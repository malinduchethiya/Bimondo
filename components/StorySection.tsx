import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function StorySection() {
  return (
    <section className="section wrap story" id="story">
      <div className="story-images">
        <div className="main" style={{ position: 'relative' }}>
          <Image
            alt="Traditional Kandyan Ves dancer welcoming travellers to Sri Lanka"
            src="/images/kandyan-ves-dancer.jpg"
            fill
            sizes="(max-width: 720px) 100vw, 50vw"
            className="object-cover"
            referrerPolicy="no-referrer"
            priority
          />
        </div>
        <div className="small">
          <Image
            alt="Joyful Sri Lankan cultural dancers in traditional blue attire"
            src="/images/sri-lankan-dancer-matching.jpg"
            fill
            sizes="(max-width: 720px) 50vw, 25vw"
            className="object-cover"
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
        <Link className="pill" href="/why-bimondo">
          GET TO KNOW US ↗
        </Link>
      </div>
    </section>
  );
}
