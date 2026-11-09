import React from 'react';
import type { Metadata } from 'next';
import PageBanner from '@/components/PageBanner';
import BentoDestinationSlider from '@/components/BentoDestinationSlider';
import ExperienceSection from '@/components/ExperienceSection';
import PlacesSection from '@/components/PlacesSection';

export const metadata: Metadata = {
  title: 'Bimondo Travels — Discover Sri Lanka',
  description:
    'Experience culture, wildlife, adventure and slow days across the wonders of Sri Lanka.',
};

export default function DiscoverPage() {
  return (
    <main>
      <PageBanner title="Feel every side of Sri Lanka." />
      <BentoDestinationSlider />
      <ExperienceSection />
      <PlacesSection />
    </main>
  );
}
