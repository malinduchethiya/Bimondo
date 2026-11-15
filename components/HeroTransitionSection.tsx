'use client';

import React from 'react';
import { useSiteCms } from '@/hooks/useSiteCms';

export default function HeroTransitionSection() {
  const { cms } = useSiteCms();
  const transition = cms.pages.home.heroTransition;

  if (transition.visible === false) {
    return null;
  }

  const features = transition.pillars || [];

  return (
    <section
      className="hero-transition-section"
      aria-label="Bimondo Signature Pillars"
    >
      <div className="hero-transition-container">
        <div className="hero-transition-grid">
          {features.map((f, idx) => (
            <div
              key={f.id || f.num || idx}
              className={`transition-card ${
                idx === 1 ? 'middle-card middle-subsection' : ''
              }`}
            >
              <div className="transition-card-top">
                <span className="transition-num">{f.num}</span>
                <span className="transition-badge">{f.badge}</span>
              </div>
              <h3 className="serif transition-title">{f.title}</h3>
              <p className="transition-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
