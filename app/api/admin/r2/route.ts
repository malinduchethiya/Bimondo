import { NextRequest, NextResponse } from 'next/server';
import {
  applyIncomingR2Headers,
  deleteFileFromR2Bucket,
  ensureR2ConfigHydratedFromFirestore,
  getPublicR2ConfigStatus,
  listFilesInR2Bucket,
  persistR2ConfigToFirestoreServer,
  R2FolderName,
  renameFileInR2Bucket,
  seedInitialR2CatalogFromCms,
  testR2Connection,
  toFirestoreMediaDocId,
  uploadFileToR2Bucket,
  writeR2ServerConfig,
} from '@/lib/r2-storage';

export async function GET(req: NextRequest) {
  applyIncomingR2Headers(req.headers);
  await ensureR2ConfigHydratedFromFirestore();

  const { searchParams } = new URL(req.url);
  const prefix = searchParams.get('prefix') || undefined;
  const origin = req.nextUrl.origin;
  const status = getPublicR2ConfigStatus(origin);

  try {
    const items = await listFilesInR2Bucket(prefix, origin);
    return NextResponse.json({
      status,
      items,
    });
  } catch (err) {
    return NextResponse.json({
      status,
      items: [],
      warning:
        err instanceof Error
          ? err.message
          : 'Could not list objects from Cloudflare R2 bucket.',
    });
  }
}

export async function POST(req: NextRequest) {
  applyIncomingR2Headers(req.headers);
  await ensureR2ConfigHydratedFromFirestore();

  const contentTypeHeader = req.headers.get('content-type') || '';
  const origin = req.nextUrl.origin;

  try {
    // 1. Multipart form-data upload -> Push image binary directly to Cloudflare R2 Bucket
    if (contentTypeHeader.includes('multipart/form-data')) {
      const formData = await req.formData();

      // Accept R2 config overrides inside multipart formData if provided
      const fAccount = String(formData.get('accountId') || '').trim();
      const fBucket = String(formData.get('bucketName') || '').trim();
      const fCdn = String(formData.get('publicCdnUrl') || '').trim();
      const fAccess = String(formData.get('accessKeyId') || '').trim();
      const fSecret = String(formData.get('secretAccessKey') || '').trim();
      if (fAccount || fCdn || fAccess || fSecret) {
        writeR2ServerConfig({
          accountId: fAccount || undefined,
          bucketName: fBucket || undefined,
          publicCdnUrl: fCdn || undefined,
          accessKeyId: fAccess || undefined,
          secretAccessKey: fSecret || undefined,
        });
        await persistR2ConfigToFirestoreServer();
      }

      const file = formData.get('file');
      if (!file || !(file instanceof File)) {
        return NextResponse.json(
          { error: 'Missing image file in multipart upload.' },
          { status: 400 }
        );
      }

      const rawFolder = String(formData.get('folder') || 'general');
      const validFolders: readonly R2FolderName[] = [
        'tours',
        'stays',
        'destinations',
        'gallery',
        'general',
      ];
      const folder: R2FolderName = validFolders.includes(
        rawFolder as R2FolderName
      )
        ? (rawFolder as R2FolderName)
        : 'general';

      const customKey = formData.get('customKey')
        ? String(formData.get('customKey'))
        : undefined;
      const replaceExistingKey = formData.get('replaceKey')
        ? String(formData.get('replaceKey'))
        : undefined;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploaded = await uploadFileToR2Bucket({
        buffer,
        fileName: file.name || `upload-${Date.now()}.jpg`,
        contentType: file.type || 'image/jpeg',
        folder,
        customKey,
        replaceExistingKey,
        requestOrigin: origin,
      });

      return NextResponse.json({
        ok: true,
        item: uploaded,
      });
    }

    // 2. JSON action -> Save R2 credentials, test connection, rename R2 object, or sync catalog
    const body = await req.json();
    const action = body?.action;

    if (action === 'save_config') {
      const status = writeR2ServerConfig({
        accountId: body.accountId,
        bucketName: body.bucketName,
        publicCdnUrl: body.publicCdnUrl,
        accessKeyId: body.accessKeyId,
        secretAccessKey: body.secretAccessKey,
      });
      await persistR2ConfigToFirestoreServer();
      const connectionTest = await testR2Connection(origin);
      const items = await listFilesInR2Bucket(undefined, origin);
      return NextResponse.json({
        ok: true,
        status: connectionTest.status || status,
        connectionTest,
        items,
      });
    }

    if (action === 'test_connection') {
      const connectionTest = await testR2Connection(origin);
      const items = await listFilesInR2Bucket(undefined, origin);
      return NextResponse.json({
        ok: connectionTest.ok,
        status: connectionTest.status,
        connectionTest,
        items,
      });
    }

    if (action === 'sync_catalog') {
      const seeded = seedInitialR2CatalogFromCms();
      const items = await listFilesInR2Bucket(undefined, origin);
      return NextResponse.json({
        ok: true,
        seededCount: Object.keys(seeded).length,
        items,
      });
    }

    if (action === 'rename_object') {
      const { oldKeyOrUrl, newKey } = body;
      if (!oldKeyOrUrl || !newKey) {
        return NextResponse.json(
          { error: 'Both oldKeyOrUrl and newKey are required to rename.' },
          { status: 400 }
        );
      }
      const renamed = await renameFileInR2Bucket({
        oldKeyOrUrl: String(oldKeyOrUrl),
        newKey: String(newKey),
        requestOrigin: origin,
      });
      return NextResponse.json({
        ok: true,
        renamed,
        oldDocId: toFirestoreMediaDocId(renamed.oldKey),
      });
    }

    return NextResponse.json(
      { error: 'Unsupported R2 admin action.' },
      { status: 400 }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Cloudflare R2 operation failed.';
    const isConfigMissing = message.includes('not connected yet');
    return NextResponse.json(
      {
        error: message,
      },
      { status: isConfigMissing ? 400 : 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  applyIncomingR2Headers(req.headers);
  await ensureR2ConfigHydratedFromFirestore();

  try {
    const { searchParams } = new URL(req.url);
    const keyOrUrl =
      searchParams.get('key') || searchParams.get('url') || '';
    if (!keyOrUrl) {
      return NextResponse.json(
        { error: 'Missing R2 object key or CDN URL to delete.' },
        { status: 400 }
      );
    }

    const result = await deleteFileFromR2Bucket(keyOrUrl);
    return NextResponse.json({
      ok: true,
      deletedKey: result.deletedKey,
      mediaDocId: toFirestoreMediaDocId(result.deletedKey),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Failed to delete object from Cloudflare R2.',
      },
      { status: 500 }
    );
  }
}
