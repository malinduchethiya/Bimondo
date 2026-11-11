'use client';

import React, { useEffect, useRef } from 'react';
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
  // Triple the array for seamless infinite loop in both directions
  const infiniteSlides = [...slides, ...slides, ...slides];

  const trackRef = useRef<HTMLDivElement | null>(null);
  const singleSetWidthRef = useRef<number>(0);
  const stepWidthRef = useRef<number>(224);
  const currentXRef = useRef<number>(0);
  const targetXRef = useRef<number>(0);
  const isHoveredRef = useRef<boolean>(false);

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
          const prevSetWidth = singleSetWidthRef.current;
          singleSetWidthRef.current = setWidth;
          stepWidthRef.current = setWidth / totalSlides;
          if (prevSetWidth === 0) {
            // Start at the middle set so both left and right arrows have infinite room
            currentXRef.current = setWidth;
            targetXRef.current = setWidth;
          }
        }
      }
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [totalSlides]);

  // Step forward 1 image from right to left every 2 seconds
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!isHoveredRef.current) {
        targetXRef.current += stepWidthRef.current;
      }
    }, AUTO_STEP_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, []);

  // 60fps smooth interpolation & seamless infinite wrapping
  useEffect(() => {
    let rafId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Smooth ease toward targetXRef
      const diff = targetXRef.current - currentXRef.current;
      if (Math.abs(diff) > 0.2) {
        currentXRef.current += diff * Math.min(1, dt * 8.5);
      } else {
        currentXRef.current = targetXRef.current;
      }

      const setWidth = singleSetWidthRef.current;
      if (setWidth > 0) {
        // Keep within the middle set [setWidth * 0.5, setWidth * 1.5)
        if (currentXRef.current >= setWidth * 2) {
          currentXRef.current -= setWidth;
          targetXRef.current -= setWidth;
        } else if (currentXRef.current < setWidth * 0.5) {
          currentXRef.current += setWidth;
          targetXRef.current += setWidth;
        }
      }

      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(-${currentXRef.current.toFixed(
          2
        )}px, 0, 0)`;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  const handlePrev = () => {
    targetXRef.current -= stepWidthRef.current;
  };

  const handleNext = () => {
    targetXRef.current += stepWidthRef.current;
  };

  return (
    <section className="section wrap places-staggered-section" id="places">
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
