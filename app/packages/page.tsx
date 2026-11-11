'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import PageBanner from '@/components/PageBanner';
import {
  TOURS,
  Tour,
  COLOMBO_DAY_EXPERIENCES,
  ColomboDayExperience,
  TOUR_QUALIFICATION_NOTICE,
} from '@/lib/tours';
import TourModal from '@/components/TourModal';
import BookingPanel from '@/components/booking/BookingPanel';
import { useSiteCms } from '@/hooks/useSiteCms';

export default function PackagesPage() {
  const { cms } = useSiteCms();
  const toursList =
    cms.tours && cms.tours.length >= 20 ? cms.tours : TOURS;
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [modalTab, setModalTab] = useState<'itinerary' | 'booking'>('booking');
  const [activeBookingTour, setActiveBookingTour] = useState<Tour>(TOURS[0]);
  const [activeDayExpBooking, setActiveDayExpBooking] =
    useState<ColomboDayExperience | null>(null);

  const categories = [
    { id: 'all', label: `All Signature Journeys (${toursList.length})` },
    { id: 'heritage', label: 'Culture, Heritage & Island Circuits' },
    { id: 'wildlife', label: 'Hiking & Wildlife' },
    { id: 'adventure', label: 'Adventure Tours' },
    { id: 'coast', label: 'Sea, Sand, Luxury & Honeymoon' },
    { id: 'family', label: 'Family & Slow Travel' },
  ];

  const filtered =
    activeCategory === 'all'
      ? toursList
      : toursList.filter((t) => t.category === activeCategory);

  return (
    <main>
      <PageBanner
        eyebrow="BIMONDO SIGNATURE JOURNEYS  /  20 DOCUMENTED TOURS"
        title="Private, tailor-made journeys across Sri Lanka."
      />

      <section className="section wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              SECTION 09 · SIGNATURE JOURNEYS &amp; ONLINE BOOKING
            </div>
            <h2 className="serif">
              Twenty curated routes{' '}
              <em style={{ color: 'var(--terracotta)' }}>built around you.</em>
            </h2>
          </div>
          <p>
            Every sample itinerary below can be adapted to your travel dates,
            preferred pace, and accommodation style (four-star hotels, boutique
            properties, or five-star luxury resorts). Select any journey to
            inspect its route or check availability via Bókun and Viator.
          </p>
        </div>

        {/* Required Qualification Notice from Company Profile Section 09 */}
        <div
          style={{
            padding: '14px 18px',
            marginBottom: '28px',
            borderRadius: '14px',
            border: '1px solid var(--line)',
            background: 'rgba(255, 255, 255, 0.75)',
            fontSize: '13px',
            lineHeight: 1.6,
            color: 'var(--ink)',
          }}
        >
          <strong>Important Note:</strong> {TOUR_QUALIFICATION_NOTICE}
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
                      {tour.durationLabel
                        ? tour.durationLabel.toUpperCase()
                        : `${tour.days} DAYS · PRIVATE TOUR`}
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
                        ROUTE DETAILS
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
                        BOOK / ENQUIRE ↗
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
              itemName={`${activeBookingTour.name} (${
                activeBookingTour.durationLabel ||
                `${activeBookingTour.days} Days`
              })`}
              itemType="tour"
              compact
            />
          </aside>
        </div>

        {/* Section 10: Colombo & Battaramulla Day Experiences */}
        <div style={{ marginTop: '64px' }}>
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
                SECTION 10 · COLOMBO &amp; BATTARAMULLA DAY EXPERIENCES
              </div>
              <h2 className="serif">
                Half-day &amp; full-day{' '}
                <em style={{ color: 'var(--terracotta)' }}>
                  experiences from our home base.
                </em>
              </h2>
            </div>
            <p>
              Operated directly from our base in Thalangama South,
              Battaramulla—ideal at the beginning or end of your Sri Lanka
              journey, or for visitors staying in Colombo.
            </p>
          </div>

          <div
            className="values-grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
              marginTop: '24px',
            }}
          >
            {COLOMBO_DAY_EXPERIENCES.map((exp, idx) => (
              <div
                key={exp.id}
                className="value"
                style={{
                  borderTopColor: '#c8dbe2',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <span
                    className="number"
                    style={{ color: 'var(--terracotta)', fontWeight: 700 }}
                  >
                    0{idx + 1} · {exp.duration.toUpperCase()} · {exp.location}
                  </span>
                  <h3
                    className="serif"
                    style={{
                      color: 'var(--ink)',
                      fontSize: '25px',
                      margin: '10px 0 8px',
                    }}
                  >
                    {exp.name}
                  </h3>
                  <p
                    style={{
                      color: '#557180',
                      lineHeight: 1.75,
                      marginBottom: '12px',
                    }}
                  >
                    {exp.description}
                  </p>
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--muted)',
                      marginBottom: '16px',
                    }}
                  >
                    <strong>Highlights:</strong> {exp.highlights}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="pill dark"
                    style={{ padding: '9px 14px', fontSize: '10.5px' }}
                    onClick={() => setActiveDayExpBooking(exp)}
                  >
                    BOOK DAY EXPERIENCE ↗
                  </button>
                  <a
                    className="pill"
                    style={{ padding: '9px 14px', fontSize: '10.5px' }}
                    href={`https://wa.me/94762232054?text=${encodeURIComponent(
                      `Hello Bimondo Travels, I would like to enquire about the ${exp.name} (${exp.duration}).`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WHATSAPP ENQUIRY
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Tailor-Made Banner */}
        <div className="dest-custom-cta-box" style={{ marginTop: '56px' }}>
          <div>
            <span className="eyebrow" style={{ color: '#a5eff4' }}>
              TAILOR-MADE ITINERARIES &amp; ACCOMMODATION
            </span>
            <h3
              className="serif"
              style={{ fontSize: '36px', margin: '10px 0', color: '#fff' }}
            >
              Prefer a custom route built around your dates?
            </h3>
            <p style={{ color: '#e0f5fb', maxWidth: '540px', lineHeight: 1.8 }}>
              Share your travel dates, group size, and preferred accommodation
              tier (four-star hotels, boutique properties, or five-star luxury
              resorts), and our Battaramulla team will design a day-by-day
              itinerary for you.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/stays" prefetch={false} className="pill light">
              ACCOMMODATION OPTIONS ↗
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
          <small>
            {activeBookingTour.durationLabel
              ? activeBookingTour.durationLabel.toUpperCase()
              : `${activeBookingTour.days} DAYS · PRIVATE JOURNEY`}
          </small>
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

      {/* Day Experience Booking Modal */}
      {activeDayExpBooking && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveDayExpBooking(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-card booking-modal-wide">
            <BookingPanel
              itemId={activeDayExpBooking.id}
              itemName={`${activeDayExpBooking.name} (${activeDayExpBooking.duration})`}
              itemType="experience"
              onClose={() => setActiveDayExpBooking(null)}
            />
          </div>
        </div>
      )}
    </main>
  );
}
