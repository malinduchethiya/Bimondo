import React from 'react';
import HeroSection from '@/components/HeroSection';
import HeroTransitionSection from '@/components/HeroTransitionSection';
import StorySection from '@/components/StorySection';
import BentoDestinationSlider from '@/components/BentoDestinationSlider';
import ExperienceSection from '@/components/ExperienceSection';
import PlacesSection from '@/components/PlacesSection';
import ValuesSection from '@/components/ValuesSection';
import PlanningSection from '@/components/PlanningSection';
import ContactSection from '@/components/ContactSection';

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <HeroTransitionSection />
      <StorySection />
      <BentoDestinationSlider />
      <ExperienceSection />
      <PlacesSection />
      <ValuesSection />
      <PlanningSection />
      <ContactSection />
    </main>
  );
}
