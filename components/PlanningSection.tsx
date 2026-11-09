'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface FAQItem {
  id: string;
  category: 'private' | 'stays' | 'booking';
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

const FAQ_CATEGORIES = [
  { id: 'all', label: 'All Questions' },
  { id: 'private', label: 'Private Journeys' },
  { id: 'stays', label: 'Chauffeur & Stays' },
  { id: 'booking', label: 'Seasons & Booking' },
] as const;

const FAQS: FAQItem[] = [
  {
    id: 'who-is-bimondo',
    category: 'private',
    q: 'Who is Bimondo Travels and how do your private journeys work?',
    a: 'Founded in Colombo in 2022 by Bimsara Illangasinghe, Bimondo Travels designs 100% private, tailor-made journeys across Sri Lanka. You share your travel dates, pace, and interests, and our local specialists craft a bespoke route with handpicked stays and your own dedicated chauffeur-guide.',
  },
  {
    id: 'truly-private',
    category: 'private',
    q: 'Are all Bimondo itineraries completely private to our group?',
    a: 'Yes, always. You never share a vehicle or guide with strangers. Whether you are travelling solo, as a couple, or with family, your vehicle and chauffeur-guide are exclusively yours from airport pickup to departure.',
  },
  {
    id: 'chauffeur-guide',
    category: 'stays',
    q: 'Is a private air-conditioned vehicle and licensed chauffeur-guide included?',
    a: 'Every Bimondo journey includes a modern, air-conditioned private vehicle, fuel, parking, highway tolls, and an experienced, licensed English-speaking Sri Lankan chauffeur-guide who accompanies you throughout.',
  },
  {
    id: 'customize-hotels',
    category: 'stays',
    q: 'Can we customize our boutique hotels, villas, and daily pace?',
    a: 'Completely. We match every stay to your taste—from historic tea planter bungalows in the hills and architect-designed coastal villas to luxury tented safari camps. During the trip, your daily schedule remains flexible if you wish to linger longer or stop along the way.',
  },
  {
    id: 'best-season',
    category: 'booking',
    q: 'When is the best time of year to visit Sri Lanka?',
    a: 'Sri Lanka is a year-round island destination thanks to two complementary monsoon seasons. November to April brings golden sunshine to the South & West Coasts, Cultural Triangle, and Hill Country, while May to September is ideal for the East Coast (Trincomalee, Pasikudah & Arugam Bay) and northern cultural capitals.',
  },
  {
    id: 'wildlife-ethics',
    category: 'private',
    q: 'How does Bimondo ensure ethical wildlife safaris and local sustainability?',
    a: 'We partner exclusively with conservation-minded naturalists and experienced jeep trackers who strictly respect park distances and animal welfare. We also prioritize quieter park gates, dawn entries, and locally owned lodges that directly benefit surrounding communities.',
  },
  {
    id: 'on-trip-support',
    category: 'stays',
    q: 'What support is provided once we land in Sri Lanka?',
    a: 'Alongside your dedicated chauffeur-guide, our Colombo concierge team is available 24/7 via WhatsApp and phone to handle restaurant reservations, spontaneous route adjustments, or any special requests.',
  },
  {
    id: 'dietary-family',
    category: 'stays',
    q: 'Do you accommodate families with children or specific dietary requirements?',
    a: 'Yes. We provide child car seats on request, pace drive times gently for younger travellers, and brief every hotel and local host in advance on vegetarian, vegan, gluten-free, halal, or allergy-safe dining.',
  },
  {
    id: 'booking-deposit',
    category: 'booking',
    q: 'How far in advance should we book, and how are reservations confirmed?',
    a: 'For peak winter and summer months, we recommend starting 2 to 6 months ahead to secure Sri Lanka’s most intimate boutique villas. Once you approve your custom route and transparent quote, a deposit locks in all hotels, vehicles, and scenic train seats.',
  },
  {
    id: 'airport-transfers',
    category: 'booking',
    q: 'Are Bandaranaike International Airport (CMB) greetings and transfers included?',
    a: 'Yes. Your personal chauffeur-guide greets you inside the arrivals concourse at Colombo Bandaranaike International Airport (CMB) and sees you all the way back to departures at the end of your journey.',
  },
];

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

export default function PlanningSection() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeReviewIdx, setActiveReviewIdx] = useState<number>(0);

  const filteredFaqs =
    activeCategory === 'all'
      ? FAQS
      : FAQS.filter((item) => item.category === activeCategory);

  const toggleFAQ = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const nextReview = () => {
    setActiveReviewIdx((prev) => (prev + 1) % REVIEWS.length);
  };

  const prevReview = () => {
    setActiveReviewIdx((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length);
  };

  const currentReview = REVIEWS[activeReviewIdx];

  return (
    <section className="section wrap planning-faq-wrapper" id="planning-faq">
      {/* Top Row: "Your dream trip. Our local know-how." + Tourist Reviews next to it */}
      <div className="planning-top-split">
        <div className="planning-intro-col">
          <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
            06 / EASY FROM THE FIRST HELLO
          </div>
          <h2 className="big-heading serif">
            Your dream trip.
            <br />
            <em style={{ color: 'var(--terracotta)' }}>Our local know-how.</em>
          </h2>
          <p className="planning-intro-lead">
            Real local care, honest advice, and transparent planning — backed by
            the heartfelt stories of travellers who explored Sri Lanka with us.
          </p>
          <Link className="pill dark" href="/contact">
            LET&apos;S START PLANNING ↗
          </Link>
        </div>

        {/* Tourist Reviews Showcase next to Heading */}
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
                <em>{currentReview.tour}</em>
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

      {/* Minimalist Pill-Filtered Hairline FAQ Block matching reference design */}
      <div className="minimal-faq-block" id="faq">
        {/* Top-left Pill Filter Tabs */}
        <div className="minimal-faq-pills" role="tablist" aria-label="FAQ Categories">
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

        {/* Clean Horizontal Hairline Accordion List */}
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
