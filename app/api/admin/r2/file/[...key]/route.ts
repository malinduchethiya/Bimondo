import { NextRequest, NextResponse } from 'next/server';
import {
  applyIncomingR2Headers,
  createPresignedR2ReadUrl,
  ensureR2ConfigHydratedFromFirestore,
  getFileBufferFromR2Bucket,
  readR2ServerConfig,
} from '@/lib/r2-storage';

const FALLBACK_ISLAND_IMAGE =
  'https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=1920&q=85';

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

    // 1. Try serving from R2 binding, local cache, or remote R2 S3
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

    // 3. If S3 credentials are configured, redirect to a signed R2 URL
    if (cfg.accountId && cfg.accessKeyId && cfg.secretAccessKey) {
      const signedUrl = createPresignedR2ReadUrl(objectKey, cfg);
      if (signedUrl.startsWith('https://')) {
        return NextResponse.redirect(signedUrl, 307);
      }
    }

    // 4. Graceful fallback redirect if an unconfigured legacy proxy URL was requested
    return NextResponse.redirect(FALLBACK_ISLAND_IMAGE, 307);
  } catch (err) {
    console.error('Error serving R2 object:', err);
    return NextResponse.redirect(FALLBACK_ISLAND_IMAGE, 307);
  }
}
