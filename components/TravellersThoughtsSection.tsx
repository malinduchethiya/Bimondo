'use client';

import React, { useState } from 'react';

interface CoreValueCard {
  id: string;
  num: string;
  title: string;
  quote: string;
  description: string;
  pillar: string;
}

const CORE_VALUES: CoreValueCard[] = [
  {
    id: 'authenticity',
    num: '01 / CORE VALUE',
    title: 'Authenticity',
    quote:
      '“We show the real Sri Lanka—local food, working villages, living traditions, and honest conversations.”',
    description:
      'Rather than staged tourist stops, we build time into every route for genuine encounters with Sri Lanka’s people, heritage, and landscapes.',
    pillar: 'Section 05 · Company Profile',
  },
  {
    id: 'personal-service',
    num: '02 / CORE VALUE',
    title: 'Personal Service',
    quote:
      '“Every traveller is different. We listen carefully, plan thoughtfully, and adapt each itinerary to the people we are hosting.”',
    description:
      'Whether you are a solo traveller, a couple, a family with children, or a small private group, your route is designed around your own pace.',
    pillar: 'Section 05 · Company Profile',
  },
  {
    id: 'sustainability-heritage',
    num: '03 / CORE VALUE',
    title: 'Sustainability & Respect for Heritage',
    quote:
      '“Tourism should protect nature and benefit local communities—approaching sacred places and wildlife with care.”',
    description:
      'We work with safari operators who respect park rules and animal welfare, encourage proper dress and conduct at sacred sites, and partner with locally owned stays.',
    pillar: 'Sections 05 & 15 · Company Profile',
  },
];

export default function TravellersThoughtsSection() {
  const [activeIdx, setActiveIdx] = useState<number>(1);

  return (
    <section className="section thoughts-section" id="travellers-thoughts">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              06 / OUR SIX CORE VALUES
            </div>
            <h2 className="serif">
              What guides every
              <br />
              <em style={{ color: 'var(--terracotta)' }}>Bimondo journey.</em>
            </h2>
          </div>
          <p>
            Authenticity, Personal Service, Sustainability, Innovation,
            Reliability, and Respect for Heritage—the principles at the heart of
            our Battaramulla team since 2022.
          </p>
        </div>

        <div className="thoughts-grid">
          {CORE_VALUES.map((item, idx) => {
            const isHighlighted = idx === activeIdx;
            return (
              <article
                key={item.id}
                className={`thought-card ${isHighlighted ? 'highlighted' : ''}`}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => setActiveIdx(idx)}
              >
                <div className="thought-top">
                  <span className="thought-tag">{item.num}</span>
                </div>

                <blockquote className="thought-quote serif">
                  {item.quote}
                </blockquote>

                <p className="thought-story">{item.description}</p>

                <div className="thought-foot">
                  <div>
                    <strong className="thought-author">{item.title}</strong>
                    <span className="thought-origin">Bimondo Travels</span>
                  </div>
                  <div className="thought-route-badge">{item.pillar}</div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
