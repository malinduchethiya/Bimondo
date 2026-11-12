'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSiteCms } from '@/hooks/useSiteCms';
import { DEFAULT_HERO_IMAGES } from '@/lib/cms-defaults';

const HERO_SLIDESHOW_INTERVAL_MS = 4000;

export default function HeroSection() {
  const { cms } = useSiteCms();
  const showTripadvisor = cms.general.tripadvisorEnabled !== false;
  const taBrand = cms.general.tripadvisorBrand || 'Tripadvisor';
  const taRating = cms.general.tripadvisorRating || '5.0';
  const taReviewsText =
    cms.general.tripadvisorReviewsText || 'Based on 165 reviews';

  const rawSlides =
    Array.isArray(cms.general.heroImages) && cms.general.heroImages.length > 0
      ? cms.general.heroImages
          .map((s) => String(s || '').trim())
          .filter(Boolean)
      : DEFAULT_HERO_IMAGES;

  const heroSlides = rawSlides.length > 0 ? rawSlides : DEFAULT_HERO_IMAGES;

  const [activeSlide, setActiveSlide] = useState<number>(0);
  const heroRef = useRef<HTMLElement | null>(null);
  const isVisibleRef = useRef<boolean>(true);

  useEffect(() => {
    if (heroSlides.length <= 1) return;

    const observer = new IntersectionObserver(
      (entries) => {
        isVisibleRef.current = Boolean(entries[0]?.isIntersecting);
      },
      { threshold: 0.05 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    const timer = window.setInterval(() => {
      if (isVisibleRef.current && !document.hidden) {
        setActiveSlide((prev) => (prev + 1) % heroSlides.length);
      }
    }, HERO_SLIDESHOW_INTERVAL_MS);

    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, [heroSlides.length]);

  const safeActiveIndex = activeSlide % heroSlides.length;

  return (
    <section ref={heroRef} className="hero" id="home">
      <div className="hero-photo" aria-hidden="true">
        {heroSlides.map((imgSrc, idx) => {
          const isActive = idx === safeActiveIndex;
          return (
            <div
              key={`${imgSrc}-${idx}`}
              className={`hero-slide-layer ${isActive ? 'is-active' : ''}`}
            >
              <Image
                src={imgSrc}
                alt={`Sri Lanka Hero Slide ${idx + 1}`}
                fill
                sizes="100vw"
                priority={idx === 0}
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          );
        })}
      </div>

      <div className="wrap hero-inner">
        <div className="hero-copy">
          <div className="eyebrow hero-eyebrow">
            {(cms.general.siteName || 'BIMONDO TRAVELS').toUpperCase()} —
            PRIVATE, AUTHENTIC JOURNEYS ACROSS SRI LANKA
          </div>
          <h1 className="serif">
            Not a place{' '}
            <span className="island-word">
              you visit<span className="period">,</span>
            </span>
            <br />
            <em>but a feeling</em>
            <br />
            <span className="stories-word">
              you carry home<span className="period">.</span>
            </span>
          </h1>
          <p>
            {cms.general.tagline ||
              `Private, tailor-made journeys across Sri Lanka—spanning adventure, culture and heritage, sea and sand, and hiking and wildlife—planned personally by our local team in Battaramulla since ${
                cms.general.foundedYear || '2022'
              }.`}
          </p>
          <div className="hero-actions">
            <Link className="pill dark" href="/packages" prefetch={false}>
              EXPLORE OUR JOURNEYS ↗
            </Link>
            <Link className="pill" href="/our-story" prefetch={false}>
              OUR STORY ↓
            </Link>
          </div>

          {heroSlides.length > 1 && (
            <div
              className="hero-slideshow-dots"
              role="tablist"
              aria-label="Hero background slideshow"
            >
              {heroSlides.map((_, idx) => (
                <button
                  key={`hero-dot-${idx}`}
                  type="button"
                  role="tab"
                  aria-selected={idx === safeActiveIndex}
                  className={`hero-slideshow-dot ${
                    idx === safeActiveIndex ? 'active' : ''
                  }`}
                  onClick={() => setActiveSlide(idx)}
                  aria-label={`Show hero image ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom-Right Frosted Tripadvisor Rating Card (Managed in /admin -> Site Settings) */}
      {showTripadvisor && (
        <div
          className="hero-tripadvisor-card"
          aria-label={`${taBrand} ${taRating} rating ${taReviewsText}`}
        >
          <div className="hero-ta-top">
            <span className="hero-ta-brand">{taBrand}</span>
            <span className="hero-ta-divider" aria-hidden="true">
              |
            </span>
            <span className="hero-ta-score">{taRating}</span>
          </div>
          <div className="hero-ta-stars" aria-hidden="true">
            <span>★</span>
            <span>★</span>
            <span>★</span>
            <span>★</span>
            <span>★</span>
          </div>
          <div className="hero-ta-sub">{taReviewsText}</div>
        </div>
      )}
    </section>
  );
}
