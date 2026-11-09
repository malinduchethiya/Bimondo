'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { BENTO_DESTINATIONS } from '@/lib/bento-destinations';

export default function BentoDestinationSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const boardRef = useRef<HTMLDivElement>(null);
  const heroTileRef = useRef<HTMLDivElement>(null);
  const heroImgRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroSubRef = useRef<HTMLParagraphElement>(null);
  const narrativeTileRef = useRef<HTMLDivElement>(null);
  const narrativeTitleRef = useRef<HTMLHeadingElement>(null);
  const narrativeBodyRef = useRef<HTMLParagraphElement>(null);
  const pathwayTileRef = useRef<HTMLDivElement>(null);
  const pathwayImgRef = useRef<HTMLDivElement>(null);
  const ctaTileRef = useRef<HTMLAnchorElement>(null);
  const navPairRef = useRef<HTMLDivElement>(null);
  const exploreTileRef = useRef<HTMLDivElement>(null);
  const tallTileRef = useRef<HTMLDivElement>(null);
  const tallImgRef = useRef<HTMLDivElement>(null);
  const stayTileRef = useRef<HTMLDivElement>(null);
  const natureTileRef = useRef<HTMLDivElement>(null);
  const natureImgRef = useRef<HTMLDivElement>(null);
  const cuisineTileRef = useRef<HTMLDivElement>(null);
  const cuisineImgRef = useRef<HTMLDivElement>(null);

  const dest = BENTO_DESTINATIONS[currentIndex];

  const runEnterAnimation = useCallback((direction: 1 | -1) => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'expo.out' },
        onComplete: () => setIsAnimating(false),
      });

      const tiles = [
        heroTileRef.current,
        exploreTileRef.current,
        natureTileRef.current,
        narrativeTileRef.current,
        pathwayTileRef.current,
        tallTileRef.current,
        cuisineTileRef.current,
        ctaTileRef.current,
        navPairRef.current,
        stayTileRef.current,
      ];

      const images = [
        heroImgRef.current,
        pathwayImgRef.current,
        tallImgRef.current,
        natureImgRef.current,
        cuisineImgRef.current,
      ];

      // 1. Staggered Bento Tile clip/scale/position entrance (Slider Revolution signature choreographed reveal)
      tl.fromTo(
        tiles,
        {
          opacity: 0,
          y: 28 * direction,
          scale: 0.94,
          clipPath:
            direction > 0
              ? 'inset(12% 12% 12% 12% round 8px)'
              : 'inset(12% 12% 12% 12% round 8px)',
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          clipPath: 'inset(0% 0% 0% 0% round 8px)',
          duration: 1.05,
          stagger: {
            amount: 0.34,
            from: 'start',
          },
        },
        0
      );

      // 2. Inner parallax zoom-out on all photography layers
      tl.fromTo(
        images,
        {
          scale: 1.26,
          filter: 'brightness(0.65) saturate(1.15)',
        },
        {
          scale: 1,
          filter: 'brightness(1) saturate(1)',
          duration: 1.45,
          ease: 'power4.out',
          stagger: 0.06,
        },
        0.05
      );

      // 3. Staggered typography reveal inside Hero & Narrative cards
      tl.fromTo(
        [
          heroTitleRef.current,
          heroSubRef.current,
          narrativeTitleRef.current,
          narrativeBodyRef.current,
        ],
        {
          opacity: 0,
          y: 22,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.07,
          ease: 'power3.out',
        },
        0.22
      );
    }, boardRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const cleanup = runEnterAnimation(1);
    return cleanup;
  }, [runEnterAnimation]);

  const transitionToSlide = useCallback(
    (nextIdx: number, direction: 1 | -1) => {
      if (isAnimating) return;
      setIsAnimating(true);

      const tiles = [
        heroTileRef.current,
        narrativeTileRef.current,
        pathwayTileRef.current,
        ctaTileRef.current,
        navPairRef.current,
        exploreTileRef.current,
        tallTileRef.current,
        stayTileRef.current,
        natureTileRef.current,
        cuisineTileRef.current,
      ];

      const images = [
        heroImgRef.current,
        pathwayImgRef.current,
        tallImgRef.current,
        natureImgRef.current,
        cuisineImgRef.current,
      ];

      const exitTl = gsap.timeline({
        onComplete: () => {
          setCurrentIndex(nextIdx);
          requestAnimationFrame(() => {
            runEnterAnimation(direction);
          });
        },
      });

      exitTl.to(
        images,
        {
          scale: 1.14,
          duration: 0.36,
          ease: 'power2.in',
        },
        0
      );

      exitTl.to(
        tiles,
        {
          opacity: 0,
          y: -18 * direction,
          scale: 0.96,
          duration: 0.34,
          stagger: {
            amount: 0.14,
            from: direction > 0 ? 'start' : 'end',
          },
          ease: 'power3.in',
        },
        0
      );
    },
    [isAnimating, runEnterAnimation]
  );

  const handlePrev = () => {
    const nextIdx =
      currentIndex === 0 ? BENTO_DESTINATIONS.length - 1 : currentIndex - 1;
    transitionToSlide(nextIdx, -1);
  };

  const handleNext = () => {
    const nextIdx =
      currentIndex === BENTO_DESTINATIONS.length - 1 ? 0 : currentIndex + 1;
    transitionToSlide(nextIdx, 1);
  };

  const whatsAppUrl = `https://wa.me/94762232054?text=${encodeURIComponent(
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
          <div ref={heroTileRef} className="bento-sr-tile bento-sr-hero">
            <div ref={heroImgRef} className="bento-sr-img-layer">
              <Image
                src={dest.heroImage}
                alt={dest.name}
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                className="object-cover bento-sr-img"
                referrerPolicy="no-referrer"
                priority
              />
            </div>
            <div className="bento-sr-hero-overlay">
              <h2 ref={heroTitleRef} className="bento-sr-hero-title">
                {dest.name}
              </h2>
              <p ref={heroSubRef} className="bento-sr-hero-subtitle">
                {dest.subtitle}
              </p>
            </div>
          </div>

          {/* 2. Middle-Left Narrative Card (Col 1, Rows 7-10) */}
          <div
            ref={narrativeTileRef}
            className="bento-sr-tile bento-sr-narrative"
          >
            <h3 ref={narrativeTitleRef} className="bento-sr-narrative-title">
              {dest.headline}
            </h3>
            <p ref={narrativeBodyRef} className="bento-sr-narrative-body">
              {dest.description}
            </p>
          </div>

          {/* 3. Middle-Center-Left Pathway Image Card (Col 2, Rows 7-10) */}
          <div ref={pathwayTileRef} className="bento-sr-tile bento-sr-pathway">
            <div ref={pathwayImgRef} className="bento-sr-img-layer">
              <Image
                src={dest.pathwayImage}
                alt={`${dest.name} pathway`}
                fill
                sizes="(max-width: 900px) 50vw, 25vw"
                className="object-cover bento-sr-img"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* 4. Bottom-Left Highlight CTA Tile (Col 1, Rows 11-12) */}
          <a
            ref={ctaTileRef}
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bento-sr-tile bento-sr-cta"
          >
            <span>{dest.ctaText}</span>
          </a>

          {/* 5. Bottom-Center-Left Previous / Next Buttons (Col 2, Rows 11-12) */}
          <div ref={navPairRef} className="bento-sr-nav-pair">
            <button
              type="button"
              onClick={handlePrev}
              disabled={isAnimating}
              className="bento-sr-tile bento-sr-nav-btn"
              aria-label="Previous destination"
            >
              PREVIOUS
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={isAnimating}
              className="bento-sr-tile bento-sr-nav-btn"
              aria-label="Next destination"
            >
              NEXT
            </button>
          </div>

          {/* 6. Top-Center-Right Explore Card (Col 3, Rows 1-3) */}
          <div
            ref={exploreTileRef}
            className="bento-sr-tile bento-sr-info bento-sr-explore"
          >
            <h3 className="bento-sr-info-title">{dest.exploreTitle}</h3>
            <p className="bento-sr-info-text">{dest.exploreText}</p>
          </div>

          {/* 7. Middle-Center-Right Tall Atmospheric Scene Card (Col 3, Rows 4-9) */}
          <div
            ref={tallTileRef}
            className="bento-sr-tile bento-sr-tall-scene"
          >
            <div ref={tallImgRef} className="bento-sr-img-layer">
              <Image
                src={dest.tallSceneImage}
                alt={`${dest.name} atmosphere`}
                fill
                sizes="(max-width: 900px) 50vw, 25vw"
                className="object-cover bento-sr-img"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* 8. Bottom-Center-Right Stay Card (Col 3, Rows 10-12) */}
          <div
            ref={stayTileRef}
            className="bento-sr-tile bento-sr-info bento-sr-stay"
          >
            <h3 className="bento-sr-info-title">{dest.stayTitle}</h3>
            <p className="bento-sr-info-text">{dest.stayText}</p>
          </div>

          {/* 9. Top-Right Nature / Botanical Image Card (Col 4, Rows 1-6) */}
          <div ref={natureTileRef} className="bento-sr-tile bento-sr-nature">
            <div ref={natureImgRef} className="bento-sr-img-layer">
              <Image
                src={dest.natureImage}
                alt={`${dest.name} nature`}
                fill
                sizes="(max-width: 900px) 50vw, 25vw"
                className="object-cover bento-sr-img"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* 10. Bottom-Right Highlighted Cuisine Card (Col 4, Rows 7-12) */}
          <div ref={cuisineTileRef} className="bento-sr-tile bento-sr-cuisine">
            <div className="bento-sr-cuisine-header">
              <h3 className="bento-sr-info-title">{dest.cuisineTitle}</h3>
              <p className="bento-sr-info-text">{dest.cuisineText}</p>
            </div>
            <div className="bento-sr-cuisine-media">
              <div ref={cuisineImgRef} className="bento-sr-img-layer">
                <Image
                  src={dest.cuisineImage}
                  alt={`${dest.name} cuisine`}
                  fill
                  sizes="(max-width: 900px) 50vw, 25vw"
                  className="object-cover bento-sr-img"
                  referrerPolicy="no-referrer"
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
