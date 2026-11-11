'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import PageBanner from '@/components/PageBanner';
import BookingPanel from '@/components/booking/BookingPanel';
import { ACCOMMODATIONS, AccommodationItem } from '@/lib/booking-types';
import { useSiteCms } from '@/hooks/useSiteCms';

export default function StaysPage() {
  const { cms } = useSiteCms();
  const staysList =
    cms.stays && cms.stays.length > 0 ? cms.stays : ACCOMMODATIONS;
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [activeStay, setActiveStay] = useState<AccommodationItem>(
    ACCOMMODATIONS[0]
  );
  const [checkIn, setCheckIn] = useState<string>('');
  const [checkOut, setCheckOut] = useState<string>('');
  const [adults, setAdults] = useState<number>(2);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [rooms, setRooms] = useState<number>(1);
  const [mobileModalOpen, setMobileModalOpen] = useState<boolean>(false);

  const regionTabs = [
    { id: 'all', label: 'All Stays' },
    { id: 'culture', label: 'Cultural Triangle' },
    { id: 'hills', label: 'Tea Country & Hills' },
    { id: 'coast', label: 'Southern Coast' },
    { id: 'wildlife', label: 'Safari Lodges' },
  ];

  const filtered =
    selectedRegion === 'all'
      ? staysList
      : staysList.filter((s) => s.region === selectedRegion);

  return (
    <main>
      <PageBanner
        eyebrow="BIMONDO BOUTIQUE STAYS  /  NIGHTSBRIDGE ACCOMMODATION"
        title="Handpicked heritage bungalows, tea villas & safari camps."
      />

      <section className="section wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              NIGHTSBRIDGE ACCOMMODATION BOOKING
            </div>
            <h2 className="serif">
              Stays with character{' '}
              <em style={{ color: 'var(--terracotta)' }}>&amp; island soul.</em>
            </h2>
          </div>
          <p>
            Select your check-in and check-out dates, rooms, and guests below to
            check real-time availability and rates through our official
            NightsBridge accommodation booking integration.
          </p>
        </div>

        {/* Top Quick Date & Guest Filter Bar */}
        <div className="homepage-booking-card" style={{ marginBottom: '36px' }}>
          <div className="homepage-booking-bar-grid">
            <div className="booking-bar-field">
              <label htmlFor="stays-checkin">CHECK-IN DATE</label>
              <input
                id="stays-checkin"
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
            <div className="booking-bar-field">
              <label htmlFor="stays-checkout">CHECK-OUT DATE</label>
              <input
                id="stays-checkout"
                type="date"
                value={checkOut}
                min={checkIn || undefined}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
            <div className="booking-bar-field">
              <label htmlFor="stays-adults">ADULTS &amp; CHILDREN</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  id="stays-adults"
                  value={adults}
                  onChange={(e) => setAdults(Number(e.target.value))}
                  aria-label="Adults"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} Adult{n > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
                <select
                  value={childrenCount}
                  onChange={(e) => setChildrenCount(Number(e.target.value))}
                  aria-label="Children"
                >
                  {[0, 1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n} Child{n !== 1 ? 'ren' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="booking-bar-field">
              <label htmlFor="stays-rooms">ROOMS</label>
              <select
                id="stays-rooms"
                value={rooms}
                onChange={(e) => setRooms(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5].map((r) => (
                  <option key={r} value={r}>
                    {r} Room{r > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Region Filter Pills */}
        <div className="filter" style={{ marginBottom: '32px' }}>
          {regionTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={selectedRegion === t.id ? 'active' : ''}
              onClick={() => setSelectedRegion(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Split Layout: Accommodation Cards + Sticky Desktop Booking Panel */}
        <div className="tour-detail-booking-layout">
          <div className="destinations-detail-grid">
            {filtered.map((stay, idx) => {
              const isSelected = activeStay.id === stay.id;
              return (
                <article
                  key={stay.id}
                  className={`destination-detail-card ${
                    isSelected ? 'is-active-booking-card' : ''
                  }`}
                >
                  <div className="dest-img-wrap">
                    <Image
                      src={stay.image}
                      alt={stay.name}
                      fill
                      priority={idx < 2}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="dest-season-badge">
                      NIGHTSBRIDGE · UP TO {stay.maxGuestsPerRoom} GUESTS/ROOM
                    </span>
                  </div>
                  <div className="dest-content">
                    <span
                      className="eyebrow"
                      style={{ color: 'var(--terracotta)' }}
                    >
                      {stay.location}
                    </span>
                    <h3 className="serif dest-name">{stay.name}</h3>
                    <p className="dest-tagline">{stay.tagline}</p>
                    <p className="dest-desc">{stay.description}</p>
                    <div className="dest-highlights">
                      <strong>Property features:</strong>
                      <ul>
                        {stay.highlights.map((h, i) => (
                          <li key={i}>✳ {h}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="dest-card-foot">
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--green)',
                        }}
                      >
                        OFFICIAL NIGHTSBRIDGE RATES
                      </span>
                      <button
                        type="button"
                        className="pill dark"
                        onClick={() => {
                          setActiveStay(stay);
                          setMobileModalOpen(true);
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

          {/* Sticky Booking Sidebar on Desktop */}
          <aside className="sticky-booking-sidebar" aria-label="Accommodation Booking Panel">
            <BookingPanel
              key={`${activeStay.id}-${checkIn}-${checkOut}-${adults}-${childrenCount}-${rooms}`}
              itemId={activeStay.id}
              itemName={activeStay.name}
              itemType="accommodation"
              defaultProvider="nightsbridge"
              initialCheckIn={checkIn}
              initialCheckOut={checkOut}
              initialAdults={adults}
              initialChildren={childrenCount}
              initialRooms={rooms}
              compact
            />
          </aside>
        </div>

        {/* Custom Route & Stay Combination CTA */}
        <div className="dest-custom-cta-box" style={{ marginTop: '48px' }}>
          <div>
            <span className="eyebrow" style={{ color: '#a5eff4' }}>
              MULTI-STOP VILLA &amp; CHAUFFEUR JOURNEYS
            </span>
            <h3
              className="serif"
              style={{ fontSize: '32px', margin: '10px 0', color: '#fff' }}
            >
              Combining multiple boutique stays across Sri Lanka?
            </h3>
            <p style={{ color: '#e0f5fb', maxWidth: '540px', lineHeight: 1.75 }}>
              Our Colombo concierge can link your NightsBridge villa reservations
              with a dedicated private chauffeur-guide from arrival to departure.
            </p>
          </div>
          <Link href="/contact" prefetch={false} className="pill light">
            SPEAK WITH OUR CONCIERGE ↗
          </Link>
        </div>
      </section>

      {/* Mobile Sticky Bottom Booking Bar */}
      <div className="mobile-sticky-booking-bar">
        <div>
          <small>SELECTED STAY (NIGHTSBRIDGE)</small>
          <strong>{activeStay.name}</strong>
        </div>
        <button
          type="button"
          className="pill dark"
          onClick={() => setMobileModalOpen(true)}
        >
          BOOK NOW ↗
        </button>
      </div>

      {/* Mobile / Full Booking Modal */}
      {mobileModalOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileModalOpen(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-card booking-modal-wide">
            <BookingPanel
              itemId={activeStay.id}
              itemName={activeStay.name}
              itemType="accommodation"
              defaultProvider="nightsbridge"
              initialCheckIn={checkIn}
              initialCheckOut={checkOut}
              initialAdults={adults}
              initialChildren={childrenCount}
              initialRooms={rooms}
              onClose={() => setMobileModalOpen(false)}
            />
          </div>
        </div>
      )}
    </main>
  );
}
