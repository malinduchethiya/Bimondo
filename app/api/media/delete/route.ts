import { NextRequest } from 'next/server';
import {
  handleR2MediaDelete,
  resolveNextRuntimeEnv,
} from '@/lib/r2-media-service';

export async function POST(req: NextRequest) {
  return handleR2MediaDelete(req, resolveNextRuntimeEnv());
}

export async function DELETE(req: NextRequest) {
  return handleR2MediaDelete(req, resolveNextRuntimeEnv());
}

export async function OPTIONS(req: NextRequest) {
  return handleR2MediaDelete(req, resolveNextRuntimeEnv());
}
