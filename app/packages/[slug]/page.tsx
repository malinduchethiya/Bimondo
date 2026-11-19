import React from 'react';
import type { Metadata } from 'next';
import PackageDetailClient from '@/components/packages/PackageDetailClient';
import { TOURS } from '@/lib/tours';
import { createImageRef, type CmsTourItem } from '@/lib/cms-defaults';
import {
  findTourBySlugOrId,
  getRelatedDestinationsForTour,
  getStaticTourParams,
  resolveTourSlug,
} from '@/lib/tour-helpers';
import { SRI_LANKA_47_DESTINATIONS } from '@/lib/sri-lanka-47-destinations';
import { buildPageMetadata, buildTourPackageJsonLd } from '@/lib/seo';

export async function generateStaticParams() {
  return getStaticTourParams();
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tour = findTourBySlugOrId(TOURS, slug);

  if (!tour) {
    return buildPageMetadata({
      title: 'Private Sri Lanka Tour Package | Bimondo Travels',
      description:
        'Explore tailor-made private Sri Lanka tour packages crafted by Bimondo Travels across heritage, wildlife, highlands, and coastal regions.',
      path: `/packages/${slug}`,
      type: 'article',
    });
  }

  const canonicalSlug = resolveTourSlug(tour);
  const durationText = tour.durationLabel || `${tour.days} Days`;
  const title = `${tour.name} (${durationText}) — Private Sri Lanka Tour | Bimondo Travels`;
  const description = `${tour.description} Route: ${tour.route}. Tailor-made private Sri Lanka itinerary by Bimondo Travels.`;

  return buildPageMetadata({
    title,
    description,
    path: `/packages/${canonicalSlug}`,
    type: 'article',
    image: tour.image || undefined,
  });
}

export default async function PackageDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const tour = findTourBySlugOrId(TOURS, slug);

  const jsonLd = tour
    ? buildTourPackageJsonLd(
        {
          ...tour,
          imageRef: createImageRef(tour.image, tour.name),
        } as CmsTourItem,
        resolveTourSlug(tour),
        getRelatedDestinationsForTour(tour, SRI_LANKA_47_DESTINATIONS)
      )
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <PackageDetailClient slug={slug} />
    </>
  );
}
