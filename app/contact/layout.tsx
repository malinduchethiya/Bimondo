import React from 'react';
import { buildBreadcrumbJsonLd, buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Contact Bimondo Travels | Plan Your Private Sri Lanka Tour',
  description:
    'Speak with our Battaramulla travel specialists via web enquiry, email, or WhatsApp (+94 76 223 2054) to plan a custom private itinerary across Sri Lanka.',
  path: '/contact',
});

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  ...buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Contact', path: '/contact' },
  ]),
};

export default function ContactLayout({
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
