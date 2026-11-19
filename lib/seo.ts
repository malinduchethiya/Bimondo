import type { Metadata } from 'next';
import type { CmsDestination, CmsTourItem, CmsTravelGuide } from '@/lib/cms-defaults';
import { resolveDestinationSlug } from '@/lib/sri-lanka-47-destinations';

export const SITE_URL = 'https://www.bimondotours.com';
export const SITE_NAME = 'Bimondo Travels';
export const SITE_ALTERNATE_NAME = 'Bimondo Tours';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/favicon.jpg`;
export const SITE_LOGO_URL = `${SITE_URL}/bimondo-logo.png`;

export function buildCanonicalUrl(path: string): string {
  if (!path || path === '/') return SITE_URL;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalized.replace(/\/+$/, '')}`;
}

export interface PageMetadataOptions {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
  image?: string;
  noIndex?: boolean;
  keywords?: string[];
  publishedTime?: string;
  modifiedTime?: string;
}

export function buildPageMetadata(options: PageMetadataOptions): Metadata {
  const canonicalUrl = buildCanonicalUrl(options.path);
  const ogImage =
    options.image && options.image.startsWith('http')
      ? options.image
      : DEFAULT_OG_IMAGE;

  return {
    title: options.title,
    description: options.description,
    keywords: options.keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: options.noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
    openGraph: {
      title: options.title,
      description: options.description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      type: options.type || 'website',
      locale: 'en_US',
      images: [{ url: ogImage, alt: options.title }],
      ...(options.publishedTime ? { publishedTime: options.publishedTime } : {}),
      ...(options.modifiedTime ? { modifiedTime: options.modifiedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: options.title,
      description: options.description,
      images: [ogImage],
    },
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: buildCanonicalUrl(item.path),
    })),
  };
}

export function buildRootGraphJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        alternateName: SITE_ALTERNATE_NAME,
        url: SITE_URL,
        logo: {
          '@type': 'ImageObject',
          url: SITE_LOGO_URL,
        },
        email: 'tours@bimondo.com',
        telephone: '+94762232054',
        foundingDate: '2022',
        sameAs: ['https://www.instagram.com/bimondo.tours/'],
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'No. 596/1, Thalangama South',
          addressLocality: 'Battaramulla',
          addressCountry: 'LK',
        },
      },
      {
        '@type': 'TravelAgency',
        '@id': `${SITE_URL}/#travelagency`,
        name: SITE_NAME,
        alternateName: SITE_ALTERNATE_NAME,
        url: SITE_URL,
        logo: SITE_LOGO_URL,
        image: DEFAULT_OG_IMAGE,
        description:
          'Destination Management Company & Tailor-Made Tour Operator in Battaramulla, Sri Lanka creating private, tailor-made Sri Lankan journeys across heritage, wildlife, hill country, adventure, and coastal destinations.',
        telephone: '+94762232054',
        email: 'tours@bimondo.com',
        areaServed: {
          '@type': 'Country',
          name: 'Sri Lanka',
        },
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'No. 596/1, Thalangama South',
          addressLocality: 'Battaramulla',
          addressCountry: 'LK',
        },
        parentOrganization: {
          '@id': `${SITE_URL}/#organization`,
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description:
          'Private, tailor-made Sri Lanka tours, 47 curated Sri Lankan destination guides, boutique stays, and travel planning resources by Bimondo Travels.',
        publisher: {
          '@id': `${SITE_URL}/#organization`,
        },
        inLanguage: 'en',
      },
    ],
  };
}

export function buildDestinationJsonLd(dest: CmsDestination) {
  const slug = resolveDestinationSlug(dest);
  const canonicalUrl = buildCanonicalUrl(`/destinations/${slug}`);
  const imageUrl = (dest.imageRef?.url || dest.image || '').trim();

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['TouristDestination', 'Place'],
        '@id': `${canonicalUrl}#destination`,
        name: dest.name,
        description: dest.overview || dest.description,
        url: canonicalUrl,
        ...(imageUrl && imageUrl.startsWith('http') ? { image: imageUrl } : {}),
        containedInPlace: {
          '@type': 'Country',
          name: 'Sri Lanka',
        },
        touristType: dest.categories || [],
        containsPlace: (dest.thingsToSee || dest.highlights || [])
          .slice(0, 10)
          .map((item) => ({
            '@type': 'TouristAttraction',
            name: item.split(' — ')[0].trim(),
          })),
      },
      buildBreadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Destinations', path: '/destinations' },
        { name: dest.name, path: `/destinations/${slug}` },
      ]),
    ],
  };
}

export function buildTourPackageJsonLd(
  tour: CmsTourItem,
  slug: string,
  relatedDestinations: CmsDestination[]
) {
  const canonicalUrl = buildCanonicalUrl(`/packages/${slug}`);
  const imageUrl = (tour.imageRef?.url || tour.image || '').trim();

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TouristTrip',
        '@id': `${canonicalUrl}#trip`,
        name: tour.name,
        description: tour.overview || tour.description,
        url: canonicalUrl,
        ...(imageUrl && imageUrl.startsWith('http') ? { image: imageUrl } : {}),
        touristType: tour.categoryLabel,
        provider: {
          '@type': 'TravelAgency',
          '@id': `${SITE_URL}/#travelagency`,
          name: SITE_NAME,
          url: SITE_URL,
        },
        itinerary: {
          '@type': 'ItemList',
          name: `${tour.name} Route`,
          itemListElement:
            relatedDestinations.length > 0
              ? relatedDestinations.map((dest, index) => ({
                  '@type': 'ListItem',
                  position: index + 1,
                  name: dest.name,
                  url: buildCanonicalUrl(
                    `/destinations/${resolveDestinationSlug(dest)}`
                  ),
                }))
              : [
                  {
                    '@type': 'ListItem',
                    position: 1,
                    name: tour.route,
                  },
                ],
        },
      },
      buildBreadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Tour Packages', path: '/packages' },
        { name: tour.name, path: `/packages/${slug}` },
      ]),
    ],
  };
}

export function buildArticleJsonLd(guide: CmsTravelGuide) {
  const canonicalUrl = buildCanonicalUrl(`/guides/${guide.slug}`);
  const imageUrl = (guide.imageRef?.url || '').trim();

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${canonicalUrl}#article`,
        headline: guide.title,
        description: guide.seoDescription || guide.summary,
        url: canonicalUrl,
        mainEntityOfPage: canonicalUrl,
        datePublished: guide.publishedAt,
        dateModified: guide.updatedAt || guide.publishedAt,
        ...(imageUrl && imageUrl.startsWith('http') ? { image: imageUrl } : {}),
        author: {
          '@type': 'Organization',
          '@id': `${SITE_URL}/#organization`,
          name: SITE_NAME,
          url: SITE_URL,
        },
        publisher: {
          '@type': 'Organization',
          '@id': `${SITE_URL}/#organization`,
          name: SITE_NAME,
          logo: {
            '@type': 'ImageObject',
            url: SITE_LOGO_URL,
          },
        },
        articleSection: guide.categoryLabel,
        inLanguage: 'en',
      },
      buildBreadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Travel Guides', path: '/guides' },
        { name: guide.title, path: `/guides/${guide.slug}` },
      ]),
    ],
  };
}
