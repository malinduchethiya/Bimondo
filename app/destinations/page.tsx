'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageBanner from '@/components/PageBanner';
import CmsImage from '@/components/CmsImage';
import BookingPanel from '@/components/booking/BookingPanel';
import { useSiteCms } from '@/hooks/useSiteCms';
import {
  CmsDestination,
  CmsColomboExperienceItem,
} from '@/lib/cms-defaults';
import { ColomboDayExperience } from '@/lib/tours';

export default function DestinationsPage() {
  const { cms } = useSiteCms();
  const pageContent = cms.pages.destinationsPage;

  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [activeDestBooking, setActiveDestBooking] =
    useState<CmsDestination | null>(null);
  const [activeDayBooking, setActiveDayBooking] =
    useState<ColomboDayExperience | null>(null);

  const destinations: CmsDestination[] = (cms.destinations || [])
    .filter((d) => d.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const colomboExperiences: (CmsColomboExperienceItem | ColomboDayExperience)[] =
    (cms.colomboExperiences || [])
      .filter((exp) => (exp as CmsColomboExperienceItem).visible !== false)
      .sort(
        (a, b) =>
          ((a as CmsColomboExperienceItem).order ?? 0) -
          ((b as CmsColomboExperienceItem).order ?? 0)
      );

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
        eyebrow={pageContent.banner.eyebrow}
        title={pageContent.banner.title}
      />

      <section className="section wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              {pageContent.regionalSection.eyebrow}
            </div>
            <h2 className="serif">
              {pageContent.regionalSection.headingLine1}
              <br />
              {pageContent.regionalSection.headingLine2Prefix}{' '}
              <em style={{ color: 'var(--terracotta)' }}>
                {pageContent.regionalSection.headingItalic}
              </em>
            </h2>
          </div>
          <p>{pageContent.regionalSection.description}</p>
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
          {filtered.map((dest, idx) => (
            <article key={dest.id} className="destination-detail-card">
              <div className="dest-img-wrap">
                <CmsImage
                  imageRef={dest.imageRef}
                  src={dest.imageRef?.url || dest.image}
                  alt={dest.imageRef?.alt || dest.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority={idx < 2}
                  loading={idx < 6 ? 'eager' : 'lazy'}
                  className="object-cover"
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
                  <strong>
                    {pageContent.regionalSection.highlightsHeading}
                  </strong>
                  <ul>
                    {(dest.highlights || []).map((h, idx) => (
                      <li key={idx}>✳ {h}</li>
                    ))}
                  </ul>
                </div>
                <div
                  className="dest-card-foot"
                  style={{ gap: '8px', flexWrap: 'wrap' }}
                >
                  <Link
                    href={
                      pageContent.regionalSection.toursButtonHref || '/packages'
                    }
                    prefetch={false}
                    className="pill"
                    style={{ padding: '9px 14px', fontSize: '10.5px' }}
                  >
                    {pageContent.regionalSection.toursButtonLabel}
                  </Link>
                  <button
                    type="button"
                    className="pill dark"
                    style={{ padding: '9px 16px', fontSize: '10.5px' }}
                    onClick={() => setActiveDestBooking(dest)}
                  >
                    {pageContent.regionalSection.bookButtonLabel}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Section 07: Complete Adventure & Activity Portfolio */}
        <div style={{ marginTop: '72px' }}>
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
                SECTION 07 · ADVENTURE & ACTIVITY PORTFOLIO
              </div>
              <h2 className="serif">
                Surfing, rivers, reefs,{' '}
                <em style={{ color: 'var(--terracotta)' }}>
                  trails & wildlife.
                </em>
              </h2>
            </div>
            <p>
              Matched to seasonal suitability across Sri Lanka’s two coastal
              monsoons and operated with reputable, safety-checked adventure
              partners, qualified instructors, safety briefings, life jackets,
              helmets, and certified equipment.
            </p>
          </div>

          <div
            className="values-grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              marginTop: '24px',
            }}
          >
            {[
              {
                code: '01 · SURFING (TWO SEASONAL COASTS)',
                title: 'Weligama & Arugam Bay',
                desc: 'Weligama on the south coast offers beginner-friendly sandy-bottom waves and vetted surf schools during the November to April season. Arugam Bay on the east coast delivers world-renowned point breaks from May to October.',
              },
              {
                code: '02 · RIVERS & RAINFOREST GORGES',
                title: 'Kitulgala White-Water & Canyoning',
                desc: 'White-water rafting on the Kelani River, waterfall abseiling, natural rock-pool canyoning, guided jungle walks, and peaceful riverside accommodation.',
              },
              {
                code: '03 · AERIAL & RIVER EXPERIENCES',
                title: 'Bentota Paramotoring & Coast',
                desc: 'Powered paramotoring flights with coastline and river views operated by qualified pilots (subject to wind and weather conditions), paired with Bentota river safaris.',
              },
              {
                code: '04 · LAGOON WINDS & MARINE REEFS',
                title: 'Kalpitiya Kite Surfing & Bar Reef',
                desc: 'Flat-water lagoon kite surfing lessons, boat trips to the Bar Reef marine sanctuary for snorkelling and diving, and seasonal offshore dolphin watching.',
              },
              {
                code: '05 · SOUTHERN REEFS & HISTORIC FORT',
                title: 'Galle & Unawatuna Diving',
                desc: 'Reef diving, historic wreck diving, calm-bay snorkelling, relaxed southern beach days, and guided heritage walks inside UNESCO-listed Galle Fort.',
              },
              {
                code: '06 · HIGHLAND & RAINFOREST HIKING',
                title: 'The Pekoe Trail, Ella & Horton Plains',
                desc: 'Selected stages of The Pekoe Trail, Little Adam’s Peak, Ella Rock, Horton Plains & World’s End, Pidurangala sunrise climbs, and guided walks in Sinharaja Rainforest.',
              },
              {
                code: '07 · NATIONAL PARKS & RAINFORESTS',
                title: 'Yala, Udawalawe, Wilpattu, Minneriya & Sinharaja',
                desc: 'Ethical 4x4 safaris for leopards, elephants, and sloth bears across Yala, Udawalawe, and Wilpattu, the seasonal Minneriya elephant gathering, and endemic birding in Sinharaja.',
              },
              {
                code: '08 · SACRED CAPITALS & LIVING HERITAGE',
                title: 'Sigiriya, Dambulla, Anuradhapura, Polonnaruwa & Kandy',
                desc: 'Unhurried guided exploration of Sigiriya Rock Fortress, Dambulla Cave Temple, the ancient capitals of Anuradhapura and Polonnaruwa, and Kandy’s Temple of the Tooth.',
              },
            ].map((item) => (
              <div
                key={item.code}
                className="value"
                style={{ borderTopColor: '#c8dbe2' }}
              >
                <span
                  className="number"
                  style={{ color: 'var(--terracotta)', fontWeight: 700 }}
                >
                  {item.code}
                </span>
                <h3
                  className="serif"
                  style={{
                    color: 'var(--ink)',
                    fontSize: '23px',
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

          <div
            style={{
              marginTop: '24px',
              padding: '18px 22px',
              borderRadius: '14px',
              background: '#fff',
              border: '1px solid var(--line)',
              fontSize: '0.88rem',
              color: '#536f7e',
              lineHeight: 1.65,
            }}
          >
            <strong style={{ color: 'var(--ink)' }}>
              Seasonal & Safety Practices:
            </strong>{' '}
            Every adventure activity is scheduled around seasonal suitability,
            operated with reputable partners, and preceded by safety briefings,
            proper equipment (life jackets, helmets, certified dive/surf gear),
            and advance checks for medical or dietary requirements. Wildlife
            sightings, sea conditions, and aerial/water activities depend on
            nature and weather and are never guaranteed.
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
            <div>
              <p style={{ marginBottom: '8px' }}>
                {pageContent.colomboSection.description}
              </p>
              <p style={{ fontSize: '0.88rem', color: '#557180' }}>
                Ideal for arrival days, departure days before an evening flight,
                and short stays in Colombo or Battaramulla.
              </p>
            </div>
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
                    onClick={() => setActiveDayBooking(exp)}
                  >
                    {pageContent.colomboSection.bookButtonLabel}
                  </button>
                  <Link
                    href={
                      pageContent.colomboSection.enquireButtonHref || '/contact'
                    }
                    prefetch={false}
                    className="pill"
                    style={{ padding: '9px 14px', fontSize: '10.5px' }}
                  >
                    {pageContent.colomboSection.enquireButtonLabel}
                  </Link>
                </div>
              </div>
              );
            })}
          </div>
        </div>

        {/* Tailor-Made Route Box */}
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
            <p style={{ color: '#e0f5fb', maxWidth: '520px', lineHeight: 1.8 }}>
              {pageContent.customCtaBox.description}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              href={pageContent.customCtaBox.primaryCtaHref || '/packages'}
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
