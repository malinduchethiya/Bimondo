'use client';

import React, { useState } from 'react';

interface Thought {
  id: string;
  quote: string;
  story: string;
  author: string;
  origin: string;
  journey: string;
  duration: string;
  date: string;
  featured?: boolean;
}

const THOUGHTS: Thought[] = [
  {
    id: 'claire-marcus',
    quote: '“We came looking for a holiday and left feeling like we had family in Sri Lanka.”',
    story:
      'From waking up to mist rolling over the Nine Arch Bridge in Ella to sharing home-cooked jackfruit curry in a quiet Kandy village, every single day felt unhurried and deeply personal. Our chauffeur-guide knew every hidden viewpoint before the crowds arrived.',
    author: 'Claire & Marcus V.',
    origin: 'Zurich, Switzerland',
    journey: 'Ceylon Grand Circuit',
    duration: '14 Days · Private Journey',
    date: 'January 2026',
  },
  {
    id: 'arjun-meera',
    quote: '“Not a single tourist trap — just pure, soulful island magic at our own pace.”',
    story:
      'Bimsara and his team listened to how we actually like to travel. When we wanted an extra afternoon by the cove in Tangalle instead of rushing, everything was rearranged effortlessly within minutes. Watching elephants gather at dusk in Minneriya stays with us forever.',
    author: 'Elena & Thomas K.',
    origin: 'Melbourne, Australia',
    journey: 'Leopards, Elephants & South Coast',
    duration: '11 Days · Tailor-Made',
    date: 'February 2026',
    featured: true,
  },
  {
    id: 'sophie-family',
    quote: '“Travelling with two children has never felt this calm, safe and full of wonder.”',
    story:
      'Our driver was endlessly patient and warm with our kids — stopping for fresh king coconuts along the roadside, spotting peacocks and toque macaques, and picking boutique stays where we could truly exhale as a family.',
    author: 'The Lindqvist Family',
    origin: 'Stockholm, Sweden',
    journey: 'Family Island Discovery',
    duration: '10 Days · Family Route',
    date: 'December 2025',
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
              06 / TRAVELLERS&apos; THOUGHTS
            </div>
            <h2 className="serif">
              Words carried
              <br />
              <em style={{ color: 'var(--terracotta)' }}>back home.</em>
            </h2>
          </div>
          <p>
            Real stories from guests who explored the island privately with our
            local guides and travel designers.
          </p>
        </div>

        <div className="thoughts-grid">
          {THOUGHTS.map((item, idx) => {
            const isHighlighted = idx === activeIdx;
            return (
              <article
                key={item.id}
                className={`thought-card ${isHighlighted ? 'highlighted' : ''}`}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => setActiveIdx(idx)}
              >
                <div className="thought-top">
                  <span className="thought-tag">{item.duration}</span>
                  <span className="thought-stars" aria-label="5 out of 5 stars">
                    ★★★★★
                  </span>
                </div>

                <blockquote className="thought-quote serif">
                  {item.quote}
                </blockquote>

                <p className="thought-story">{item.story}</p>

                <div className="thought-foot">
                  <div>
                    <strong className="thought-author">{item.author}</strong>
                    <span className="thought-origin">{item.origin}</span>
                  </div>
                  <div className="thought-route-badge">{item.journey}</div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
