'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const FAQS: FaqItem[] = [
  {
    category: 'PRIVATE TRAVEL',
    question: 'Are all Bimondo journeys completely private?',
    answer:
      'Yes. Every journey we craft is 100% private to you and your travelling companions. You never share a vehicle or guide with strangers, and each day moves to your personal pace—whether you want to linger longer at a highland tea estate or stop spontaneously at a roadside fruit stall.',
  },
  {
    category: 'TAILOR-MADE ROUTES',
    question: 'Can we customize the sample itineraries and hotel style?',
    answer:
      'Completely. The journeys on our website are curated starting points. We tailor every route, duration, activity, and stay around your preferences—from intimate heritage tea bungalows and architect-designed boutique villas to luxury tented safari camps.',
  },
  {
    category: 'CHAUFFEUR-GUIDES',
    question: 'Who will accompany us during our trip in Sri Lanka?',
    answer:
      'You will travel with a dedicated, licensed English-speaking Sri Lankan chauffeur-guide in a modern, air-conditioned private vehicle, supported 24/7 by our Colombo-based concierge team for any reservations, adjustments, or local recommendations.',
  },
  {
    category: 'SEASONS & WEATHER',
    question: 'When is the best time of year to visit Sri Lanka?',
    answer:
      'Sri Lanka is a true year-round island destination thanks to two distinct monsoon patterns. December to April is ideal for the South & West Coasts, Hill Country, and Cultural Triangle, while May to September brings sun-drenched days to the East Coast (Trincomalee, Pasikudah & Arugam Bay) and northern cultural capitals.',
  },
  {
    category: 'WILDLIFE ETHICS',
    question: 'How do you approach wildlife safaris and conservation?',
    answer:
      'We work exclusively with ethical naturalists and experienced trackers who respect park regulations and animal welfare. We often recommend quieter park sectors, dawn entry windows, or lesser-known reserves like Wilpattu, Kumana, and Gal Oya to avoid jeep crowding.',
  },
  {
    category: 'BOOKING & SUPPORT',
    question: 'How does the planning and confirmation process work?',
    answer:
      'Simply share your travel dates or ideas via WhatsApp or email. Within 24–48 hours, we design a personalized route proposal. Once we refine the details together and you are delighted with every stay, we issue a clear written quote and lock in your reservations.',
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section className="section faq-section" id="faq">
      <div className="wrap faq-grid">
        <div className="faq-intro">
          <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
            08 / GOOD TO KNOW
          </div>
          <h2 className="big-heading serif">
            Questions,
            <br />
            <em style={{ color: 'var(--terracotta)' }}>answered simply.</em>
          </h2>
          <p className="faq-lead">
            Everything you need to know about planning a private, unhurried
            journey across Sri Lanka with our local team.
          </p>
          <div className="faq-cta-box">
            <span>Have a specific question about dates or routes?</span>
            <Link className="pill dark" href="/contact">
              ASK OUR LOCAL TEAM ↗
            </Link>
          </div>
        </div>

        <div className="faq-list">
          {FAQS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`faq-item ${isOpen ? 'open' : ''}`}
              >
                <button
                  type="button"
                  className="faq-question-btn"
                  aria-expanded={isOpen}
                  onClick={() => toggleFaq(idx)}
                >
                  <div className="faq-question-left">
                    <span className="faq-num">
                      0{idx + 1} / {item.category}
                    </span>
                    <h3 className="serif faq-question-title">
                      {item.question}
                    </h3>
                  </div>
                  <span className="faq-icon" aria-hidden="true">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>

                <div
                  className="faq-answer-wrap"
                  style={{
                    maxHeight: isOpen ? '320px' : '0px',
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <p className="faq-answer-text">{item.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
