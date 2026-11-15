import { NextRequest, NextResponse } from 'next/server';
import {
  applyIncomingR2Headers,
  ensureR2ConfigHydratedFromFirestore,
  getFileBufferFromR2Bucket,
  readR2ServerConfig,
} from '@/lib/r2-storage';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ key: string[] }> }
) {
  try {
    applyIncomingR2Headers(req.headers);
    await ensureR2ConfigHydratedFromFirestore();

    const resolvedParams = await context.params;
    const keyParts = resolvedParams?.key || [];
    const objectKey = keyParts.join('/').replace(/^\/+/, '');

    if (!objectKey) {
      return new NextResponse('Missing R2 object key', { status: 400 });
    }

    // 1. Try serving from local cache or remote R2 S3
    const fileData = await getFileBufferFromR2Bucket(objectKey);
    if (fileData) {
      return new NextResponse(new Uint8Array(fileData.buffer), {
        status: 200,
        headers: {
          'Content-Type': fileData.contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // 2. If publicCdnUrl is configured on R2, redirect directly to the R2 domain
    const cfg = readR2ServerConfig();
    if (cfg.publicCdnUrl) {
      return NextResponse.redirect(`${cfg.publicCdnUrl}/${objectKey}`, 307);
    }

    return new NextResponse('R2 object not found', { status: 404 });
  } catch (err) {
    console.error('Error serving R2 object:', err);
    return new NextResponse('Failed to serve R2 object', { status: 500 });
  }
}
