'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageBanner from '@/components/PageBanner';
import CmsImage from '@/components/CmsImage';
import { useSiteCms } from '@/hooks/useSiteCms';
import { CmsGalleryPhoto } from '@/lib/cms-defaults';

export default function GalleryPage() {
  const { cms } = useSiteCms();
  const pageContent = cms.pages.galleryPage;

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<CmsGalleryPhoto | null>(
    null
  );

  const photos: CmsGalleryPhoto[] = (cms.gallery || [])
    .filter((p) => p.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const categories = [
    { id: 'all', label: 'All Regions' },
    { id: 'culture', label: 'Culture & Heritage' },
    { id: 'highlands', label: 'Hill Country & Hiking' },
    { id: 'wildlife', label: 'Wildlife & Nature' },
    { id: 'coast', label: 'Sea & Sand' },
  ];

  const filtered =
    activeCategory === 'all'
      ? photos
      : photos.filter((p) => p.category === activeCategory);

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

        {/* Gallery Grid */}
        <div className="gallery-grid">
          {filtered.map((photo, i) => (
            <div
              key={photo.id}
              className="gallery-item"
              onClick={() => setSelectedPhoto(photo)}
            >
              <CmsImage
                imageRef={photo.imageRef}
                src={photo.imageRef?.url || photo.image}
                alt={photo.imageRef?.alt || photo.title}
                fill
                priority={i < 2}
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
              <div className="gallery-overlay">
                <span className="gallery-loc">{photo.location}</span>
                <h3 className="serif gallery-title">{photo.title}</h3>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#e5f8fc',
                    marginTop: '4px',
                  }}
                >
                  Click to view full photo ↗
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Custom Tailor-Made CTA Box */}
        <div className="dest-custom-cta-box" style={{ marginTop: '55px' }}>
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
          <Link
            href={pageContent.customCtaBox.ctaHref || '/contact'}
            prefetch={false}
            className="pill light"
          >
            {pageContent.customCtaBox.ctaLabel}
          </Link>
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedPhoto(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-card"
            style={{ maxWidth: '850px', padding: '0', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                position: 'relative',
                height: 'clamp(220px, 42vh, 420px)',
                width: '100%',
              }}
            >
              <CmsImage
                imageRef={selectedPhoto.imageRef}
                src={selectedPhoto.imageRef?.url || selectedPhoto.image}
                alt={selectedPhoto.imageRef?.alt || selectedPhoto.title}
                fill
                sizes="(max-width: 768px) 100vw, 850px"
                className="object-cover"
              />
              <button
                type="button"
                className="modal-close-btn"
                style={{
                  color: '#ffffff',
                  background: 'rgba(0,0,0,0.5)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'grid',
                  placeItems: 'center',
                  top: '16px',
                  right: '16px',
                }}
                onClick={() => setSelectedPhoto(null)}
              >
                ×
              </button>
            </div>
            <div
              style={{
                padding: 'clamp(18px, 4vw, 28px) clamp(16px, 4vw, 32px)',
              }}
            >
              <span className="eyebrow" style={{ color: 'var(--terracotta)' }}>
                {selectedPhoto.categoryLabel} · {selectedPhoto.location}
              </span>
              <h2
                className="serif"
                style={{
                  fontSize: 'clamp(24px, 6vw, 32px)',
                  margin: '8px 0 12px',
                }}
              >
                {selectedPhoto.title}
              </h2>
              <p
                style={{
                  lineHeight: 1.75,
                  color: '#536f7e',
                  margin: 0,
                  fontSize: '14px',
                }}
              >
                {selectedPhoto.description}
              </p>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px',
                  marginTop: '20px',
                }}
              >
                <Link
                  href="/contact"
                  prefetch={false}
                  className="pill dark"
                  onClick={() => setSelectedPhoto(null)}
                >
                  PLAN A TRIP TO THIS REGION ↗
                </Link>
                <button
                  type="button"
                  className="pill"
                  onClick={() => setSelectedPhoto(null)}
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
