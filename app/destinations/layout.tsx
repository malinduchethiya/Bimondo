import React from 'react';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Sri Lanka Destinations Directory (47 Places) | Bimondo Travels',
  description:
    'Explore 47 curated Sri Lanka destination guides across the Cultural Triangle, Hill Country, National Parks, Beaches, Adventure Hubs, and Colombo Day Experiences.',
  path: '/destinations',
});

export default function DestinationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
