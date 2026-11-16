import { NextRequest } from 'next/server';
import {
  handleR2MediaUpload,
  resolveNextRuntimeEnv,
} from '@/lib/r2-media-service';

export async function POST(req: NextRequest) {
  return handleR2MediaUpload(req, resolveNextRuntimeEnv());
}

export async function OPTIONS(req: NextRequest) {
  return handleR2MediaUpload(req, resolveNextRuntimeEnv());
}
