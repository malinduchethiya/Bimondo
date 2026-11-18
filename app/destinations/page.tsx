'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import PageBanner from '@/components/PageBanner';
import BookingPanel from '@/components/booking/BookingPanel';
import CmsImage from '@/components/CmsImage';
import { useSiteCms } from '@/hooks/useSiteCms';
import type { CmsDestination, DestinationCategoryId } from '@/lib/cms-defaults';
import { isForbiddenImageUrl } from '@/lib/content-repository';
import {
  DESTINATION_CATEGORY_FILTERS,
  resolveDestinationSlug,
} from '@/lib/sri-lanka-47-destinations';

const ADVENTURE_ACTIVITIES = [
  {
    id: 'adv-surf-weligama',
    title: 'Surfing at Weligama & South Coast',
    location: 'Weligama, Mirissa & Hikkaduwa · South / Southwest Coast',
    season: 'Best November – April',
    description:
      'Warm-water beach and reef breaks ideal for beginners and intermediates, paired with surf coaching and relaxed south-coast stays.',
    slug: 'mirissa',
  },
  {
    id: 'adv-surf-arugam',
    title: 'Surfing at Arugam Bay',
    location: 'Arugam Bay · East Coast',
    season: 'Best May – October',
    description:
      'Long right-hand point breaks along the east coast during the dry summer months, combined with Kumana wildlife safaris and lagoon tours.',
    slug: 'arugam-bay',
  },
  {
    id: 'adv-rafting-kitulgala',
    title: 'White-Water Rafting & Canyoning',
    location: 'Kitulgala · Kelani River',
    season: 'Year-round (subject to river levels)',
    description:
      'Guided white-water rafting and waterfall abseiling through rainforest gorges on the Kelani River with vetted safety operators.',
    slug: 'kitulgala',
  },
  {
    id: 'adv-paramotoring-bentota',
    title: 'Paramotoring & River Safaris',
    location: 'Bentota · Southwest Coast',
    season: 'Best November – April',
    description:
      'Powered paraglider flights over the Bentota coastline and river estuary in calm weather windows, plus mangrove boat safaris.',
    slug: 'bentota',
  },
  {
    id: 'adv-kalpitiya-kite',
    title: 'Kite Surfing, Bar Reef Diving & Dolphins',
    location: 'Kalpitiya · Northwest Peninsula',
    season: 'Kite Surfing May–Oct & Dec–Mar · Reef & Dolphins Nov–Apr',
    description:
      'Flat-water lagoon kite surfing lessons, snorkelling and diving at the Bar Reef, and seasonal offshore dolphin watching.',
    slug: 'kalpitiya',
  },
  {
    id: 'adv-pekoe-trail',
    title: 'The Pekoe Trail & Highland Trekking',
    location: 'Kandy, Nuwara Eliya, Haputale, Horton Plains & Ella',
    season: 'Best January – May',
    description:
      'Curated walking stages on The Pekoe Trail through historic tea estates, Horton Plains & World’s End, Little Adam’s Peak, and Ella Rock.',
    slug: 'ella',
  },
];

const CATEGORY_LABELS_MAP: Record<DestinationCategoryId, string> = {
  'culture-heritage': 'Culture & Heritage',
  'hill-country-hiking': 'Hill Country & Hiking',
  'wildlife-nature': 'Wildlife & Nature',
  'beaches-coast': 'Beaches & Coast',
  adventure: 'Adventure',
  'cities-local': 'Cities & Local Experiences',
};

function hasValidDestinationImage(dest: CmsDestination): boolean {
  const rawUrl = (dest.imageRef?.url || dest.image || '').trim();
  return rawUrl.length > 0 && !isForbiddenImageUrl(rawUrl);
}

function getDestinationCategories(dest: CmsDestination): DestinationCategoryId[] {
  if (Array.isArray(dest.categories) && dest.categories.length > 0) {
    return dest.categories;
  }
  switch (dest.region) {
    case 'culture':
      return ['culture-heritage'];
    case 'hills':
      return ['hill-country-hiking'];
    case 'wildlife':
      return ['wildlife-nature'];
    case 'coast':
      return ['beaches-coast'];
    case 'colombo':
      return ['cities-local'];
    default:
      return ['culture-heritage'];
  }
}

function matchesDestinationSearch(dest: CmsDestination, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;

  const terms = q.split(/\s+/).filter(Boolean);
  const searchableCorpus = [
    dest.name,
    dest.slug || '',
    dest.regionLabel,
    dest.season,
    dest.tagline,
    dest.description,
    dest.overview || '',
    ...(dest.highlights || []),
    ...(dest.thingsToSee || []),
    ...(dest.thingsToDo || []),
    ...(dest.hikingTrails || []),
    ...(dest.seasonalActivities || []),
    ...(dest.festivals || []),
    ...(dest.tags || []),
    ...getDestinationCategories(dest).map((c) => CATEGORY_LABELS_MAP[c] || c),
  ]
    .join(' ')
    .toLowerCase();

  return terms.every((term) => searchableCorpus.includes(term));
}

export default function DestinationsPage() {
  const { cms } = useSiteCms();
  const pageCopy = cms.pages.destinationsPage;

  const [activeCategory, setActiveCategory] = useState<
    'all' | DestinationCategoryId
  >('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bookingModalItem, setBookingModalItem] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const visibleDestinations = useMemo(
    () =>
      [...cms.destinations]
        .filter((d) => d.visible !== false && !d.deletedAt)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [cms.destinations]
  );

  const visibleColomboExperiences = useMemo(
    () =>
      [...cms.colomboExperiences]
        .filter((e) => e.visible !== false && !e.deletedAt)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [cms.colomboExperiences]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: visibleDestinations.length,
      'culture-heritage': 0,
      'hill-country-hiking': 0,
      'wildlife-nature': 0,
      'beaches-coast': 0,
      adventure: 0,
      'cities-local': 0,
    };

    for (const dest of visibleDestinations) {
      const cats = getDestinationCategories(dest);
      for (const c of cats) {
        counts[c] = (counts[c] || 0) + 1;
      }
    }
    return counts;
  }, [visibleDestinations]);

  const filteredDestinations = useMemo(() => {
    return visibleDestinations.filter((dest) => {
      if (activeCategory !== 'all') {
        const cats = getDestinationCategories(dest);
        if (!cats.includes(activeCategory)) {
          return false;
        }
      }
      return matchesDestinationSearch(dest, searchQuery);
    });
  }, [visibleDestinations, activeCategory, searchQuery]);

  const activeCategoryMeta =
    DESTINATION_CATEGORY_FILTERS.find((c) => c.id === activeCategory) ||
    DESTINATION_CATEGORY_FILTERS[0];

  return (
    <main>
      <PageBanner
        eyebrow={pageCopy.banner.eyebrow}
        title={pageCopy.banner.title}
      />

      <section className="section wrap">
        {/* Editorial Intro */}
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              {pageCopy.regionalSection.eyebrow}
            </div>
            <h2 className="serif">
              {pageCopy.regionalSection.headingLine1}
              <br />
              {pageCopy.regionalSection.headingLine2Prefix}{' '}
              <em style={{ color: 'var(--terracotta)' }}>
                {pageCopy.regionalSection.headingItalic}
              </em>
            </h2>
          </div>
          <p>{pageCopy.regionalSection.description}</p>
        </div>

        {/* Search & Category Discovery Bar */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid rgba(21, 91, 114, 0.14)',
            borderRadius: '14px',
            padding: '20px 22px',
            marginBottom: '28px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              marginBottom: '16px',
            }}
          >
            {/* Search Input */}
            <div
              style={{
                position: 'relative',
                flex: '1 1 300px',
                maxWidth: '520px',
              }}
            >
              <Search
                style={{
                  width: '16px',
                  height: '16px',
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search destinations, attractions, surfing, elephants, waterfalls, regions..."
                aria-label="Search Sri Lanka destinations"
                style={{
                  width: '100%',
                  padding: '10px 36px 10px 40px',
                  fontSize: '13.5px',
                  background: 'var(--paper)',
                  border: '1px solid #b9d3dd',
                  borderRadius: '999px',
                  color: 'var(--ink)',
                  outline: 'none',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search query"
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px',
                  }}
                >
                  <X style={{ width: '15px', height: '15px' }} />
                </button>
              )}
            </div>

            {/* Quick Keyword Suggestions */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: 'var(--muted)',
              }}
            >
              <span>Popular searches:</span>
              {['Surfing', 'Elephants', 'Leopards', 'UNESCO', 'Waterfalls', 'Train'].map(
                (kw) => {
                  const isKwActive =
                    searchQuery.trim().toLowerCase() === kw.toLowerCase();
                  return (
                    <button
                      key={kw}
                      type="button"
                      onClick={() =>
                        setSearchQuery(isKwActive ? '' : kw.toLowerCase())
                      }
                      style={{
                        padding: '4px 11px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        borderRadius: '999px',
                        border: '1px solid #b9d3dd',
                        background: isKwActive ? 'var(--green)' : '#ffffff',
                        color: isKwActive ? '#ffffff' : 'var(--ink)',
                        cursor: 'pointer',
                      }}
                    >
                      {kw}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="filter" style={{ marginBottom: '12px' }}>
            {DESTINATION_CATEGORY_FILTERS.map((cat) => {
              const count = categoryCounts[cat.id] ?? 0;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={isActive ? 'active' : ''}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Active Filter Context Line */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              fontSize: '12.5px',
              color: 'var(--muted)',
              paddingTop: '10px',
              borderTop: '1px solid #e1eef3',
            }}
          >
            <span>{activeCategoryMeta.description}</span>
            <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
              Showing {filteredDestinations.length} of{' '}
              {visibleDestinations.length} destinations
            </span>
          </div>
        </div>

        {/* Destination Cards Grid */}
        {filteredDestinations.length === 0 ? (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid rgba(21, 91, 114, 0.14)',
              borderRadius: '14px',
              padding: '48px 24px',
              textAlign: 'center',
            }}
          >
            <h3
              className="serif"
              style={{ fontSize: '26px', marginBottom: '8px' }}
            >
              No destinations match &ldquo;{searchQuery}&rdquo;
            </h3>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--muted)',
                maxWidth: '460px',
                margin: '0 auto 18px',
              }}
            >
              Try clearing your search term or switching to &ldquo;All
              Destinations&rdquo; to browse all {visibleDestinations.length} Sri
              Lankan destinations.
            </p>
            <button
              type="button"
              className="pill dark"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
            >
              SHOW ALL {visibleDestinations.length} DESTINATIONS
            </button>
          </div>
        ) : (
          <div className="destinations-detail-grid">
            {filteredDestinations.map((dest) => {
              const slug = resolveDestinationSlug(dest);
              const detailHref = `/destinations/${slug}`;
              const hasImage = hasValidDestinationImage(dest);
              const categories = getDestinationCategories(dest);
              const primaryCategoryLabel =
                CATEGORY_LABELS_MAP[categories[0]] || dest.regionLabel;
              const displayHighlights = (dest.highlights || []).slice(0, 3);

              return (
                <article key={dest.id} className="destination-detail-card">
                  {/* Render image ONLY if an existing CMS/R2 image is assigned */}
                  {hasImage ? (
                    <Link
                      href={detailHref}
                      prefetch={false}
                      className="dest-img-wrap"
                      style={{ display: 'block', textDecoration: 'none' }}
                    >
                      <CmsImage
                        src={dest.imageRef?.url || dest.image}
                        imageRef={dest.imageRef}
                        alt={dest.imageRef?.alt || dest.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                      />
                      <span className="dest-season-badge">{dest.season}</span>
                    </Link>
                  ) : (
                    /* Clean, minimal editorial top header when no image is assigned */
                    <div
                      style={{
                        padding: '18px 20px 14px',
                        borderBottom: '1px solid #e1eef3',
                        background: 'var(--paper)',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                      }}
                    >
                      <span
                        className="eyebrow"
                        style={{
                          color: 'var(--terracotta)',
                          marginBottom: 0,
                        }}
                      >
                        {primaryCategoryLabel.toUpperCase()}
                      </span>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          background: '#ffffff',
                          border: '1px solid #b9d3dd',
                          color: 'var(--ink)',
                        }}
                      >
                        {dest.season}
                      </span>
                    </div>
                  )}

                  <div className="dest-content">
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          marginBottom: '4px',
                        }}
                      >
                        <div
                          className="eyebrow"
                          style={{ color: 'var(--muted)' }}
                        >
                          {dest.regionLabel}
                        </div>
                        {categories.length > 1 && (
                          <span
                            style={{
                              fontSize: '10px',
                              color: 'var(--muted)',
                              letterSpacing: '0.05em',
                              textTransform: 'uppercase',
                            }}
                          >
                            {categories
                              .map((c) => CATEGORY_LABELS_MAP[c])
                              .slice(0, 2)
                              .join(' · ')}
                          </span>
                        )}
                      </div>

                      <h3 className="serif dest-name">
                        <Link
                          href={detailHref}
                          prefetch={false}
                          style={{
                            color: 'inherit',
                            textDecoration: 'none',
                          }}
                        >
                          {dest.name}
                        </Link>
                      </h3>

                      {dest.tagline && (
                        <p className="dest-tagline">{dest.tagline}</p>
                      )}
                      <p className="dest-desc">{dest.description}</p>

                      {displayHighlights.length > 0 && (
                        <div className="dest-highlights">
                          <span
                            className="eyebrow"
                            style={{ color: 'var(--terracotta)' }}
                          >
                            {pageCopy.regionalSection.highlightsHeading ||
                              'NOTABLE HIGHLIGHTS'}
                          </span>
                          <ul>
                            {displayHighlights.map((h) => (
                              <li key={h}>• {h}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div
                      className="dest-card-foot"
                      style={{ flexWrap: 'wrap', gap: '10px' }}
                    >
                      <Link
                        href={detailHref}
                        prefetch={false}
                        className="pill dark"
                      >
                        EXPLORE DESTINATION →
                      </Link>
                      <button
                        type="button"
                        className="pill"
                        onClick={() =>
                          setBookingModalItem({
                            id: dest.id,
                            name: `${dest.name} — Private Regional Discovery`,
                          })
                        }
                      >
                        {pageCopy.regionalSection.bookButtonLabel ||
                          'PLAN THIS DESTINATION ↗'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Dedicated Adventure Portfolio Section */}
        <div
          style={{
            marginTop: '64px',
            paddingTop: '48px',
            borderTop: '1px solid #d2e4eb',
          }}
        >
          <div className="section-head" style={{ marginBottom: '28px' }}>
            <div>
              <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
                VETTED OPERATORS · SEASONAL MATCHING
              </div>
              <h2 className="serif">
                Adventure across{' '}
                <em style={{ color: 'var(--terracotta)' }}>
                  island, river &amp; sea.
                </em>
              </h2>
            </div>
            <p>
              From surfing warm Indian Ocean swells in Weligama (Nov–Apr) and
              Arugam Bay (May–Oct) to white-water rafting in Kitulgala,
              paramotoring in Bentota, kite surfing in Kalpitiya, and walking
              The Pekoe Trail—we work with safety-checked local operators and
              match every activity to the right season.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
              gap: '20px',
            }}
          >
            {ADVENTURE_ACTIVITIES.map((act) => (
              <div
                key={act.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(21, 91, 114, 0.14)',
                  borderRadius: '14px',
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap',
                      marginBottom: '8px',
                    }}
                  >
                    <span
                      className="eyebrow"
                      style={{ color: 'var(--terracotta)' }}
                    >
                      {act.location}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '3px 10px',
                        borderRadius: '999px',
                        background: 'var(--paper)',
                        border: '1px solid #b9d3dd',
                        color: 'var(--ink)',
                        fontWeight: 600,
                      }}
                    >
                      {act.season}
                    </span>
                  </div>
                  <h3
                    className="serif"
                    style={{ fontSize: '22px', marginBottom: '8px' }}
                  >
                    {act.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '13.5px',
                      lineHeight: 1.65,
                      color: 'var(--muted)',
                      margin: 0,
                    }}
                  >
                    {act.description}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Link
                    href={`/destinations/${act.slug}`}
                    prefetch={false}
                    className="pill dark"
                  >
                    DESTINATION GUIDE →
                  </Link>
                  <button
                    type="button"
                    className="pill"
                    onClick={() =>
                      setBookingModalItem({
                        id: act.id,
                        name: act.title,
                      })
                    }
                  >
                    ENQUIRE →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Colombo & Battaramulla Day Experiences Section */}
        <div
          style={{
            marginTop: '64px',
            paddingTop: '48px',
            borderTop: '1px solid #d2e4eb',
          }}
        >
          <div className="section-head" style={{ marginBottom: '28px' }}>
            <div>
              <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
                {pageCopy.colomboSection.eyebrow}
              </div>
              <h2 className="serif">
                {pageCopy.colomboSection.headingPrefix}{' '}
                <em style={{ color: 'var(--terracotta)' }}>
                  {pageCopy.colomboSection.headingItalic}
                </em>
              </h2>
            </div>
            <p>{pageCopy.colomboSection.description}</p>
          </div>

          <div className="destinations-detail-grid">
            {visibleColomboExperiences.map((exp) => {
              const rawExpImg = (exp.imageRef?.url || exp.image || '').trim();
              const hasExpImg =
                rawExpImg.length > 0 && !isForbiddenImageUrl(rawExpImg);

              return (
                <article key={exp.id} className="destination-detail-card">
                  {hasExpImg ? (
                    <div className="dest-img-wrap">
                      <CmsImage
                        src={rawExpImg}
                        imageRef={exp.imageRef}
                        alt={exp.imageRef?.alt || exp.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                      />
                      <span className="dest-season-badge">{exp.duration}</span>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '18px 20px 14px',
                        borderBottom: '1px solid #e1eef3',
                        background: 'var(--paper)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span
                        className="eyebrow"
                        style={{ color: 'var(--terracotta)', marginBottom: 0 }}
                      >
                        COLOMBO &amp; BATTARAMULLA DAY EXPERIENCE
                      </span>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '999px',
                          background: '#ffffff',
                          border: '1px solid #b9d3dd',
                          color: 'var(--ink)',
                        }}
                      >
                        {exp.duration}
                      </span>
                    </div>
                  )}
                  <div className="dest-content">
                    <div>
                      <div className="eyebrow" style={{ color: 'var(--muted)' }}>
                        {exp.location}
                      </div>
                      <h3 className="serif dest-name">{exp.name}</h3>
                      <p className="dest-desc">{exp.description}</p>
                      <div className="dest-highlights">
                        <span
                          className="eyebrow"
                          style={{ color: 'var(--terracotta)' }}
                        >
                          EXPERIENCE HIGHLIGHTS
                        </span>
                        <p
                          style={{
                            fontSize: '13px',
                            color: 'var(--muted)',
                            marginTop: '6px',
                          }}
                        >
                          {exp.highlights}
                        </p>
                      </div>
                    </div>
                    <div
                      className="dest-card-foot"
                      style={{ flexWrap: 'wrap', gap: '10px' }}
                    >
                      <button
                        type="button"
                        className="pill dark"
                        onClick={() =>
                          setBookingModalItem({
                            id: exp.id,
                            name: `${exp.name} (${exp.duration})`,
                          })
                        }
                      >
                        {pageCopy.colomboSection.bookButtonLabel}
                      </button>
                      <Link
                        href={pageCopy.colomboSection.enquireButtonHref}
                        prefetch={false}
                        className="pill"
                      >
                        {pageCopy.colomboSection.enquireButtonLabel}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="dest-custom-cta-box" style={{ color: '#ffffff' }}>
          <div>
            <div className="eyebrow" style={{ color: '#a5eff4' }}>
              {pageCopy.customCtaBox.eyebrow}
            </div>
            <h3 className="serif" style={{ margin: '6px 0 8px' }}>
              {pageCopy.customCtaBox.heading}
            </h3>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
              {pageCopy.customCtaBox.description}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              href={pageCopy.customCtaBox.primaryCtaHref}
              prefetch={false}
              className="pill light"
            >
              {pageCopy.customCtaBox.primaryCtaLabel}
            </Link>
            <Link
              href={pageCopy.customCtaBox.secondaryCtaHref}
              prefetch={false}
              className="pill dark"
            >
              {pageCopy.customCtaBox.secondaryCtaLabel}
            </Link>
          </div>
        </div>
      </section>

      {/* Live Provider Booking Modal */}
      {bookingModalItem && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setBookingModalItem(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-label={`Book ${bookingModalItem.name}`}
        >
          <div className="modal-card booking-modal-wide">
            <BookingPanel
              itemId={bookingModalItem.id}
              itemName={bookingModalItem.name}
              itemType="tour"
              defaultProvider="bokun"
              onClose={() => setBookingModalItem(null)}
            />
          </div>
        </div>
      )}
    </main>
  );
}
