'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import PageBanner from '@/components/PageBanner';
import CmsImage from '@/components/CmsImage';
import { useSiteCms } from '@/hooks/useSiteCms';
import { CmsGalleryPhoto } from '@/lib/cms-defaults';

const GALLERY_CATEGORY_LIST = [
  { id: 'culture', label: 'Culture & Heritage' },
  { id: 'highlands', label: 'Hill Country & Hiking' },
  { id: 'wildlife', label: 'Wildlife & Nature' },
  { id: 'coast', label: 'Sea & Sand' },
] as const;

export default function GalleryPage() {
  const { cms } = useSiteCms();
  const pageContent = cms.pages.galleryPage;

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<CmsGalleryPhoto | null>(
    null
  );

  const photos = useMemo(
    () =>
      (cms.gallery || [])
        .filter(
          (p) =>
            p.visible !== false &&
            !p.deletedAt &&
            Boolean((p.imageRef?.url || p.image || '').trim())
        )
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [cms.gallery]
  );

  const categorySections = useMemo(() => {
    const visibleCategories =
      activeCategory === 'all'
        ? GALLERY_CATEGORY_LIST
        : GALLERY_CATEGORY_LIST.filter((c) => c.id === activeCategory);

    return visibleCategories
      .map((cat) => ({
        ...cat,
        items: photos.filter((p) => {
          const normalizedCat =
            p.category === 'highlands' ||
            p.category === 'wildlife' ||
            p.category === 'coast'
              ? p.category
              : 'culture';
          return normalizedCat === cat.id;
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [photos, activeCategory]);

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

        {/* Minimal Category Filter */}
        <div className="filter" style={{ marginBottom: '36px' }}>
          <button
            type="button"
            className={activeCategory === 'all' ? 'active' : ''}
            onClick={() => setActiveCategory('all')}
          >
            All Categories
          </button>
          {GALLERY_CATEGORY_LIST.map((c) => (
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

        {/* Direct 4-Column Category Showcase */}
        {categorySections.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
            No photos available in this category yet.
          </p>
        ) : (
          <div className="gallerydesign-categories">
            {categorySections.map((categorySection) => (
              <div key={categorySection.id} className="gallerydesign-section">
                <h3 className="serif gallerydesign-heading">
                  {categorySection.label}
                </h3>
                <div className="gallerydesign">
                  {categorySection.items.map((photo, idx) => (
                    <button
                      key={photo.id}
                      type="button"
                      className="gallerydesign-item"
                      onClick={() => setSelectedPhoto(photo)}
                      aria-label={photo.title || categorySection.label}
                    >
                      <CmsImage
                        imageRef={photo.imageRef}
                        src={photo.imageRef?.url || photo.image}
                        alt={
                          photo.imageRef?.alt ||
                          photo.title ||
                          categorySection.label
                        }
                        fill
                        sizes="(max-width: 639px) 50vw, (max-width: 959px) 33vw, 25vw"
                        priority={idx < 4}
                        loading={idx < 8 ? 'eager' : 'lazy'}
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

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

      {/* Clean Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedPhoto(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-card"
            style={{ maxWidth: '900px', padding: '0', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                position: 'relative',
                height: 'clamp(280px, 65vh, 620px)',
                width: '100%',
                background: '#0b2230',
              }}
            >
              <CmsImage
                imageRef={selectedPhoto.imageRef}
                src={selectedPhoto.imageRef?.url || selectedPhoto.image}
                alt={
                  selectedPhoto.imageRef?.alt ||
                  selectedPhoto.title ||
                  selectedPhoto.categoryLabel ||
                  'Sri Lanka gallery photo'
                }
                fill
                sizes="(max-width: 768px) 100vw, 900px"
                priority
                loading="eager"
                className="object-contain"
              />
              <button
                type="button"
                className="modal-close-btn"
                aria-label="Close photo"
                style={{
                  color: '#ffffff',
                  background: 'rgba(0,0,0,0.55)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'grid',
                  placeItems: 'center',
                  top: '14px',
                  right: '14px',
                }}
                onClick={() => setSelectedPhoto(null)}
              >
                <X size={18} />
              </button>
            </div>
            {(selectedPhoto.title?.trim() || selectedPhoto.categoryLabel) && (
              <div
                style={{
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  {selectedPhoto.categoryLabel && (
                    <span
                      className="eyebrow"
                      style={{ color: 'var(--terracotta)', display: 'block' }}
                    >
                      {selectedPhoto.categoryLabel}
                    </span>
                  )}
                  {selectedPhoto.title?.trim() && (
                    <span
                      className="serif"
                      style={{ fontSize: '20px', color: 'var(--ink)' }}
                    >
                      {selectedPhoto.title}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="pill"
                  onClick={() => setSelectedPhoto(null)}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
