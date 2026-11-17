'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CmsBentoSlideItem } from '@/lib/cms-defaults';
import { useSiteCms } from '@/hooks/useSiteCms';
import CmsImage from '@/components/CmsImage';

export default function BentoDestinationSlider() {
  const { cms } = useSiteCms();
  const bentoSettings = cms.pages.home.bentoSlider;
  const [currentIndex, setCurrentIndex] = useState(0);
  const boardRef = useRef<HTMLElement | null>(null);
  const isVisibleRef = useRef(false);

  const bentoSlides: CmsBentoSlideItem[] = useMemo(() => {
    const rawList = Array.isArray(cms.bentoDestinations)
      ? cms.bentoDestinations.filter((b) => b.visible !== false)
      : [];

    return [...rawList].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [cms.bentoDestinations]);

  const safeIndex =
    bentoSlides.length > 0 ? currentIndex % bentoSlides.length : 0;
  const dest = bentoSlides[safeIndex];

  useEffect(() => {
    const el = boardRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        isVisibleRef.current = Boolean(entries[0]?.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      bentoSlides.length <= 1 ||
      !isVisibleRef.current
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      const nextSlide = bentoSlides[(safeIndex + 1) % bentoSlides.length];
      if (!nextSlide) return;
      const urls = [
        nextSlide.heroImageRef?.url || nextSlide.heroImage,
        nextSlide.pathwayImageRef?.url || nextSlide.pathwayImage,
        nextSlide.tallSceneImageRef?.url || nextSlide.tallSceneImage,
        nextSlide.natureImageRef?.url || nextSlide.natureImage,
        nextSlide.cuisineImageRef?.url || nextSlide.cuisineImage,
      ];
      for (const raw of urls) {
        const u = (raw || '').trim();
        if (!u || u.startsWith('data:') || u.startsWith('blob:')) continue;
        const img = new window.Image();
        img.decoding = 'async';
        img.referrerPolicy = 'no-referrer';
        img.src = u;
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [bentoSlides, safeIndex]);

  if (bentoSettings?.visible === false || !dest) {
    return null;
  }

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev <= 0 ? bentoSlides.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev >= bentoSlides.length - 1 ? 0 : prev + 1
    );
  };

  const whatsAppNumber =
    (cms.general.whatsappNumber || '94762232054').replace(/\D/g, '') ||
    '94762232054';
  const whatsAppUrl = `https://wa.me/${whatsAppNumber}?text=${encodeURIComponent(
    `Hello Bimondo Travels, I'd love to plan a private journey to ${dest.name} (${dest.subtitle}).`
  )}`;

  return (
    <section
      ref={boardRef}
      className="bento-full-section"
      id="destinations-slider"
      aria-label="Sri Lanka Featured Destinations Bento Slider"
      style={
        {
          '--bento-frame-bg': dest.theme.frameBg,
          '--bento-card-bg': dest.theme.cardBg,
          '--bento-card-alt-bg': dest.theme.cardAltBg,
          '--bento-desc-grad': dest.theme.descGradient,
          '--bento-highlight-bg': dest.theme.highlightBg,
          '--bento-cta-grad': dest.theme.ctaGradient,
          '--bento-nav-bg': dest.theme.navBg,
          '--bento-nav-hover-bg': dest.theme.navHoverBg,
          '--bento-glow': dest.theme.glowColor,
        } as React.CSSProperties
      }
    >
      <div className="bento-sr-board">
        <div className="bento-sr-grid">
          {/* 1. Top-Left Hero Banner Card (Cols 1-2, Rows 1-6) */}
          <div className="bento-sr-tile bento-sr-hero">
            <div className="bento-sr-img-layer">
              <CmsImage
                imageRef={dest.heroImageRef}
                src={dest.heroImageRef?.url || dest.heroImage}
                alt={dest.heroImageRef?.alt || dest.name}
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                className="object-cover bento-sr-img"
              />
            </div>
            <div className="bento-sr-hero-overlay">
              <h2 className="bento-sr-hero-title">{dest.name}</h2>
              <p className="bento-sr-hero-subtitle">{dest.subtitle}</p>
            </div>
          </div>

          {/* 2. Middle-Left Narrative Card (Col 1, Rows 7-10) */}
          <div className="bento-sr-tile bento-sr-narrative">
            <h3 className="bento-sr-narrative-title">{dest.headline}</h3>
            <p className="bento-sr-narrative-body">{dest.description}</p>
          </div>

          {/* 3. Middle-Center-Left Pathway Image Card (Col 2, Rows 7-10) */}
          <div className="bento-sr-tile bento-sr-pathway">
            <div className="bento-sr-img-layer">
              <CmsImage
                imageRef={dest.pathwayImageRef}
                src={dest.pathwayImageRef?.url || dest.pathwayImage}
                alt={dest.pathwayImageRef?.alt || `${dest.name} pathway`}
                fill
                sizes="(max-width: 900px) 50vw, 25vw"
                className="object-cover bento-sr-img"
              />
            </div>
          </div>

          {/* 4. Bottom-Left Highlight CTA Tile (Col 1, Rows 11-12) */}
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bento-sr-tile bento-sr-cta"
          >
            <span>{dest.ctaText}</span>
          </a>

          {/* 5. Bottom-Center-Left Previous / Next Buttons (Col 2, Rows 11-12) */}
          <div className="bento-sr-nav-pair">
            <button
              type="button"
              onClick={handlePrev}
              className="bento-sr-tile bento-sr-nav-btn"
              aria-label="Previous destination"
            >
              {bentoSettings.prevButtonLabel || 'PREVIOUS'}
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="bento-sr-tile bento-sr-nav-btn"
              aria-label="Next destination"
            >
              {bentoSettings.nextButtonLabel || 'NEXT'}
            </button>
          </div>

          {/* 6. Top-Center-Right Explore Card (Col 3, Rows 1-3) */}
          <div className="bento-sr-tile bento-sr-info bento-sr-explore">
            <h3 className="bento-sr-info-title">{dest.exploreTitle}</h3>
            <p className="bento-sr-info-text">{dest.exploreText}</p>
          </div>

          {/* 7. Middle-Center-Right Tall Atmospheric Scene Card (Col 3, Rows 4-9) */}
          <div className="bento-sr-tile bento-sr-tall-scene">
            <div className="bento-sr-img-layer">
              <CmsImage
                imageRef={dest.tallSceneImageRef}
                src={dest.tallSceneImageRef?.url || dest.tallSceneImage}
                alt={dest.tallSceneImageRef?.alt || `${dest.name} atmosphere`}
                fill
                sizes="(max-width: 900px) 50vw, 25vw"
                className="object-cover bento-sr-img"
              />
            </div>
          </div>

          {/* 8. Bottom-Center-Right Stay Card (Col 3, Rows 10-12) */}
          <div className="bento-sr-tile bento-sr-info bento-sr-stay">
            <h3 className="bento-sr-info-title">{dest.stayTitle}</h3>
            <p className="bento-sr-info-text">{dest.stayText}</p>
          </div>

          {/* 9. Top-Right Nature / Botanical Image Card (Col 4, Rows 1-6) */}
          <div className="bento-sr-tile bento-sr-nature">
            <div className="bento-sr-img-layer">
              <CmsImage
                imageRef={dest.natureImageRef}
                src={dest.natureImageRef?.url || dest.natureImage}
                alt={dest.natureImageRef?.alt || `${dest.name} nature`}
                fill
                sizes="(max-width: 900px) 50vw, 25vw"
                className="object-cover bento-sr-img"
              />
            </div>
          </div>

          {/* 10. Bottom-Right Highlighted Cuisine Card (Col 4, Rows 7-12) */}
          <div className="bento-sr-tile bento-sr-cuisine">
            <div className="bento-sr-cuisine-header">
              <h3 className="bento-sr-info-title">{dest.cuisineTitle}</h3>
              <p className="bento-sr-info-text">{dest.cuisineText}</p>
            </div>
            <div className="bento-sr-cuisine-media">
              <div className="bento-sr-img-layer">
                <CmsImage
                  imageRef={dest.cuisineImageRef}
                  src={dest.cuisineImageRef?.url || dest.cuisineImage}
                  alt={dest.cuisineImageRef?.alt || `${dest.name} cuisine`}
                  fill
                  sizes="(max-width: 900px) 50vw, 25vw"
                  className="object-cover bento-sr-img"
                />
              </div>
              <div className="bento-sr-cuisine-fade" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
