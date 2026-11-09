'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface FAQItem {
  q: string;
  a: string;
}

interface ReviewItem {
  name: string;
  location: string;
  rating: number;
  tour: string;
  date: string;
  quote: string;
}

export default function PlanningSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [activeReviewIdx, setActiveReviewIdx] = useState<number>(0);

  const faqs: FAQItem[] = [
    {
      q: 'How does planning a private tailor-made trip with Bimondo work?',
      a: 'You share your dates, group size, and interests. Our local Sri Lankan travel specialists craft a personalized itinerary with handpicked boutique stays, private vehicles, and a dedicated chauffeur-guide. We refine the plan together until it is exactly right.',
    },
    {
      q: 'Is a private vehicle and dedicated chauffeur-guide included?',
      a: 'Yes, always. Every Bimondo journey includes a dedicated air-conditioned vehicle and an experienced, licensed English-speaking Sri Lankan chauffeur-guide who stays with you throughout your journey. Travel at your own unhurried pace.',
    },
    {
      q: 'Can we customize hotels and daily activities along the way?',
      a: 'Absolutely. We curate stays to your taste—from colonial tea planter bungalows and eco-lodges to beach retreats. If you wish to linger longer or make spontaneous roadside stops, your guide easily accommodates it.',
    },
    {
      q: 'What kind of support is provided once we land in Sri Lanka?',
      a: 'Our Colombo team is available 24/7 on WhatsApp and phone from the moment you land at Bandaranaike International Airport (CMB) until you board your flight home.',
    },
    {
      q: 'When is the best time of year to visit Sri Lanka?',
      a: 'Sri Lanka is a year-round paradise. From November to April, the South/West coasts and Cultural Triangle enjoy sunny skies. From May to September, the East Coast (Trincomalee, Passikudah, Arugam Bay) features calm waters and prime wildlife safaris.',
    },
  ];

  const reviews: ReviewItem[] = [
    {
      name: 'Elena & Marcus Weber',
      location: 'Munich, Germany',
      rating: 5,
      tour: '14-Day Ceylon Grand Circuit',
      date: 'Visited February 2026',
      quote:
        '“Our chauffeur-guide Nimal felt like family from day one. No tour bus crowds, gorgeous boutique tea villas in Ella, and spontaneous stops for fresh king coconuts. Bimondo made Sri Lanka truly unforgettable.”',
    },
    {
      name: 'The Jenkins Family (4 guests)',
      location: 'Melbourne, Australia',
      rating: 5,
      tour: '10-Day Family Island Discovery',
      date: 'Visited December 2025',
      quote:
        '“Travelling with two kids aged 8 and 11 can be daunting, but Bimondo took care of every single detail. Watching hundreds of wild elephants gather at Minneriya was a lifelong memory for our boys.”',
    },
    {
      name: 'Claire & Antoine Dupont',
      location: 'Paris, France',
      rating: 5,
      tour: '8-Day Southern Shores in Luxury',
      date: 'Visited January 2026',
      quote:
        '“From watching sunrise over Pidurangala to quiet sunset walks along Galle Fort ramparts. The 24/7 WhatsApp concierge was always reassuring. An authentic, private experience we will cherish.”',
    },
    {
      name: 'Liam & Sophie Campbell',
      location: 'Edinburgh, UK',
      rating: 5,
      tour: '8-Day The Pekoe Trail Walk',
      date: 'Visited March 2026',
      quote:
        '“Incredible walks through emerald tea valleys with our naturalist guide. Every hotel had character and warmth. You truly come as a traveller and leave as a lifelong friend.”',
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  const nextReview = () => {
    setActiveReviewIdx((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setActiveReviewIdx((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const currentReview = reviews[activeReviewIdx];

  return (
    <section className="section wrap planning-with-reviews" id="planning-faq">
      {/* Left Column: Intro & Tourist Reviews Showcase */}
      <div className="planning-left-col">
        <div className="intro">
          <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
            06 / EASY FROM THE FIRST HELLO
          </div>
          <h2 className="big-heading serif">
            Your dream trip.
            <br />
            <em style={{ color: 'var(--terracotta)' }}>Our local know-how.</em>
          </h2>
          <p
            style={{
              lineHeight: 1.85,
              color: 'var(--muted)',
              maxWidth: '440px',
              marginBottom: '24px',
            }}
          >
            Real local care, honest advice, and transparent planning — backed by
            the heartfelt stories of travellers who explored Sri Lanka with us.
          </p>
          <Link className="pill dark" href="/contact">
            LET&apos;S START PLANNING ↗
          </Link>
        </div>

        {/* Tourist Reviews Card */}
        <div className="tourist-reviews-widget">
          <div className="reviews-widget-header">
            <div>
              <span className="eyebrow reviews-eyebrow">
                ★ 4.98 / 5.0 · TRAVELLER REVIEWS
              </span>
              <h3 className="serif reviews-heading">Stories from our guests</h3>
            </div>
            <div className="reviews-nav-arrows">
              <button
                type="button"
                className="review-arrow-btn"
                onClick={prevReview}
                aria-label="Previous review"
              >
                ←
              </button>
              <button
                type="button"
                className="review-arrow-btn"
                onClick={nextReview}
                aria-label="Next review"
              >
                →
              </button>
            </div>
          </div>

          <div className="review-quote-box">
            <div className="stars-row">
              {Array.from({ length: currentReview.rating }).map((_, i) => (
                <span key={i} className="star">★</span>
              ))}
            </div>
            <p className="review-quote-text">{currentReview.quote}</p>
            <div className="review-author-meta">
              <strong>{currentReview.name}</strong>
              <div className="review-submeta">
                <span>{currentReview.location}</span> · <em>{currentReview.tour}</em>
              </div>
            </div>
          </div>

          <div className="review-dots">
            {reviews.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`review-dot ${activeReviewIdx === i ? 'active' : ''}`}
                onClick={() => setActiveReviewIdx(i)}
                aria-label={`Go to review ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Interactive FAQ Accordion */}
      <div className="planning-right-col">
        <div className="faq-container-header">
          <span className="eyebrow" style={{ color: 'var(--terracotta)' }}>
            FREQUENTLY ASKED QUESTIONS
          </span>
          <h3 className="serif faq-section-title">
            Answers to your travel questions
          </h3>
        </div>

        <div className="faq-list">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`faq-item ${isOpen ? 'is-open' : ''}`}
              >
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => toggleFAQ(index)}
                  aria-expanded={isOpen}
                >
                  <span className="faq-num">0{index + 1}</span>
                  <span className="faq-question-text">{faq.q}</span>
                  <span className="faq-toggle-icon">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div className="faq-answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
