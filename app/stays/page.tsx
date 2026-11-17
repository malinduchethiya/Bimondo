'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageBanner from '@/components/PageBanner';
import CmsImage from '@/components/CmsImage';
import BookingPanel from '@/components/booking/BookingPanel';
import { AccommodationItem } from '@/lib/booking-types';
import { CmsStayItem } from '@/lib/cms-defaults';
import { useSiteCms } from '@/hooks/useSiteCms';

export default function StaysPage() {
  const { cms } = useSiteCms();
  const pageContent = cms.pages.staysPage;

  const staysList: (CmsStayItem | AccommodationItem)[] = (cms.stays || [])
    .filter((s) => (s as CmsStayItem).visible !== false)
    .sort(
      (a, b) =>
        ((a as CmsStayItem).order ?? 0) - ((b as CmsStayItem).order ?? 0)
    );

  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [activeStay, setActiveStay] = useState<AccommodationItem | null>(
    staysList[0] ?? null
  );
  const [checkIn, setCheckIn] = useState<string>('');
  const [checkOut, setCheckOut] = useState<string>('');
  const [adults, setAdults] = useState<number>(2);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [rooms, setRooms] = useState<number>(1);
  const [mobileModalOpen, setMobileModalOpen] = useState<boolean>(false);

  const regionTabs = [
    { id: 'all', label: 'All Regions' },
    { id: 'culture', label: 'Cultural Triangle' },
    { id: 'hills', label: 'Kandy & Hill Country' },
    { id: 'coast', label: 'South, West & East Coasts' },
    { id: 'wildlife', label: 'National Park Regions' },
  ];

  const filtered =
    selectedRegion === 'all'
      ? staysList
      : staysList.filter((s) => s.region === selectedRegion);

  const resolvedActiveStay =
    (activeStay ? staysList.find((s) => s.id === activeStay.id) : undefined) ||
    staysList[0] ||
    null;

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

        {/* Qualification Notice */}
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
          <strong>{pageContent.introSection.policyLabel}</strong>{' '}
          {pageContent.introSection.policyNotice}
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
              const isSelected = resolvedActiveStay?.id === stay.id;
              const cmsStay = stay as CmsStayItem;
              return (
                <article
                  key={stay.id}
                  className={`destination-detail-card ${
                    isSelected ? 'is-active-booking-card' : ''
                  }`}
                >
                  <div className="dest-img-wrap">
                    <CmsImage
                      imageRef={cmsStay.imageRef}
                      src={cmsStay.imageRef?.url || stay.image}
                      alt={cmsStay.imageRef?.alt || stay.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority={idx < 2}
                      loading={idx < 6 ? 'eager' : 'lazy'}
                      className="object-cover"
                    />
                    <span className="dest-season-badge">
                      {pageContent.introSection.badgeLabel}
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
                      <strong>
                        {pageContent.introSection.standardsHeading}
                      </strong>
                      <ul>
                        {(stay.highlights || []).map((h, i) => (
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
                        {pageContent.introSection.providerNote}
                      </span>
                      <button
                        type="button"
                        className="pill dark"
                        onClick={() => {
                          setActiveStay(stay);
                          setMobileModalOpen(true);
                        }}
                      >
                        {pageContent.introSection.checkButtonLabel}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Sticky Booking Sidebar on Desktop */}
          {resolvedActiveStay && (
            <aside
              className="sticky-booking-sidebar"
              aria-label="Accommodation Booking Panel"
            >
              <BookingPanel
                key={`${resolvedActiveStay.id}-${checkIn}-${checkOut}-${adults}-${childrenCount}-${rooms}`}
                itemId={resolvedActiveStay.id}
                itemName={resolvedActiveStay.name}
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
          )}
        </div>

        {/* Section 09: Accommodation Tiers & Guest Comfort */}
        <div style={{ marginTop: '64px' }}>
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
                SECTION 13 · ACCOMMODATION TIERS & GUEST COMFORT
              </div>
              <h2 className="serif">
                Handpicked stays &{' '}
                <em style={{ color: 'var(--terracotta)' }}>
                  seamless comfort.
                </em>
              </h2>
            </div>
            <p>
              Every property is selected for its location, comfort, hospitality,
              and suitability for your route—paired with comfortable
              air-conditioned private vehicles, professional drivers, and
              family-friendly room arrangements.
            </p>
          </div>

          <div
            className="values-grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              marginTop: '24px',
            }}
          >
            {[
              {
                code: '01 · FOUR-STAR HOTELS',
                title: 'Dependable Four-Star Comfort',
                desc: 'Well-located four-star properties across the Cultural Triangle, Kandy, Nuwara Eliya, Ella, national park gateways, and the coast—offering modern amenities, swimming pools, and warm Sri Lankan service.',
              },
              {
                code: '02 · BOUTIQUE PROPERTIES',
                title: 'Characterful Boutique Stays',
                desc: 'Intimate tea-planter bungalows, historic Galle Fort townhouses, riverside eco-lodges, and design-led coastal villas selected for atmosphere, privacy, and regional dining.',
              },
              {
                code: '03 · FIVE-STAR LUXURY RESORTS',
                title: 'Five-Star Luxury Resorts',
                desc: 'Premier beachfront resorts, private-pool safari lodges, and luxury highland sanctuaries with spa facilities, fine dining, and personalized concierge care.',
              },
            ].map((tier) => (
              <div
                key={tier.code}
                className="value"
                style={{ borderTopColor: '#c8dbe2' }}
              >
                <span
                  className="number"
                  style={{ color: 'var(--terracotta)', fontWeight: 700 }}
                >
                  {tier.code}
                </span>
                <h3
                  className="serif"
                  style={{
                    color: 'var(--ink)',
                    fontSize: '23px',
                    margin: '10px 0 8px',
                  }}
                >
                  {tier.title}
                </h3>
                <p style={{ color: '#557180', lineHeight: 1.75 }}>
                  {tier.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 11: Operations, Quality, and Safety */}
        <div style={{ marginTop: '64px' }}>
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
                SECTION 15 · OPERATIONS, QUALITY & SAFETY STANDARDS
              </div>
              <h2 className="serif">
                Six operational pillars{' '}
                <em style={{ color: 'var(--terracotta)' }}>on the ground.</em>
              </h2>
            </div>
            <p>
              Managed directly from our operational base in Thalangama South,
              Battaramulla to ensure safe, punctual, and comfortable travel
              across Sri Lanka.
            </p>
          </div>

          <div
            className="values-grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
              marginTop: '24px',
            }}
          >
            {[
              {
                code: '01 · VEHICLES AND DRIVERS',
                title: 'Private Air-Conditioned Transport',
                desc: 'Professional, courteous local drivers and comfortable air-conditioned cars, SUVs, and vans—with daily cleanliness standards, comprehensive insurance checks, vehicle safety inspections, and trusted transport partners.',
              },
              {
                code: '02 · GUIDES',
                title: 'Licensed & Specialist Local Guides',
                desc: 'Licensed national guides, accredited monument site guides at ancient capitals, specialist trekking and adventure guides, and experienced wildlife and rainforest naturalists.',
              },
              {
                code: '03 · ACCOMMODATION QUALITY',
                title: 'Ongoing Hotel Quality Monitoring',
                desc: 'Guest-specific hotel selection across four-star hotels, boutique properties, and five-star luxury resorts—backed by continuous guest feedback tracking and regular supplier reviews.',
              },
              {
                code: '04 · ADVENTURE PARTNERS',
                title: 'Vetted Operators & Equipment',
                desc: 'Partnering only with reputable surf schools, white-water rafting operators, dive centres, kite surfing schools, and paramotoring pilots using qualified instructors and certified safety equipment.',
              },
              {
                code: '05 · GUEST CARE & CONTINGENCIES',
                title: '24-Hour Assistance & Backup Planning',
                desc: '24-hour on-call guest assistance, medical contact arrangements, travel insurance guidance, real-time weather monitoring, alternative itinerary planning, and backup accommodation, vehicles, and activity providers.',
              },
              {
                code: '06 · QUALITY STANDARDS',
                title: 'Punctuality & Fast Resolution',
                desc: 'On-time pickups, clean vehicles, pre-confirmed hotel rooms, accurate pre-arrival and daily information, fast communication responses, and immediate supplier issue resolution.',
              },
            ].map((op) => (
              <div
                key={op.code}
                className="value"
                style={{ borderTopColor: '#c8dbe2' }}
              >
                <span
                  className="number"
                  style={{ color: 'var(--terracotta)', fontWeight: 700 }}
                >
                  {op.code}
                </span>
                <h3
                  className="serif"
                  style={{
                    color: 'var(--ink)',
                    fontSize: '23px',
                    margin: '10px 0 8px',
                  }}
                >
                  {op.title}
                </h3>
                <p style={{ color: '#557180', lineHeight: 1.75 }}>{op.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Route & Stay Combination CTA */}
        <div className="dest-custom-cta-box" style={{ marginTop: '48px' }}>
          <div>
            <span className="eyebrow" style={{ color: '#a5eff4' }}>
              {pageContent.customCtaBox.eyebrow}
            </span>
            <h3
              className="serif"
              style={{ fontSize: '32px', margin: '10px 0', color: '#fff' }}
            >
              {pageContent.customCtaBox.heading}
            </h3>
            <p style={{ color: '#e0f5fb', maxWidth: '540px', lineHeight: 1.75 }}>
              {pageContent.customCtaBox.description}
            </p>
          </div>
          <Link
            href={pageContent.customCtaBox.ctaHref || '/contact'}
            prefetch={false}
            className="pill light"
          >
            {pageContent.customCtaBox.ctaLabel}
          </Link>
        </div>
      </section>

      {/* Mobile Sticky Bottom Booking Bar */}
      {resolvedActiveStay && (
        <div className="mobile-sticky-booking-bar">
          <div>
            <small>SELECTED REGION STAY</small>
            <strong>{resolvedActiveStay.name}</strong>
          </div>
          <button
            type="button"
            className="pill dark"
            onClick={() => setMobileModalOpen(true)}
          >
            BOOK NOW ↗
          </button>
        </div>
      )}

      {/* Mobile / Full Booking Modal */}
      {mobileModalOpen && resolvedActiveStay && (
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
              itemId={resolvedActiveStay.id}
              itemName={resolvedActiveStay.name}
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
