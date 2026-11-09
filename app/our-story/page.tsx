import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import PageBanner from '@/components/PageBanner';
import StorySection from '@/components/StorySection';

export const metadata: Metadata = {
  title: 'Bimondo Travels — Our Story',
  description:
    'Founded in 2022 by Bimsara Illangasinghe. Private bespoke journeys through Sri Lanka. Come as a traveller, leave as a friend.',
};

export default function OurStoryPage() {
  const pillars = [
    {
      number: '01',
      title: 'Real People, Real Connections',
      desc: 'We do not run tour buses or impersonal itineraries. Every journey is guided by trusted Sri Lankan driver-guides who share their home with genuine pride.',
    },
    {
      number: '02',
      title: 'Move at Your Own Rhythm',
      desc: 'If you want to spend another hour sipping tea watching the mist roll over Ella Gap, or stop for fresh roadside king coconuts, you do. There are no rigid clocks.',
    },
    {
      number: '03',
      title: 'Respecting Our Island Home',
      desc: 'We support local community homestays, ethical wildlife safaris without harassment, and family-owned boutique lodges across every province.',
    },
  ];

  return (
    <main>
      <PageBanner
        eyebrow="BIMONDO TRAVELS  /  OUR STORY"
        title="Come as a traveller. Leave as a friend."
      />

      {/* Main Story Section featuring Ayubowan traditional dancer */}
      <StorySection />

      {/* Detailed Philosophy & Team Section */}
      <section className="section wrap" style={{ paddingTop: '20px' }}>
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              OUR PHILOSOPHY
            </div>
            <h2 className="serif">
              Why we founded{' '}
              <em style={{ color: 'var(--terracotta)' }}>Bimondo Travels.</em>
            </h2>
          </div>
          <p>
            Sri Lanka is an island of warmth and wonder. We created Bimondo to
            offer discerning travellers a truly private, thoughtful way to
            experience it.
          </p>
        </div>

        <div className="values-grid" style={{ marginBottom: '60px' }}>
          {pillars.map((p) => (
            <div key={p.number} className="value" style={{ borderTopColor: '#c8dbe2' }}>
              <span className="number" style={{ color: 'var(--terracotta)', fontWeight: 700 }}>
                {p.number} / PHILOSOPHY
              </span>
              <h3 className="serif" style={{ color: 'var(--ink)', fontSize: '28px', margin: '12px 0 10px' }}>
                {p.title}
              </h3>
              <p style={{ color: '#557180', lineHeight: 1.8 }}>{p.desc}</p>
            </div>
          ))}
        </div>

        {/* Founder Quote Card */}
        <div className="founder-quote-card">
          <div>
            <span className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              A MESSAGE FROM OUR FOUNDER
            </span>
            <blockquote
              className="serif"
              style={{
                fontSize: 'clamp(22px, 2.5vw, 32px)',
                lineHeight: 1.35,
                color: 'var(--ink)',
                margin: '16px 0 20px',
              }}
            >
              “When you travel with someone who genuinely loves their country, every
              roadside tea shop, hidden temple cave, and quiet ocean bay becomes a
              memory you carry for the rest of your life.”
            </blockquote>
            <p style={{ color: '#536f7e', lineHeight: 1.8, marginBottom: '24px' }}>
              <strong>Bimsara Illangasinghe</strong> — Founder, Bimondo Travels
              (Private) Ltd, Colombo, Sri Lanka.
            </p>
            <Link href="/contact" className="pill dark">
              PLAN YOUR JOURNEY WITH US ↗
            </Link>
          </div>
          <div className="founder-glance-box">
            <h4 className="serif" style={{ fontSize: '22px', margin: '0 0 12px', color: 'var(--ink)' }}>
              Bimondo At a Glance
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '10px', fontSize: '13px', color: '#3d5c6b' }}>
              <li>✳ Founded in Colombo in 2022</li>
              <li>✳ 100% Private tailor-made routes</li>
              <li>✳ Handpicked English-speaking chauffeur team</li>
              <li>✳ 24/7 Islandwide WhatsApp concierge</li>
              <li>✳ 4.98 / 5.0 Traveller satisfaction score</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
