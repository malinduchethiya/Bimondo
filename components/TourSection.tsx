'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { BENTO_DESTINATIONS, BentoDestination } from '@/lib/bento-destinations';
import { TOURS, Tour } from '@/lib/tours';
import TourModal from '@/components/TourModal';

export default function TourSection() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  const boardRef = useRef<HTMLDivElement>(null);
  const total = BENTO_DESTINATIONS.length;
  const currentDest: BentoDestination = BENTO_DESTINATIONS[currentIndex];

  const handlePrev = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [isAnimating, total]);

  const handleNext = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [isAnimating, total]);

  // GSAP animation on destination switch
  useEffect(() => {
    if (!boardRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => setIsAnimating(false),
      });

      // Animate images
      tl.fromTo(
        '.bento-anim-img',
        {
          opacity: 0.35,
          scale: 1.05,
        },
        {
          opacity: 1,
          scale: 1,
          duration: 0.65,
          ease: 'power2.out',
          stagger: 0.03,
        },
        0
      );

      // Animate cards
      tl.fromTo(
        '.bento-anim-card',
        {
          opacity: 0.3,
          y: 12,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
          stagger: 0.02,
        },
        0.04
      );

      // Animate text captions
      tl.fromTo(
        '.bento-anim-text',
        {
          opacity: 0,
          y: 8,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: 'power1.out',
          stagger: 0.02,
        },
        0.08
      );
    }, boardRef);

    return () => ctx.revert();
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  const handleOpenTour = () => {
    const matched =
      TOURS.find((t) => t.id === currentDest.ctaTourId) || TOURS[0];
    setSelectedTour(matched);
  };

  return (
    <>
      <section className="section tour-section-bento" id="journeys">
        <div className="wrap">
          {/* Section Header */}
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
                02 / MADE FOR YOUR KIND OF WONDER · {currentDest.name.toUpperCase()}
              </div>
              <h2 className="serif tour-head-title">
                Find your kind
                <br />
                of <span className="sri-big-text">Sri</span>{' '}
                <em className="lanka-text">Lanka.</em>
              </h2>
            </div>
            <p>
              From mist-draped tea ridges and ancient kingdoms to serene coastal shores.
              Explore our signature bespoke destinations curated by local specialists.
            </p>
          </div>

          {/* Quick Destination Pill Tabs */}
          <div className="bento-tabs-row" aria-label="Destinations selection">
            {BENTO_DESTINATIONS.map((dest, idx) => (
              <button
                key={dest.id}
                type="button"
                className={`bento-tab-btn ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => {
                  if (idx !== currentIndex && !isAnimating) {
                    setIsAnimating(true);
                    setCurrentIndex(idx);
                  }
                }}
              >
                {dest.name}
              </button>
            ))}
          </div>

          {/* Bento Board Frame matching image.png */}
          <div className="bento-board-frame" ref={boardRef}>
            <div className="bento-layout-container">
              {/* =========================================================
                  COLUMN 1 (Left Half): Hero card on top + 2 sub-columns below
                 ========================================================= */}
              <div className="bento-col-left">
                {/* Hero Landscape Card */}
                <div className="bento-hero-card">
                  <div className="bento-img-container">
                    <Image
                      key={`hero-${currentDest.id}`}
                      src={currentDest.heroImage}
                      alt={`${currentDest.name} scenery`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 55vw"
                      className="object-cover bento-anim-img"
                      referrerPolicy="no-referrer"
                      priority
                    />
                    <div className="bento-hero-overlay" />
                    <div className="bento-hero-caption bento-anim-text">
                      <h3 className="bento-hero-title">{currentDest.name}</h3>
                      <p className="bento-hero-sub">{currentDest.subtitle}</p>
                    </div>
                  </div>
                </div>

                {/* Sub-row below hero */}
                <div className="bento-sub-row">
                  {/* Left Sub-column: Headline & Description + CTA button */}
                  <div className="bento-sub-col">
                    <div className="bento-card bento-story-card bento-anim-card">
                      <h3 className="bento-story-headline bento-anim-text">
                        {currentDest.headline}
                      </h3>
                      <p className="bento-story-desc bento-anim-text">
                        {currentDest.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="bento-primary-btn bento-anim-card"
                      onClick={handleOpenTour}
                    >
                      {currentDest.ctaText}
                    </button>
                  </div>

                  {/* Right Sub-column: Pathway image + Navigation buttons */}
                  <div className="bento-sub-col">
                    <div className="bento-pathway-card">
                      <div className="bento-img-container">
                        <Image
                          key={`path-${currentDest.id}`}
                          src={currentDest.pathwayImage}
                          alt={`${currentDest.name} walkway`}
                          fill
                          sizes="(max-width: 1024px) 50vw, 25vw"
                          className="object-cover bento-anim-img"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                    <div className="bento-nav-pair bento-anim-card">
                      <button
                        type="button"
                        className="bento-nav-btn"
                        onClick={handlePrev}
                        aria-label="Previous destination"
                        disabled={isAnimating}
                      >
                        PREVIOUS
                      </button>
                      <button
                        type="button"
                        className="bento-nav-btn"
                        onClick={handleNext}
                        aria-label="Next destination"
                        disabled={isAnimating}
                      >
                        NEXT
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* =========================================================
                  COLUMN 2 (Middle): Explore (top), Tall Scene (mid), Stay (bot)
                 ========================================================= */}
              <div className="bento-col-mid">
                {/* Explore Card */}
                <div className="bento-card bento-anim-card">
                  <h4 className="bento-card-title bento-anim-text">
                    {currentDest.exploreTitle}
                  </h4>
                  <p className="bento-card-text bento-anim-text">
                    {currentDest.exploreText}
                  </p>
                </div>

                {/* Middle Tall Scenic Image */}
                <div className="bento-tall-scene-card">
                  <div className="bento-img-container">
                    <Image
                      key={`tall-${currentDest.id}`}
                      src={currentDest.tallSceneImage}
                      alt={`${currentDest.name} scenic landscape`}
                      fill
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="object-cover bento-anim-img"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                {/* Stay Card */}
                <div className="bento-card bento-anim-card">
                  <h4 className="bento-card-title bento-anim-text">
                    {currentDest.stayTitle}
                  </h4>
                  <p className="bento-card-text bento-anim-text">
                    {currentDest.stayText}
                  </p>
                </div>
              </div>

              {/* =========================================================
                  COLUMN 3 (Right): Nature (top), Cuisine (mid), Dish (bot)
                 ========================================================= */}
              <div className="bento-col-right">
                {/* Nature & Flower Image */}
                <div className="bento-nature-card">
                  <div className="bento-img-container">
                    <Image
                      key={`nature-${currentDest.id}`}
                      src={currentDest.natureImage}
                      alt={`${currentDest.name} botanical and wildlife`}
                      fill
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="object-cover bento-anim-img"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                {/* Cuisine Card */}
                <div className="bento-card bento-anim-card">
                  <h4 className="bento-card-title bento-anim-text">
                    {currentDest.cuisineTitle}
                  </h4>
                  <p className="bento-card-text bento-anim-text">
                    {currentDest.cuisineText}
                  </p>
                </div>

                {/* Cuisine Food / Tea Image */}
                <div className="bento-food-card">
                  <div className="bento-img-container">
                    <Image
                      key={`food-${currentDest.id}`}
                      src={currentDest.cuisineImage}
                      alt={`${currentDest.name} traditional cuisine`}
                      fill
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="object-cover bento-anim-img"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Under-board footnote */}
          <div className="bento-footer-note">
            <span>
              Destination {currentIndex + 1} of {total} · {currentDest.name}
            </span>
            <span>
              Use <strong>PREVIOUS</strong> / <strong>NEXT</strong> or arrow keys to cycle regions
            </span>
          </div>
        </div>
      </section>

      {/* Detail Modal */}
      <TourModal
        tour={selectedTour}
        onClose={() => setSelectedTour(null)}
      />
    </>
  );
}
