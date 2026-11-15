import { NextRequest, NextResponse } from 'next/server';
import firebaseConfig from '@/firebase-applet-config.json';
import { verifyAdminRequest } from '@/lib/firebase-admin-auth';
import {
  buildServedCdnUrl,
  deleteFileFromR2Bucket,
  extractR2KeyFromCdnUrl,
  getPublicR2ConfigStatus,
  listFilesInR2Bucket,
  R2FailureStep,
  R2OperationError,
  renameFileInR2Bucket,
  testR2Connection,
  toFirestoreMediaDocId,
  uploadFileToR2Bucket,
} from '@/lib/r2-storage';

function createRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function errorResponse(params: {
  requestId: string;
  step: R2FailureStep;
  error: string;
  status: number;
  extra?: Record<string, unknown>;
}) {
  return NextResponse.json(
    {
      ok: false,
      requestId: params.requestId,
      step: params.step,
      error: params.error,
      ...(params.extra || {}),
    },
    { status: params.status }
  );
}

/**
 * Checks live Firestore `site_cms/main` to find any published fields referencing
 * the given R2 object key or CDN URL before allowing deletion.
 */
async function findPublishedCmsReferences(
  targetObjectKey: string,
  targetCdnUrl: string,
  ignoreSlot?: string
): Promise<string[]> {
  const references: string[] = [];
  try {
    const projectId = firebaseConfig.projectId;
    const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/site_cms/main`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return references;

    const docJson = await res.json();
    const fields = docJson?.fields || {};

    const matchesTarget = (rawUrl: string): boolean => {
      const trimmed = (rawUrl || '').trim();
      if (!trimmed) return false;
      if (targetCdnUrl && trimmed === targetCdnUrl) return true;
      const extracted = extractR2KeyFromCdnUrl(trimmed);
      return Boolean(extracted && extracted === targetObjectKey);
    };

    const generalFields = fields?.general?.mapValue?.fields || {};
    const heroValues = generalFields?.heroImages?.arrayValue?.values || [];
    heroValues.forEach((v: { stringValue?: string }, idx: number) => {
      const slot = `hero:${idx}`;
      if (slot !== ignoreSlot && matchesTarget(v?.stringValue || '')) {
        references.push(`Hero Slide #${idx + 1}`);
      }
    });

    const generalImageSlots: Array<[string, string]> = [
      ['storyMainImage', 'Our Story Main Image'],
      ['storySecondaryImage', 'Our Story Secondary Image'],
      ['experienceImage', 'Experience Section Image'],
    ];
    for (const [fieldKey, label] of generalImageSlots) {
      const slot = `general:${fieldKey}`;
      const val = generalFields?.[fieldKey]?.stringValue || '';
      if (slot !== ignoreSlot && matchesTarget(val)) {
        references.push(label);
      }
    }

    const collectionSlots: Array<[string, string, string]> = [
      ['tours', 'tour', 'Tour'],
      ['stays', 'stay', 'Stay'],
      ['destinations', 'destination', 'Destination'],
      ['gallery', 'gallery', 'Gallery Item'],
      ['reviews', 'review', 'Review'],
    ];

    for (const [arrayKey, slotPrefix, typeLabel] of collectionSlots) {
      const arr = fields?.[arrayKey]?.arrayValue?.values || [];
      arr.forEach(
        (
          entry: {
            mapValue?: {
              fields?: Record<string, { stringValue?: string }>;
            };
          },
          idx: number
        ) => {
          const itemFields = entry?.mapValue?.fields || {};
          const itemId =
            itemFields?.id?.stringValue || `${slotPrefix}_${idx + 1}`;
          const itemName =
            itemFields?.name?.stringValue ||
            itemFields?.title?.stringValue ||
            itemId;
          const imgVal = itemFields?.image?.stringValue || '';
          const slot = `${slotPrefix}:${itemId}`;
          if (slot !== ignoreSlot && matchesTarget(imgVal)) {
            references.push(`${typeLabel}: ${itemName}`);
          }
        }
      );
    }
  } catch {
    // Non-fatal if Firestore cannot be reached
  }
  return references;
}

export async function GET(req: NextRequest) {
  const requestId = createRequestId();
  const authResult = await verifyAdminRequest(req);
  if (!authResult.ok) {
    return errorResponse({
      requestId,
      step: authResult.step,
      error: authResult.error,
      status: authResult.status,
    });
  }

  const { searchParams } = new URL(req.url);
  const prefix = searchParams.get('prefix') || undefined;

  try {
    const items = await listFilesInR2Bucket(prefix);
    const status = getPublicR2ConfigStatus({
      s3Connected: true,
      objectCount: items.length,
    });
    return NextResponse.json({
      ok: true,
      requestId,
      status,
      items,
    });
  } catch (err) {
    const step: R2FailureStep =
      err instanceof R2OperationError ? err.step : 'r2_list';
    const statusCode =
      err instanceof R2OperationError ? err.statusCode : 502;
    const message =
      err instanceof Error
        ? err.message
        : 'Could not list objects from Cloudflare R2 bucket.';
    const status = getPublicR2ConfigStatus({
      s3Connected: false,
      lastError: message,
    });

    return errorResponse({
      requestId,
      step,
      error: message,
      status: statusCode,
      extra: {
        status,
        items: [],
      },
    });
  }
}

export async function POST(req: NextRequest) {
  const requestId = createRequestId();
  const authResult = await verifyAdminRequest(req);
  if (!authResult.ok) {
    return errorResponse({
      requestId,
      step: authResult.step,
      error: authResult.error,
      status: authResult.status,
    });
  }

  const contentTypeHeader = req.headers.get('content-type') || '';

  try {
    if (contentTypeHeader.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file');
      if (!file || !(file instanceof File)) {
        return errorResponse({
          requestId,
          step: 'validation',
          error: 'Missing image file in multipart upload.',
          status: 400,
        });
      }

      const rawFolder = String(formData.get('folder') || 'general').trim();
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploaded = await uploadFileToR2Bucket({
        buffer,
        fileName: file.name || `upload-${Date.now()}.jpg`,
        contentType: file.type || undefined,
        folder: rawFolder,
      });

      return NextResponse.json({
        ok: true,
        requestId,
        item: uploaded,
      });
    }

    const body = await req.json();
    const action = body?.action;

    if (action === 'test_connection') {
      const connectionTest = await testR2Connection();
      if (!connectionTest.ok) {
        return errorResponse({
          requestId,
          step: 'r2_list',
          error: connectionTest.message,
          status: 502,
          extra: {
            status: connectionTest.status,
            connectionTest,
            items: [],
          },
        });
      }
      return NextResponse.json({
        ok: true,
        requestId,
        status: connectionTest.status,
        connectionTest,
        items: connectionTest.items,
      });
    }

    if (action === 'rename_object') {
      const { oldKeyOrUrl, newKey } = body;
      if (!oldKeyOrUrl || !newKey) {
        return errorResponse({
          requestId,
          step: 'validation',
          error: 'Both oldKeyOrUrl and newKey are required to rename.',
          status: 400,
        });
      }
      const renamed = await renameFileInR2Bucket({
        oldKeyOrUrl: String(oldKeyOrUrl),
        newKey: String(newKey),
      });
      return NextResponse.json({
        ok: true,
        requestId,
        renamed,
        oldDocId: toFirestoreMediaDocId(renamed.oldKey),
      });
    }

    return errorResponse({
      requestId,
      step: 'validation',
      error: `Unsupported R2 admin action "${String(action || '')}".`,
      status: 400,
    });
  } catch (err) {
    const step: R2FailureStep =
      err instanceof R2OperationError ? err.step : 'r2_write';
    const statusCode =
      err instanceof R2OperationError ? err.statusCode : 500;
    const message =
      err instanceof Error ? err.message : 'Cloudflare R2 operation failed.';
    return errorResponse({
      requestId,
      step,
      error: message,
      status: statusCode,
    });
  }
}

export async function DELETE(req: NextRequest) {
  const requestId = createRequestId();
  const authResult = await verifyAdminRequest(req);
  if (!authResult.ok) {
    return errorResponse({
      requestId,
      step: authResult.step,
      error: authResult.error,
      status: authResult.status,
    });
  }

  try {
    const { searchParams } = new URL(req.url);
    const keyOrUrl =
      searchParams.get('key') || searchParams.get('url') || '';
    const ignoreSlot = searchParams.get('ignoreSlot') || undefined;

    if (!keyOrUrl) {
      return errorResponse({
        requestId,
        step: 'validation',
        error: 'Missing R2 object key or CDN URL to delete.',
        status: 400,
      });
    }

    const resolvedKey =
      extractR2KeyFromCdnUrl(keyOrUrl) || keyOrUrl.replace(/^\/+/, '');
    if (!resolvedKey) {
      return errorResponse({
        requestId,
        step: 'validation',
        error: 'Could not resolve R2 object key from request.',
        status: 400,
      });
    }

    const cdnUrl = buildServedCdnUrl(resolvedKey);
    const references = await findPublishedCmsReferences(
      resolvedKey,
      cdnUrl,
      ignoreSlot
    );

    if (references.length > 0) {
      return errorResponse({
        requestId,
        step: 'r2_delete',
        error: `Cannot delete "${resolvedKey}" from R2 while it is referenced by published site content (${references.join(
          ', '
        )}). Unassign or replace the image on those sections first.`,
        status: 409,
        extra: {
          referencedBy: references,
        },
      });
    }

    const result = await deleteFileFromR2Bucket(resolvedKey);
    return NextResponse.json({
      ok: true,
      requestId,
      deletedKey: result.deletedKey,
      mediaDocId: toFirestoreMediaDocId(result.deletedKey),
    });
  } catch (err) {
    const step: R2FailureStep =
      err instanceof R2OperationError ? err.step : 'r2_delete';
    const statusCode =
      err instanceof R2OperationError ? err.statusCode : 500;
    return errorResponse({
      requestId,
      step,
      error:
        err instanceof Error
          ? err.message
          : 'Failed to delete object from Cloudflare R2.',
      status: statusCode,
    });
  }
}
