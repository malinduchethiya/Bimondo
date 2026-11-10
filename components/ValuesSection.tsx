'use client';

import React, { useState } from 'react';

interface ReviewItem {
  name: string;
  location: string;
  rating: number;
  tour: string;
  date: string;
  quote: string;
}

const REVIEWS: ReviewItem[] = [
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

export default function ValuesSection() {
  const [activeReviewIdx, setActiveReviewIdx] = useState<number>(0);

  const nextReview = () => {
    setActiveReviewIdx((prev) => (prev + 1) % REVIEWS.length);
  };

  const prevReview = () => {
    setActiveReviewIdx((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length);
  };

  const currentReview = REVIEWS[activeReviewIdx];

  return (
    <section className="section values leaf-green-section" id="why">
      <div className="wrap">
        <div className="tourist-reviews-widget">
          <div className="reviews-widget-header">
            <div>
              <span className="eyebrow reviews-eyebrow">
                05 / ★ 4.98 / 5.0 · TRAVELLER REVIEWS
              </span>
              <h2 className="serif reviews-heading">Stories from our guests</h2>
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
                <span key={i} className="star">
                  ★
                </span>
              ))}
            </div>
            <p className="review-quote-text">{currentReview.quote}</p>
            <div className="review-author-meta">
              <strong>{currentReview.name}</strong>
              <div className="review-submeta">
                <span>{currentReview.location}</span> ·{' '}
                <em>{currentReview.tour}</em> · <span>{currentReview.date}</span>
              </div>
            </div>
          </div>

          <div className="review-dots">
            {REVIEWS.map((_, i) => (
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
    </section>
  );
}

