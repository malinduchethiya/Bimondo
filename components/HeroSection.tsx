'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSiteCms } from '@/hooks/useSiteCms';
import CmsImage from '@/components/CmsImage';

const HERO_SLIDESHOW_INTERVAL_MS = 4000;

export default function HeroSection() {
  const { cms } = useSiteCms();
  const hero = cms.pages.home.hero;

  const allActiveSlides = [...(hero.slides || [])]
    .filter((s) => s.visible !== false && !s.deletedAt)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const slidesWithImages = allActiveSlides.filter((s) =>
    Boolean(s.image?.url?.trim())
  );

  const visibleSlides =
    slidesWithImages.length > 0
      ? slidesWithImages
      : allActiveSlides.slice(0, 1);

  const [activeSlide, setActiveSlide] = useState<number>(0);
  const heroRef = useRef<HTMLElement | null>(null);
  const isVisibleRef = useRef<boolean>(true);

  const safeActiveIndex =
    visibleSlides.length > 0 ? activeSlide % visibleSlides.length : 0;

  useEffect(() => {
    if (!heroRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        isVisibleRef.current = Boolean(entries[0]?.isIntersecting);
      },
      { threshold: 0.05 }
    );

    observer.observe(heroRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (visibleSlides.length <= 1) return;

    let lastScrollAt = 0;
    const onScroll = () => {
      lastScrollAt = Date.now();
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    const timer = window.setInterval(() => {
      if (
        isVisibleRef.current &&
        !document.hidden &&
        Date.now() - lastScrollAt > 250
      ) {
        setActiveSlide((prev) => (prev + 1) % visibleSlides.length);
      }
    }, HERO_SLIDESHOW_INTERVAL_MS);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearInterval(timer);
    };
  }, [visibleSlides.length]);

  if (hero.visible === false) {
    return null;
  }

  const showTripadvisor = hero.tripadvisorEnabled !== false;
  const taBrand = hero.tripadvisorBrand ?? 'Tripadvisor';
  const taRating = hero.tripadvisorRating ?? '5.0';
  const taReviewsText = hero.tripadvisorReviewsText ?? 'Based on 165 reviews';

  const nextSlideIndex =
    visibleSlides.length > 1
      ? (safeActiveIndex + 1) % visibleSlides.length
      : 0;

  return (
    <section ref={heroRef} className="hero" id="home">
      <div className="hero-photo" aria-hidden="true">
        {visibleSlides.length > 0 ? (
          visibleSlides.map((slide, idx) => {
            const isActive = idx === safeActiveIndex;
            const isNear = idx === 0 || isActive || idx === nextSlideIndex;

            return (
              <div
                key={slide.id || `${slide.image?.url}-${idx}`}
                className={`hero-slide-layer ${isActive ? 'is-active' : ''}`}
              >
                <CmsImage
                  imageRef={slide.image}
                  src={slide.image?.url}
                  alt={slide.image?.alt || `Sri Lanka Hero Slide ${idx + 1}`}
                  fill
                  sizes="100vw"
                  priority={idx === 0}
                  loading={isNear ? 'eager' : 'lazy'}
                  className="object-cover"
                />
              </div>
            );
          })
        ) : (
          <div className="hero-slide-layer is-active">
            <CmsImage
              src=""
              alt="Hero Background"
              fill
              sizes="100vw"
              priority
              className="object-cover"
            />
          </div>
        )}
      </div>

      <div className="wrap hero-inner">
        <div className="hero-copy">
          <div className="eyebrow hero-eyebrow">{hero.eyebrow}</div>
          <h1 className="serif">
            {hero.headlinePart1}{' '}
            <span className="island-word">
              {hero.headlineHighlight1}
              <span className="period">,</span>
            </span>
            <br />
            <em>{hero.headlineItalic}</em>
            <br />
            <span className="stories-word">
              {hero.headlineHighlight2}
              <span className="period">.</span>
            </span>
          </h1>
          <p>{hero.description}</p>
          <div className="hero-actions">
            <Link
              className="pill dark"
              href={hero.primaryCtaHref || '/packages'}
              prefetch={false}
            >
              {hero.primaryCtaLabel}
            </Link>
            <Link
              className="pill"
              href={hero.secondaryCtaHref || '/our-story'}
              prefetch={false}
            >
              {hero.secondaryCtaLabel}
            </Link>
          </div>

          {visibleSlides.length > 1 && (
            <div
              className="hero-slideshow-dots"
              role="tablist"
              aria-label="Hero background slideshow (4s interval)"
            >
              {visibleSlides.map((slide, idx) => (
                <button
                  key={slide.id || `hero-dot-${idx}`}
                  type="button"
                  role="tab"
                  aria-selected={idx === safeActiveIndex}
                  className={`hero-slideshow-dot ${
                    idx === safeActiveIndex ? 'active' : ''
                  }`}
                  onClick={() => setActiveSlide(idx)}
                  aria-label={`Show hero image ${idx + 1} of ${visibleSlides.length}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

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
