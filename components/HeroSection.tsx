import React from 'react';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="hero" id="home">
      <div className="hero-photo" aria-hidden="true" />

      <div className="wrap hero-inner">
        <div className="hero-copy">
          <div className="eyebrow hero-eyebrow">
            BIMONDO TRAVELS — PRIVATE, AUTHENTIC JOURNEYS ACROSS SRI LANKA
          </div>
          <h1 className="serif">
            Not a place{' '}
            <span className="island-word">
              you visit<span className="period">,</span>
            </span>
            <br />
            <em>but a feeling</em>
            <br />
            <span className="stories-word">
              you carry home<span className="period">.</span>
            </span>
          </h1>
          <p>
            Private, tailor-made journeys across Sri Lanka—spanning adventure,
            culture and heritage, sea and sand, and hiking and wildlife—planned
            personally by our local team in Battaramulla since 2022.
          </p>
          <div className="hero-actions">
            <Link className="pill dark" href="/packages" prefetch={false}>
              EXPLORE OUR JOURNEYS ↗
            </Link>
            <Link className="pill" href="/our-story" prefetch={false}>
              OUR STORY ↓
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom-Right Frosted Tripadvisor Rating Card */}
      <div
        className="hero-tripadvisor-card"
        aria-label="Tripadvisor 5.0 rating based on 165 reviews"
      >
        <div className="hero-ta-top">
          <span className="hero-ta-brand">Tripadvisor</span>
          <span className="hero-ta-divider" aria-hidden="true">
            |
          </span>
          <span className="hero-ta-score">5.0</span>
        </div>
        <div className="hero-ta-stars" aria-hidden="true">
          <span>★</span>
          <span>★</span>
          <span>★</span>
          <span>★</span>
          <span>★</span>
        </div>
        <div className="hero-ta-sub">Based on 165 reviews</div>
      </div>
    </section>
  );
}
