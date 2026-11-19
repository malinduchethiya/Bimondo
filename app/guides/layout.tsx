import React from 'react';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Sri Lanka Travel Guides, Itineraries & Planning Tips | Bimondo Travels',
  description:
    'Practical Sri Lanka travel guides written for international visitors: monsoon seasons, 7-day and 10-day itineraries, safari comparisons, Cultural Triangle routing, and first-time visitor advice.',
  path: '/guides',
});

export default function GuidesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
