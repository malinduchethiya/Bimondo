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
    desc: 'Contact through our website, email, or WhatsApp with travel dates or general ideas.',
  },
  {
    num: '02',
    title: 'Consultation',
    desc: 'Discussion of your interests, preferred pace, accommodation style, and budget.',
  },
  {
    num: '03',
    title: 'Itinerary Design',
    desc: 'Custom day-by-day route designed with suggested hotels and experiences.',
  },
  {
    num: '04',
    title: 'Quotation & Confirmation',
    desc: 'Clear quotation, refinements, booking confirmation, and reservations.',
  },
  {
    num: '05',
    title: 'Pre-Arrival Information',
    desc: 'Practical notes on packing, weather, cultural etiquette, and driver/guide details.',
  },
  {
    num: '06',
    title: 'Arrival & Journey',
    desc: 'Airport greeting, private journey across Sri Lanka, and 24-hour on-call support.',
  },
  {
    num: '07',
    title: 'Departure & Follow-Up',
    desc: 'Airport transfer on departure and post-journey feedback follow-up.',
  },
];

const FAQ_CATEGORIES = [
  { id: 'all', label: '7-Step Process & All FAQs' },
  { id: 'private', label: 'Private Journeys' },
  { id: 'stays', label: 'Stays & Guides' },
  { id: 'booking', label: 'Seasons & Booking' },
] as const;

const FAQS: FAQItem[] = [
  {
    id: 'who-is-bimondo',
    category: 'private',
    q: 'Who is Bimondo Travels and where are you based?',
    a: 'Bimondo Travels is a Sri Lankan travel company founded in 2022 by I.M. Bimsara Illangasinghe and based at No. 596/1, Thalangama South, Battaramulla, near Colombo. We plan and operate private, tailor-made journeys across Sri Lanka for solo travellers, couples, families, and small private groups.',
  },
  {
    id: 'how-journey-works',
    category: 'booking',
    q: 'How does the 7-step Bimondo guest journey work from enquiry to departure?',
    a: '(01) Enquiry via website, email, or WhatsApp; (02) Consultation on your interests, pace, accommodation style, and budget; (03) Custom day-by-day Itinerary Design; (04) Clear Quotation and Confirmation; (05) Pre-Arrival Information on packing, weather, cultural etiquette, and driver/guide details; (06) Airport greeting, private journey, and 24-hour on-call support; (07) Departure transfer and post-journey follow-up.',
  },
  {
    id: 'accommodation-options',
    category: 'stays',
    q: 'What types of accommodation do you arrange across Sri Lanka?',
    a: 'We arrange a curated range of four-star hotels, characterful boutique properties, and five-star luxury resorts. Routes, durations, hotels, and inclusions are selected and confirmed individually at the time of enquiry.',
  },
  {
    id: 'drivers-and-guides',
    category: 'stays',
    q: 'Who accompanies us during our journey and what support is available?',
    a: 'We provide private transport with professional drivers and licensed guides, specialist local guides for activities like hiking, birdwatching, and adventure sports, and 24-hour on-call assistance from our team in Battaramulla.',
  },
  {
    id: 'wildlife-and-nature',
    category: 'private',
    q: 'How do you handle wildlife safaris and adventure safety?',
    a: 'We partner with safari operators in Yala, Udawalawe, Wilpattu, and Minneriya who respect park rules and animal welfare, and with vetted, safety-checked operators for adventure activities. Wildlife sightings, sea conditions, and adventure activities depend on nature and are never guaranteed.',
  },
  {
    id: 'best-seasons',
    category: 'booking',
    q: 'How do Sri Lanka’s coastal seasons work when planning our route?',
    a: 'Sri Lanka is a year-round destination with two distinct coastal seasons: Weligama and the South/West Coast are best from November to April, while Arugam Bay and the East Coast are best from May to October.',
  },
];

export default function PlanningSection() {
  const { cms } = useSiteCms();
  const faqsList = cms.faqs && cms.faqs.length > 0 ? cms.faqs : FAQS;
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const filteredFaqs =
    activeCategory === 'all'
      ? faqsList
      : faqsList.filter((item) => item.category === activeCategory);

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

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))',
              gap: '10px',
              margin: '14px 0 18px',
            }}
          >
            {GUEST_JOURNEY_STEPS.map((step) => (
              <div
                key={step.num}
                style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: '1px solid var(--line)',
                  background: 'rgba(255, 255, 255, 0.55)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    color: 'var(--terracotta)',
                    textTransform: 'uppercase',
                  }}
                >
                  Step {step.num} · {step.title}
                </div>
                <div
                  style={{
                    fontSize: '0.76rem',
                    lineHeight: 1.38,
                    color: 'var(--muted)',
                    marginTop: '3px',
                  }}
                >
                  {step.desc}
                </div>
              </div>
            ))}
          </div>

          <Link className="pill dark" href="/contact" prefetch={false}>
            START WITH STEP 01 — ENQUIRE ↗
          </Link>
        </div>
      </div>

      {/* Minimalist Pill-Filtered Hairline FAQ Block */}
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

        <div className="minimal-faq-list" data-lenis-prevent>
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
                    maxHeight: isOpen ? '260px' : '0px',
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
