import React from 'react';
import type { Metadata } from 'next';
import PageBanner from '@/components/PageBanner';
import ValuesSection from '@/components/ValuesSection';
import TravellersThoughtsSection from '@/components/TravellersThoughtsSection';
import PlanningSection from '@/components/PlanningSection';
import FaqSection from '@/components/FaqSection';

export const metadata: Metadata = {
  title: 'Bimondo Travels — Why Bimondo',
  description:
    'Private by nature, 24-hour support, and care for our home. The Bimondo difference.',
};

export default function WhyBimondoPage() {
  return (
    <main>
      <PageBanner title="Travel with a local heart." />
      <ValuesSection />
      <TravellersThoughtsSection />
      <PlanningSection />
      <FaqSection />
    </main>
  );
}
