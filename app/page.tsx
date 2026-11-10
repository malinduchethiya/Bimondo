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
import HomepageAvailabilityBar from '@/components/booking/HomepageAvailabilityBar';

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <HeroTransitionSection />
      <HomepageAvailabilityBar />
      <StorySection />
      <BentoDestinationSlider />
      <div className="horizontal-scroll-pin-wrap" id="horizontal-scroll-wrap">
        <div className="horizontal-scroll-track" id="horizontal-scroll-track">
          <ExperienceSection />
          <PlacesSection />
          <ValuesSection />
          <PlanningSection />
          <ContactSection />
        </div>
      </div>
    </main>
  );
}

