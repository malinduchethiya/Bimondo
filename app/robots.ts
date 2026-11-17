import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

function resolveSiteBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_URL ||
    'https://www.bimondotours.com';
  return raw.trim().replace(/\/+$/, '');
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = resolveSiteBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
