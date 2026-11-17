'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageBanner from '@/components/PageBanner';
import CmsImage from '@/components/CmsImage';
import { Tour, ColomboDayExperience } from '@/lib/tours';
import { CmsColomboExperienceItem, CmsTourItem } from '@/lib/cms-defaults';
import TourModal from '@/components/TourModal';
import BookingPanel from '@/components/booking/BookingPanel';
import { useSiteCms } from '@/hooks/useSiteCms';

export default function PackagesPage() {
  const { cms } = useSiteCms();
  const pageContent = cms.pages.packagesPage;

  const toursList: (CmsTourItem | Tour)[] = (cms.tours || [])
    .filter((t) => (t as CmsTourItem).visible !== false)
    .sort(
      (a, b) =>
        ((a as CmsTourItem).order ?? 0) - ((b as CmsTourItem).order ?? 0)
    );

  const colomboExperiences: (CmsColomboExperienceItem | ColomboDayExperience)[] =
    (cms.colomboExperiences || [])
      .filter((exp) => (exp as CmsColomboExperienceItem).visible !== false)
      .sort(
        (a, b) =>
          ((a as CmsColomboExperienceItem).order ?? 0) -
          ((b as CmsColomboExperienceItem).order ?? 0)
      );

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [modalTab, setModalTab] = useState<'itinerary' | 'booking'>('booking');
  const [activeBookingTour, setActiveBookingTour] = useState<Tour | null>(
    toursList[0] ?? null
  );
  const [activeDayExpBooking, setActiveDayExpBooking] =
    useState<ColomboDayExperience | null>(null);

  const categories = [
    { id: 'all', label: `All Signature Journeys (${toursList.length})` },
    { id: 'adventure', label: 'Adventure Journeys' },
    { id: 'heritage', label: 'Culture and Heritage Journeys' },
    { id: 'coast', label: 'Sea and Sand Escapes' },
    { id: 'wildlife', label: 'Hiking and Wildlife Journeys' },
    { id: 'family', label: 'Families and Special Markets' },
  ];

  const filtered =
    activeCategory === 'all'
      ? toursList
      : toursList.filter((t) => t.category === activeCategory);

  const resolvedBookingTour =
    (activeBookingTour
      ? toursList.find((t) => t.id === activeBookingTour.id)
      : undefined) ||
    toursList[0] ||
    null;

  const waNumber = (cms.general.whatsappNumber || '94762232054').replace(
    /\D/g,
    ''
  );

  return (
    <main>
      <PageBanner
        eyebrow={pageContent.banner.eyebrow}
        title={pageContent.banner.title}
      />

      <section className="section wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              {pageContent.introSection.eyebrow}
            </div>
            <h2 className="serif">
              {pageContent.introSection.headingPrefix}{' '}
              <em style={{ color: 'var(--terracotta)' }}>
                {pageContent.introSection.headingItalic}
              </em>
            </h2>
          </div>
          <p>{pageContent.introSection.description}</p>
        </div>

        {/* Required Qualification Notice from Company Profile Section 06 / 09 */}
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
          <strong>{pageContent.introSection.qualificationLabel}</strong> These
          are sample itineraries. Routes, durations, hotels, and inclusions are
          confirmed upon consultation. {pageContent.introSection.qualificationNotice}
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
            {filtered.map((tour, idx) => {
              const isSelected = resolvedBookingTour?.id === tour.id;
              const cmsTour = tour as CmsTourItem;
              return (
                <article
                  key={tour.id}
                  className={`package-card ${
                    isSelected ? 'is-active-booking-card' : ''
                  }`}
                >
                  <div className="package-img-wrap">
                    <CmsImage
                      imageRef={cmsTour.imageRef}
                      src={cmsTour.imageRef?.url || tour.image}
                      alt={cmsTour.imageRef?.alt || tour.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      priority={idx < 2}
                      loading={idx < 6 ? 'eager' : 'lazy'}
                      className="object-cover"
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
                      <strong>Route:</strong>{' '}
                      {Array.isArray(tour.route)
                        ? tour.route.join(' → ')
                        : tour.route}
                    </p>
                    <p className="package-desc">{tour.description}</p>
                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--muted)',
                        margin: '0 0 16px',
                      }}
                    >
                      <strong>Highlights:</strong>{' '}
                      {Array.isArray(tour.highlights)
                        ? tour.highlights.join(', ')
                        : tour.highlights}
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
                        {pageContent.introSection.routeDetailsButtonLabel}
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
                        {pageContent.introSection.bookButtonLabel}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Sticky Booking Panel on Desktop */}
          {resolvedBookingTour && (
            <aside
              className="sticky-booking-sidebar"
              aria-label="Tour Booking & Availability Panel"
            >
              <BookingPanel
                key={resolvedBookingTour.id}
                itemId={resolvedBookingTour.id}
                itemName={`${resolvedBookingTour.name} (${
                  resolvedBookingTour.durationLabel ||
                  `${resolvedBookingTour.days} Days`
                })`}
                itemType="tour"
                compact
              />
            </aside>
          )}
        </div>

        {/* Section 13: Target Travellers and Markets */}
        <div style={{ marginTop: '64px' }}>
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
                SECTION 13 · TARGET TRAVELLERS & SOURCE MARKETS
              </div>
              <h2 className="serif">
                Tailored for international{' '}
                <em style={{ color: 'var(--terracotta)' }}>
                  markets & travel styles.
                </em>
              </h2>
            </div>
            <p>
              Our itineraries are designed around the flight schedules, holiday
              durations, dietary preferences, and travel styles of our core
              source markets and guest profiles.
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
                code: '01 · UNITED KINGDOM AND EUROPE',
                title: 'Longer Island Circuits & Slow Travel',
                desc: 'Multi-region island journeys combining the Cultural Triangle, hill-country tea estates, national park wildlife safaris, southern beaches, highland hiking on The Pekoe Trail, and unhurried boutique stays.',
              },
              {
                code: '02 · INDIA',
                title: 'Short & Medium Breaks',
                desc: 'Convenient 4 to 7-day holidays connecting Colombo, Kandy, Nuwara Eliya, and Bentota for couples, families, and small private groups—featuring vegetarian-friendly four-star and five-star hotels.',
              },
              {
                code: '03 · AUSTRALIA',
                title: 'Surfing, Wildlife & Active Holidays',
                desc: 'Longer active itineraries timed to the right coastal season—pairing warm-water surf breaks in Weligama or Arugam Bay with highland hikes, national park safaris, and relaxed coastal stays.',
              },
              {
                code: '04 · FAMILIES',
                title: 'Comfortable Pace & Family Stays',
                desc: 'Shorter daily driving times, interconnecting family rooms, safe swimming beaches, visits to the Udawalawe Elephant Transit Home, scenic highland train journeys, and gentle activities for all ages.',
              },
              {
                code: '05 · ADVENTURE TRAVELLERS',
                title: 'Multi-Sport Island Expeditions',
                desc: 'Dedicated adventure routes featuring surfing, Kelani River white-water rafting and waterfall abseiling in Kitulgala, paramotoring in Bentota, kite surfing in Kalpitiya, reef/wreck diving in Galle, and rainforest trekking.',
              },
            ].map((market) => (
              <div
                key={market.code}
                className="value"
                style={{ borderTopColor: '#c8dbe2' }}
              >
                <span
                  className="number"
                  style={{ color: 'var(--terracotta)', fontWeight: 700 }}
                >
                  {market.code}
                </span>
                <h3
                  className="serif"
                  style={{
                    color: 'var(--ink)',
                    fontSize: '23px',
                    margin: '10px 0 8px',
                  }}
                >
                  {market.title}
                </h3>
                <p style={{ color: '#557180', lineHeight: 1.75 }}>
                  {market.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 10: Colombo & Battaramulla Day Experiences */}
        <div style={{ marginTop: '64px' }}>
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
                {pageContent.colomboSection.eyebrow}
              </div>
              <h2 className="serif">
                {pageContent.colomboSection.headingPrefix}{' '}
                <em style={{ color: 'var(--terracotta)' }}>
                  {pageContent.colomboSection.headingItalic}
                </em>
              </h2>
            </div>
            <p>{pageContent.colomboSection.description}</p>
          </div>

          <div
            className="values-grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
              marginTop: '24px',
            }}
          >
            {colomboExperiences.map((exp, idx) => {
              const cmsExp = exp as CmsColomboExperienceItem;
              const expImgUrl = (cmsExp.imageRef?.url || exp.image || '').trim();
              return (
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
                    {expImgUrl && (
                      <div
                        style={{
                          position: 'relative',
                          width: '100%',
                          height: '180px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          marginBottom: '14px',
                        }}
                      >
                        <CmsImage
                          imageRef={cmsExp.imageRef}
                          src={expImgUrl}
                          alt={cmsExp.imageRef?.alt || exp.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                    )}
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
                      <strong>Highlights:</strong>{' '}
                      {Array.isArray(exp.highlights)
                        ? exp.highlights.join(', ')
                        : exp.highlights}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="pill dark"
                      style={{ padding: '9px 14px', fontSize: '10.5px' }}
                      onClick={() => setActiveDayExpBooking(exp)}
                    >
                      {pageContent.colomboSection.bookButtonLabel}
                    </button>
                    <a
                      className="pill"
                      style={{ padding: '9px 14px', fontSize: '10.5px' }}
                      href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                        `Hello Bimondo Travels, I would like to enquire about the ${exp.name} (${exp.duration}).`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {pageContent.colomboSection.whatsappButtonLabel}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Tailor-Made Banner */}
        <div className="dest-custom-cta-box" style={{ marginTop: '56px' }}>
          <div>
            <span className="eyebrow" style={{ color: '#a5eff4' }}>
              {pageContent.customCtaBox.eyebrow}
            </span>
            <h3
              className="serif"
              style={{ fontSize: '36px', margin: '10px 0', color: '#fff' }}
            >
              {pageContent.customCtaBox.heading}
            </h3>
            <p style={{ color: '#e0f5fb', maxWidth: '540px', lineHeight: 1.8 }}>
              {pageContent.customCtaBox.description}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              href={pageContent.customCtaBox.primaryCtaHref || '/stays'}
              prefetch={false}
              className="pill light"
            >
              {pageContent.customCtaBox.primaryCtaLabel}
            </Link>
            <Link
              href={pageContent.customCtaBox.secondaryCtaHref || '/contact'}
              prefetch={false}
              className="pill dark"
            >
              {pageContent.customCtaBox.secondaryCtaLabel}
            </Link>
          </div>
        </div>
      </section>

      {/* Mobile Sticky Booking Bar */}
      {resolvedBookingTour && (
        <div className="mobile-sticky-booking-bar">
          <div>
            <small>
              {resolvedBookingTour.durationLabel
                ? resolvedBookingTour.durationLabel.toUpperCase()
                : `${resolvedBookingTour.days} DAYS · PRIVATE JOURNEY`}
            </small>
            <strong>{resolvedBookingTour.name}</strong>
          </div>
          <button
            type="button"
            className="pill dark"
            onClick={() => {
              setModalTab('booking');
              setSelectedTour(resolvedBookingTour);
            }}
          >
            BOOK NOW ↗
          </button>
        </div>
      )}

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
