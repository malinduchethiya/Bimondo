'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageBanner from '@/components/PageBanner';
import BookingPanel from '@/components/booking/BookingPanel';
import { BookingItemType } from '@/lib/booking-types';
import {
  CmsColomboExperienceItem,
  CmsStayItem,
  CmsTourItem,
} from '@/lib/cms-defaults';
import { useSiteCms } from '@/hooks/useSiteCms';

export default function BookingPage() {
  const { cms } = useSiteCms();
  const pageContent = cms.pages.bookingPage;

  const toursList = (cms.tours || [])
    .filter((t) => (t as CmsTourItem).visible !== false)
    .sort(
      (a, b) =>
        ((a as CmsTourItem).order ?? 0) - ((b as CmsTourItem).order ?? 0)
    );

  const staysList = (cms.stays || [])
    .filter((s) => (s as CmsStayItem).visible !== false)
    .sort(
      (a, b) =>
        ((a as CmsStayItem).order ?? 0) - ((b as CmsStayItem).order ?? 0)
    );

  const dayExperiencesList = (cms.colomboExperiences || [])
    .filter((e) => (e as CmsColomboExperienceItem).visible !== false)
    .sort(
      (a, b) =>
        ((a as CmsColomboExperienceItem).order ?? 0) -
        ((b as CmsColomboExperienceItem).order ?? 0)
    );

  const [bookingCategory, setBookingCategory] =
    useState<BookingItemType>('tour');
  const [selectedItemId, setSelectedItemId] = useState<string>(
    toursList[0]?.id || ''
  );

  const handleCategorySwitch = (nextCat: BookingItemType) => {
    setBookingCategory(nextCat);
    if (nextCat === 'accommodation') {
      setSelectedItemId(staysList[0]?.id || '');
    } else if (nextCat === 'experience') {
      setSelectedItemId(dayExperiencesList[0]?.id || '');
    } else {
      setSelectedItemId(toursList[0]?.id || '');
    }
  };

  const selectedStay =
    staysList.find((s) => s.id === selectedItemId) || staysList[0];
  const selectedTour =
    toursList.find((t) => t.id === selectedItemId) || toursList[0];
  const selectedDayExp =
    dayExperiencesList.find((d) => d.id === selectedItemId) ||
    dayExperiencesList[0];

  const resolvedItemId =
    bookingCategory === 'accommodation'
      ? selectedStay?.id || ''
      : bookingCategory === 'experience'
        ? selectedDayExp?.id || ''
        : selectedTour?.id || '';

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
        eyebrow={pageContent.banner.eyebrow}
        title={pageContent.banner.title}
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
          <strong>{pageContent.selectorSection.qualificationLabel}</strong>{' '}
          {pageContent.selectorSection.qualificationNotice}
        </div>

        <div className="booking-page-selector-card">
          <div className="homepage-booking-top">
            <div>
              <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
                {pageContent.selectorSection.stepEyebrow}
              </div>
              <h2 className="serif homepage-booking-title">
                {pageContent.selectorSection.stepHeadingPrefix}{' '}
                <em style={{ color: 'var(--terracotta)' }}>
                  {pageContent.selectorSection.stepHeadingItalic}
                </em>
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
                {pageContent.selectorSection.tabToursLabel}
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
                {pageContent.selectorSection.tabDayExpLabel}
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
                {pageContent.selectorSection.tabStaysLabel}
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
                value={resolvedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
              >
                {bookingCategory === 'accommodation'
                  ? staysList.map((stay) => (
                      <option key={stay.id} value={stay.id}>
                        {stay.name} — {stay.location}
                      </option>
                    ))
                  : bookingCategory === 'experience'
                    ? dayExperiencesList.map((exp) => (
                        <option key={exp.id} value={exp.id}>
                          {exp.name} ({exp.duration} · {exp.location})
                        </option>
                      ))
                    : toursList.map((tour) => (
                        <option key={tour.id} value={tour.id}>
                          {tour.name} (
                          {tour.durationLabel || `${tour.days} Days`} ·{' '}
                          {Array.isArray(tour.route)
                            ? tour.route.join(' → ')
                            : tour.route}
                          )
                        </option>
                      ))}
              </select>
            </div>

            <div className="booking-page-quick-links">
              <Link
                href={pageContent.selectorSection.quickLinkToursHref || '/packages'}
                prefetch={false}
                className="pill"
              >
                {pageContent.selectorSection.quickLinkToursLabel}
              </Link>
              <Link
                href={pageContent.selectorSection.quickLinkStaysHref || '/stays'}
                prefetch={false}
                className="pill"
              >
                {pageContent.selectorSection.quickLinkStaysLabel}
              </Link>
              <Link
                href={
                  pageContent.selectorSection.quickLinkVerifyHref ||
                  '/booking/confirmation'
                }
                prefetch={false}
                className="pill"
              >
                {pageContent.selectorSection.quickLinkVerifyLabel}
              </Link>
            </div>
          </div>
        </div>

        {/* Full Interactive Booking Calendar, Dynamic Pricing & Official Provider Checkout */}
        {resolvedItemId && (
          <div style={{ marginTop: '24px' }}>
            <BookingPanel
              key={`${bookingCategory}-${resolvedItemId}`}
              itemId={resolvedItemId}
              itemName={selectedItemName}
              itemType={bookingCategory}
            />
          </div>
        )}
      </section>
    </main>
  );
}
