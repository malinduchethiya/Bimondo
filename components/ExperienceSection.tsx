'use client';

import React from 'react';
import Link from 'next/link';
import { useSiteCms } from '@/hooks/useSiteCms';
import CmsImage from '@/components/CmsImage';
import SriLanka3DTerrainMap from '@/components/SriLanka3DTerrainMap';
import { resolveTourSlug } from '@/lib/tour-helpers';

const DEFAULT_COMPETITIVE_ADVANTAGES = [
  {
    id: 'adv-01',
    num: '01',
    title: 'Operating Since 2022',
    desc: 'Established in 2022 in Thalangama South, Battaramulla, serving international travellers from the United Kingdom, Europe, India, and Australia.',
  },
  {
    id: 'adv-02',
    num: '02',
    title: 'Strong Adventure Range',
    desc: 'Surfing in Weligama and Arugam Bay, white-water rafting and abseiling in Kitulgala, paramotoring in Bentota, kite surfing in Kalpitiya, diving in Galle, and highland trekking.',
  },
  {
    id: 'adv-03',
    num: '03',
    title: 'Private and Personal Travel',
    desc: 'Tailor-made itineraries built around your own dates, pace, and interests—for solo travellers, couples, families, and small private groups.',
  },
  {
    id: 'adv-04',
    num: '04',
    title: '24-Hour Support',
    desc: 'Round-the-clock on-call assistance from our local operations team throughout your journey in Sri Lanka.',
  },
  {
    id: 'adv-05',
    num: '05',
    title: 'Digital Convenience',
    desc: 'Online booking confirmations, clear written itinerary summaries, WhatsApp concierge support, and social media enquiry handling.',
  },
  {
    id: 'adv-06',
    num: '06',
    title: 'Luxury Accommodation Options',
    desc: 'Handpicked four-star hotels, characterful boutique properties, and five-star luxury resorts matched to your route and budget.',
  },
  {
    id: 'adv-07',
    num: '07',
    title: 'Colombo-Area Operational Base',
    desc: 'Strategically based in Thalangama South, Battaramulla near Colombo, Parliament, Diyawanna Lake, Kotte, and the airport expressway network.',
  },
  {
    id: 'adv-08',
    num: '08',
    title: 'Authenticity with Sustainability',
    desc: 'Genuine local experiences that uplift Sri Lankan communities, respect sacred heritage, and protect wildlife and natural habitats.',
  },
];

const DEFAULT_SUSTAINABILITY_ITEMS = [
  {
    id: 'sust-01',
    category: 'COMMUNITY UPLIFTMENT',
    title: 'Local Drivers, Guides & Family-Run Businesses',
    desc: 'Working directly with Sri Lankan drivers, licensed guides, family-run restaurants, and authentic community experiences so tourism income benefits local people.',
  },
  {
    id: 'sust-02',
    category: 'CULTURAL RESPECT',
    title: 'Temple Dress Codes & Responsible Photography',
    desc: 'Briefing guests on respectful dress codes at sacred Buddhist and Hindu sites, etiquette at the Temple of the Tooth and ancient capitals, and considerate photography.',
  },
  {
    id: 'sust-03',
    category: 'ETHICAL WILDLIFE',
    title: 'Responsible National Park & Marine Viewing',
    desc: 'Partnering with safari and marine operators in Yala, Udawalawe, Wilpattu, Minneriya, Mirissa, and Kalpitiya who follow park rules and never crowd or disturb wildlife.',
  },
  {
    id: 'sust-04',
    category: 'ENVIRONMENTAL CARE',
    title: 'Reduced Plastic & Habitat Protection',
    desc: 'Encouraging reduced single-use plastic and protecting Sri Lanka’s rainforests, highland trails, beaches, wetlands, and coral reefs.',
  },
];

const FEATURED_TOUR_IDS = [
  'waves-and-rapids',
  'ceylon-grand-circuit',
  'southern-shores-in-luxury',
  'the-pekoe-trail-walk',
  'family-island-discovery',
];

type ExperienceSectionCms = ReturnType<
  typeof useSiteCms
>['cms']['pages']['home']['experience'];

const DiscoverMapStage = React.memo(function DiscoverMapStage({
  expSection,
}: {
  expSection: ExperienceSectionCms;
}) {
  const [activePinId, setActivePinId] = React.useState<string | null>(null);

  const visibleMapPins = React.useMemo(
    () =>
      [...(expSection.mapPins || [])]
        .filter((pin) => pin.visible !== false && !pin.deletedAt)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [expSection.mapPins]
  );

  const handleSelectPin = React.useCallback((pinId: string) => {
    setActivePinId((prev) => (prev === pinId ? prev : pinId));
  }, []);

  const activePin =
    (activePinId
      ? visibleMapPins.find((pin) => pin.id === activePinId)
      : null) || null;

  const activePinHighlights = activePin?.highlights
    ? activePin.highlights
        .split(/[·,\n|•;]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const primaryCtaText =
    (activePin?.ctaLabel && activePin.ctaLabel.trim()) ||
    (expSection.primaryCtaLabel || '').trim();
  const primaryCtaLink =
    (activePin?.ctaHref && activePin.ctaHref.trim()) ||
    expSection.primaryCtaHref ||
    '/packages';
  const secondaryCtaText = (expSection.secondaryCtaLabel || '').trim();

  return (
    <div className="experience-grid">
      <div aria-live="polite">
        <div className="eyebrow">
          {activePin
            ? activePin.regionEyebrow || expSection.eyebrow
            : expSection.eyebrow}
        </div>

        {activePin ? (
          <h2 className="serif">
            {activePin.heading || activePin.label}
            {activePin.headingItalic ? (
              <>
                {' '}
                <em>{activePin.headingItalic}</em>
              </>
            ) : null}
          </h2>
        ) : (
          <h2 className="serif">
            {expSection.headingLine1}
            <br />
            {expSection.headingLine2Prefix}{' '}
            <em>{expSection.headingItalic}</em>
            <br />
            {expSection.headingLine3}
          </h2>
        )}

        <p>
          {activePin
            ? activePin.description || expSection.description
            : expSection.description}
        </p>

        {activePin && activePinHighlights.length > 0 && (
          <div className="discover-pin-highlights">
            {activePinHighlights.map((item, idx) => (
              <span key={idx} className="discover-pin-highlight-item">
                {item}
              </span>
            ))}
          </div>
        )}

        {(primaryCtaText || secondaryCtaText) && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {primaryCtaText && (
              <Link
                className="pill dark"
                href={primaryCtaLink}
                prefetch={false}
              >
                {primaryCtaText}
              </Link>
            )}
            {secondaryCtaText && (
              <Link
                className="pill"
                href={expSection.secondaryCtaHref || '/contact'}
                prefetch={false}
              >
                {secondaryCtaText}
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="experience-photo" style={{ position: 'relative' }}>
        <SriLanka3DTerrainMap
          pins={visibleMapPins}
          activePinId={activePin?.id ?? null}
          onSelectPin={handleSelectPin}
          enableHoverSelect
        />
      </div>
    </div>
  );
});

export default function ExperienceSection() {
  const { cms } = useSiteCms();
  const expSection = cms.pages.home.experience;

  if (expSection.visible === false) {
    return null;
  }

  const experiences = expSection.items || [];

  const visibleTours = [...(cms.tours || [])]
    .filter((t) => t.visible !== false && !t.deletedAt)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const featuredTours = FEATURED_TOUR_IDS.map((id) =>
    visibleTours.find((t) => t.id === id)
  ).filter((t): t is NonNullable<typeof t> => Boolean(t));

  const displayFeaturedTours =
    featuredTours.length > 0 ? featuredTours : visibleTours.slice(0, 5);

  const competitiveAdvantages =
    cms.pages.ourStoryPage.competitiveAdvantagesSection?.items?.length
      ? cms.pages.ourStoryPage.competitiveAdvantagesSection.items
      : DEFAULT_COMPETITIVE_ADVANTAGES;

  const sustainabilityItems =
    cms.pages.ourStoryPage.sustainabilitySection?.items?.length
      ? cms.pages.ourStoryPage.sustainabilitySection.items
      : DEFAULT_SUSTAINABILITY_ITEMS;

  return (
    <section className="section experience" id="discover">
      <div className="wrap">
        <DiscoverMapStage expSection={expSection} />

        <div className="experiences">
          {experiences.map((exp) => (
            <div key={exp.id || exp.num} className="exp">
              <span>{exp.num}</span>
              <b>{exp.title}</b>
              <span>{exp.desc}</span>
            </div>
          ))}
        </div>

        {/* Featured Signature Journeys (reusing existing cms.tours and their imageRef) */}
        {displayFeaturedTours.length > 0 && (
          <div style={{ marginTop: '72px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '28px',
              }}
            >
              <div>
                <div className="eyebrow">
                  SIGNATURE JOURNEYS · 20 SAMPLE ITINERARIES ACROSS 5 CATEGORIES
                </div>
                <h3
                  className="serif"
                  style={{
                    fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
                    lineHeight: 1.12,
                    marginTop: '8px',
                  }}
                >
                  Featured private <em>journeys.</em>
                </h3>
              </div>
              <Link className="pill dark" href="/packages" prefetch={false}>
                EXPLORE ALL 20 JOURNEYS ↗
              </Link>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '18px',
              }}
            >
              {displayFeaturedTours.map((tour) => (
                <article
                  key={tour.id}
                  style={{
                    background: '#fff',
                    borderRadius: '18px',
                    border: '1px solid var(--line)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      height: '175px',
                      background: '#e5dfd5',
                    }}
                  >
                    <CmsImage
                      imageRef={tour.imageRef}
                      src={tour.image}
                      alt={tour.imageRef?.alt || tour.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      className="object-cover"
                    />
                    <span
                      style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        background: 'rgba(20, 26, 23, 0.84)',
                        color: '#fff',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                      }}
                    >
                      {tour.durationLabel || `${tour.days} Days`}
                    </span>
                  </div>
                  <div
                    style={{
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      flex: 1,
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.68rem',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--accent)',
                        fontWeight: 700,
                      }}
                    >
                      {tour.categoryLabel}
                    </span>
                    <h4
                      className="serif"
                      style={{
                        fontSize: '1.22rem',
                        margin: '6px 0',
                        lineHeight: 1.2,
                      }}
                    >
                      <Link
                        href={`/packages/${resolveTourSlug(tour)}`}
                        prefetch={false}
                        style={{ color: 'inherit', textDecoration: 'none' }}
                      >
                        {tour.name}
                      </Link>
                    </h4>
                    <p
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--muted)',
                        marginBottom: '8px',
                      }}
                    >
                      <b>Route:</b> {tour.route}
                    </p>
                    <p
                      style={{
                        fontSize: '0.84rem',
                        color: 'var(--muted)',
                        lineHeight: 1.55,
                        marginBottom: '14px',
                        flex: 1,
                      }}
                    >
                      {tour.description}
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link
                        href={`/packages/${resolveTourSlug(tour)}`}
                        prefetch={false}
                        className="pill"
                        style={{
                          flex: 1,
                          justifyContent: 'center',
                          fontSize: '0.72rem',
                          padding: '8px 10px',
                        }}
                      >
                        DETAILS
                      </Link>
                      <Link
                        href={`/booking?type=tour&item=${encodeURIComponent(
                          tour.id
                        )}`}
                        prefetch={false}
                        className="pill dark"
                        style={{
                          flex: 1,
                          justifyContent: 'center',
                          fontSize: '0.72rem',
                          padding: '8px 10px',
                        }}
                      >
                        BOOK ↗
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Why Bimondo Travels: 8 Competitive Advantages */}
        <div style={{ marginTop: '72px' }}>
          <div style={{ maxWidth: '680px', marginBottom: '28px' }}>
            <div className="eyebrow">
              WHY BIMONDO TRAVELS · EIGHT COMPETITIVE ADVANTAGES
            </div>
            <h3
              className="serif"
              style={{
                fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
                lineHeight: 1.12,
                marginTop: '8px',
              }}
            >
              Private planning. <em>Dependable execution.</em>
            </h3>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
            }}
          >
            {competitiveAdvantages.map((adv) => (
              <div
                key={adv.id}
                style={{
                  background: '#fff',
                  border: '1px solid var(--line)',
                  borderRadius: '16px',
                  padding: '22px',
                }}
              >
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: 'var(--accent)',
                  }}
                >
                  {adv.num}
                </span>
                <h4
                  className="serif"
                  style={{ fontSize: '1.18rem', margin: '6px 0 8px' }}
                >
                  {adv.title}
                </h4>
                <p
                  style={{
                    fontSize: '0.86rem',
                    color: 'var(--muted)',
                    lineHeight: 1.58,
                  }}
                >
                  {adv.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Sustainability & Heritage Preservation Summary */}
        <div
          style={{
            marginTop: '56px',
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: '20px',
            padding: 'clamp(24px, 4vw, 36px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <div style={{ maxWidth: '640px' }}>
              <div className="eyebrow">
                SUSTAINABILITY & HERITAGE PRESERVATION
              </div>
              <h3
                className="serif"
                style={{
                  fontSize: 'clamp(1.5rem, 2.6vw, 2.15rem)',
                  lineHeight: 1.15,
                  marginTop: '6px',
                }}
              >
                Uplifting local communities & <em>preserving our heritage.</em>
              </h3>
            </div>
            <Link className="pill" href="/our-story" prefetch={false}>
              OUR VALUES & SUSTAINABILITY ↗
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
            }}
          >
            {sustainabilityItems.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  background: 'var(--bg)',
                  border: '1px solid var(--line)',
                }}
              >
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: 'var(--accent)',
                    textTransform: 'uppercase',
                  }}
                >
                  {item.category}
                </span>
                <h4
                  className="serif"
                  style={{ fontSize: '1.08rem', margin: '6px 0' }}
                >
                  {item.title}
                </h4>
                <p
                  style={{
                    fontSize: '0.84rem',
                    color: 'var(--muted)',
                    lineHeight: 1.55,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

