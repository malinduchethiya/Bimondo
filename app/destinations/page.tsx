'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import PageBanner from '@/components/PageBanner';
import BookingPanel from '@/components/booking/BookingPanel';
import { useSiteCms } from '@/hooks/useSiteCms';
import { DEFAULT_DESTINATIONS, CmsDestination } from '@/lib/cms-defaults';
import { COLOMBO_DAY_EXPERIENCES, ColomboDayExperience } from '@/lib/tours';

export default function DestinationsPage() {
  const { cms } = useSiteCms();
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [activeDestBooking, setActiveDestBooking] =
    useState<CmsDestination | null>(null);
  const [activeDayBooking, setActiveDayBooking] =
    useState<ColomboDayExperience | null>(null);

  const destinations: CmsDestination[] =
    cms.destinations && cms.destinations.length > 0
      ? cms.destinations
      : DEFAULT_DESTINATIONS;

  const filtered =
    selectedRegion === 'all'
      ? destinations
      : destinations.filter((d) => d.region === selectedRegion);

  const regionTabs = [
    { id: 'all', label: 'All Regions' },
    { id: 'culture', label: 'Culture & Heritage' },
    { id: 'hills', label: 'Hill Country & Hiking' },
    { id: 'wildlife', label: 'Wildlife & Nature' },
    { id: 'coast', label: 'Sea & Sand' },
    { id: 'colombo', label: 'Colombo & Battaramulla' },
  ];

  return (
    <main>
      <PageBanner
        eyebrow="BIMONDO DESTINATIONS  /  SRI LANKA"
        title="From ancient kingdoms and tea hills to wild parks and coasts."
      />

      <section className="section wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              DESTINATIONS BY REGION
            </div>
            <h2 className="serif">
              Five regions across
              <br />
              our <em style={{ color: 'var(--terracotta)' }}>island home.</em>
            </h2>
          </div>
          <p>
            Every itinerary connects Sri Lanka&apos;s Cultural Triangle, Hill
            Country, National Parks, Southern and Eastern Coasts, and our
            Colombo &amp; Battaramulla home base with private transport and
            licensed local guides.
          </p>
        </div>

        {/* Region Filter Tabs */}
        <div className="filter" style={{ marginBottom: '40px' }}>
          {regionTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={selectedRegion === tab.id ? 'active' : ''}
              onClick={() => setSelectedRegion(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Destinations Grid */}
        <div className="destinations-detail-grid">
          {filtered.map((dest, i) => (
            <article key={dest.id} className="destination-detail-card">
              <div className="dest-img-wrap">
                <Image
                  src={dest.image}
                  alt={dest.name}
                  fill
                  priority={i < 2}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="dest-season-badge">{dest.season}</span>
              </div>
              <div className="dest-content">
                <span
                  className="eyebrow"
                  style={{ color: 'var(--terracotta)' }}
                >
                  {dest.regionLabel}
                </span>
                <h3 className="serif dest-name">{dest.name}</h3>
                <p className="dest-tagline">{dest.tagline}</p>
                <p className="dest-desc">{dest.description}</p>
                <div className="dest-highlights">
                  <strong>Documented places &amp; experiences:</strong>
                  <ul>
                    {dest.highlights.map((h, idx) => (
                      <li key={idx}>✳ {h}</li>
                    ))}
                  </ul>
                </div>
                <div
                  className="dest-card-foot"
                  style={{ gap: '8px', flexWrap: 'wrap' }}
                >
                  <Link
                    href="/packages"
                    prefetch={false}
                    className="pill"
                    style={{ padding: '9px 14px', fontSize: '10.5px' }}
                  >
                    TOURS IN REGION
                  </Link>
                  <button
                    type="button"
                    className="pill dark"
                    style={{ padding: '9px 16px', fontSize: '10.5px' }}
                    onClick={() => setActiveDestBooking(dest)}
                  >
                    BOOK / ENQUIRE ↗
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Section 10: Colombo & Battaramulla Day Experiences */}
        <div style={{ marginTop: '64px' }}>
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
                SECTION 10 · COLOMBO &amp; BATTARAMULLA DAY EXPERIENCES
              </div>
              <h2 className="serif">
                Six short experiences from{' '}
                <em style={{ color: 'var(--terracotta)' }}>
                  our Battaramulla base.
                </em>
              </h2>
            </div>
            <p>
              Because our office is located at No. 596/1, Thalangama South,
              Battaramulla, we offer half-day and full-day experiences around
              Colombo, Kotte, Kelaniya, Thalangama Wetland, and Negombo Lagoon.
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
                    onClick={() => setActiveDayBooking(exp)}
                  >
                    BOOK EXPERIENCE ↗
                  </button>
                  <Link
                    href="/contact"
                    prefetch={false}
                    className="pill"
                    style={{ padding: '9px 14px', fontSize: '10.5px' }}
                  >
                    ENQUIRE
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tailor-Made Route Box */}
        <div className="dest-custom-cta-box" style={{ marginTop: '56px' }}>
          <div>
            <span className="eyebrow" style={{ color: '#a5eff4' }}>
              CUSTOM ROUTING &amp; ACCOMMODATION
            </span>
            <h3
              className="serif"
              style={{ fontSize: '36px', margin: '10px 0', color: '#fff' }}
            >
              Want to combine culture, tea hills, wildlife &amp; the sea?
            </h3>
            <p style={{ color: '#e0f5fb', maxWidth: '520px', lineHeight: 1.8 }}>
              Our team in Battaramulla designs private day-by-day itineraries
              matched to the season, your preferred travel pace, and four-star,
              boutique, or five-star accommodation.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/packages" prefetch={false} className="pill light">
              VIEW 20 SIGNATURE TOURS ↗
            </Link>
            <Link href="/contact" prefetch={false} className="pill dark">
              DESIGN MY ROUTE ↗
            </Link>
          </div>
        </div>
      </section>

      {activeDestBooking && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveDestBooking(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-card booking-modal-wide">
            <BookingPanel
              itemId={activeDestBooking.id}
              itemName={activeDestBooking.name}
              itemType="experience"
              onClose={() => setActiveDestBooking(null)}
            />
          </div>
        </div>
      )}

      {activeDayBooking && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveDayBooking(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-card booking-modal-wide">
            <BookingPanel
              itemId={activeDayBooking.id}
              itemName={`${activeDayBooking.name} (${activeDayBooking.duration})`}
              itemType="experience"
              onClose={() => setActiveDayBooking(null)}
            />
          </div>
        </div>
      )}
    </main>
  );
}
