'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const MAIN_SLIDES = [
  {
    src: '/images/kandyan-ves-dancer.jpg',
    alt: 'Traditional Kandyan cultural heritage in Sri Lanka',
  },
  {
    src: 'https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=1000&q=85',
    alt: 'Sunrise over Sigiriya Rock Fortress in the Cultural Triangle',
  },
  {
    src: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1000&q=85',
    alt: 'Hill country railway and tea hills in Ella, Sri Lanka',
  },
  {
    src: 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1000&q=85',
    alt: 'Historic Galle Fort ramparts and southern coastline',
  },
];

const SMALL_SLIDES = [
  {
    src: '/images/sri-lankan-dancer-matching.jpg',
    alt: 'Living cultural traditions of Sri Lanka',
  },
  {
    src: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=900&q=85',
    alt: 'Tea estates along The Pekoe Trail in the Central Highlands',
  },
  {
    src: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=900&q=85',
    alt: 'Wild elephant herds at Minneriya National Park',
  },
  {
    src: '/images/sri-lankan-dancer-welcome.jpg',
    alt: 'Warm Sri Lankan hospitality',
  },
];

export default function StorySection() {
  const [mainIdx, setMainIdx] = useState(0);
  const [smallIdx, setSmallIdx] = useState(0);
  const [mainFading, setMainFading] = useState(false);
  const [smallFading, setSmallFading] = useState(false);

  useEffect(() => {
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
          01 / OUR STORY · EST. 2022 IN BATTARAMULLA
        </div>
        <h2 className="big-heading serif">
          Through the people
          <br />
          who call this
          <br />
          <em style={{ color: 'var(--terracotta)' }}>island home.</em>
        </h2>
        <p>
          In the quiet suburb of Thalangama South in Battaramulla, where the
          morning mist rises off the wetland and the green edge of the
          countryside meets the energy of Colombo, Bimondo Travels was founded in
          2022 by I.M. Bimsara Illangasinghe on a simple belief: the best way to
          experience Sri Lanka is not through a window on a rushed bus tour, but
          through the people who call this island home.
        </p>
        <p style={{ marginTop: '12px' }}>
          Instead of selling one-size-fits-all packages, we plan journeys around
          the traveller—whether you want to surf warm southern swells, climb
          ancient rock fortresses at dawn, walk through misty tea hills, or sit
          quietly in a jeep watching elephants gather by a lake.
        </p>
        <div className="quote">
          “Not a place you visit, but a feeling you carry home.”
        </div>
        <Link className="pill" href="/our-story" prefetch={false}>
          READ OUR FULL STORY ↗
        </Link>
      </div>
    </section>
  );
}
