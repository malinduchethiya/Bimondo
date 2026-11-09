'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import PageBanner from '@/components/PageBanner';
import { TOURS, Tour } from '@/lib/tours';
import TourModal from '@/components/TourModal';

export default function PackagesPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);

  const categories = [
    { id: 'all', label: 'All packages' },
    { id: 'heritage', label: 'Culture & Heritage' },
    { id: 'wildlife', label: 'Wildlife & Safari' },
    { id: 'coast', label: 'Coast & Slow Living' },
    { id: 'adventure', label: 'Adventure' },
    { id: 'family', label: 'Family Journeys' },
  ];

  const filtered =
    activeCategory === 'all'
      ? TOURS
      : TOURS.filter((t) => t.category === activeCategory);

  return (
    <main>
      <PageBanner
        eyebrow="BIMONDO BESPOKE PACKAGES  /  SRI LANKA"
        title="Thoughtfully planned private journeys across the island."
      />

      <section className="section wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              PRIVATE SIGNATURE PACKAGES
            </div>
            <h2 className="serif">
              Journeys shaped to your{' '}
              <em style={{ color: 'var(--terracotta)' }}>personal rhythm.</em>
            </h2>
          </div>
          <p>
            Every package is completely private. You have your own dedicated,
            licensed English-speaking chauffeur-guide and air-conditioned vehicle
            throughout.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="filter" style={{ marginBottom: '36px' }}>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className={activeCategory === c.id ? 'active' : ''}
              onClick={() => setActiveCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Packages Grid */}
        <div className="packages-grid">
          {filtered.map((tour) => (
            <article key={tour.id} className="package-card">
              <div className="package-img-wrap">
                <Image
                  src={tour.image}
                  alt={tour.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="tour-tag">
                  {tour.days} DAYS · PRIVATE TOUR
                </span>
              </div>
              <div className="package-card-body">
                <span
                  className="eyebrow"
                  style={{ color: 'var(--terracotta)', marginBottom: '4px' }}
                >
                  {tour.categoryLabel}
                </span>
                <h3 className="serif">{tour.name}</h3>
                <p className="package-route">
                  <strong>Route:</strong> {tour.route}
                </p>
                <p className="package-desc">{tour.description}</p>
                <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '0 0 16px' }}>
                  <strong>Highlights:</strong> {tour.highlights}
                </p>
                <div className="package-footer">
                  <span style={{ fontSize: '11px', letterSpacing: '0.1em', fontWeight: 700, color: '#328eae' }}>
                    TAILOR-MADE
                  </span>
                  <button
                    type="button"
                    className="pill dark"
                    style={{ padding: '10px 18px', fontSize: '11px' }}
                    onClick={() => setSelectedTour(tour)}
                  >
                    VIEW ITINERARY ↗
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Custom Tailor-Made Banner */}
        <div className="dest-custom-cta-box" style={{ marginTop: '50px' }}>
          <div>
            <span className="eyebrow" style={{ color: '#a5eff4' }}>
              BESPOKE ITINERARY DESIGN
            </span>
            <h3 className="serif" style={{ fontSize: '36px', margin: '10px 0', color: '#fff' }}>
              Have a specific route or duration in mind?
            </h3>
            <p style={{ color: '#e0f5fb', maxWidth: '520px', lineHeight: 1.8 }}>
              From 3-day quick weekenders to month-long comprehensive island explorations,
              we design custom itineraries tailored entirely to your interests, pace, and preferred hotels.
            </p>
          </div>
          <Link href="/contact" className="pill light">
            REQUEST A CUSTOM ITINERARY ↗
          </Link>
        </div>
      </section>

      {/* Tour Modal */}
      <TourModal
        tour={selectedTour}
        onClose={() => setSelectedTour(null)}
      />
    </main>
  );
}
