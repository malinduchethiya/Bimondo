import React from 'react';
import type { Metadata } from 'next';
import GuideDetailClient from '@/components/guides/GuideDetailClient';
import {
  DEFAULT_TRAVEL_GUIDES,
  findTravelGuideBySlug,
} from '@/lib/travel-guides';
import { buildArticleJsonLd, buildPageMetadata } from '@/lib/seo';

export async function generateStaticParams() {
  return DEFAULT_TRAVEL_GUIDES.map((guide) => ({
    slug: guide.slug,
  }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = findTravelGuideBySlug(DEFAULT_TRAVEL_GUIDES, slug);

  if (!guide) {
    return buildPageMetadata({
      title: 'Sri Lanka Travel Guide | Bimondo Travels',
      description:
        'Practical Sri Lanka travel guides, regional itineraries, and seasonal advice from Bimondo Travels.',
      path: `/guides/${slug}`,
      type: 'article',
    });
  }

  return buildPageMetadata({
    title: guide.seoTitle || `${guide.title} | Bimondo Travels`,
    description: guide.seoDescription || guide.summary,
    path: `/guides/${guide.slug}`,
    type: 'article',
    image: guide.imageRef?.url || undefined,
    publishedTime: guide.publishedAt,
    modifiedTime: guide.updatedAt || guide.publishedAt,
  });
}

export default async function GuideDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const guide = findTravelGuideBySlug(DEFAULT_TRAVEL_GUIDES, slug);
  const jsonLd = guide ? buildArticleJsonLd(guide) : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <GuideDetailClient slug={slug} />
    </>
  );
}
