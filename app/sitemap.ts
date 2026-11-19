import type { MetadataRoute } from 'next';
import {
  SRI_LANKA_47_DESTINATIONS,
  resolveDestinationSlug,
} from '@/lib/sri-lanka-47-destinations';
import { TOURS } from '@/lib/tours';
import { resolveTourSlug } from '@/lib/tour-helpers';
import { DEFAULT_TRAVEL_GUIDES } from '@/lib/travel-guides';
import { SITE_URL } from '@/lib/seo';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/destinations`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/packages`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/guides`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/stays`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/gallery`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/our-story`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/booking`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
  ];

  const destinationRoutes: MetadataRoute.Sitemap = SRI_LANKA_47_DESTINATIONS.filter(
    (d) => d.visible !== false
  ).map((dest) => ({
    url: `${SITE_URL}/destinations/${resolveDestinationSlug(dest)}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: dest.featuredOnHome ? 0.9 : 0.85,
  }));

  const packageRoutes: MetadataRoute.Sitemap = TOURS.map((tour) => ({
    url: `${SITE_URL}/packages/${resolveTourSlug(tour)}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.9,
  }));

  const guideRoutes: MetadataRoute.Sitemap = DEFAULT_TRAVEL_GUIDES.filter(
    (g) => g.visible !== false
  ).map((guide) => ({
    url: `${SITE_URL}/guides/${guide.slug}`,
    lastModified: new Date(guide.updatedAt || guide.publishedAt),
    changeFrequency: 'monthly',
    priority: 0.85,
  }));

  return [
    ...staticRoutes,
    ...destinationRoutes,
    ...packageRoutes,
    ...guideRoutes,
  ];
}
