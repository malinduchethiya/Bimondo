import React from 'react';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="hero" id="home">
      <div className="hero-photo" aria-hidden="true" />

      <div className="wrap hero-inner">
        <div className="hero-copy">
          <div className="eyebrow hero-eyebrow">
            AYUBOWAN · PRIVATE JOURNEYS IN SRI LANKA
          </div>
          <h1 className="serif">
            A little{' '}
            <span className="island-word">
              island<span className="period">.</span>
            </span>
            <br />
            <em>A lifetime</em>
            <br />
            <span className="stories-word">
              of stories<span className="period">.</span>
            </span>
          </h1>
          <p>
            Not a checklist. Not a crowded tour bus. Just your own Sri Lanka —
            its warm people, ancient wonders and unforgettable little moments.
          </p>
          <div className="hero-actions">
            <Link className="pill dark" href="/packages" prefetch={false}>
              EXPLORE OUR JOURNEYS ↗
            </Link>
            <Link className="pill" href="/our-story" prefetch={false}>
              MEET BIMONDO ↓
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
