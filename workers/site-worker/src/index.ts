import {
  handleBookingAvailabilityGet,
  handleBookingSettingsGet,
  handleBookingSettingsPost,
  handleBookingVerifyGet,
} from '../../../lib/booking-handlers';

interface WorkerEnv {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  [key: string]: unknown;
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

const siteWorker = {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/+$/, '') || '/';

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
  },
};

export default siteWorker;
