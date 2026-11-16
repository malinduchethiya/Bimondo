import { NextRequest } from 'next/server';
import {
  handleR2MediaHealth,
  resolveNextRuntimeEnv,
} from '@/lib/r2-media-service';

export async function GET(req: NextRequest) {
  return handleR2MediaHealth(req, resolveNextRuntimeEnv());
}

export async function OPTIONS(req: NextRequest) {
  return handleR2MediaHealth(req, resolveNextRuntimeEnv());
}
