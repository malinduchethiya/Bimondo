'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Compass,
  HelpCircle,
  MapPin,
  Route,
  Sparkles,
  XCircle,
} from 'lucide-react';
import PageBanner from '@/components/PageBanner';
import CmsImage from '@/components/CmsImage';
import BookingPanel from '@/components/booking/BookingPanel';
import { useSiteCms } from '@/hooks/useSiteCms';
import { CmsTourItem, createImageRef } from '@/lib/cms-defaults';
import { isForbiddenImageUrl } from '@/lib/content-repository';
import { TOUR_QUALIFICATION_NOTICE, TOURS } from '@/lib/tours';
import {
  findTourBySlugOrId,
  getRelatedDestinationsForTour,
  resolveTourSlug,
} from '@/lib/tour-helpers';
import {
  SRI_LANKA_47_DESTINATIONS,
  resolveDestinationSlug,
} from '@/lib/sri-lanka-47-destinations';
import {
  trackBookingButtonClick,
  trackTourPackageView,
  trackWhatsAppClick,
} from '@/lib/analytics';

interface PackageDetailClientProps {
  slug: string;
}

function hasValidImage(tour: CmsTourItem): boolean {
  const url = (tour.imageRef?.url || tour.image || '').trim();
  return url.length > 0 && !isForbiddenImageUrl(url);
}

export default function PackageDetailClient({ slug }: PackageDetailClientProps) {
  const { cms } = useSiteCms();
  const [showBookingModal, setShowBookingModal] = useState(false);

  const tour = useMemo<CmsTourItem | undefined>(() => {
    const fromCms = findTourBySlugOrId(cms.tours || [], slug);
    if (fromCms) return fromCms;
    const fromStatic = findTourBySlugOrId(TOURS, slug);
    if (!fromStatic) return undefined;
    return {
      ...fromStatic,
      imageRef: createImageRef(fromStatic.image, fromStatic.name),
      visible: true,
    };
  }, [cms.tours, slug]);

  const relatedDestinations = useMemo(() => {
    if (!tour) return [];
    const pool =
      cms.destinations && cms.destinations.length > 0
        ? cms.destinations
        : SRI_LANKA_47_DESTINATIONS;
    return getRelatedDestinationsForTour(tour, pool);
  }, [cms.destinations, tour]);

  const relatedGuides = useMemo(() => {
    if (!tour) return [];
    const guides = (cms.travelGuides || []).filter(
      (g) => g.visible !== false && !g.deletedAt
    );
    const byId = guides.filter((g) => (g.relatedTourIds || []).includes(tour.id));
    if (byId.length > 0) return byId.slice(0, 3);
    const destSlugs = new Set(
      relatedDestinations.map((d) => resolveDestinationSlug(d))
    );
    return guides
      .filter((g) =>
        (g.relatedDestinationSlugs || []).some((s) => destSlugs.has(s))
      )
      .slice(0, 3);
  }, [cms.travelGuides, tour, relatedDestinations]);

  const peerTours = useMemo(() => {
    if (!tour) return [];
    return (cms.tours || [])
      .filter(
        (t) =>
          t.visible !== false &&
          !t.deletedAt &&
          t.id !== tour.id &&
          t.category === tour.category
      )
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .slice(0, 3);
  }, [cms.tours, tour]);

  useEffect(() => {
    if (!tour) return;
    trackTourPackageView(
      resolveTourSlug(tour),
      tour.name,
      tour.categoryLabel,
      tour.days
    );
  }, [tour]);

  if (!tour) {
    return (
      <main>
        <PageBanner
          eyebrow="BIMONDO TRAVELS  /  SIGNATURE JOURNEYS"
          title="Tour Package Not Found"
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
              The requested Sri Lanka tour package could not be located. Browse our complete
              collection of private signature journeys to continue planning.
            </p>
            <Link href="/packages" prefetch={false} className="pill dark">
              <ArrowLeft className="w-4 h-4" />
              All Tour Packages
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const durationText = tour.durationLabel || `${tour.days} Days`;
  const hasImg = hasValidImage(tour);
  const waNumber = (cms.general.whatsappNumber || '94762232054').replace(/\D/g, '');
  const whatsAppUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    `Hello Bimondo Travels, I would like to enquire about the ${tour.name} (${durationText}) private tour.`
  )}`;

  const highlightsList = Array.isArray(tour.highlights)
    ? tour.highlights
    : (tour.highlights || '')
        .split(/[·,;\n]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 3);

  const itineraryItems = Array.isArray(tour.itinerary)
    ? tour.itinerary.filter(Boolean)
    : [];
  const includedItems = Array.isArray(tour.included)
    ? tour.included.filter(Boolean)
    : [];
  const excludedItems = Array.isArray(tour.excluded)
    ? tour.excluded.filter(Boolean)
    : [];
  const activityItems = Array.isArray(tour.activities)
    ? tour.activities.filter(Boolean)
    : [];
  const faqItems = Array.isArray(tour.faq)
    ? tour.faq.filter((f) => f.q && f.a)
    : [];

  return (
    <main>
      <PageBanner
        eyebrow={`BIMONDO TRAVELS  /  ${tour.categoryLabel.toUpperCase()}`}
        title={tour.name}
      />

      {/* Breadcrumb & Hero Overview */}
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
          <Link href="/" prefetch={false} className="hover:underline">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/packages" prefetch={false} className="hover:underline">
            Tour Packages
          </Link>
          <span aria-hidden="true">/</span>
          <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{tour.name}</span>
        </nav>

        <div
          className={`grid grid-cols-1 ${
            hasImg ? 'lg:grid-cols-12 gap-8 items-start' : 'max-w-4xl'
          }`}
        >
          <div className={hasImg ? 'lg:col-span-7' : ''}>
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
                {durationText}
              </span>
              <span
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
                {tour.categoryLabel}
              </span>
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
                Private Tailor-Made Journey
              </span>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--ink)',
                marginBottom: '14px',
              }}
            >
              <Route className="w-4 h-4 text-[#328eae] shrink-0" />
              <span>Route: {tour.route}</span>
            </div>

            <p
              style={{
                fontSize: '15.5px',
                lineHeight: 1.75,
                color: 'var(--ink)',
                marginBottom: '16px',
              }}
            >
              {tour.overview || tour.description}
            </p>

            {tour.overview && tour.overview !== tour.description && (
              <p
                style={{
                  fontSize: '14.5px',
                  lineHeight: 1.7,
                  color: 'var(--muted)',
                  marginBottom: '18px',
                }}
              >
                {tour.description}
              </p>
            )}

            <div
              style={{
                padding: '13px 16px',
                marginBottom: '20px',
                borderRadius: '12px',
                border: '1px solid var(--line)',
                background: 'rgba(255, 255, 255, 0.78)',
                fontSize: '12.5px',
                lineHeight: 1.6,
                color: 'var(--muted)',
              }}
            >
              <strong style={{ color: 'var(--ink)' }}>Sample Itinerary Notice:</strong>{' '}
              {TOUR_QUALIFICATION_NOTICE}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="pill dark"
                onClick={() => {
                  trackBookingButtonClick({
                    source: 'package_detail_hero',
                    itemType: 'tour',
                    itemId: tour.id,
                    itemName: tour.name,
                  });
                  setShowBookingModal(true);
                }}
              >
                Check Availability &amp; Enquire
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="pill"
                onClick={() =>
                  trackWhatsAppClick('package_detail_hero', tour.name)
                }
              >
                WhatsApp Specialist ↗
              </a>
              <Link href="/packages" prefetch={false} className="pill">
                <ArrowLeft className="w-3.5 h-3.5" />
                All 20 Packages
              </Link>
            </div>
          </div>

          {hasImg && (
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
                  imageRef={tour.imageRef}
                  src={tour.imageRef?.url || tour.image}
                  alt={tour.imageRef?.alt || tour.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content + Booking Sidebar */}
      <section className="section wrap" style={{ paddingTop: '12px' }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-10">
            {/* Key Highlights */}
            <section
              style={{
                background: '#ffffff',
                border: '1px solid rgba(21, 91, 114, 0.14)',
                borderRadius: '14px',
                padding: '24px',
              }}
            >
              <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-[#e1eef3]">
                <div>
                  <span
                    className="eyebrow"
                    style={{ color: 'var(--terracotta)', display: 'block', marginBottom: '4px' }}
                  >
                    JOURNEY HIGHLIGHTS
                  </span>
                  <h2 className="serif" style={{ fontSize: '26px', margin: 0 }}>
                    What Defines This Route
                  </h2>
                </div>
                <Sparkles className="w-5 h-5 text-[#328eae] shrink-0" />
              </div>

              <p
                style={{
                  fontSize: '14.5px',
                  lineHeight: 1.72,
                  color: 'var(--ink)',
                  marginBottom: highlightsList.length > 1 ? '16px' : 0,
                }}
              >
                {tour.highlights}
              </p>

              {highlightsList.length > 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {highlightsList.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '11px 14px',
                        borderRadius: '10px',
                        background: 'var(--paper)',
                        border: '1px solid #e1eef3',
                        fontSize: '13.5px',
                        color: 'var(--ink)',
                        lineHeight: 1.5,
                      }}
                    >
                      <span style={{ color: 'var(--terracotta)', fontWeight: 700 }}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Optional CMS Day-by-Day Itinerary (strictly rendered only if provided in CMS) */}
            {itineraryItems.length > 0 && (
              <section
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(21, 91, 114, 0.14)',
                  borderRadius: '14px',
                  padding: '24px',
                }}
              >
                <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-[#e1eef3]">
                  <div>
                    <span
                      className="eyebrow"
                      style={{ color: 'var(--terracotta)', display: 'block', marginBottom: '4px' }}
                    >
                      SUGGESTED FLOW
                    </span>
                    <h2 className="serif" style={{ fontSize: '26px', margin: 0 }}>
                      Outline Itinerary
                    </h2>
                  </div>
                  <Calendar className="w-5 h-5 text-[#328eae] shrink-0" />
                </div>
                <ol className="space-y-3" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {itineraryItems.map((line, idx) => (
                    <li
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: 'var(--paper)',
                        border: '1px solid #e1eef3',
                        fontSize: '14px',
                        lineHeight: 1.6,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          color: 'var(--terracotta)',
                          fontSize: '12px',
                          whiteSpace: 'nowrap',
                          marginTop: '2px',
                        }}
                      >
                        DAY {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Optional CMS Activities */}
            {activityItems.length > 0 && (
              <section
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(21, 91, 114, 0.14)',
                  borderRadius: '14px',
                  padding: '24px',
                }}
              >
                <span
                  className="eyebrow"
                  style={{ color: 'var(--terracotta)', display: 'block', marginBottom: '4px' }}
                >
                  KEY EXPERIENCES
                </span>
                <h2 className="serif" style={{ fontSize: '26px', margin: '0 0 14px' }}>
                  Featured Activities
                </h2>
                <ul className="space-y-2" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {activityItems.map((act, idx) => (
                    <li
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        fontSize: '14px',
                        lineHeight: 1.6,
                      }}
                    >
                      <Compass className="w-4 h-4 text-[#328eae] shrink-0 mt-1" />
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Optional CMS Inclusions & Exclusions (only shown when explicitly populated in CMS) */}
            {(includedItems.length > 0 || excludedItems.length > 0) && (
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {includedItems.length > 0 && (
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid rgba(21, 91, 114, 0.14)',
                      borderRadius: '14px',
                      padding: '20px',
                    }}
                  >
                    <h2 className="serif" style={{ fontSize: '22px', margin: '0 0 12px' }}>
                      What&apos;s Included
                    </h2>
                    <ul className="space-y-2" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {includedItems.map((item, idx) => (
                        <li
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            fontSize: '13.5px',
                            lineHeight: 1.55,
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4 text-[#155b72] shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {excludedItems.length > 0 && (
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid rgba(21, 91, 114, 0.14)',
                      borderRadius: '14px',
                      padding: '20px',
                    }}
                  >
                    <h2 className="serif" style={{ fontSize: '22px', margin: '0 0 12px' }}>
                      Not Included
                    </h2>
                    <ul className="space-y-2" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {excludedItems.map((item, idx) => (
                        <li
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            fontSize: '13.5px',
                            lineHeight: 1.55,
                            color: 'var(--muted)',
                          }}
                        >
                          <XCircle className="w-4 h-4 text-[#607d8b] shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {/* Destinations Covered on This Journey */}
            {relatedDestinations.length > 0 && (
              <section>
                <div className="mb-4">
                  <span
                    className="eyebrow"
                    style={{ color: 'var(--terracotta)', display: 'block', marginBottom: '4px' }}
                  >
                    DESTINATIONS ON THIS ROUTE
                  </span>
                  <h2 className="serif" style={{ fontSize: '28px', margin: 0 }}>
                    Explore the Places You&apos;ll Visit
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
                          padding: '18px',
                          textDecoration: 'none',
                          color: 'inherit',
                        }}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
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
                        <p
                          style={{
                            fontSize: '13px',
                            color: 'var(--muted)',
                            lineHeight: 1.55,
                            margin: '0 0 10px',
                          }}
                        >
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
                          Read Destination Guide →
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Optional Package FAQ */}
            {faqItems.length > 0 && (
              <section
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(21, 91, 114, 0.14)',
                  borderRadius: '14px',
                  padding: '24px',
                }}
              >
                <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-[#e1eef3]">
                  <div>
                    <span
                      className="eyebrow"
                      style={{ color: 'var(--terracotta)', display: 'block', marginBottom: '4px' }}
                    >
                      FREQUENTLY ASKED
                    </span>
                    <h2 className="serif" style={{ fontSize: '24px', margin: 0 }}>
                      Questions About This Journey
                    </h2>
                  </div>
                  <HelpCircle className="w-5 h-5 text-[#328eae] shrink-0" />
                </div>
                <div className="space-y-4">
                  {faqItems.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        paddingBottom: idx < faqItems.length - 1 ? '14px' : 0,
                        borderBottom:
                          idx < faqItems.length - 1 ? '1px solid #e1eef3' : 'none',
                      }}
                    >
                      <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 4px' }}>
                        {item.q}
                      </h3>
                      <p style={{ fontSize: '13.5px', color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>
                        {item.a}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Related Travel Guides */}
            {relatedGuides.length > 0 && (
              <section>
                <div className="mb-4">
                  <span
                    className="eyebrow"
                    style={{ color: 'var(--terracotta)', display: 'block', marginBottom: '4px' }}
                  >
                    PLANNING RESOURCES
                  </span>
                  <h2 className="serif" style={{ fontSize: '26px', margin: 0 }}>
                    Helpful Sri Lanka Travel Guides
                  </h2>
                </div>
                <div className="space-y-3">
                  {relatedGuides.map((guide) => (
                    <Link
                      key={guide.id}
                      href={`/guides/${guide.slug}`}
                      prefetch={false}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '14px',
                        background: '#ffffff',
                        border: '1px solid rgba(21, 91, 114, 0.14)',
                        borderRadius: '12px',
                        padding: '16px 18px',
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <div>
                        <span
                          className="eyebrow"
                          style={{ color: 'var(--terracotta)', fontSize: '10px' }}
                        >
                          {guide.categoryLabel} · {guide.readingTime}
                        </span>
                        <h3 className="serif" style={{ fontSize: '19px', margin: '4px 0 4px' }}>
                          {guide.title}
                        </h3>
                        <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0, lineHeight: 1.55 }}>
                          {guide.summary}
                        </p>
                      </div>
                      <BookOpen className="w-4 h-4 text-[#328eae] shrink-0 mt-1" />
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Booking Panel & Custom Enquiry */}
          <aside className="lg:col-span-5 space-y-6">
            <BookingPanel
              itemId={tour.id}
              itemName={`${tour.name} (${durationText})`}
              itemType="tour"
              compact
            />

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
                CUSTOMISE THIS ITINERARY
              </span>
              <h3 className="serif" style={{ fontSize: '24px', margin: '0 0 10px' }}>
                Tailor {tour.name} to Your Dates
              </h3>
              <p
                style={{
                  fontSize: '13.5px',
                  lineHeight: 1.65,
                  opacity: 0.9,
                  margin: '0 0 18px',
                }}
              >
                Adjust trip length, upgrade to boutique or five-star hotels, or add extra coastal
                nights. Every Bimondo Travels journey is confirmed individually with our
                Battaramulla specialists.
              </p>
              <div className="space-y-2.5">
                <Link
                  href={`/contact?package=${encodeURIComponent(tour.name)}`}
                  prefetch={false}
                  className="pill light"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() =>
                    trackBookingButtonClick({
                      source: 'package_detail_sidebar_contact',
                      itemType: 'tour',
                      itemId: tour.id,
                      itemName: tour.name,
                    })
                  }
                >
                  Request Custom Quote →
                </Link>
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pill dark"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() =>
                    trackWhatsAppClick('package_detail_sidebar', tour.name)
                  }
                >
                  Message on WhatsApp (+94 76 223 2054) ↗
                </a>
              </div>
            </div>

            {peerTours.length > 0 && (
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
                  SIMILAR JOURNEYS
                </span>
                <h3 className="serif" style={{ fontSize: '22px', margin: '0 0 14px' }}>
                  More {tour.categoryLabel}
                </h3>
                <div className="space-y-3">
                  {peerTours.map((peer) => (
                    <Link
                      key={peer.id}
                      href={`/packages/${resolveTourSlug(peer)}`}
                      prefetch={false}
                      style={{
                        display: 'block',
                        padding: '13px 14px',
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
                          marginBottom: '3px',
                        }}
                      >
                        {peer.durationLabel || `${peer.days} Days`}
                      </div>
                      <div className="serif" style={{ fontSize: '18px', marginBottom: '2px' }}>
                        {peer.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        {peer.route}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>

      {/* Modal Booking Panel */}
      {showBookingModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowBookingModal(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label={`Book ${tour.name}`}
        >
          <div className="modal-card booking-modal-wide">
            <BookingPanel
              itemId={tour.id}
              itemName={`${tour.name} (${durationText})`}
              itemType="tour"
              onClose={() => setShowBookingModal(false)}
            />
          </div>
        </div>
      )}
    </main>
  );
}
