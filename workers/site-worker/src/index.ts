import {
  handleBookingAvailabilityGet,
  handleBookingSettingsGet,
  handleBookingSettingsPost,
  handleBookingVerifyGet,
} from '../../../lib/booking-handlers';
import {
  handleR2MediaApiRequest,
  R2HandlerOptions,
  R2MediaWorkerEnv,
} from '../../../lib/r2-media-service';

export interface WorkerEnv extends R2MediaWorkerEnv {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

function toEnvRecord(env: WorkerEnv): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === 'string') {
      out[key] = value;
    }
  }
  return out;
}

export async function handleSiteWorkerRequest(
  request: Request,
  env: WorkerEnv,
  r2Options?: R2HandlerOptions
): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';

  if (pathname === '/api/media' || pathname.startsWith('/api/media/')) {
    return handleR2MediaApiRequest(request, env, r2Options);
  }

  if (pathname === '/api/booking/availability' && request.method === 'GET') {
    return handleBookingAvailabilityGet(request, toEnvRecord(env));
  }

  if (pathname === '/api/booking/verify' && request.method === 'GET') {
    return handleBookingVerifyGet(request, toEnvRecord(env));
  }

  if (pathname === '/api/booking/settings') {
    if (request.method === 'GET') {
      return handleBookingSettingsGet(toEnvRecord(env));
    }
    if (request.method === 'POST') {
      return handleBookingSettingsPost(request, toEnvRecord(env));
    }
  }

  return env.ASSETS.fetch(request);
}

const siteWorker = {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    return handleSiteWorkerRequest(request, env);
  },
};

export default siteWorker;
