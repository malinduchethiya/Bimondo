import {
  handleR2MediaApiRequest,
  R2MediaWorkerEnv,
} from '../../../lib/r2-media-service';

interface PagesContext {
  request: Request;
  env: R2MediaWorkerEnv;
}

export async function onRequest(context: PagesContext): Promise<Response> {
  return handleR2MediaApiRequest(context.request, context.env);
}
