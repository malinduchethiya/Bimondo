'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Compass,
  Footprints,
  Info,
  MapPin,
  Sparkles,
  Utensils,
} from 'lucide-react';
import PageBanner from '@/components/PageBanner';
import CmsImage from '@/components/CmsImage';
import BookingPanel from '@/components/booking/BookingPanel';
import { useSiteCms } from '@/hooks/useSiteCms';
import { CmsDestination, CmsTourItem } from '@/lib/cms-defaults';
import { isForbiddenImageUrl } from '@/lib/content-repository';
import {
  DESTINATION_CATEGORY_FILTERS,
  SRI_LANKA_47_DESTINATIONS,
  findDestinationBySlugOrId,
  resolveDestinationSlug,
} from '@/lib/sri-lanka-47-destinations';

interface DestinationDetailClientProps {
  slug: string;
}

const CATEGORY_LABEL_MAP: Record<string, string> = DESTINATION_CATEGORY_FILTERS.reduce(
  (acc, item) => {
    acc[item.id] = item.label;
    return acc;
  },
  {} as Record<string, string>
);

function hasValidDestinationImage(dest: CmsDestination): boolean {
  const url = (dest.imageRef?.url || dest.image || '').trim();
  return Boolean(url) && !isForbiddenImageUrl(url);
}

function splitHeadlineAndDetail(item: string): { title: string; detail: string | null } {
  const dashIdx = item.indexOf(' — ');
  if (dashIdx !== -1) {
    return {
      title: item.slice(0, dashIdx).trim(),
      detail: item.slice(dashIdx + 3).trim(),
    };
  }
  const hyphenIdx = item.indexOf(' - ');
  if (hyphenIdx !== -1 && hyphenIdx < 60) {
    return {
      title: item.slice(0, hyphenIdx).trim(),
      detail: item.slice(hyphenIdx + 3).trim(),
    };
  }
  return { title: item.trim(), detail: null };
}

export default function DestinationDetailClient({ slug }: DestinationDetailClientProps) {
  const { cms } = useSiteCms();
  const [bookingItem, setBookingItem] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const destination = useMemo(() => {
    return (
      findDestinationBySlugOrId(cms.destinations, slug) ||
      findDestinationBySlugOrId(SRI_LANKA_47_DESTINATIONS, slug)
    );
  }, [cms.destinations, slug]);

  const relatedTours = useMemo<CmsTourItem[]>(() => {
    if (!destination) return [];
    const visibleTours = (cms.tours || []).filter((t) => t.visible !== false);
    const idSet = new Set(destination.relatedTourIds || []);
    const matchedById = visibleTours.filter((t) => idSet.has(t.id));
    if (matchedById.length > 0) return matchedById;

    const destNameNorm = destination.name.toLowerCase();
    return visibleTours
      .filter(
        (t) =>
          t.route.toLowerCase().includes(destNameNorm) ||
          t.description.toLowerCase().includes(destNameNorm)
      )
      .slice(0, 3);
  }, [cms.tours, destination]);

  const nearbyOrCategoryPeers = useMemo<CmsDestination[]>(() => {
    if (!destination) return [];
    const primaryCat = destination.categories?.[0];
    return (cms.destinations || [])
      .filter(
        (d) =>
          d.visible !== false &&
          d.id !== destination.id &&
          (d.region === destination.region ||
            (primaryCat && (d.categories || []).includes(primaryCat)))
      )
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .slice(0, 4);
  }, [cms.destinations, destination]);

  const openEnquiryForDestination = (tourTitle?: string) => {
    setBookingItem({
      id: destination?.id || slug,
      name:
        tourTitle ||
        `Private Sri Lanka Journey — Including ${destination?.name || 'Destination'}`,
    });
  };

  if (!destination) {
    return (
      <main>
        <PageBanner
          eyebrow="BIMONDO TRAVELS  /  DESTINATION GUIDE"
          title="Destination Not Found"
        />
        <section className="section wrap">
          <div
            style={{
              background: '#ffffff',
              border: '1px solid rgba(21, 91, 114, 0.14)',
              borderRadius: '14px',
              padding: '48px 24px',
              textAlign: 'center',
              maxWidth: '640px',
              margin: '0 auto',
            }}
          >
            <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>
              The requested Sri Lanka destination guide could not be located. Browse our complete
              47-destination directory to continue planning your journey.
            </p>
            <Link href="/destinations" className="pill dark">
              <ArrowLeft className="w-4 h-4" />
              All 47 Destinations
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const hasImage = hasValidDestinationImage(destination);
  const thingsToSee =
    destination.thingsToSee && destination.thingsToSee.length > 0
      ? destination.thingsToSee
      : destination.highlights || [];
  const thingsToDo = destination.thingsToDo || [];
  const hikingTrails = destination.hikingTrails || [];
  const seasonalActivities = destination.seasonalActivities || [];
  const festivals = destination.festivals || [];
  const diningOptions =
    destination.showDiningSection !== false ? destination.diningOptions || [] : [];
  const specialConsiderations = destination.specialConsiderations || [];

  const navSections = [
    { id: 'overview', label: 'Overview', show: true },
    { id: 'things-to-see', label: 'Things to See', show: thingsToSee.length > 0 },
    { id: 'things-to-do', label: 'Things to Do', show: thingsToDo.length > 0 },
    { id: 'hiking-trails', label: 'Hiking & Trails', show: hikingTrails.length > 0 },
    {
      id: 'seasonal-guide',
      label: 'Best Time & Season',
      show: Boolean(destination.season) || seasonalActivities.length > 0,
    },
    { id: 'festivals', label: 'Local Festivals', show: festivals.length > 0 },
    { id: 'dining', label: 'Dining Guide', show: diningOptions.length > 0 },
    {
      id: 'visitor-considerations',
      label: 'Visitor Tips',
      show: specialConsiderations.length > 0,
    },
    { id: 'related-journeys', label: 'Related Journeys', show: true },
  ].filter((s) => s.show);

  return (
    <main>
      <PageBanner
        eyebrow={`BIMONDO TRAVELS  /  ${(
          destination.regionLabel || destination.region
        ).toUpperCase()}`}
        title={destination.name}
      />

      {/* Top Breadcrumb & Introduction Section */}
      <section className="section wrap" style={{ paddingTop: '28px', paddingBottom: '28px' }}>
        <nav
          aria-label="Breadcrumb"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: 'var(--muted)',
            marginBottom: '24px',
          }}
        >
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <span>/</span>
          <Link href="/destinations" className="hover:underline">
            Destinations
          </Link>
          <span>/</span>
          <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{destination.name}</span>
        </nav>

        <div
          className={`grid grid-cols-1 ${
            hasImage ? 'lg:grid-cols-12 gap-8 items-start' : 'max-w-4xl'
          }`}
        >
          <div className={hasImage ? 'lg:col-span-7' : ''}>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  padding: '5px 12px',
                  borderRadius: '999px',
                  background: 'var(--green)',
                  color: '#ffffff',
                }}
              >
                {destination.regionLabel || destination.region}
              </span>
              {(destination.categories || []).map((catId) => (
                <span
                  key={catId}
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '5px 12px',
                    borderRadius: '999px',
                    background: '#ffffff',
                    border: '1px solid #b9d3dd',
                    color: 'var(--ink)',
                  }}
                >
                  {CATEGORY_LABEL_MAP[catId] || catId}
                </span>
              ))}
              {destination.season && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '5px 12px',
                    borderRadius: '999px',
                    background: 'var(--paper)',
                    border: '1px solid #b9d3dd',
                    color: 'var(--terracotta)',
                  }}
                >
                  Best Season: {destination.season}
                </span>
              )}
            </div>

            {destination.tagline && (
              <p
                className="serif"
                style={{
                  fontSize: '22px',
                  fontStyle: 'italic',
                  color: 'var(--terracotta)',
                  marginBottom: '14px',
                }}
              >
                {destination.tagline}
              </p>
            )}

            <p
              style={{
                fontSize: '15.5px',
                lineHeight: 1.72,
                color: 'var(--ink)',
                marginBottom: '14px',
              }}
            >
              {destination.overview || destination.description}
            </p>

            {destination.overview &&
              destination.description &&
              destination.overview !== destination.description && (
                <p
                  style={{
                    fontSize: '14.5px',
                    lineHeight: 1.68,
                    color: 'var(--muted)',
                    marginBottom: '22px',
                  }}
                >
                  {destination.description}
                </p>
              )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => openEnquiryForDestination()}
                className="pill dark"
              >
                Include {destination.name} in Your Journey
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <Link href="/destinations" className="pill">
                <ArrowLeft className="w-3.5 h-3.5" />
                All 47 Destinations
              </Link>
            </div>
          </div>

          {/* Assigned CMS Image — strictly rendered only when an image exists */}
          {hasImage && (
            <div className="lg:col-span-5">
              <div
                style={{
                  position: 'relative',
                  aspectRatio: '4 / 3',
                  width: '100%',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  border: '1px solid rgba(21, 91, 114, 0.14)',
                }}
              >
                <CmsImage
                  imageRef={destination.imageRef}
                  src={destination.imageRef?.url || destination.image}
                  alt={destination.imageRef?.alt || destination.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Quick Anchor Navigation Bar */}
      <div
        style={{
          background: '#ffffff',
          borderTop: '1px solid #d2e4eb',
          borderBottom: '1px solid #d2e4eb',
        }}
      >
        <div className="wrap overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-6 py-3.5 min-w-max">
            {navSections.map((sec) => (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--ink)',
                  whiteSpace: 'nowrap',
                }}
              >
                {sec.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Main Structured Destination Guide Layout */}
      <section className="section wrap" style={{ paddingTop: '36px' }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Primary Editorial Column */}
          <div className="lg:col-span-8 space-y-12">
            {/* 1. Overview & Quick Highlights */}
            <section id="overview">
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(21, 91, 114, 0.14)',
                  borderRadius: '14px',
                  padding: '24px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #e1eef3',
                    paddingBottom: '14px',
                    marginBottom: '18px',
                  }}
                >
                  <div>
                    <span
                      className="eyebrow"
                      style={{ color: 'var(--terracotta)', display: 'block', marginBottom: '4px' }}
                    >
                      DESTINATION SNAPSHOT
                    </span>
                    <h2 className="serif" style={{ fontSize: '26px', margin: 0 }}>
                      Key Highlights at a Glance
                    </h2>
                  </div>
                  <Compass className="w-5 h-5 text-[#328eae] shrink-0" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {(destination.highlights || thingsToSee.slice(0, 4)).map((item, idx) => {
                    const parsed = splitHeadlineAndDetail(item);
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: '1px solid #e1eef3',
                          background: 'var(--paper)',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'var(--terracotta)',
                            marginTop: '2px',
                          }}
                        >
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '13.5px', margin: 0 }}>
                            {parsed.title}
                          </p>
                          {parsed.detail && (
                            <p
                              style={{
                                fontSize: '12.5px',
                                color: 'var(--muted)',
                                margin: '4px 0 0',
                                lineHeight: 1.55,
                              }}
                            >
                              {parsed.detail}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* 2. Things to See */}
            {thingsToSee.length > 0 && (
              <section id="things-to-see">
                <div className="mb-5">
                  <span
                    className="eyebrow"
                    style={{ color: 'var(--terracotta)', display: 'block', marginBottom: '4px' }}
                  >
                    LANDMARKS & ATTRACTIONS
                  </span>
                  <h2 className="serif" style={{ fontSize: '30px', margin: 0 }}>
                    Things to See in {destination.name}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {thingsToSee.map((item, idx) => {
                    const parsed = splitHeadlineAndDetail(item);
                    return (
                      <div
                        key={idx}
                        style={{
                          background: '#ffffff',
                          border: '1px solid rgba(21, 91, 114, 0.14)',
                          borderRadius: '12px',
                          padding: '18px 20px',
                        }}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className="eyebrow"
                            style={{ color: 'var(--terracotta)', fontSize: '10px' }}
                          >
                            ATTRACTION {String(idx + 1).padStart(2, '0')}
                          </span>
                          <MapPin className="w-3.5 h-3.5 text-[#607d8b]" />
                        </div>
                        <h3 className="serif" style={{ fontSize: '19px', margin: '0 0 6px' }}>
                          {parsed.title}
                        </h3>
                        {parsed.detail && (
                          <p
                            style={{
                              fontSize: '13.5px',
                              color: 'var(--muted)',
                              margin: 0,
                              lineHeight: 1.6,
                            }}
                          >
                            {parsed.detail}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 3. Things to Do */}
            {thingsToDo.length > 0 && (
              <section id="things-to-do">
                <div className="mb-5">
                  <span
                    className="eyebrow"
                    style={{ color: 'var(--terracotta)', display: 'block', marginBottom: '4px' }}
                  >
                    CURATED EXPERIENCES
                  </span>
                  <h2 className="serif" style={{ fontSize: '30px', margin: 0 }}>
                    Things to Do &amp; Local Experiences
                  </h2>
                </div>

                <div className="space-y-3">
                  {thingsToDo.map((item, idx) => {
                    const parsed = splitHeadlineAndDetail(item);
                    return (
                      <div
                        key={idx}
                        style={{
                          background: '#ffffff',
                          border: '1px solid rgba(21, 91, 114, 0.14)',
                          borderRadius: '12px',
                          padding: '18px 20px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '14px',
                        }}
                      >
                        <Sparkles className="w-4 h-4 text-[#328eae] shrink-0 mt-1" />
                        <div>
                          <h3 style={{ fontWeight: 600, fontSize: '15.5px', margin: 0 }}>
                            {parsed.title}
                          </h3>
                          {parsed.detail && (
                            <p
                              style={{
                                fontSize: '13.5px',
                                color: 'var(--muted)',
                                margin: '4px 0 0',
                                lineHeight: 1.6,
                              }}
                            >
                              {parsed.detail}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 4. Hiking & Trails */}
            {hikingTrails.length > 0 && (
              <section id="hiking-trails">
                <div className="mb-5">
                  <span
                    className="eyebrow"
                    style={{ color: 'var(--terracotta)', display: 'block', marginBottom: '4px' }}
                  >
                    WALKING & TREKKING ROUTES
                  </span>
                  <h2 className="serif" style={{ fontSize: '30px', margin: 0 }}>
                    Hiking Trails &amp; Nature Walks
                  </h2>
                </div>

                <div className="space-y-3">
                  {hikingTrails.map((trail, idx) => {
                    const parsed = splitHeadlineAndDetail(trail);
                    return (
                      <div
                        key={idx}
                        style={{
                          background: '#ffffff',
                          border: '1px solid rgba(21, 91, 114, 0.14)',
                          borderRadius: '12px',
                          padding: '18px 20px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '14px',
                        }}
                      >
                        <Footprints className="w-5 h-5 text-[#328eae] shrink-0 mt-0.5" />
                        <div>
                          <h3 className="serif" style={{ fontSize: '19px', margin: 0 }}>
                            {parsed.title}
                          </h3>
                          {parsed.detail && (
                            <p
                              style={{
                                fontSize: '13.5px',
                                color: 'var(--muted)',
                                margin: '4px 0 0',
                                lineHeight: 1.6,
                              }}
                            >
                              {parsed.detail}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 5. Best Time & Seasonal Experiences */}
            {(destination.season || seasonalActivities.length > 0) && (
              <section id="seasonal-guide">
                <div className="mb-5">
                  <span
                    className="eyebrow"
                    style={{ color: 'var(--terracotta)', display: 'block', marginBottom: '4px' }}
                  >
                    CLIMATE & TIMING
                  </span>
                  <h2 className="serif" style={{ fontSize: '30px', margin: 0 }}>
                    Best Time &amp; Seasonal Experiences
                  </h2>
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid rgba(21, 91, 114, 0.14)',
                    borderRadius: '12px',
                    padding: '22px',
                  }}
                >
                  {destination.season && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        paddingBottom: '14px',
                        marginBottom: '14px',
                        borderBottom: '1px solid #e1eef3',
                      }}
                    >
                      <Calendar className="w-5 h-5 text-[#328eae]" />
                      <div>
                        <span
                          className="eyebrow"
                          style={{ color: 'var(--muted)', fontSize: '10px', display: 'block' }}
                        >
                          RECOMMENDED SEASONAL WINDOW
                        </span>
                        <p className="serif" style={{ fontSize: '19px', margin: 0 }}>
                          {destination.season}
                        </p>
                      </div>
                    </div>
                  )}

                  {seasonalActivities.length > 0 && (
                    <ul className="space-y-2.5" style={{ paddingLeft: 0, listStyle: 'none', margin: '0 0 14px' }}>
                      {seasonalActivities.map((act, idx) => (
                        <li
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            fontSize: '13.5px',
                            lineHeight: 1.6,
                            color: 'var(--ink)',
                          }}
                        >
                          <span style={{ color: 'var(--terracotta)', fontWeight: 700 }}>•</span>
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--muted)',
                      paddingTop: '12px',
                      margin: 0,
                      borderTop: '1px solid #e1eef3',
                      lineHeight: 1.55,
                    }}
                  >
                    Seasonal note: Weather patterns, ocean conditions, and wildlife movements across
                    Sri Lanka vary naturally throughout the year. Our travel specialists tailor
                    daily routing and departure times to current regional conditions.
                  </p>
                </div>
              </section>
            )}

            {/* 6. Local Festivals */}
            {festivals.length > 0 && (
              <section id="festivals">
                <div className="mb-5">
                  <span
                    className="eyebrow"
                    style={{ color: 'var(--terracotta)', display: 'block', marginBottom: '4px' }}
                  >
                    CULTURAL CALENDAR
                  </span>
                  <h2 className="serif" style={{ fontSize: '30px', margin: 0 }}>
                    Local Festivals &amp; Cultural Events
                  </h2>
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid rgba(21, 91, 114, 0.14)',
                    borderRadius: '12px',
                    padding: '22px',
                  }}
                >
                  <div className="space-y-4">
                    {festivals.map((fest, idx) => {
                      const parsed = splitHeadlineAndDetail(fest);
                      return (
                        <div
                          key={idx}
                          style={{
                            paddingBottom: idx < festivals.length - 1 ? '14px' : 0,
                            borderBottom:
                              idx < festivals.length - 1 ? '1px solid #e1eef3' : 'none',
                          }}
                        >
                          <h3 className="serif" style={{ fontSize: '19px', margin: 0 }}>
                            {parsed.title}
                          </h3>
                          {parsed.detail && (
                            <p
                              style={{
                                fontSize: '13.5px',
                                color: 'var(--muted)',
                                margin: '4px 0 0',
                                lineHeight: 1.6,
                              }}
                            >
                              {parsed.detail}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--muted)',
                      paddingTop: '12px',
                      marginTop: '14px',
                      marginBottom: 0,
                      borderTop: '1px solid #e1eef3',
                      lineHeight: 1.55,
                    }}
                  >
                    Festival dates in Sri Lanka often follow the lunar and Poya calendar and shift
                    annually. Confirm exact procession or festival dates when planning your itinerary.
                  </p>
                </div>
              </section>
            )}

            {/* 7. Dining Suggestions */}
            {diningOptions.length > 0 && (
              <section id="dining">
                <div className="mb-5">
                  <span
                    className="eyebrow"
                    style={{ color: 'var(--terracotta)', display: 'block', marginBottom: '4px' }}
                  >
                    LOCAL DINING REFERENCE
                  </span>
                  <h2 className="serif" style={{ fontSize: '30px', margin: 0 }}>
                    Suggested Places to Eat
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {diningOptions.map((dining, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: '#ffffff',
                        border: '1px solid rgba(21, 91, 114, 0.14)',
                        borderRadius: '12px',
                        padding: '18px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="serif" style={{ fontSize: '19px', margin: 0 }}>
                            {dining.name}
                          </h3>
                          <Utensils className="w-4 h-4 text-[#328eae] shrink-0 mt-1" />
                        </div>
                        {dining.cuisine && (
                          <p
                            className="eyebrow"
                            style={{ color: 'var(--terracotta)', fontSize: '10px', marginBottom: '8px' }}
                          >
                            {dining.cuisine}
                          </p>
                        )}
                        {dining.notes && (
                          <p
                            style={{
                              fontSize: '13.5px',
                              color: 'var(--muted)',
                              lineHeight: 1.6,
                              margin: '0 0 10px',
                            }}
                          >
                            {dining.notes}
                          </p>
                        )}
                      </div>
                      {dining.contact && (
                        <p
                          style={{
                            fontSize: '12px',
                            color: 'var(--ink)',
                            paddingTop: '10px',
                            margin: 0,
                            borderTop: '1px solid #e1eef3',
                          }}
                        >
                          {dining.contact}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <p
                  style={{
                    fontSize: '12px',
                    color: 'var(--muted)',
                    background: 'var(--paper)',
                    border: '1px solid #d2e4eb',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    margin: 0,
                    lineHeight: 1.55,
                  }}
                >
                  Dining note: Restaurants listed above are compiled from our regional Sri Lanka
                  travel reference guide for visitor convenience. Opening hours, menus, and contact
                  details may change and should be verified locally prior to visiting; listings do
                  not represent official Bimondo Travels commercial partnerships unless explicitly
                  noted.
                </p>
              </section>
            )}

            {/* 8. Special Visitor Considerations */}
            {specialConsiderations.length > 0 && (
              <section id="visitor-considerations">
                <div className="mb-5">
                  <span
                    className="eyebrow"
                    style={{ color: 'var(--terracotta)', display: 'block', marginBottom: '4px' }}
                  >
                    ETIQUETTE, SAFETY & PRACTICAL ADVICE
                  </span>
                  <h2 className="serif" style={{ fontSize: '30px', margin: 0 }}>
                    Special Visitor Considerations
                  </h2>
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid rgba(21, 91, 114, 0.14)',
                    borderRadius: '12px',
                    padding: '22px',
                  }}
                >
                  <div className="space-y-3">
                    {specialConsiderations.map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Info className="w-4 h-4 text-[#328eae] shrink-0 mt-1" />
                        <p
                          style={{
                            fontSize: '13.5px',
                            color: 'var(--ink)',
                            margin: 0,
                            lineHeight: 1.65,
                          }}
                        >
                          {tip}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Right Planning & Related Journeys Column */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Tailor-Made Journey Enquiry Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0d3b4f 0%, #17647a 100%)',
                borderRadius: '14px',
                padding: '24px',
                color: '#ffffff',
              }}
            >
              <span
                className="eyebrow"
                style={{ color: '#a5eff4', display: 'block', marginBottom: '8px' }}
              >
                BESPOKE SRI LANKA ITINERARIES
              </span>
              <h3 className="serif" style={{ fontSize: '25px', margin: '0 0 10px' }}>
                Include {destination.name} in Your Private Journey
              </h3>
              <p
                style={{
                  fontSize: '13.5px',
                  lineHeight: 1.65,
                  opacity: 0.9,
                  margin: '0 0 20px',
                }}
              >
                Every Bimondo Travels itinerary is privately chauffeured and tailored around your
                preferred pace, boutique stays, and seasonal windows across {destination.name} and
                neighboring regions.
              </p>
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => openEnquiryForDestination()}
                  className="pill light"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Plan a Journey with {destination.name}
                  <ArrowUpRight className="w-4 h-4" />
                </button>
                <Link
                  href={`/contact?destination=${encodeURIComponent(destination.name)}`}
                  className="pill dark"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Speak with a Travel Specialist
                </Link>
              </div>
            </div>

            {/* 9. Related Tours & Curated Journeys */}
            <div
              id="related-journeys"
              style={{
                background: '#ffffff',
                border: '1px solid rgba(21, 91, 114, 0.14)',
                borderRadius: '14px',
                padding: '22px',
              }}
            >
              <span
                className="eyebrow"
                style={{ color: 'var(--terracotta)', display: 'block', marginBottom: '4px' }}
              >
                SIGNATURE ROUTES
              </span>
              <h3 className="serif" style={{ fontSize: '23px', margin: '0 0 14px' }}>
                Related Tours &amp; Journeys
              </h3>

              {relatedTours.length > 0 ? (
                <div className="space-y-3.5">
                  {relatedTours.map((tour) => (
                    <div
                      key={tour.id}
                      style={{
                        border: '1px solid #e1eef3',
                        borderRadius: '10px',
                        background: 'var(--paper)',
                        padding: '14px',
                      }}
                    >
                      <div
                        className="eyebrow"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          color: 'var(--terracotta)',
                          fontSize: '10px',
                          marginBottom: '4px',
                        }}
                      >
                        <span>{tour.durationLabel || `${tour.days} Days`}</span>
                        <span>{tour.categoryLabel}</span>
                      </div>
                      <h4 className="serif" style={{ fontSize: '18px', margin: '0 0 4px' }}>
                        {tour.name}
                      </h4>
                      <p
                        style={{
                          fontSize: '12px',
                          color: 'var(--muted)',
                          margin: '0 0 6px',
                          fontWeight: 500,
                        }}
                      >
                        {tour.route}
                      </p>
                      <p
                        style={{
                          fontSize: '12.5px',
                          color: 'var(--ink)',
                          margin: '0 0 10px',
                          lineHeight: 1.5,
                        }}
                      >
                        {tour.description}
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingTop: '10px',
                          borderTop: '1px solid #e1eef3',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => openEnquiryForDestination(tour.name)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            padding: 0,
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: 'var(--green)',
                          }}
                        >
                          Enquire This Route →
                        </button>
                        <Link
                          href="/packages"
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--muted)',
                          }}
                        >
                          View Packages
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '13.5px', color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
                  {destination.name} can be seamlessly integrated into any custom private Sri Lanka
                  circuit. Use the enquiry button above to request a tailored route.
                </p>
              )}
            </div>

            {/* Nearby & Same-Category Destinations */}
            {nearbyOrCategoryPeers.length > 0 && (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(21, 91, 114, 0.14)',
                  borderRadius: '14px',
                  padding: '22px',
                }}
              >
                <span
                  className="eyebrow"
                  style={{ color: 'var(--terracotta)', display: 'block', marginBottom: '4px' }}
                >
                  CONTINUE EXPLORING
                </span>
                <h3 className="serif" style={{ fontSize: '21px', margin: '0 0 12px' }}>
                  Pair {destination.name} With
                </h3>
                <div className="space-y-2.5">
                  {nearbyOrCategoryPeers.map((peer) => {
                    const peerSlug = resolveDestinationSlug(peer);
                    return (
                      <Link
                        key={peer.id}
                        href={`/destinations/${peerSlug}`}
                        style={{
                          display: 'block',
                          border: '1px solid #e1eef3',
                          borderRadius: '10px',
                          background: 'var(--paper)',
                          padding: '12px 14px',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="serif" style={{ fontSize: '17px', color: 'var(--ink)' }}>
                            {peer.name}
                          </span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-[#607d8b]" />
                        </div>
                        <p
                          style={{
                            fontSize: '11px',
                            color: 'var(--muted)',
                            margin: '2px 0 0',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                          }}
                        >
                          {peer.regionLabel || peer.region}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>

      {bookingItem && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setBookingItem(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-label={`Plan journey including ${destination.name}`}
        >
          <div className="modal-card booking-modal-wide">
            <BookingPanel
              itemId={bookingItem.id}
              itemName={bookingItem.name}
              itemType="tour"
              defaultProvider="bokun"
              onClose={() => setBookingItem(null)}
            />
          </div>
        </div>
      )}
    </main>
  );
}
