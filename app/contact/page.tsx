import React from 'react';
import PageBanner from '@/components/PageBanner';
import ContactSection from '@/components/ContactSection';
import FaqSection from '@/components/FaqSection';

export default function ContactPage() {
  return (
    <main>
      <PageBanner title="Your journey starts here." />
      <ContactSection />
      <FaqSection />
    </main>
  );
}
