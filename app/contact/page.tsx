import React from 'react';
import type { Metadata } from 'next';
import PageBanner from '@/components/PageBanner';
import ContactSection from '@/components/ContactSection';
import FaqSection from '@/components/FaqSection';

export const metadata: Metadata = {
  title: 'Bimondo Travels — Contact Us',
  description:
    'Plan your private Sri Lankan journey. Direct WhatsApp or email communication.',
};

export default function ContactPage() {
  return (
    <main>
      <PageBanner title="Your journey starts here." />
      <ContactSection />
      <FaqSection />
    </main>
  );
}
