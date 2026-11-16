import {
  handleBookingAvailabilityGet,
  handleBookingSettingsGet,
  handleBookingSettingsPost,
  handleBookingVerifyGet,
} from '../../../lib/booking-handlers';

interface PagesContext {
  request: Request;
  env: Record<string, unknown>;
}

function toEnvRecord(
  env: Record<string, unknown>
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === 'string') {
      out[key] = value;
    }
  }
  return out;
}

export async function onRequest(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';
  const envMap = toEnvRecord(env);

  if (pathname === '/api/booking/availability' && request.method === 'GET') {
    return handleBookingAvailabilityGet(request, envMap);
  }

  if (pathname === '/api/booking/verify' && request.method === 'GET') {
    return handleBookingVerifyGet(request, envMap);
  }

  if (pathname === '/api/booking/settings') {
    if (request.method === 'GET') {
      return handleBookingSettingsGet(envMap);
    }
    if (request.method === 'POST') {
      return handleBookingSettingsPost(request, envMap);
    }
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
