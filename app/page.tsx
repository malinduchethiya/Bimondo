import React from 'react';
import HeroSection from '@/components/HeroSection';
import HeroTransitionSection from '@/components/HeroTransitionSection';
import StorySection from '@/components/StorySection';
import BentoDestinationSlider from '@/components/BentoDestinationSlider';
import TourSection from '@/components/TourSection';
import ExperienceSection from '@/components/ExperienceSection';
import PlacesSection from '@/components/PlacesSection';
import ValuesSection from '@/components/ValuesSection';
import TravellersThoughtsSection from '@/components/TravellersThoughtsSection';
import PlanningSection from '@/components/PlanningSection';
import FaqSection from '@/components/FaqSection';
import ContactSection from '@/components/ContactSection';

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <HeroTransitionSection />
      <StorySection />
      <BentoDestinationSlider />
      <TourSection />
      <ExperienceSection />
      <PlacesSection />
      <ValuesSection />
      <TravellersThoughtsSection />
      <PlanningSection />
      <FaqSection />
      <ContactSection />
    </main>
  );
}
