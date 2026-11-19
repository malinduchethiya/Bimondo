'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, BookOpen, Clock, Search, X } from 'lucide-react';
import PageBanner from '@/components/PageBanner';
import CmsImage from '@/components/CmsImage';
import { useSiteCms } from '@/hooks/useSiteCms';
import { isForbiddenImageUrl } from '@/lib/content-repository';
import {
  DEFAULT_TRAVEL_GUIDES,
  TRAVEL_GUIDE_CATEGORIES,
  type TravelGuideCategoryId,
} from '@/lib/travel-guides';

export default function GuidesPage() {
  const { cms } = useSiteCms();
  const [activeCategory, setActiveCategory] = useState<
    'all' | TravelGuideCategoryId
  >('all');
  const [searchQuery, setSearchQuery] = useState('');

  const publishedGuides = useMemo(() => {
    const source =
      Array.isArray(cms.travelGuides) && cms.travelGuides.length > 0
        ? cms.travelGuides
        : DEFAULT_TRAVEL_GUIDES;
    return [...source]
      .filter((g) => g.visible !== false && !g.deletedAt)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [cms.travelGuides]);

  const filteredGuides = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return publishedGuides.filter((guide) => {
      if (activeCategory !== 'all' && guide.category !== activeCategory) {
        return false;
      }
      if (!q) return true;
      const corpus = [
        guide.title,
        guide.summary,
        guide.intro,
        guide.categoryLabel,
        ...guide.sections.map((s) => `${s.heading} ${s.paragraphs.join(' ')}`),
      ]
        .join(' ')
        .toLowerCase();
      return q.split(/\s+/).every((term) => corpus.includes(term));
    });
  }, [publishedGuides, activeCategory, searchQuery]);

  return (
    <main>
      <PageBanner
        eyebrow="BIMONDO TRAVELS  /  SRI LANKA TRAVEL GUIDES"
        title="Travel Guides & Itineraries"
      />

      <section className="section wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              PRACTICAL INSIGHTS FROM BATTARAMULLA
            </div>
            <h2 className="serif">
              Plan your Sri Lanka journey with{' '}
              <em style={{ color: 'var(--terracotta)' }}>local clarity.</em>
            </h2>
          </div>
          <p>
            Honest, ground-level planning guides covering Sri Lanka&apos;s dual monsoon
            seasons, realistic 7-day and 10-day private routes, safari and climb comparisons,
            and practical preparation for first-time international visitors.
          </p>
        </div>

        {/* Search & Category Filter Bar */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid rgba(21, 91, 114, 0.14)',
            borderRadius: '14px',
            padding: '18px 22px',
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
              marginBottom: '14px',
            }}
          >
            <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '480px' }}>
              <Search
                aria-hidden="true"
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
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setSearchQuery('');
                }}
                placeholder="Search travel guides (e.g. monsoon, 10-day, Sigiriya, safari)..."
                aria-label="Search Sri Lanka travel guides"
                style={{
                  width: '100%',
                  padding: '10px 36px 10px 40px',
                  fontSize: '13.5px',
                  background: 'var(--paper)',
                  border: '1px solid #b9d3dd',
                  borderRadius: '999px',
                  color: 'var(--ink)',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear guide search"
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                  }}
                >
                  <X style={{ width: '15px', height: '15px' }} />
                </button>
              )}
            </div>

            <div
              aria-live="polite"
              style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ink)' }}
            >
              Showing {filteredGuides.length} of {publishedGuides.length} guides
            </div>
          </div>

          <div className="filter" role="group" aria-label="Filter guides by topic">
            {TRAVEL_GUIDE_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  aria-pressed={isActive}
                  className={isActive ? 'active' : ''}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {cat.label}
                </button>
              );
            })}
            {(activeCategory !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('all');
                  setSearchQuery('');
                }}
                style={{ borderStyle: 'dashed' }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Guides Grid */}
        {filteredGuides.length === 0 ? (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid rgba(21, 91, 114, 0.14)',
              borderRadius: '14px',
              padding: '44px 24px',
              textAlign: 'center',
            }}
          >
            <h3 className="serif" style={{ fontSize: '24px', marginBottom: '8px' }}>
              No travel guides match your filter
            </h3>
            <p style={{ color: 'var(--muted)', marginBottom: '18px', fontSize: '14px' }}>
              Reset your search or topic filter to view all {publishedGuides.length} Sri Lanka
              planning guides.
            </p>
            <button
              type="button"
              className="pill dark"
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
              }}
            >
              Show All Travel Guides
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '22px',
            }}
          >
            {filteredGuides.map((guide) => {
              const imgUrl = (guide.imageRef?.url || '').trim();
              const hasImg = imgUrl.length > 0 && !isForbiddenImageUrl(imgUrl);

              return (
                <article
                  key={guide.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid rgba(21, 91, 114, 0.14)',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    {hasImg ? (
                      <Link
                        href={`/guides/${guide.slug}`}
                        prefetch={false}
                        style={{
                          display: 'block',
                          position: 'relative',
                          aspectRatio: '16 / 10',
                          width: '100%',
                        }}
                      >
                        <CmsImage
                          imageRef={guide.imageRef}
                          src={imgUrl}
                          alt={guide.imageRef?.alt || guide.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover"
                        />
                      </Link>
                    ) : (
                      <div
                        style={{
                          padding: '14px 20px',
                          background: 'var(--paper)',
                          borderBottom: '1px solid #e1eef3',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                        }}
                      >
                        <span
                          className="eyebrow"
                          style={{ color: 'var(--terracotta)', margin: 0, fontSize: '10px' }}
                        >
                          {guide.eyebrow}
                        </span>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '11px',
                            color: 'var(--muted)',
                            fontWeight: 600,
                          }}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          {guide.readingTime}
                        </span>
                      </div>
                    )}

                    <div style={{ padding: '20px 22px 16px' }}>
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'var(--muted)',
                          marginBottom: '6px',
                        }}
                      >
                        {guide.categoryLabel}
                      </div>
                      <h3 className="serif" style={{ fontSize: '23px', margin: '0 0 10px', lineHeight: 1.25 }}>
                        <Link
                          href={`/guides/${guide.slug}`}
                          prefetch={false}
                          style={{ color: 'inherit', textDecoration: 'none' }}
                        >
                          {guide.title}
                        </Link>
                      </h3>
                      <p
                        style={{
                          fontSize: '13.5px',
                          lineHeight: 1.65,
                          color: 'var(--muted)',
                          margin: 0,
                        }}
                      >
                        {guide.summary}
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '14px 22px 20px',
                      borderTop: '1px solid #e1eef3',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <Link
                      href={`/guides/${guide.slug}`}
                      prefetch={false}
                      className="pill dark"
                      style={{ padding: '8px 16px', fontSize: '11px' }}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Read Guide
                    </Link>
                    <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                      {guide.relatedDestinationSlugs.length} destinations covered
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Cross-Navigation CTA */}
        <div className="dest-custom-cta-box" style={{ marginTop: '52px', color: '#ffffff' }}>
          <div>
            <div className="eyebrow" style={{ color: '#a5eff4' }}>
              FROM RESEARCH TO PRIVATE ROUTE
            </div>
            <h3 className="serif" style={{ margin: '6px 0 8px' }}>
              Ready to turn these ideas into your own Sri Lanka itinerary?
            </h3>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9, maxWidth: '580px' }}>
              Explore all 47 regional destination guides, compare our 20 sample private tour
              packages, or speak directly with our Battaramulla travel specialists.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link href="/destinations" prefetch={false} className="pill light">
              47 Destinations
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link href="/packages" prefetch={false} className="pill dark">
              20 Tour Packages
            </Link>
            <Link href="/contact" prefetch={false} className="pill dark">
              Plan Custom Trip
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
