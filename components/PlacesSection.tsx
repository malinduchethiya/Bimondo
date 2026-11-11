'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSiteCms } from '@/hooks/useSiteCms';
import { StaggerSlideVariant } from '@/lib/cms-defaults';

interface StaggeredPlaceSlide {
  id: string;
  name: string;
  subtitle: string;
  image: string;
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

const FALLBACK_PLACE_SLIDES: StaggeredPlaceSlide[] = [
  {
    id: 'sigiriya',
    name: 'Sigiriya',
    subtitle: 'Cultural Triangle',
    image:
      'https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=900&q=85',
    variant: 'tall-up',
  },
  {
    id: 'ella-hills',
    name: 'Ella & Pekoe Trail',
    subtitle: 'Hill Country & Hiking',
    image:
      'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=900&q=85',
    variant: 'low-down',
  },
  {
    id: 'galle-coast',
    name: 'Galle & Mirissa',
    subtitle: 'Sea & Sand Escapes',
    image:
      'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=900&q=85',
    variant: 'mid-up',
  },
  {
    id: 'kandy-heritage',
    name: 'Kandy',
    subtitle: 'Sacred Hill Capital',
    image:
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=900&q=85',
    variant: 'compact-mid',
  },
  {
    id: 'yala-safari',
    name: 'Yala & Udawalawe',
    subtitle: 'Wildlife & Nature',
    image:
      'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&w=900&q=85',
    variant: 'mid-up',
  },
  {
    id: 'kitulgala-falls',
    name: 'Kitulgala & Horton Plains',
    subtitle: 'Waterfalls & Cloud Forests',
    image:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=85',
    variant: 'tall-deep',
  },
  {
    id: 'minneriya',
    name: 'Minneriya & Wilpattu',
    subtitle: 'National Park Safaris',
    image:
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=900&q=85',
    variant: 'low-down',
  },
  {
    id: 'arugam-weligama',
    name: 'Weligama & Arugam Bay',
    subtitle: 'Surf & Coastal Lagoons',
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85',
    variant: 'compact-mid',
  },
];

const AUTO_STEP_INTERVAL_MS = 2000;

export default function PlacesSection() {
  const { cms } = useSiteCms();

  const slides: StaggeredPlaceSlide[] =
    Array.isArray(cms.destinations) && cms.destinations.length > 0
      ? cms.destinations.map((dest, idx) => ({
          id: dest.id,
          name: dest.name.split(',')[0].trim(),
          subtitle: dest.regionLabel,
          image: dest.image,
          variant:
            dest.staggerVariant ||
            DEFAULT_VARIANTS[idx % DEFAULT_VARIANTS.length],
        }))
      : FALLBACK_PLACE_SLIDES;

  const totalSlides = slides.length;
  // Duplicate 2x for seamless infinite loop with fewer DOM nodes
  const infiniteSlides = [...slides, ...slides];

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

      // Stop RAF loop once target is reached so 0% CPU is used while resting between 2s steps
      if (Math.abs(targetXRef.current - currentXRef.current) > 0.25) {
        rafIdRef.current = window.requestAnimationFrame(tick);
      } else {
        rafIdRef.current = null;
      }
    };

    rafIdRef.current = window.requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
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
  }, [startAnimationTick]);

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
            04 / REGIONS WE COVER ACROSS SRI LANKA
          </div>
          <h2 className="serif">
            From ancient capitals
            <br />
            <em style={{ color: 'var(--terracotta)' }}>to wild coasts.</em>
          </h2>
        </div>
        <div>
          <p>
            Including our Colombo &amp; Battaramulla home base—with half-day and
            full-day experiences across Thalangama Wetland, Colombo, Kotte,
            Kelaniya, and Negombo Lagoon.
          </p>
          <div style={{ marginTop: '12px' }}>
            <Link className="pill" href="/destinations" prefetch={false}>
              EXPLORE ALL DESTINATIONS &amp; DAY TRIPS ↗
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
                <Image
                  alt={slide.name}
                  src={slide.image}
                  fill
                  sizes="(max-width: 720px) 180px, 230px"
                  className="object-cover"
                  referrerPolicy="no-referrer"
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
