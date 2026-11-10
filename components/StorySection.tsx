'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const MAIN_SLIDES = [
  {
    src: '/images/kandyan-ves-dancer.jpg',
    alt: 'Traditional Kandyan Ves dancer welcoming travellers to Sri Lanka',
  },
  {
    src: 'https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=1000&q=85',
    alt: 'Sunrise over Sigiriya Lion Rock fortress in Sri Lanka',
  },
  {
    src: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1000&q=85',
    alt: 'Nine Arch Bridge and misty tea hills in Ella, Sri Lanka',
  },
  {
    src: 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1000&q=85',
    alt: 'Historic Galle Fort lighthouse and southern coastline',
  },
];

const SMALL_SLIDES = [
  {
    src: '/images/sri-lankan-dancer-matching.jpg',
    alt: 'Joyful Sri Lankan cultural dancers in traditional attire',
  },
  {
    src: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=900&q=85',
    alt: 'Emerald Ceylon tea terraces in the Central Highlands',
  },
  {
    src: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=900&q=85',
    alt: 'Wild elephant gathering by an ancient reservoir in Sri Lanka',
  },
  {
    src: '/images/sri-lankan-dancer-welcome.jpg',
    alt: 'Warm Ayubowan traditional welcome in Sri Lanka',
  },
];

export default function StorySection() {
  const [mainIdx, setMainIdx] = useState(0);
  const [smallIdx, setSmallIdx] = useState(0);
  const [mainFading, setMainFading] = useState(false);
  const [smallFading, setSmallFading] = useState(false);

  useEffect(() => {
    // Preload all slideshow images so transitions are instant
    [...MAIN_SLIDES, ...SMALL_SLIDES].forEach((slide) => {
      const preloadImg = new window.Image();
      preloadImg.src = slide.src;
    });

    const cycleMain = () => {
      setMainFading(true);
      window.setTimeout(() => {
        setMainIdx((prev) => (prev + 1) % MAIN_SLIDES.length);
        setMainFading(false);
      }, 320);
    };

    const cycleSmall = () => {
      setSmallFading(true);
      window.setTimeout(() => {
        setSmallIdx((prev) => (prev + 1) % SMALL_SLIDES.length);
        setSmallFading(false);
      }, 320);
    };

    const mainInterval = window.setInterval(cycleMain, 3800);

    let smallInterval: number | null = null;
    const smallStartDelay = window.setTimeout(() => {
      cycleSmall();
      smallInterval = window.setInterval(cycleSmall, 3800);
    }, 1900);

    return () => {
      window.clearInterval(mainInterval);
      window.clearTimeout(smallStartDelay);
      if (smallInterval) {
        window.clearInterval(smallInterval);
      }
    };
  }, []);

  const currentMain = MAIN_SLIDES[mainIdx];
  const currentSmall = SMALL_SLIDES[smallIdx];

  return (
    <section className="section wrap story" id="story">
      <div className="story-images">
        <div className="main" style={{ position: 'relative' }}>
          <Image
            alt={currentMain.alt}
            src={currentMain.src}
            fill
            sizes="(max-width: 720px) 100vw, 50vw"
            className={`object-cover story-slide-img ${
              mainFading ? 'is-fading' : ''
            }`}
            referrerPolicy="no-referrer"
            priority
          />
        </div>
        <div className="small">
          <Image
            alt={currentSmall.alt}
            src={currentSmall.src}
            fill
            sizes="(max-width: 720px) 50vw, 25vw"
            className={`object-cover story-slide-img ${
              smallFading ? 'is-fading' : ''
            }`}
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      <div>
        <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
          01 / THE BIMONDO STORY
        </div>
        <h2 className="big-heading serif">
          Come as a
          <br />
          traveller.
          <br />
          <em style={{ color: 'var(--terracotta)' }}>Leave as a friend.</em>
        </h2>
        <p>
          Bimondo began in 2022 with a simple idea: the best way to experience Sri
          Lanka is through the people who call it home. Founded by Bimsara
          Illangasinghe, we create private journeys that move to your rhythm, not
          somebody else&apos;s schedule.
        </p>
        <div className="quote">
          “Not a place you visit, but a feeling you carry home.”
        </div>
        <Link className="pill" href="/our-story" prefetch={false}>
          GET TO KNOW US ↗
        </Link>
      </div>
    </section>
  );
}
