'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import BookingPanel from '@/components/booking/BookingPanel';
import { ACCOMMODATIONS, BookingItemType } from '@/lib/booking-types';
import { TOURS } from '@/lib/tours';

export default function HomepageAvailabilityBar() {
  const [bookingCategory, setBookingCategory] =
    useState<BookingItemType>('tour');
  const [selectedItemId, setSelectedItemId] = useState<string>(
    TOURS[0]?.id || 'ceylon-grand-circuit'
  );
  const [checkIn, setCheckIn] = useState<string>('');
  const [checkOut, setCheckOut] = useState<string>('');
  const [adults, setAdults] = useState<number>(2);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleCategorySwitch = (nextCat: BookingItemType) => {
    setBookingCategory(nextCat);
    if (nextCat === 'accommodation') {
      setSelectedItemId(
        ACCOMMODATIONS[0]?.id || 'stay-sigiriya-water-gardens'
      );
    } else {
      setSelectedItemId(TOURS[0]?.id || 'ceylon-grand-circuit');
    }
  };

  const selectedItemName =
    bookingCategory === 'accommodation'
      ? ACCOMMODATIONS.find((s) => s.id === selectedItemId)?.name ||
        'Boutique Sri Lanka Stay'
      : TOURS.find((t) => t.id === selectedItemId)?.name ||
        'Private Sri Lanka Journey';

  return (
    <div
      className="section wrap homepage-booking-section"
      id="check-availability"
      role="region"
      aria-label="Check Availability and Book Your Experience"
    >
      <div className="homepage-booking-card">
        <div className="homepage-booking-top">
          <div>
            <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              LIVE BOOKING &amp; AVAILABILITY · NIGHTSBRIDGE · BÓKUN · VIATOR
            </div>
            <h2 className="serif homepage-booking-title">
              Check availability &amp;{' '}
              <em style={{ color: 'var(--terracotta)' }}>book your journey.</em>
            </h2>
          </div>

          <div className="homepage-booking-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={bookingCategory === 'tour'}
              className={`minimal-faq-pill ${
                bookingCategory === 'tour' ? 'active' : ''
              }`}
              onClick={() => handleCategorySwitch('tour')}
            >
              Tours &amp; Experiences (Bókun / Viator)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={bookingCategory === 'accommodation'}
              className={`minimal-faq-pill ${
                bookingCategory === 'accommodation' ? 'active' : ''
              }`}
              onClick={() => handleCategorySwitch('accommodation')}
            >
              Boutique Stays (NightsBridge)
            </button>
          </div>
        </div>

        <div className="homepage-booking-bar-grid">
          <div className="booking-bar-field">
            <label htmlFor="hb-item-select">
              {bookingCategory === 'accommodation'
                ? 'BOUTIQUE ACCOMMODATION'
                : 'SIGNATURE TOUR / EXPERIENCE'}
            </label>
            <select
              id="hb-item-select"
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
            >
              {bookingCategory === 'accommodation'
                ? ACCOMMODATIONS.map((stay) => (
                    <option key={stay.id} value={stay.id}>
                      {stay.name} ({stay.location})
                    </option>
                  ))
                : TOURS.map((tour) => (
                    <option key={tour.id} value={tour.id}>
                      {tour.name} ({tour.days} Days)
                    </option>
                  ))}
            </select>
          </div>

          <div className="booking-bar-field">
            <label htmlFor="hb-checkin">
              {bookingCategory === 'accommodation'
                ? 'CHECK-IN DATE'
                : 'PREFERRED DEPARTURE'}
            </label>
            <input
              id="hb-checkin"
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </div>

          {bookingCategory === 'accommodation' && (
            <div className="booking-bar-field">
              <label htmlFor="hb-checkout">CHECK-OUT DATE</label>
              <input
                id="hb-checkout"
                type="date"
                value={checkOut}
                min={checkIn || undefined}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
          )}

          <div className="booking-bar-field">
            <label htmlFor="hb-guests">GUESTS / PARTICIPANTS</label>
            <select
              id="hb-guests"
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'Adult' : 'Adults'}
                </option>
              ))}
            </select>
          </div>

          <div className="booking-bar-action">
            <button
              type="button"
              className="pill dark"
              style={{ width: '100%', minHeight: '48px' }}
              onClick={() => setIsModalOpen(true)}
            >
              CHECK AVAILABILITY ↗
            </button>
          </div>
        </div>

        <div className="homepage-booking-sublinks">
          <span>
            Real-time availability &amp; checkout powered by official provider
            integrations.
          </span>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <Link href="/stays" prefetch={false}>
              Explore Boutique Stays →
            </Link>
            <Link href="/packages" prefetch={false}>
              Browse Tour Packages →
            </Link>
            <Link href="/admin/booking" prefetch={false}>
              Booking Settings
            </Link>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Booking & Availability"
        >
          <div className="modal-card booking-modal-wide">
            <BookingPanel
              itemId={selectedItemId}
              itemName={selectedItemName}
              itemType={bookingCategory}
              initialCheckIn={checkIn}
              initialCheckOut={checkOut}
              initialAdults={adults}
              onClose={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
