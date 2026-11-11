'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageBanner from '@/components/PageBanner';
import BookingPanel from '@/components/booking/BookingPanel';
import { ACCOMMODATIONS, BookingItemType } from '@/lib/booking-types';
import {
  TOURS,
  COLOMBO_DAY_EXPERIENCES,
  TOUR_QUALIFICATION_NOTICE,
} from '@/lib/tours';
import { useSiteCms } from '@/hooks/useSiteCms';

export default function BookingPage() {
  const { cms } = useSiteCms();
  const toursList =
    cms.tours && cms.tours.length >= 20 ? cms.tours : TOURS;
  const staysList =
    cms.stays && cms.stays.length > 0 ? cms.stays : ACCOMMODATIONS;

  const [bookingCategory, setBookingCategory] =
    useState<BookingItemType>('tour');
  const [selectedItemId, setSelectedItemId] = useState<string>(
    toursList[0]?.id || 'ceylon-grand-circuit'
  );

  const handleCategorySwitch = (nextCat: BookingItemType) => {
    setBookingCategory(nextCat);
    if (nextCat === 'accommodation') {
      setSelectedItemId(
        staysList[0]?.id || 'stay-sigiriya-water-gardens'
      );
    } else if (nextCat === 'experience') {
      setSelectedItemId(
        COLOMBO_DAY_EXPERIENCES[0]?.id || 'thalangama-wetland-birdwalk'
      );
    } else {
      setSelectedItemId(toursList[0]?.id || 'ceylon-grand-circuit');
    }
  };

  const selectedStay = staysList.find((s) => s.id === selectedItemId);
  const selectedTour = toursList.find((t) => t.id === selectedItemId);
  const selectedDayExp = COLOMBO_DAY_EXPERIENCES.find(
    (d) => d.id === selectedItemId
  );

  const selectedItemName =
    bookingCategory === 'accommodation'
      ? selectedStay?.name || 'Sri Lanka Accommodation'
      : bookingCategory === 'experience'
      ? selectedDayExp
        ? `${selectedDayExp.name} (${selectedDayExp.duration})`
        : 'Colombo & Battaramulla Day Experience'
      : selectedTour
      ? `${selectedTour.name} (${
          selectedTour.durationLabel || `${selectedTour.days} Days`
        })`
      : 'Private Sri Lanka Journey';

  return (
    <main>
      <PageBanner
        eyebrow="BIMONDO ONLINE BOOKING  /  NIGHTSBRIDGE · BÓKUN · VIATOR"
        title="Check real-time availability & book your Sri Lanka journey."
      />

      <section className="section wrap">
        <div
          style={{
            padding: '14px 18px',
            marginBottom: '22px',
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

        <div className="booking-page-selector-card">
          <div className="homepage-booking-top">
            <div>
              <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
                STEP 1 · SELECT YOUR JOURNEY, DAY EXPERIENCE OR ACCOMMODATION
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
                Signature Journeys (20)
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={bookingCategory === 'experience'}
                className={`minimal-faq-pill ${
                  bookingCategory === 'experience' ? 'active' : ''
                }`}
                onClick={() => handleCategorySwitch('experience')}
              >
                Colombo Day Experiences (6)
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
                Accommodation (NightsBridge)
              </button>
            </div>
          </div>

          {/* Item Selector Dropdown */}
          <div className="booking-page-item-picker">
            <div className="booking-bar-field">
              <label htmlFor="booking-page-item-select">
                {bookingCategory === 'accommodation'
                  ? 'SELECT REGIONAL ACCOMMODATION (NIGHTSBRIDGE)'
                  : bookingCategory === 'experience'
                  ? 'SELECT COLOMBO & BATTARAMULLA DAY EXPERIENCE'
                  : 'SELECT PRIVATE SIGNATURE JOURNEY (BÓKUN / VIATOR)'}
              </label>
              <select
                id="booking-page-item-select"
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
              >
                {bookingCategory === 'accommodation'
                  ? staysList.map((stay) => (
                      <option key={stay.id} value={stay.id}>
                        {stay.name} — {stay.location}
                      </option>
                    ))
                  : bookingCategory === 'experience'
                  ? COLOMBO_DAY_EXPERIENCES.map((exp) => (
                      <option key={exp.id} value={exp.id}>
                        {exp.name} ({exp.duration} · {exp.location})
                      </option>
                    ))
                  : toursList.map((tour) => (
                      <option key={tour.id} value={tour.id}>
                        {tour.name} (
                        {tour.durationLabel || `${tour.days} Days`} ·{' '}
                        {tour.route})
                      </option>
                    ))}
              </select>
            </div>

            <div className="booking-page-quick-links">
              <Link href="/packages" prefetch={false} className="pill">
                VIEW ALL 20 TOURS
              </Link>
              <Link href="/stays" prefetch={false} className="pill">
                ACCOMMODATION OPTIONS
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
