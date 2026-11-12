import { NextRequest, NextResponse } from 'next/server';
import { getFileBufferFromR2Bucket } from '@/lib/r2-storage';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ key: string[] }> }
) {
  try {
    const resolvedParams = await context.params;
    const keyParts = resolvedParams?.key || [];
    const objectKey = keyParts.join('/');

    if (!objectKey) {
      return new NextResponse('Missing R2 object key', { status: 400 });
    }

    const fileData = await getFileBufferFromR2Bucket(objectKey);
    if (!fileData) {
      return new NextResponse('R2 object not found', { status: 404 });
    }

    return new NextResponse(new Uint8Array(fileData.buffer), {
      status: 200,
      headers: {
        'Content-Type': fileData.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    console.error('Error serving R2 object:', err);
    return new NextResponse('Failed to serve R2 object', { status: 500 });
  }
}
