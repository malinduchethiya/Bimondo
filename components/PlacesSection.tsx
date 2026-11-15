'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSiteCms } from '@/hooks/useSiteCms';
import {
  CmsImageRef,
  createImageRef,
  StaggerSlideVariant,
} from '@/lib/cms-defaults';
import CmsImage from '@/components/CmsImage';

interface StaggeredPlaceSlide {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  imageRef: CmsImageRef;
  variant: StaggerSlideVariant;
}

const DEFAULT_VARIANTS: StaggerSlideVariant[] = [
  'tall-up',
  'low-down',
  'mid-up',
  'compact-mid',
  'mid-up',
  'tall-deep',
  'low-down',
  'compact-mid',
];

const AUTO_STEP_INTERVAL_MS = 2000;

export default function PlacesSection() {
  const { cms } = useSiteCms();
  const placesSection = cms.pages.home.places;

  const visibleDestinations = Array.isArray(cms.destinations)
    ? [...cms.destinations]
        .filter((d) => d.visible !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : [];

  const slides: StaggeredPlaceSlide[] = visibleDestinations.map((dest, idx) => ({
    id: dest.id,
    name: dest.name.split(',')[0].trim(),
    subtitle: dest.regionLabel,
    image: dest.imageRef?.url || dest.image || '',
    imageRef: dest.imageRef || createImageRef(dest.image, dest.name),
    variant:
      dest.staggerVariant || DEFAULT_VARIANTS[idx % DEFAULT_VARIANTS.length],
  }));

  const totalSlides = slides.length;
  const infiniteSlides = totalSlides > 0 ? [...slides, ...slides] : [];

  const sectionRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const singleSetWidthRef = useRef<number>(0);
  const stepWidthRef = useRef<number>(224);
  const currentXRef = useRef<number>(0);
  const targetXRef = useRef<number>(0);
  const isHoveredRef = useRef<boolean>(false);
  const isVisibleRef = useRef<boolean>(false);
  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const startAnimationTick = useCallback(() => {
    if (rafIdRef.current !== null) return;
    lastTimeRef.current = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.06);
      lastTimeRef.current = now;

      const diff = targetXRef.current - currentXRef.current;
      if (Math.abs(diff) > 0.25) {
        currentXRef.current += diff * Math.min(1, dt * 8.5);
      } else {
        currentXRef.current = targetXRef.current;
      }

      const setWidth = singleSetWidthRef.current;
      if (setWidth > 0) {
        if (currentXRef.current >= setWidth) {
          currentXRef.current -= setWidth;
          targetXRef.current -= setWidth;
        } else if (currentXRef.current < 0) {
          currentXRef.current += setWidth;
          targetXRef.current += setWidth;
        }
      }

      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(-${currentXRef.current.toFixed(
          1
        )}px, 0, 0)`;
      }

      if (Math.abs(targetXRef.current - currentXRef.current) > 0.25) {
        rafIdRef.current = window.requestAnimationFrame(tick);
      } else {
        rafIdRef.current = null;
      }
    };

    rafIdRef.current = window.requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (totalSlides === 0) return;
    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      const items = track.children;
      if (items.length > totalSlides) {
        const firstEl = items[0] as HTMLElement;
        const secondSetEl = items[totalSlides] as HTMLElement;
        const setWidth = secondSetEl.offsetLeft - firstEl.offsetLeft;
        if (setWidth > 0) {
          singleSetWidthRef.current = setWidth;
          stepWidthRef.current = setWidth / totalSlides;
        }
      }
    };

    measure();
    window.addEventListener('resize', measure, { passive: true });
    return () => window.removeEventListener('resize', measure);
  }, [totalSlides]);

  useEffect(() => {
    if (totalSlides === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        isVisibleRef.current = Boolean(entries[0]?.isIntersecting);
      },
      { threshold: 0.05 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    const interval = window.setInterval(() => {
      if (
        isVisibleRef.current &&
        !isHoveredRef.current &&
        !document.hidden
      ) {
        targetXRef.current += stepWidthRef.current;
        startAnimationTick();
      }
    }, AUTO_STEP_INTERVAL_MS);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [startAnimationTick, totalSlides]);

  if (placesSection.visible === false || totalSlides === 0) {
    return null;
  }

  const handlePrev = () => {
    targetXRef.current -= stepWidthRef.current;
    startAnimationTick();
  };

  const handleNext = () => {
    targetXRef.current += stepWidthRef.current;
    startAnimationTick();
  };

  return (
    <section
      ref={sectionRef}
      className="section wrap places-staggered-section"
      id="places"
    >
      <div className="section-head">
        <div>
          <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
            {placesSection.eyebrow}
          </div>
          <h2 className="serif">
            {placesSection.headingLine1}
            <br />
            <em style={{ color: 'var(--terracotta)' }}>
              {placesSection.headingItalic}
            </em>
          </h2>
        </div>
        <div>
          <p>{placesSection.description}</p>
          <div style={{ marginTop: '12px' }}>
            <Link
              className="pill"
              href={placesSection.ctaHref || '/destinations'}
              prefetch={false}
            >
              {placesSection.ctaLabel}
            </Link>
          </div>
        </div>
      </div>

      <div
        className="places-staggered-slider-wrap"
        onMouseEnter={() => {
          isHoveredRef.current = true;
        }}
        onMouseLeave={() => {
          isHoveredRef.current = false;
        }}
      >
        <button
          type="button"
          className="places-staggered-arrow prev"
          onClick={handlePrev}
          aria-label="Previous place image"
        >
          <ChevronLeft size={28} strokeWidth={2.4} />
        </button>

        <div className="places-staggered-viewport">
          <div ref={trackRef} className="places-staggered-track">
            {infiniteSlides.map((slide, idx) => (
              <div
                key={`${slide.id}-${idx}`}
                className={`place staggered-place-card variant-${slide.variant}`}
              >
                <CmsImage
                  imageRef={slide.imageRef}
                  src={slide.image}
                  alt={slide.imageRef?.alt || slide.name}
                  fill
                  sizes="(max-width: 720px) 180px, 230px"
                  className="object-cover"
                />
                <div className="place-name staggered-place-label">
                  {slide.name}
                  <small>{slide.subtitle}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="places-staggered-arrow next"
          onClick={handleNext}
          aria-label="Next place image"
        >
          <ChevronRight size={28} strokeWidth={2.4} />
        </button>
      </div>
    </section>
  );
}
