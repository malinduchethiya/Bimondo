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

const SITEMAP_PATHS: {
  path: string;
  changefreq: string;
  priority: string;
}[] = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/destinations', changefreq: 'weekly', priority: '0.9' },
  { path: '/packages', changefreq: 'weekly', priority: '0.9' },
  { path: '/stays', changefreq: 'weekly', priority: '0.85' },
  { path: '/gallery', changefreq: 'monthly', priority: '0.8' },
  { path: '/our-story', changefreq: 'monthly', priority: '0.8' },
  { path: '/contact', changefreq: 'monthly', priority: '0.85' },
  { path: '/booking', changefreq: 'weekly', priority: '0.8' },
];

function buildSitemapXml(origin: string): string {
  const baseUrl = (origin || 'https://www.bimondotours.com').replace(/\/+$/, '');
  const lastmod = new Date().toISOString();
  const entries = SITEMAP_PATHS.map(
    (item) => `  <url>
    <loc>${baseUrl}${item.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

function buildRobotsTxt(origin: string): string {
  const baseUrl = (origin || 'https://www.bimondotours.com').replace(/\/+$/, '');
  return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Host: ${baseUrl}
Sitemap: ${baseUrl}/sitemap.xml
`;
}

export async function handleSiteWorkerRequest(
  request: Request,
  env: WorkerEnv,
  r2Options?: R2HandlerOptions
): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';

  if (pathname === '/sitemap.xml' && request.method === 'GET') {
    return new Response(buildSitemapXml(url.origin), {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  if (pathname === '/robots.txt' && request.method === 'GET') {
    return new Response(buildRobotsTxt(url.origin), {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

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
