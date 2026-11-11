import { NextRequest, NextResponse } from 'next/server';
import {
  deleteFileFromR2Bucket,
  getPublicR2ConfigStatus,
  listFilesInR2Bucket,
  renameFileInR2Bucket,
  uploadFileToR2Bucket,
  writeR2ServerConfig,
} from '@/lib/r2-storage';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const config = getPublicR2ConfigStatus();
  const prefix = req.nextUrl.searchParams.get('prefix') || undefined;

  if (!config.configured) {
    return NextResponse.json({
      config,
      objects: [],
    });
  }

  try {
    const objects = await listFilesInR2Bucket(prefix);
    return NextResponse.json({
      config,
      objects,
    });
  } catch (err) {
    return NextResponse.json(
      {
        config,
        objects: [],
        error:
          err instanceof Error
            ? err.message
            : 'Failed to list objects from Cloudflare R2 bucket.',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // 1. Direct Device File Upload / Replace to Cloudflare R2 Bucket
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file');
      if (!file || !(file instanceof File)) {
        return NextResponse.json(
          { error: 'No image file provided for Cloudflare R2 upload.' },
          { status: 400 }
        );
      }

      const rawFolder = String(formData.get('folder') || 'general');
      const allowedFolders = [
        'tours',
        'stays',
        'destinations',
        'gallery',
        'general',
      ] as const;
      const folder = (allowedFolders as readonly string[]).includes(rawFolder)
        ? (rawFolder as (typeof allowedFolders)[number])
        : 'general';

      const customKey = String(formData.get('customKey') || '').trim() || undefined;
      const replaceExistingKey =
        String(formData.get('replaceKey') || '').trim() || undefined;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploaded = await uploadFileToR2Bucket({
        buffer,
        fileName: file.name || `upload-${Date.now()}.jpg`,
        contentType: file.type || 'image/jpeg',
        folder,
        customKey,
        replaceExistingKey,
      });

      return NextResponse.json({
        ok: true,
        item: uploaded,
      });
    }

    // 2. JSON Actions: Save R2 Config, Rename R2 Object, Delete R2 Object
    const body = await req.json();

    if (body?.action === 'save_config') {
      const status = writeR2ServerConfig({
        accountId: body.accountId,
        bucketName: body.bucketName,
        publicCdnUrl: body.publicCdnUrl,
        accessKeyId: body.accessKeyId,
        secretAccessKey: body.secretAccessKey,
      });
      return NextResponse.json({
        ok: true,
        config: status,
      });
    }

    if (body?.action === 'rename_object') {
      const renamed = await renameFileInR2Bucket({
        oldKeyOrUrl: String(body.oldKeyOrUrl || ''),
        newKey: String(body.newKey || ''),
      });
      return NextResponse.json({
        ok: true,
        renamed,
      });
    }

    if (body?.action === 'delete_object') {
      const result = await deleteFileFromR2Bucket(
        String(body.keyOrUrl || '')
      );
      return NextResponse.json({
        ok: true,
        ...result,
      });
    }

    return NextResponse.json(
      { error: 'Unsupported R2 action.' },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Cloudflare R2 operation failed.',
      },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const keyOrUrl =
      req.nextUrl.searchParams.get('key') ||
      req.nextUrl.searchParams.get('url') ||
      '';
    if (!keyOrUrl) {
      return NextResponse.json(
        { error: 'Missing R2 object key or CDN URL to delete.' },
        { status: 400 }
      );
    }

    const result = await deleteFileFromR2Bucket(keyOrUrl);
    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Failed to delete object from Cloudflare R2 bucket.',
      },
      { status: 400 }
    );
  }
}
