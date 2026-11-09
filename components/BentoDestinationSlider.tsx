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
  imgXPercent: number;
  imgYPercent: number;
  clipFrom: string;
}

const FOUR_SIDES_CONFIG: Record<SwipeSide, SideSwipeConfig> = {
  left: {
    x: -80,
    y: 0,
    imgXPercent: -100,
    imgYPercent: 0,
    clipFrom: 'inset(0% 100% 0% 0% round 6px)',
  },
  right: {
    x: 80,
    y: 0,
    imgXPercent: 100,
    imgYPercent: 0,
    clipFrom: 'inset(0% 0% 0% 100% round 6px)',
  },
  top: {
    x: 0,
    y: -80,
    imgXPercent: 0,
    imgYPercent: -100,
    clipFrom: 'inset(0% 0% 100% 0% round 6px)',
  },
  bottom: {
    x: 0,
    y: 80,
    imgXPercent: 0,
    imgYPercent: 100,
    clipFrom: 'inset(100% 0% 0% 0% round 6px)',
  },
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
      { tile: heroTileRef.current, img: heroImgRef.current, defaultSide: 'left' as SwipeSide },
      { tile: pathwayTileRef.current, img: pathwayImgRef.current, defaultSide: 'bottom' as SwipeSide },
      { tile: tallTileRef.current, img: tallImgRef.current, defaultSide: 'top' as SwipeSide },
      { tile: natureTileRef.current, img: natureImgRef.current, defaultSide: 'right' as SwipeSide },
      { tile: cuisineTileRef.current, img: cuisineImgRef.current, defaultSide: 'bottom' as SwipeSide },
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

  // Core 4-sides swipe-in animation for photos and cards
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
        defaults: { ease: 'expo.out' },
        onComplete: () => setIsAnimating(false),
      });

      // 1. Swipe each photo in from one of the 4 sides (Left, Bottom, Top, Right)
      photoPairs.forEach((pair, idx) => {
        const side = (shuffledSides[idx] || pair.defaultSide) as SwipeSide;
        const cfg = FOUR_SIDES_CONFIG[side];

        // Outer tile clip-path + directional slide from its side
        tl.fromTo(
          pair.tile,
          {
            opacity: 0,
            x: cfg.x,
            y: cfg.y,
            clipPath: cfg.clipFrom,
          },
          {
            opacity: 1,
            x: 0,
            y: 0,
            clipPath: 'inset(0% 0% 0% 0% round 6px)',
            duration: 1.25,
            clearProps: 'clipPath',
          },
          idx * 0.09
        );

        // Inner photo layer swiping across from the same side + unzooming
        tl.fromTo(
          pair.img,
          {
            xPercent: cfg.imgXPercent * 0.65,
            yPercent: cfg.imgYPercent * 0.65,
            scale: 1.28,
            filter: 'brightness(0.65) saturate(1.18)',
          },
          {
            xPercent: 0,
            yPercent: 0,
            scale: 1,
            filter: 'brightness(1) saturate(1)',
            duration: 1.45,
            ease: 'power4.out',
          },
          idx * 0.09
        );
      });

      // 2. Swipe the text/info cards in from their 4 corresponding sides
      infoTiles.forEach((item, idx) => {
        const side = randomizeSides
          ? (gsap.utils.random(['left', 'right', 'top', 'bottom']) as SwipeSide)
          : item.side;
        const cfg = FOUR_SIDES_CONFIG[side];

        tl.fromTo(
          item.tile,
          {
            opacity: 0,
            x: cfg.x * 0.75,
            y: cfg.y * 0.75,
            clipPath: cfg.clipFrom,
          },
          {
            opacity: 1,
            x: 0,
            y: 0,
            clipPath: 'inset(0% 0% 0% 0% round 6px)',
            duration: 1.1,
            clearProps: 'clipPath',
          },
          0.12 + idx * 0.07
        );
      });

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
          y: 24,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.07,
          ease: 'power3.out',
        },
        0.32
      );
    }, boardRef);

    return () => ctx.revert();
  }, []);

  // Trigger the 4-side photo swipe animation whenever scrolling to this section
  useEffect(() => {
    if (!boardRef.current) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: boardRef.current,
        start: 'top 78%',
        end: 'bottom 18%',
        onEnter: () => {
          runFourSidesSwipeIn(false);
        },
        onEnterBack: () => {
          runFourSidesSwipeIn(true);
        },
      });
    }, boardRef);

    return () => ctx.revert();
  }, [runFourSidesSwipeIn]);

  const handleCardMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (isAnimating) return;
    gsap.to(e.currentTarget, {
      y: gsap.utils.random(-5, -2),
      scale: 1.014,
      duration: 0.38,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  };

  const handleCardMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    if (isAnimating) return;
    gsap.to(e.currentTarget, {
      y: 0,
      x: 0,
      scale: 1,
      duration: 0.45,
      ease: 'power3.out',
      overwrite: 'auto',
    });
  };

  const transitionToSlide = useCallback(
    (nextIdx: number) => {
      if (isAnimating) return;
      setIsAnimating(true);

      const tiles = getTiles();
      const allSides: SwipeSide[] = ['left', 'right', 'top', 'bottom'];

      const exitTl = gsap.timeline({
        onComplete: () => {
          setCurrentIndex(nextIdx);
          requestAnimationFrame(() => {
            runFourSidesSwipeIn(true);
          });
        },
      });

      // Swipe tiles out toward the 4 sides before swiping the next destination in from 4 sides
      tiles.forEach((tile, idx) => {
        const exitSide = allSides[idx % 4];
        const cfg = FOUR_SIDES_CONFIG[exitSide];
        exitTl.to(
          tile,
          {
            opacity: 0,
            x: cfg.x * 0.55,
            y: cfg.y * 0.55,
            clipPath: cfg.clipFrom,
            duration: 0.38,
            ease: 'power3.in',
          },
          idx * 0.025
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
          {/* 1. Top-Left Hero Banner Card (Cols 1-2, Rows 1-6) — Swipes from LEFT */}
          <div
            ref={heroTileRef}
            onMouseEnter={handleCardMouseEnter}
            onMouseLeave={handleCardMouseLeave}
            className="bento-sr-tile bento-sr-hero"
          >
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
            onMouseEnter={handleCardMouseEnter}
            onMouseLeave={handleCardMouseLeave}
            className="bento-sr-tile bento-sr-narrative"
          >
            <h3 ref={narrativeTitleRef} className="bento-sr-narrative-title">
              {dest.headline}
            </h3>
            <p ref={narrativeBodyRef} className="bento-sr-narrative-body">
              {dest.description}
            </p>
          </div>

          {/* 3. Middle-Center-Left Pathway Image Card (Col 2, Rows 7-10) — Swipes from BOTTOM */}
          <div
            ref={pathwayTileRef}
            onMouseEnter={handleCardMouseEnter}
            onMouseLeave={handleCardMouseLeave}
            className="bento-sr-tile bento-sr-pathway"
          >
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
            onMouseEnter={handleCardMouseEnter}
            onMouseLeave={handleCardMouseLeave}
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
              onMouseEnter={handleCardMouseEnter}
              onMouseLeave={handleCardMouseLeave}
              className="bento-sr-tile bento-sr-nav-btn"
              aria-label="Previous destination"
            >
              PREVIOUS
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={isAnimating}
              onMouseEnter={handleCardMouseEnter}
              onMouseLeave={handleCardMouseLeave}
              className="bento-sr-tile bento-sr-nav-btn"
              aria-label="Next destination"
            >
              NEXT
            </button>
          </div>

          {/* 6. Top-Center-Right Explore Card (Col 3, Rows 1-3) */}
          <div
            ref={exploreTileRef}
            onMouseEnter={handleCardMouseEnter}
            onMouseLeave={handleCardMouseLeave}
            className="bento-sr-tile bento-sr-info bento-sr-explore"
          >
            <h3 className="bento-sr-info-title">{dest.exploreTitle}</h3>
            <p className="bento-sr-info-text">{dest.exploreText}</p>
          </div>

          {/* 7. Middle-Center-Right Tall Atmospheric Scene Card (Col 3, Rows 4-9) — Swipes from TOP */}
          <div
            ref={tallTileRef}
            onMouseEnter={handleCardMouseEnter}
            onMouseLeave={handleCardMouseLeave}
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
            onMouseEnter={handleCardMouseEnter}
            onMouseLeave={handleCardMouseLeave}
            className="bento-sr-tile bento-sr-info bento-sr-stay"
          >
            <h3 className="bento-sr-info-title">{dest.stayTitle}</h3>
            <p className="bento-sr-info-text">{dest.stayText}</p>
          </div>

          {/* 9. Top-Right Nature / Botanical Image Card (Col 4, Rows 1-6) — Swipes from RIGHT */}
          <div
            ref={natureTileRef}
            onMouseEnter={handleCardMouseEnter}
            onMouseLeave={handleCardMouseLeave}
            className="bento-sr-tile bento-sr-nature"
          >
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

          {/* 10. Bottom-Right Highlighted Cuisine Card (Col 4, Rows 7-12) — Swipes from BOTTOM/RIGHT */}
          <div
            ref={cuisineTileRef}
            onMouseEnter={handleCardMouseEnter}
            onMouseLeave={handleCardMouseLeave}
            className="bento-sr-tile bento-sr-cuisine"
          >
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
