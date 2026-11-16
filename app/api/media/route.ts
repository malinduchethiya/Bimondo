import { NextRequest } from 'next/server';
import {
  handleR2MediaDelete,
  handleR2MediaList,
  resolveNextRuntimeEnv,
} from '@/lib/r2-media-service';

export async function GET(req: NextRequest) {
  return handleR2MediaList(req, resolveNextRuntimeEnv());
}

export async function DELETE(req: NextRequest) {
  return handleR2MediaDelete(req, resolveNextRuntimeEnv());
}

export async function OPTIONS(req: NextRequest) {
  return handleR2MediaList(req, resolveNextRuntimeEnv());
}
