import React from 'react';
import { buildBreadcrumbJsonLd, buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Sri Lanka Photography Gallery | Bimondo Travels',
  description:
    'Visual stories from across Sri Lanka—ancient heritage citadels, misty highland tea estates, national park wildlife, and tropical Indian Ocean beaches.',
  path: '/gallery',
});

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  ...buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Gallery', path: '/gallery' },
  ]),
};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
