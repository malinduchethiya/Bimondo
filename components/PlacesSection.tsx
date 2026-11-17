'use client';

import React, { useEffect, useRef, useState } from 'react';
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

const AUTO_STEP_INTERVAL_MS = 3200;

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

  const sectionRef = useRef<HTMLElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const stepWidthRef = useRef<number>(226);
  const maxOffsetRef = useRef<number>(0);
  const isHoveredRef = useRef<boolean>(false);
  const isVisibleRef = useRef<boolean>(false);
  const isScrollingRef = useRef<boolean>(false);
  const [stepIndex, setStepIndex] = useState<number>(0);

  useEffect(() => {
    if (totalSlides === 0) return;

    const measure = () => {
      const track = trackRef.current;
      const viewport = viewportRef.current;
      if (!track || !viewport) return;
      const items = track.children;
      if (items.length >= 2) {
        const firstEl = items[0] as HTMLElement;
        const secondEl = items[1] as HTMLElement;
        const step = secondEl.offsetLeft - firstEl.offsetLeft;
        if (step > 0) {
          stepWidthRef.current = step;
        }
      }
      maxOffsetRef.current = Math.max(
        0,
        track.scrollWidth - viewport.clientWidth
      );
    };

    measure();
    window.addEventListener('resize', measure, { passive: true });
    return () => window.removeEventListener('resize', measure);
  }, [totalSlides]);

  useEffect(() => {
    if (totalSlides <= 1) return;

    let scrollTimer: number | null = null;
    const onScroll = () => {
      isScrollingRef.current = true;
      if (scrollTimer !== null) window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        isScrollingRef.current = false;
      }, 220);
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        isVisibleRef.current = Boolean(entries[0]?.isIntersecting);
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    const interval = window.setInterval(() => {
      if (
        isVisibleRef.current &&
        !isHoveredRef.current &&
        !isScrollingRef.current &&
        !document.hidden
      ) {
        setStepIndex((prev) => {
          const next = prev + 1;
          const nextPx = next * stepWidthRef.current;
          if (
            maxOffsetRef.current > 0 &&
            nextPx > maxOffsetRef.current + stepWidthRef.current * 0.4
          ) {
            return 0;
          }
          return next >= totalSlides ? 0 : next;
        });
      }
    }, AUTO_STEP_INTERVAL_MS);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      if (scrollTimer !== null) window.clearTimeout(scrollTimer);
      window.clearInterval(interval);
    };
  }, [totalSlides]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const rawOffset = stepIndex * stepWidthRef.current;
    const clamped =
      maxOffsetRef.current > 0
        ? Math.min(rawOffset, maxOffsetRef.current)
        : rawOffset;
    track.style.transform = `translate3d(-${clamped.toFixed(0)}px, 0, 0)`;
  }, [stepIndex, totalSlides]);

  if (placesSection.visible === false || totalSlides === 0) {
    return null;
  }

  const handlePrev = () => {
    setStepIndex((prev) => (prev <= 0 ? Math.max(0, totalSlides - 3) : prev - 1));
  };

  const handleNext = () => {
    setStepIndex((prev) => {
      const next = prev + 1;
      const nextPx = next * stepWidthRef.current;
      if (
        maxOffsetRef.current > 0 &&
        nextPx > maxOffsetRef.current + stepWidthRef.current * 0.4
      ) {
        return 0;
      }
      return next >= totalSlides ? 0 : next;
    });
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

        <div ref={viewportRef} className="places-staggered-viewport">
          <div
            ref={trackRef}
            className="places-staggered-track"
            style={{
              transition:
                'transform 0.48s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            {slides.map((slide) => (
              <div
                key={slide.id}
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
