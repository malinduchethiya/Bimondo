import React from 'react';
import type { Metadata } from 'next';
import PageBanner from '@/components/PageBanner';
import TourSection from '@/components/TourSection';

export const metadata: Metadata = {
  title: 'Bimondo Travels — Private Journeys',
  description:
    'Explore curated tailor-made journeys in Sri Lanka, from heritage wonders to coastal hideaways.',
};

export default function JourneysPage() {
  return (
    <main>
      <PageBanner title="Your island. Your journey." />
      <TourSection />
    </main>
  );
}
