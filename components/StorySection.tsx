'use client';

import React from 'react';
import Link from 'next/link';
import { useSiteCms } from '@/hooks/useSiteCms';
import CmsImage from '@/components/CmsImage';

export default function StorySection() {
  const { cms } = useSiteCms();
  const mainImg = cms.general.storyMainImage || '';
  const secondaryImg = cms.general.storySecondaryImage || '';

  return (
    <section className="section wrap story" id="story">
      <div className="story-images">
        <div className="main" style={{ position: 'relative' }}>
          <CmsImage
            alt="Our Story in Sri Lanka"
            src={mainImg}
            fill
            sizes="(max-width: 720px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </div>
        <div className="small">
          <CmsImage
            alt="Living cultural traditions of Sri Lanka"
            src={secondaryImg}
            fill
            sizes="(max-width: 720px) 50vw, 25vw"
            className="object-cover"
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
