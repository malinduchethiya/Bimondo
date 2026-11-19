import React from 'react';
import type { Metadata } from 'next';
import DestinationDetailClient from '@/components/destinations/DestinationDetailClient';
import {
  SRI_LANKA_47_DESTINATIONS,
  findDestinationBySlugOrId,
  resolveDestinationSlug,
} from '@/lib/sri-lanka-47-destinations';
import { buildDestinationJsonLd, buildPageMetadata } from '@/lib/seo';

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
    return buildPageMetadata({
      title: 'Sri Lanka Destination Guide | Bimondo Travels',
      description:
        'Explore curated Sri Lanka destination guides, cultural heritage landmarks, wildlife reserves, hill country trails, and coastal retreats with Bimondo Travels.',
      path: `/destinations/${slug}`,
      type: 'article',
    });
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
  const imageUrl = (dest.imageRef?.url || dest.image || '').trim();

  return buildPageMetadata({
    title,
    description,
    path: `/destinations/${canonicalSlug}`,
    type: 'article',
    image: imageUrl || undefined,
  });
}

export default async function DestinationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const dest = findDestinationBySlugOrId(SRI_LANKA_47_DESTINATIONS, slug);

  const jsonLd = dest ? buildDestinationJsonLd(dest) : null;

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

