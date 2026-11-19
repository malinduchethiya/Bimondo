'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Clock,
  Info,
  MapPin,
  Route,
} from 'lucide-react';
import PageBanner from '@/components/PageBanner';
import CmsImage from '@/components/CmsImage';
import { useSiteCms } from '@/hooks/useSiteCms';
import { isForbiddenImageUrl } from '@/lib/content-repository';
import {
  DEFAULT_TRAVEL_GUIDES,
  findTravelGuideBySlug,
} from '@/lib/travel-guides';
import {
  SRI_LANKA_47_DESTINATIONS,
  resolveDestinationSlug,
} from '@/lib/sri-lanka-47-destinations';
import { resolveTourSlug } from '@/lib/tour-helpers';
import {
  trackBookingButtonClick,
  trackGuideView,
  trackWhatsAppClick,
} from '@/lib/analytics';

interface GuideDetailClientProps {
  slug: string;
}

export default function GuideDetailClient({ slug }: GuideDetailClientProps) {
  const { cms } = useSiteCms();

  const allGuides = useMemo(() => {
    const source =
      Array.isArray(cms.travelGuides) && cms.travelGuides.length > 0
        ? cms.travelGuides
        : DEFAULT_TRAVEL_GUIDES;
    return source.filter((g) => g.visible !== false && !g.deletedAt);
  }, [cms.travelGuides]);

  const guide = useMemo(() => {
    return (
      findTravelGuideBySlug(allGuides, slug) ||
      findTravelGuideBySlug(DEFAULT_TRAVEL_GUIDES, slug)
    );
  }, [allGuides, slug]);

  const relatedDestinations = useMemo(() => {
    if (!guide) return [];
    const pool =
      cms.destinations && cms.destinations.length > 0
        ? cms.destinations
        : SRI_LANKA_47_DESTINATIONS;
    const bySlug = new Map(
      pool
        .filter((d) => d.visible !== false && !d.deletedAt)
        .map((d) => [resolveDestinationSlug(d), d])
    );
    return (guide.relatedDestinationSlugs || [])
      .map((s) => bySlug.get(s.toLowerCase()))
      .filter((d): d is NonNullable<typeof d> => Boolean(d));
  }, [cms.destinations, guide]);

  const relatedTours = useMemo(() => {
    if (!guide) return [];
    const idSet = new Set(guide.relatedTourIds || []);
    return (cms.tours || []).filter(
      (t) => t.visible !== false && !t.deletedAt && idSet.has(t.id)
    );
  }, [cms.tours, guide]);

  const otherGuides = useMemo(() => {
    if (!guide) return [];
    return allGuides.filter((g) => g.slug !== guide.slug).slice(0, 3);
  }, [allGuides, guide]);

  useEffect(() => {
    if (!guide) return;
    trackGuideView(guide.slug, guide.title, guide.categoryLabel);
  }, [guide]);

  if (!guide) {
    return (
      <main>
        <PageBanner
          eyebrow="BIMONDO TRAVELS  /  TRAVEL GUIDES"
          title="Guide Not Found"
        />
        <section className="section wrap">
          <div
            style={{
              background: '#ffffff',
              border: '1px solid rgba(21, 91, 114, 0.14)',
              borderRadius: '14px',
              padding: '44px 24px',
              textAlign: 'center',
              maxWidth: '620px',
              margin: '0 auto',
            }}
          >
            <p style={{ color: 'var(--muted)', marginBottom: '20px' }}>
              The requested Sri Lanka travel guide could not be found.
            </p>
            <Link href="/guides" prefetch={false} className="pill dark">
              <ArrowLeft className="w-4 h-4" />
              All Travel Guides
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const imgUrl = (guide.imageRef?.url || '').trim();
  const hasImg = imgUrl.length > 0 && !isForbiddenImageUrl(imgUrl);
  const waNumber = (cms.general.whatsappNumber || '94762232054').replace(/\D/g, '');
  const whatsAppUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    `Hello Bimondo Travels, I was reading "${guide.title}" and would love to plan a private Sri Lanka itinerary.`
  )}`;

  return (
    <main>
      <PageBanner
        eyebrow={`BIMONDO TRAVELS  /  ${guide.eyebrow}`}
        title={guide.title}
      />

      <section className="section wrap" style={{ paddingTop: '28px' }}>
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
          <Link href="/" prefetch={false} className="hover:underline">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/guides" prefetch={false} className="hover:underline">
            Travel Guides
          </Link>
          <span aria-hidden="true">/</span>
          <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{guide.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Article Column */}
          <article className="lg:col-span-8 space-y-8">
            <div
              style={{
                background: '#ffffff',
                border: '1px solid rgba(21, 91, 114, 0.14)',
                borderRadius: '14px',
                padding: '26px',
              }}
            >
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    padding: '5px 12px',
                    borderRadius: '999px',
                    background: 'var(--green)',
                    color: '#ffffff',
                  }}
                >
                  {guide.categoryLabel}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '12px',
                    color: 'var(--muted)',
                    fontWeight: 600,
                  }}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {guide.readingTime}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  Updated {guide.updatedAt || guide.publishedAt}
                </span>
              </div>

              {hasImg && (
                <div
                  style={{
                    position: 'relative',
                    aspectRatio: '16 / 9',
                    width: '100%',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    marginBottom: '20px',
                    border: '1px solid #e1eef3',
                  }}
                >
                  <CmsImage
                    imageRef={guide.imageRef}
                    src={imgUrl}
                    alt={guide.imageRef?.alt || guide.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 65vw"
                    className="object-cover"
                  />
                </div>
              )}

              <p
                style={{
                  fontSize: '16px',
                  lineHeight: 1.78,
                  color: 'var(--ink)',
                  margin: 0,
                }}
              >
                {guide.intro}
              </p>

              {/* Quick Table of Contents */}
              {guide.sections.length > 1 && (
                <div
                  style={{
                    marginTop: '20px',
                    padding: '16px 18px',
                    borderRadius: '12px',
                    background: 'var(--paper)',
                    border: '1px solid #d2e4eb',
                  }}
                >
                  <div
                    className="eyebrow"
                    style={{ color: 'var(--terracotta)', fontSize: '10.5px', marginBottom: '8px' }}
                  >
                    IN THIS GUIDE
                  </div>
                  <ol
                    style={{
                      margin: 0,
                      paddingLeft: '18px',
                      display: 'grid',
                      gap: '6px',
                      fontSize: '13.5px',
                    }}
                  >
                    {guide.sections.map((sec) => (
                      <li key={sec.id}>
                        <a
                          href={`#${sec.id}`}
                          style={{ color: 'var(--green)', fontWeight: 600, textDecoration: 'none' }}
                          className="hover:underline"
                        >
                          {sec.heading}
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            {/* Article Sections */}
            {guide.sections.map((sec) => (
              <section
                key={sec.id}
                id={sec.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(21, 91, 114, 0.14)',
                  borderRadius: '14px',
                  padding: '26px',
                }}
              >
                <h2 className="serif" style={{ fontSize: '27px', margin: '0 0 14px', lineHeight: 1.25 }}>
                  {sec.heading}
                </h2>
                <div className="space-y-3.5">
                  {sec.paragraphs.map((para, pIdx) => (
                    <p
                      key={pIdx}
                      style={{
                        fontSize: '15px',
                        lineHeight: 1.76,
                        color: 'var(--ink)',
                        margin: 0,
                      }}
                    >
                      {para}
                    </p>
                  ))}
                </div>

                {sec.bullets && sec.bullets.length > 0 && (
                  <ul
                    className="space-y-2.5"
                    style={{
                      margin: '16px 0 0',
                      padding: '16px 18px',
                      listStyle: 'none',
                      borderRadius: '10px',
                      background: 'var(--paper)',
                      border: '1px solid #e1eef3',
                    }}
                  >
                    {sec.bullets.map((b, bIdx) => (
                      <li
                        key={bIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          fontSize: '13.8px',
                          lineHeight: 1.6,
                          color: 'var(--ink)',
                        }}
                      >
                        <span style={{ color: 'var(--terracotta)', fontWeight: 700 }}>•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {sec.note && (
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '13px 15px',
                      borderRadius: '10px',
                      background: 'var(--paper)',
                      border: '1px solid #d2e4eb',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      fontSize: '12.8px',
                      lineHeight: 1.6,
                      color: 'var(--muted)',
                    }}
                  >
                    <Info className="w-4 h-4 text-[#328eae] shrink-0 mt-0.5" />
                    <span>{sec.note}</span>
                  </div>
                )}
              </section>
            ))}

            {/* Destinations Mentioned in This Guide */}
            {relatedDestinations.length > 0 && (
              <section>
                <div className="mb-4">
                  <span
                    className="eyebrow"
                    style={{ color: 'var(--terracotta)', display: 'block', marginBottom: '4px' }}
                  >
                    FEATURED PLACES
                  </span>
                  <h2 className="serif" style={{ fontSize: '28px', margin: 0 }}>
                    Destinations Covered in This Guide
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedDestinations.map((dest) => {
                    const destSlug = resolveDestinationSlug(dest);
                    return (
                      <Link
                        key={dest.id}
                        href={`/destinations/${destSlug}`}
                        prefetch={false}
                        style={{
                          display: 'block',
                          background: '#ffffff',
                          border: '1px solid rgba(21, 91, 114, 0.14)',
                          borderRadius: '12px',
                          padding: '16px 18px',
                          textDecoration: 'none',
                          color: 'inherit',
                        }}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span
                            className="eyebrow"
                            style={{ color: 'var(--terracotta)', fontSize: '10px' }}
                          >
                            {dest.regionLabel}
                          </span>
                          <MapPin className="w-3.5 h-3.5 text-[#328eae]" />
                        </div>
                        <h3 className="serif" style={{ fontSize: '20px', margin: '0 0 6px' }}>
                          {dest.name}
                        </h3>
                        <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 8px', lineHeight: 1.55 }}>
                          {dest.description}
                        </p>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: 'var(--green)',
                          }}
                        >
                          Explore {dest.name} →
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
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
                style={{ color: '#a5eff4', display: 'block', marginBottom: '6px' }}
              >
                PERSONAL ROUTE PLANNING
              </span>
              <h3 className="serif" style={{ fontSize: '24px', margin: '0 0 10px' }}>
                Design Your Private Sri Lanka Journey
              </h3>
              <p
                style={{
                  fontSize: '13.5px',
                  lineHeight: 1.65,
                  opacity: 0.9,
                  margin: '0 0 18px',
                }}
              >
                Share your travel dates and preferred pace with our Battaramulla specialists for a
                personalised day-by-day proposal with vetted private transport and boutique stays.
              </p>
              <div className="space-y-2.5">
                <Link
                  href="/contact"
                  prefetch={false}
                  className="pill light"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() =>
                    trackBookingButtonClick({
                      source: 'guide_detail_sidebar',
                      itemType: 'general',
                      itemId: guide.slug,
                      itemName: guide.title,
                    })
                  }
                >
                  Request a Custom Itinerary
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pill dark"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() =>
                    trackWhatsAppClick('guide_detail_sidebar', guide.slug)
                  }
                >
                  WhatsApp Concierge ↗
                </a>
              </div>
            </div>

            {/* Related Tour Packages */}
            {relatedTours.length > 0 && (
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
                  MATCHING ROUTES
                </span>
                <h3 className="serif" style={{ fontSize: '22px', margin: '0 0 14px' }}>
                  Related Tour Packages
                </h3>
                <div className="space-y-3">
                  {relatedTours.map((tour) => (
                    <Link
                      key={tour.id}
                      href={`/packages/${resolveTourSlug(tour)}`}
                      prefetch={false}
                      style={{
                        display: 'block',
                        padding: '14px',
                        borderRadius: '10px',
                        background: 'var(--paper)',
                        border: '1px solid #e1eef3',
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          color: 'var(--terracotta)',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          marginBottom: '4px',
                        }}
                      >
                        {tour.durationLabel || `${tour.days} Days`} · {tour.categoryLabel}
                      </div>
                      <div className="serif" style={{ fontSize: '18px', marginBottom: '4px' }}>
                        {tour.name}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          color: 'var(--muted)',
                        }}
                      >
                        <Route className="w-3.5 h-3.5 shrink-0" />
                        <span>{tour.route}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* More Guides */}
            {otherGuides.length > 0 && (
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
                  KEEP READING
                </span>
                <h3 className="serif" style={{ fontSize: '22px', margin: '0 0 14px' }}>
                  More Sri Lanka Guides
                </h3>
                <div className="space-y-3">
                  {otherGuides.map((g) => (
                    <Link
                      key={g.id}
                      href={`/guides/${g.slug}`}
                      prefetch={false}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: 'var(--paper)',
                        border: '1px solid #e1eef3',
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <BookOpen className="w-4 h-4 text-[#328eae] shrink-0 mt-1" />
                      <div>
                        <div className="serif" style={{ fontSize: '16.5px', lineHeight: 1.3 }}>
                          {g.title}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '3px' }}>
                          {g.readingTime}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <div style={{ marginTop: '14px' }}>
                  <Link href="/guides" prefetch={false} className="pill" style={{ width: '100%', justifyContent: 'center' }}>
                    <ArrowLeft className="w-3.5 h-3.5" />
                    View All Travel Guides
                  </Link>
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
