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
    category: 'PRIVATE JOURNEYS',
    question: 'Are all Bimondo Travels itineraries private and tailor-made?',
    answer:
      'Yes. Every journey is planned around your interests, preferred pace, accommodation style, and budget—whether you are travelling solo, as a couple, with family, or in a small private group.',
  },
  {
    category: '7-STEP PROCESS',
    question: 'How does the guest journey work from first enquiry to departure?',
    answer:
      'We follow seven clear steps: (01) Enquiry via website, email, or WhatsApp; (02) Personal consultation; (03) Custom day-by-day itinerary design; (04) Clear quotation and booking confirmation; (05) Pre-arrival information on packing, weather, cultural etiquette, and driver/guide details; (06) Airport greeting, private journey, and 24-hour on-call support; and (07) Departure transfer and post-trip follow-up.',
  },
  {
    category: 'ACCOMMODATION & TRANSPORT',
    question: 'What accommodation and transport standards do you provide?',
    answer:
      'We arrange a curated range of four-star hotels, boutique properties, and five-star luxury resorts across Sri Lanka, paired with private transport, professional drivers, licensed guides, and specialist local guides for hiking, birdwatching, and adventure sports.',
  },
  {
    category: 'SEASONS & COASTS',
    question: 'When is the best time of year to visit different parts of Sri Lanka?',
    answer:
      'Sri Lanka is a year-round destination with two distinct coastal seasons. Weligama and the South and West Coasts are best from November to April, while Arugam Bay and the East Coast are best from May to October.',
  },
  {
    category: 'RESPONSIBLE TRAVEL',
    question: 'How do you approach wildlife safaris and nature experiences?',
    answer:
      'We partner with safari operators in Yala, Udawalawe, Wilpattu, and Minneriya who respect park rules and animal welfare, and with vetted, safety-checked adventure operators. Routes, durations, hotels, and inclusions are confirmed individually at the time of enquiry; wildlife sightings, sea conditions, and adventure activities depend on nature and are never guaranteed.',
  },
  {
    category: 'HOME BASE IN BATTARAMULLA',
    question: 'Where is Bimondo Travels located in Sri Lanka?',
    answer:
      'Our office is located at No. 596/1, Thalangama South, Battaramulla, Sri Lanka—close to Colombo, Kotte, Thalangama Wetland, and the expressway network linking Bandaranaike International Airport (CMB) with the rest of the island.',
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
            <em style={{ color: 'var(--terracotta)' }}>answered clearly.</em>
          </h2>
          <p className="faq-lead">
            Practical information on how we plan, confirm, and support your
            private journey across Sri Lanka from our base in Battaramulla.
          </p>
          <div className="faq-cta-box">
            <span>Have a question about travel dates or a custom route?</span>
            <Link className="pill dark" href="/contact" prefetch={false}>
              SPEAK WITH OUR TEAM ↗
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
