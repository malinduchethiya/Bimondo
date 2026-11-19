import React from 'react';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Sri Lanka Tour Packages & Private Journeys | Bimondo Travels',
  description:
    'Browse 20 signature private Sri Lanka tour packages spanning heritage circuits, wildlife safaris, tea-country hikes, family holidays, adventure routes, and coastal retreats.',
  path: '/packages',
});

export default function PackagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
