'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BENTO_DESTINATIONS } from '@/lib/bento-destinations';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

type SwipeSide = 'left' | 'right' | 'top' | 'bottom';

interface SideSwipeConfig {
  x: number;
  y: number;
}

const FOUR_SIDES_CONFIG: Record<SwipeSide, SideSwipeConfig> = {
  left: { x: -48, y: 0 },
  right: { x: 48, y: 0 },
  top: { x: 0, y: -48 },
  bottom: { x: 0, y: 48 },
};

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

  const getTiles = () =>
    [
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
    ].filter(Boolean) as HTMLElement[];

  const getPhotoPairs = () =>
    [
      {
        tile: heroTileRef.current,
        img: heroImgRef.current,
        defaultSide: 'left' as SwipeSide,
      },
      {
        tile: pathwayTileRef.current,
        img: pathwayImgRef.current,
        defaultSide: 'bottom' as SwipeSide,
      },
      {
        tile: tallTileRef.current,
        img: tallImgRef.current,
        defaultSide: 'top' as SwipeSide,
      },
      {
        tile: natureTileRef.current,
        img: natureImgRef.current,
        defaultSide: 'right' as SwipeSide,
      },
      {
        tile: cuisineTileRef.current,
        img: cuisineImgRef.current,
        defaultSide: 'bottom' as SwipeSide,
      },
    ].filter((p) => p.tile && p.img) as {
      tile: HTMLElement;
      img: HTMLElement;
      defaultSide: SwipeSide;
    }[];

  const getInfoTiles = () =>
    [
      { tile: narrativeTileRef.current, side: 'left' as SwipeSide },
      { tile: exploreTileRef.current, side: 'top' as SwipeSide },
      { tile: stayTileRef.current, side: 'bottom' as SwipeSide },
      { tile: ctaTileRef.current, side: 'left' as SwipeSide },
      { tile: navPairRef.current, side: 'bottom' as SwipeSide },
    ].filter((t) => t.tile) as { tile: HTMLElement; side: SwipeSide }[];

  // Pure GPU-composited 4-sides swipe-in animation (no clip-path or filter repaints)
  const runFourSidesSwipeIn = useCallback((randomizeSides = false) => {
    if (!boardRef.current) return;
    setIsAnimating(true);

    const ctx = gsap.context(() => {
      const photoPairs = getPhotoPairs();
      const infoTiles = getInfoTiles();
      const allSides: SwipeSide[] = ['left', 'top', 'right', 'bottom'];
      const shuffledSides = randomizeSides
        ? gsap.utils.shuffle([...allSides, gsap.utils.random(allSides)])
        : ['left', 'bottom', 'top', 'right', 'bottom'];

      const tl = gsap.timeline({
        defaults: { ease: 'power3.out', force3D: true },
        onComplete: () => setIsAnimating(false),
      });

      photoPairs.forEach((pair, idx) => {
        const side = (shuffledSides[idx] || pair.defaultSide) as SwipeSide;
        const cfg = FOUR_SIDES_CONFIG[side];

        tl.fromTo(
          pair.tile,
          {
            opacity: 0,
            x: cfg.x,
            y: cfg.y,
          },
          {
            opacity: 1,
            x: 0,
            y: 0,
            duration: 0.65,
          },
          idx * 0.05
        );

        tl.fromTo(
          pair.img,
          {
            scale: 1.08,
          },
          {
            scale: 1,
            duration: 0.8,
            ease: 'power2.out',
          },
          idx * 0.05
        );
      });

      infoTiles.forEach((item, idx) => {
        const side = randomizeSides
          ? (gsap.utils.random(['left', 'right', 'top', 'bottom']) as SwipeSide)
          : item.side;
        const cfg = FOUR_SIDES_CONFIG[side];

        tl.fromTo(
          item.tile,
          {
            opacity: 0,
            x: cfg.x * 0.6,
            y: cfg.y * 0.6,
          },
          {
            opacity: 1,
            x: 0,
            y: 0,
            duration: 0.6,
          },
          0.08 + idx * 0.04
        );
      });
    }, boardRef);

    return () => ctx.revert();
  }, []);

  // Trigger once when first scrolling into view so repeated scrolling never stalls
  useEffect(() => {
    if (!boardRef.current) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: boardRef.current,
        start: 'top 82%',
        once: true,
        onEnter: () => {
          runFourSidesSwipeIn(false);
        },
      });
    }, boardRef);

    return () => ctx.revert();
  }, [runFourSidesSwipeIn]);

  const transitionToSlide = useCallback(
    (nextIdx: number) => {
      if (isAnimating) return;
      setIsAnimating(true);

      const tiles = getTiles();
      const allSides: SwipeSide[] = ['left', 'right', 'top', 'bottom'];

      const exitTl = gsap.timeline({
        defaults: { force3D: true },
        onComplete: () => {
          setCurrentIndex(nextIdx);
          requestAnimationFrame(() => {
            runFourSidesSwipeIn(true);
          });
        },
      });

      tiles.forEach((tile, idx) => {
        const exitSide = allSides[idx % 4];
        const cfg = FOUR_SIDES_CONFIG[exitSide];
        exitTl.to(
          tile,
          {
            opacity: 0,
            x: cfg.x * 0.4,
            y: cfg.y * 0.4,
            duration: 0.25,
            ease: 'power2.in',
          },
          idx * 0.015
        );
      });
    },
    [isAnimating, runFourSidesSwipeIn]
  );

  const handlePrev = () => {
    const nextIdx =
      currentIndex === 0 ? BENTO_DESTINATIONS.length - 1 : currentIndex - 1;
    transitionToSlide(nextIdx);
  };

  const handleNext = () => {
    const nextIdx =
      currentIndex === BENTO_DESTINATIONS.length - 1 ? 0 : currentIndex + 1;
    transitionToSlide(nextIdx);
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
          <div ref={tallTileRef} className="bento-sr-tile bento-sr-tall-scene">
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
