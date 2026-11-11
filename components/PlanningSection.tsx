'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSiteCms } from '@/hooks/useSiteCms';

interface FAQItem {
  id: string;
  category: 'private' | 'stays' | 'booking';
  q: string;
  a: string;
}

const GUEST_JOURNEY_STEPS = [
  {
    num: '01',
    title: 'Enquiry',
    desc: 'Reach us via website, email, or WhatsApp.',
  },
  {
    num: '02',
    title: 'Consultation',
    desc: 'Discuss your pace, stays, and interests.',
  },
  {
    num: '03',
    title: 'Itinerary Design',
    desc: 'Custom day-by-day route & hotel curation.',
  },
  {
    num: '04',
    title: 'Confirmation',
    desc: 'Clear quotation & confirmed reservations.',
  },
  {
    num: '05',
    title: 'Pre-Arrival',
    desc: 'Packing notes, etiquette & guide details.',
  },
  {
    num: '06',
    title: 'Arrival & Journey',
    desc: 'Airport greeting & 24-hour local support.',
  },
  {
    num: '07',
    title: 'Follow-Up',
    desc: 'Departure transfer & post-trip care.',
  },
];

const FAQ_CATEGORIES = [
  { id: 'all', label: 'All FAQs' },
  { id: 'private', label: 'Private Journeys' },
  { id: 'stays', label: 'Stays & Guides' },
  { id: 'booking', label: 'Seasons & Booking' },
] as const;

const FAQS: FAQItem[] = [
  {
    id: 'who-is-bimondo',
    category: 'private',
    q: 'Who is Bimondo Travels and where are you based?',
    a: 'Bimondo Travels is a Sri Lankan travel company founded in 2022 by I.M. Bimsara Illangasinghe and based at No. 596/1, Thalangama South, Battaramulla, near Colombo. We plan private, tailor-made journeys across Sri Lanka.',
  },
  {
    id: 'how-journey-works',
    category: 'booking',
    q: 'How does the 7-step guest journey work?',
    a: '(01) Enquiry; (02) Personal consultation; (03) Custom day-by-day itinerary design; (04) Clear quotation & booking confirmation; (05) Pre-arrival briefing; (06) Airport greeting, private journey & 24-hour support; (07) Departure transfer & follow-up.',
  },
  {
    id: 'accommodation-options',
    category: 'stays',
    q: 'What types of accommodation do you arrange?',
    a: 'We arrange curated four-star hotels, characterful boutique properties, and five-star luxury resorts. Hotels and inclusions are confirmed individually at the time of enquiry.',
  },
  {
    id: 'drivers-and-guides',
    category: 'stays',
    q: 'Who accompanies us during our journey?',
    a: 'Private transport with professional drivers and licensed guides, specialist local guides for hiking, birdwatching, and adventure sports, plus 24-hour on-call support from Battaramulla.',
  },
  {
    id: 'wildlife-and-nature',
    category: 'private',
    q: 'How do you handle wildlife safaris and adventure safety?',
    a: 'We partner with safari operators in Yala, Udawalawe, Wilpattu, and Minneriya who respect park rules and animal welfare, and vetted adventure operators. Sightings and sea conditions depend on nature.',
  },
  {
    id: 'best-seasons',
    category: 'booking',
    q: 'How do Sri Lanka’s two coastal seasons work?',
    a: 'Weligama and the South/West Coast are best from November to April, while Arugam Bay and the East Coast are best from May to October.',
  },
];

export default function PlanningSection() {
  const { cms } = useSiteCms();
  const faqsList = cms.faqs && cms.faqs.length > 0 ? cms.faqs : FAQS;
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const filteredFaqs = (
    activeCategory === 'all'
      ? faqsList
      : faqsList.filter((item) => item.category === activeCategory)
  ).slice(0, 5);

  const toggleFAQ = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="section wrap planning-faq-wrapper" id="planning-faq">
      <div className="planning-top-split">
        <div className="planning-intro-col">
          <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
            06 / HOW A BIMONDO JOURNEY WORKS
          </div>
          <h2 className="big-heading serif">
            Seven clear steps.
            <br />
            <em style={{ color: 'var(--terracotta)' }}>Personal from day one.</em>
          </h2>
          <p className="planning-intro-lead">
            From your first message to your departure flight, every itinerary is
            designed around your pace with clear written arrangements and
            24-hour local support.
          </p>

          <div className="planning-steps-compact-grid">
            {GUEST_JOURNEY_STEPS.map((step) => (
              <div key={step.num} className="planning-step-chip">
                <div className="planning-step-chip-head">
                  <span className="planning-step-num">{step.num}</span>
                  <strong className="planning-step-title">{step.title}</strong>
                </div>
                <p className="planning-step-desc">{step.desc}</p>
              </div>
            ))}
            <Link
              className="planning-step-cta-card"
              href="/contact"
              prefetch={false}
            >
              <span>START YOUR JOURNEY</span>
              <strong>Step 01 — Enquire ↗</strong>
            </Link>
          </div>
        </div>
      </div>

      {/* Minimalist Pill-Filtered Hairline FAQ Block (No internal scroll capture so horizontal scroll is seamless) */}
      <div className="minimal-faq-block" id="faq">
        <div
          className="minimal-faq-pills"
          role="tablist"
          aria-label="FAQ Categories"
        >
          {FAQ_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`minimal-faq-pill ${isActive ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="minimal-faq-list">
          {filteredFaqs.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className={`minimal-faq-row ${isOpen ? 'is-open' : ''}`}
              >
                <button
                  type="button"
                  className="minimal-faq-trigger"
                  onClick={() => toggleFAQ(item.id)}
                  aria-expanded={isOpen}
                >
                  <span className="minimal-faq-question">{item.q}</span>
                  <span className="minimal-faq-plus" aria-hidden="true">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                <div
                  className="minimal-faq-panel"
                  style={{
                    maxHeight: isOpen ? '160px' : '0px',
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <p className="minimal-faq-answer">{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
