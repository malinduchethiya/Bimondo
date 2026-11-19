import React from 'react';
import { buildBreadcrumbJsonLd, buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Our Story, Values & Responsible Travel | Bimondo Travels',
  description:
    'Learn about Bimondo Travels, a Battaramulla-based Sri Lankan destination management company founded in 2022 dedicated to private journeys, local communities, and heritage preservation.',
  path: '/our-story',
});

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  ...buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Our Story', path: '/our-story' },
  ]),
};

export default function OurStoryLayout({
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
