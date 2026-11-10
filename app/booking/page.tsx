'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageBanner from '@/components/PageBanner';
import BookingPanel from '@/components/booking/BookingPanel';
import { ACCOMMODATIONS, BookingItemType } from '@/lib/booking-types';
import { TOURS } from '@/lib/tours';

export default function BookingPage() {
  const [bookingCategory, setBookingCategory] =
    useState<BookingItemType>('tour');
  const [selectedItemId, setSelectedItemId] = useState<string>(
    TOURS[0]?.id || 'ceylon-grand-circuit'
  );

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

  const selectedStay = ACCOMMODATIONS.find((s) => s.id === selectedItemId);
  const selectedTour = TOURS.find((t) => t.id === selectedItemId);

  const selectedItemName =
    bookingCategory === 'accommodation'
      ? selectedStay?.name || 'Boutique Sri Lanka Stay'
      : selectedTour
      ? `${selectedTour.name} (${selectedTour.days} Days)`
      : 'Private Sri Lanka Journey';

  return (
    <main>
      <PageBanner
        eyebrow="BIMONDO ONLINE BOOKING  /  NIGHTSBRIDGE · BÓKUN · VIATOR"
        title="Check real-time availability & book your Sri Lanka journey."
      />

      <section className="section wrap">
        <div className="booking-page-selector-card">
          <div className="homepage-booking-top">
            <div>
              <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
                STEP 1 · SELECT YOUR EXPERIENCE OR ACCOMMODATION
              </div>
              <h2 className="serif homepage-booking-title">
                What would you like to{' '}
                <em style={{ color: 'var(--terracotta)' }}>book today?</em>
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

          {/* Item Selector Pills / Dropdown */}
          <div className="booking-page-item-picker">
            <div className="booking-bar-field">
              <label htmlFor="booking-page-item-select">
                {bookingCategory === 'accommodation'
                  ? 'SELECT BOUTIQUE ACCOMMODATION (NIGHTSBRIDGE)'
                  : 'SELECT PRIVATE SIGNATURE TOUR (BÓKUN / VIATOR)'}
              </label>
              <select
                id="booking-page-item-select"
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
              >
                {bookingCategory === 'accommodation'
                  ? ACCOMMODATIONS.map((stay) => (
                      <option key={stay.id} value={stay.id}>
                        {stay.name} — {stay.location}
                      </option>
                    ))
                  : TOURS.map((tour) => (
                      <option key={tour.id} value={tour.id}>
                        {tour.name} ({tour.days} Days · {tour.route})
                      </option>
                    ))}
              </select>
            </div>

            <div className="booking-page-quick-links">
              <Link href="/packages" prefetch={false} className="pill">
                VIEW TOUR ITINERARIES
              </Link>
              <Link href="/stays" prefetch={false} className="pill">
                VIEW BOUTIQUE STAYS
              </Link>
              <Link
                href="/booking/confirmation"
                prefetch={false}
                className="pill"
              >
                VERIFY EXISTING BOOKING
              </Link>
            </div>
          </div>
        </div>

        {/* Full Interactive Booking Calendar, Dynamic Pricing & Official Provider Checkout */}
        <div style={{ marginTop: '24px' }}>
          <BookingPanel
            key={`${bookingCategory}-${selectedItemId}`}
            itemId={selectedItemId}
            itemName={selectedItemName}
            itemType={bookingCategory}
          />
        </div>
      </section>
    </main>
  );
}
