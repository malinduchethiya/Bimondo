'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import PageBanner from '@/components/PageBanner';
import { TOURS, Tour } from '@/lib/tours';
import TourModal from '@/components/TourModal';
import BookingPanel from '@/components/booking/BookingPanel';

export default function PackagesPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [modalTab, setModalTab] = useState<'itinerary' | 'booking'>('booking');
  const [activeBookingTour, setActiveBookingTour] = useState<Tour>(TOURS[0]);

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
              PRIVATE SIGNATURE PACKAGES · BÓKUN &amp; VIATOR
            </div>
            <h2 className="serif">
              Journeys shaped to your{' '}
              <em style={{ color: 'var(--terracotta)' }}>personal rhythm.</em>
            </h2>
          </div>
          <p>
            Every package is completely private. Select any tour below to view
            the availability calendar, departure times, participant pricing, and
            official Bókun or Viator checkout.
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

        {/* Split Layout: Packages Grid + Sticky Desktop Booking Panel */}
        <div className="tour-detail-booking-layout">
          <div className="packages-grid">
            {filtered.map((tour, i) => {
              const isSelected = activeBookingTour.id === tour.id;
              return (
                <article
                  key={tour.id}
                  className={`package-card ${
                    isSelected ? 'is-active-booking-card' : ''
                  }`}
                >
                  <div className="package-img-wrap">
                    <Image
                      src={tour.image}
                      alt={tour.name}
                      fill
                      priority={i < 2}
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
                      style={{
                        color: 'var(--terracotta)',
                        marginBottom: '4px',
                      }}
                    >
                      {tour.categoryLabel}
                    </span>
                    <h3 className="serif">{tour.name}</h3>
                    <p className="package-route">
                      <strong>Route:</strong> {tour.route}
                    </p>
                    <p className="package-desc">{tour.description}</p>
                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--muted)',
                        margin: '0 0 16px',
                      }}
                    >
                      <strong>Highlights:</strong> {tour.highlights}
                    </p>
                    <div
                      className="package-footer"
                      style={{ gap: '8px', flexWrap: 'wrap' }}
                    >
                      <button
                        type="button"
                        className="pill"
                        style={{ padding: '9px 14px', fontSize: '10.5px' }}
                        onClick={() => {
                          setActiveBookingTour(tour);
                          setModalTab('itinerary');
                          setSelectedTour(tour);
                        }}
                      >
                        ITINERARY
                      </button>
                      <button
                        type="button"
                        className="pill dark"
                        style={{ padding: '9px 16px', fontSize: '10.5px' }}
                        onClick={() => {
                          setActiveBookingTour(tour);
                          setModalTab('booking');
                          setSelectedTour(tour);
                        }}
                      >
                        BOOK NOW ↗
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Sticky Booking Panel on Desktop */}
          <aside
            className="sticky-booking-sidebar"
            aria-label="Tour Booking & Availability Panel"
          >
            <BookingPanel
              key={activeBookingTour.id}
              itemId={activeBookingTour.id}
              itemName={`${activeBookingTour.name} (${activeBookingTour.days} Days)`}
              itemType="tour"
              compact
            />
          </aside>
        </div>

        {/* Custom Tailor-Made Banner */}
        <div className="dest-custom-cta-box" style={{ marginTop: '50px' }}>
          <div>
            <span className="eyebrow" style={{ color: '#a5eff4' }}>
              BESPOKE ITINERARY DESIGN &amp; ACCOMMODATIONS
            </span>
            <h3
              className="serif"
              style={{ fontSize: '36px', margin: '10px 0', color: '#fff' }}
            >
              Looking for boutique villas or a custom route?
            </h3>
            <p style={{ color: '#e0f5fb', maxWidth: '520px', lineHeight: 1.8 }}>
              Book handpicked Sri Lankan heritage bungalows via NightsBridge or
              design a custom itinerary tailored entirely to your dates.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/stays" prefetch={false} className="pill light">
              BOOK BOUTIQUE STAYS ↗
            </Link>
            <Link href="/contact" prefetch={false} className="pill dark">
              REQUEST CUSTOM ITINERARY ↗
            </Link>
          </div>
        </div>
      </section>

      {/* Mobile Sticky Booking Bar */}
      <div className="mobile-sticky-booking-bar">
        <div>
          <small>{activeBookingTour.days} DAYS · PRIVATE JOURNEY</small>
          <strong>{activeBookingTour.name}</strong>
        </div>
        <button
          type="button"
          className="pill dark"
          onClick={() => {
            setModalTab('booking');
            setSelectedTour(activeBookingTour);
          }}
        >
          BOOK NOW ↗
        </button>
      </div>

      {/* Tour Detail & Booking Modal */}
      <TourModal
        tour={selectedTour}
        initialTab={modalTab}
        onClose={() => setSelectedTour(null)}
      />
    </main>
  );
}
