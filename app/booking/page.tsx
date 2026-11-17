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

        {/* Section 10: The 7-Stage Guest Journey */}
        <div style={{ marginTop: '64px' }}>
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
                SECTION 12 · THE GUEST JOURNEY (SEVEN STAGES)
              </div>
              <h2 className="serif">
                From first enquiry to{' '}
                <em style={{ color: 'var(--terracotta)' }}>
                  departure & follow-up.
                </em>
              </h2>
            </div>
            <p>
              Every booking with Bimondo Travels follows a structured 7-stage
              process managed by our team in Thalangama South, Battaramulla.
            </p>
          </div>

          <div
            className="values-grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              marginTop: '24px',
            }}
          >
            {[
              {
                stage: 'STAGE 01 · ENQUIRY',
                title: 'Multi-Channel Enquiry',
                desc: 'Contact our team via www.bimondotours.com, email (tours@bimondo.com), WhatsApp (+94 76 223 2054), Facebook (Bimondo tours), or Instagram (@Bimondo.tours).',
              },
              {
                stage: 'STAGE 02 · CONSULTATION',
                title: 'Personal Travel Consultation',
                desc: 'We discuss your travel dates, group size, personal interests, preferred travel pace, accommodation level (four-star, boutique, or five-star), and budget.',
              },
              {
                stage: 'STAGE 03 · ITINERARY DESIGN',
                title: 'Tailor-Made Route Planning',
                desc: 'We craft a personalized day-by-day route detailing daily activities, realistic driving times, seasonal suitability, and curated hotel options.',
              },
              {
                stage: 'STAGE 04 · QUOTATION & CONFIRMATION',
                title: 'Written Quotation & Terms',
                desc: 'You receive a clear written quotation specifying all inclusions, exclusions, hotel room categories, and transparent booking terms.',
              },
              {
                stage: 'STAGE 05 · PRE-ARRIVAL INFORMATION',
                title: 'Practical Sri Lanka Briefing',
                desc: 'Before you fly, we share practical guidance on Sri Lanka visas, regional weather, clothing, currency/money, temple dress etiquette, and 24-hour emergency contacts.',
              },
              {
                stage: 'STAGE 06 · ARRIVAL AND JOURNEY',
                title: 'Airport Greeting & 24-Hour Support',
                desc: 'Personal airport greeting on arrival, private air-conditioned transport with your driver/guide, pre-confirmed accommodation, and 24-hour local on-call support.',
              },
              {
                stage: 'STAGE 07 · DEPARTURE & FOLLOW-UP',
                title: 'Departure Transfer & Feedback',
                desc: 'Punctual airport transfer for your departure flight followed by a personal post-trip follow-up to gather your feedback.',
              },
            ].map((item) => (
              <div
                key={item.stage}
                className="value"
                style={{ borderTopColor: '#c8dbe2' }}
              >
                <span
                  className="number"
                  style={{ color: 'var(--terracotta)', fontWeight: 700 }}
                >
                  {item.stage}
                </span>
                <h3
                  className="serif"
                  style={{
                    color: 'var(--ink)',
                    fontSize: '22px',
                    margin: '10px 0 8px',
                  }}
                >
                  {item.title}
                </h3>
                <p style={{ color: '#557180', lineHeight: 1.75 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 12: Digital Services & Online Convenience */}
        <div
          style={{
            marginTop: '48px',
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: '18px',
            padding: 'clamp(22px, 3.5vw, 34px)',
          }}
        >
          <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
            SECTION 14 · DIGITAL SERVICES & ONLINE CONVENIENCE
          </div>
          <h3
            className="serif"
            style={{
              fontSize: 'clamp(1.5rem, 2.5vw, 2.1rem)',
              margin: '8px 0 16px',
            }}
          >
            Modern digital convenience backed by 24-hour local care.
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: '12px',
            }}
          >
            {[
              'Online booking confirmations & status verification',
              'Clear written booking summaries & itineraries',
              'Website-based tour & stay discovery (www.bimondotours.com)',
              'Direct WhatsApp concierge support (+94 76 223 2054)',
              'Social media enquiry handling on Facebook (Bimondo tours) & Instagram (@Bimondo.tours)',
              '24-hour online assistance & post-journey guest feedback',
            ].map((service) => (
              <div
                key={service}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'var(--bg)',
                  border: '1px solid var(--line)',
                  fontSize: '0.86rem',
                  color: 'var(--ink)',
                  lineHeight: 1.5,
                }}
              >
                ✓ {service}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

