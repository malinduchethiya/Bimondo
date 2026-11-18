import React from 'react';
import type { Metadata } from 'next';
import DestinationDetailClient from '@/components/destinations/DestinationDetailClient';
import {
  SRI_LANKA_47_DESTINATIONS,
  findDestinationBySlugOrId,
  resolveDestinationSlug,
} from '@/lib/sri-lanka-47-destinations';

export const dynamicParams = true;

export async function generateStaticParams() {
  return SRI_LANKA_47_DESTINATIONS.map((dest) => ({
    slug: resolveDestinationSlug(dest),
  }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const dest = findDestinationBySlugOrId(SRI_LANKA_47_DESTINATIONS, slug);

  if (!dest) {
    return {
      title: 'Sri Lanka Destination Guide | Bimondo Travels',
      description:
        'Explore curated Sri Lanka destination guides, cultural heritage landmarks, wildlife reserves, hill country trails, and coastal retreats with Bimondo Travels.',
    };
  }

  const canonicalSlug = resolveDestinationSlug(dest);
  const title =
    dest.seoTitle ||
    `${dest.name} Travel Guide — Things to See, Do & Best Season | Bimondo Travels`;
  const description =
    dest.seoDescription ||
    dest.overview ||
    dest.description ||
    `Plan your visit to ${dest.name}, Sri Lanka with Bimondo Travels.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/destinations/${canonicalSlug}`,
    },
    openGraph: {
      title,
      description,
      url: `/destinations/${canonicalSlug}`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function DestinationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const dest = findDestinationBySlugOrId(SRI_LANKA_47_DESTINATIONS, slug);

  const jsonLd = dest
    ? {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'TouristDestination',
            name: dest.name,
            description: dest.overview || dest.description,
            url: `https://bimondotravels.com/destinations/${resolveDestinationSlug(dest)}`,
            touristType: dest.categories || [],
            containsPlace: (dest.thingsToSee || dest.highlights || []).slice(0, 8).map((item) => ({
              '@type': 'TouristAttraction',
              name: item.split(' — ')[0],
            })),
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://bimondotravels.com/',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Destinations',
                item: 'https://bimondotravels.com/destinations',
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: dest.name,
                item: `https://bimondotravels.com/destinations/${resolveDestinationSlug(dest)}`,
              },
            ],
          },
        ],
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <DestinationDetailClient slug={slug} />
    </>
  );
}
