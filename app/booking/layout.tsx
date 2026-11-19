import React from 'react';
import { buildBreadcrumbJsonLd, buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Online Booking & Availability | Bimondo Travels Sri Lanka',
  description:
    'Check live availability and book private Sri Lanka signature journeys, Colombo day experiences, and boutique stays through Bimondo Travels official booking channels.',
  path: '/booking',
});

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  ...buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Booking', path: '/booking' },
  ]),
};

export default function BookingLayout({
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
