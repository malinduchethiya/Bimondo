import React from 'react';
import { buildBreadcrumbJsonLd, buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Boutique Stays & Luxury Hotels in Sri Lanka | Bimondo Travels',
  description:
    'Discover handpicked four-star hotels, characterful boutique retreats, and five-star luxury resorts across Sri Lanka’s heritage regions, tea hills, wildlife parks, and coasts.',
  path: '/stays',
});

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  ...buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Boutique Stays', path: '/stays' },
  ]),
};

export default function StaysLayout({
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
