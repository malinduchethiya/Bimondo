'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSiteCms } from '@/hooks/useSiteCms';

interface TouristThoughtCard {
  id: string;
  name: string;
  subtitle: string;
  thought: string;
  image: string;
}

const DEFAULT_TOURIST_THOUGHTS: TouristThoughtCard[] = [
  {
    id: 'thought-1',
    name: 'David & Sarah Miller',
    subtitle: 'United Kingdom · Grand Island Journey',
    thought:
      '“Traveling privately with Bimondo made Sri Lanka feel effortless. From climbing Sigiriya at dawn to quiet tea hills in Ella, every day moved at our own pace.”',
    image:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'thought-2',
    name: 'Claire Dubois',
    subtitle: 'France · Pekoe Trail & South Coast',
    thought:
      '“Walking stages of The Pekoe Trail and finishing along the southern coast in Galle was unforgettable. Our guide shared the real Sri Lanka with such warmth.”',
    image:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'thought-3',
    name: 'Liam & Chloe Reynolds',
    subtitle: 'Australia · Surf, Safari & Coast',
    thought:
      '“Morning surf sessions in Weligama, watching wild elephants gather in Udawalawe, and 24-hour support from the Battaramulla team — truly a feeling you carry home.”',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'thought-4',
    name: 'Ananya & Rohan Sharma',
    subtitle: 'India · Cultural Triangle & Hills',
    thought:
      '“Every detail was thoughtfully arranged for our family. Visiting Kandy, Nuwara Eliya, and Bentota with a private driver made the whole trip calm and memorable.”',
    image:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'thought-5',
    name: 'Lukas & Hannah Weber',
    subtitle: 'Germany · Wildlife & Rainforests',
    thought:
      '“Our safaris in Yala and Wilpattu were handled with genuine respect for nature. Starting with the Thalangama wetland walk near Colombo was a wonderful touch.”',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'thought-6',
    name: 'Sofía & Mateo Rossi',
    subtitle: 'Italy · Romance in Ceylon',
    thought:
      '“From candlelit hill-country stays in Ella to sunset walks along Galle Fort ramparts, our honeymoon felt completely personal from arrival to departure.”',
    image:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
  },
];

// Train speed in pixels per second moving from right to left (desktop & tablet)
const TRAIN_SPEED_PX_PER_SEC = 85;

export default function ValuesSection() {
  const { cms } = useSiteCms();

  const cards: TouristThoughtCard[] =
    Array.isArray(cms.reviews) && cms.reviews.length > 0
      ? cms.reviews.map((rev, idx) => ({
          id: rev.id || `rev-${idx}`,
          name: rev.name,
          subtitle: [rev.location, rev.tour].filter(Boolean).join(' · '),
          thought: rev.quote,
          image:
            rev.image ||
            DEFAULT_TOURIST_THOUGHTS[idx % DEFAULT_TOURIST_THOUGHTS.length]
              .image,
        }))
      : DEFAULT_TOURIST_THOUGHTS;

  const totalCards = cards.length;
  // Duplicate cards 2x for seamless continuous train motion with minimal DOM nodes
  const trainCards = [...cards, ...cards];
  // First 4 cards for mobile vertical phone 2x2 square grid gallery
  const mobileGridCards = cards.slice(0, 4);

  const sectionRef = useRef<HTMLElement | null>(null);
  const ribbonRef = useRef<HTMLDivElement | null>(null);
  const dotsRef = useRef<HTMLDivElement | null>(null);
  const firstSetWidthRef = useRef<number>(0);
  const singleCardStepRef = useRef<number>(330);
  const currentOffsetRef = useRef<number>(0);
  const targetNudgeRef = useRef<number>(0);
  const isHoveredRef = useRef<boolean>(false);
  const currentVelocityFactorRef = useRef<number>(1);
  const isVisibleRef = useRef<boolean>(false);

  useEffect(() => {
    const measureTrack = () => {
      const ribbon = ribbonRef.current;
      if (!ribbon) return;
      const children = ribbon.children;
      if (children.length > totalCards) {
        const firstCard = children[0] as HTMLElement;
        const secondSetFirstCard = children[totalCards] as HTMLElement;
        const setWidth = secondSetFirstCard.offsetLeft - firstCard.offsetLeft;
        if (setWidth > 0) {
          firstSetWidthRef.current = setWidth;
          singleCardStepRef.current = setWidth / totalCards;
        }
      }
    };

    measureTrack();
    window.addEventListener('resize', measureTrack, { passive: true });
    return () => window.removeEventListener('resize', measureTrack);
  }, [totalCards]);

  useEffect(() => {
    let rafId: number | null = null;
    let lastTime = performance.now();
    let lastReportedDot = 0;

    const updateDotDom = (activeIdx: number) => {
      const container = dotsRef.current;
      if (!container) return;
      const buttons = container.children;
      for (let i = 0; i < buttons.length; i++) {
        const btn = buttons[i] as HTMLElement;
        const isActive = i === activeIdx;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      }
    };

    const animateTrain = (now: number) => {
      if (
        !isVisibleRef.current ||
        document.hidden ||
        window.innerWidth <= 767
      ) {
        rafId = null;
        return;
      }

      const dt = Math.min((now - lastTime) / 1000, 0.06);
      lastTime = now;

      // Smoothly ramp speed down on hover and back up on leave
      const targetVel = isHoveredRef.current ? 0 : 1;
      currentVelocityFactorRef.current +=
        (targetVel - currentVelocityFactorRef.current) * Math.min(1, dt * 8);

      // Continuous right-to-left train movement
      currentOffsetRef.current +=
        TRAIN_SPEED_PX_PER_SEC * currentVelocityFactorRef.current * dt;

      // Apply any smooth manual nudge from arrows/dots
      if (Math.abs(targetNudgeRef.current) > 0.5) {
        const step = targetNudgeRef.current * Math.min(1, dt * 10);
        currentOffsetRef.current += step;
        targetNudgeRef.current -= step;
      } else if (targetNudgeRef.current !== 0) {
        currentOffsetRef.current += targetNudgeRef.current;
        targetNudgeRef.current = 0;
      }

      const setWidth = firstSetWidthRef.current;
      if (setWidth > 0) {
        if (currentOffsetRef.current >= setWidth) {
          currentOffsetRef.current -= setWidth;
        } else if (currentOffsetRef.current < 0) {
          currentOffsetRef.current += setWidth;
        }

        const cardStep = singleCardStepRef.current || setWidth / totalCards;
        const currentDot =
          Math.floor((currentOffsetRef.current + cardStep * 0.35) / cardStep) %
          totalCards;
        if (currentDot !== lastReportedDot) {
          lastReportedDot = currentDot;
          updateDotDom(currentDot);
        }
      }

      if (ribbonRef.current) {
        ribbonRef.current.style.transform = `translate3d(-${currentOffsetRef.current.toFixed(
          1
        )}px, 0, 0)`;
      }

      rafId = window.requestAnimationFrame(animateTrain);
    };

    const startLoopIfNeeded = () => {
      if (
        rafId === null &&
        isVisibleRef.current &&
        !document.hidden &&
        window.innerWidth > 767
      ) {
        lastTime = performance.now();
        rafId = window.requestAnimationFrame(animateTrain);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisibleRef.current = Boolean(entry?.isIntersecting);
        if (isVisibleRef.current) {
          startLoopIfNeeded();
        } else if (rafId !== null) {
          window.cancelAnimationFrame(rafId);
          rafId = null;
        }
      },
      { threshold: 0.05 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    const onVisibilityChange = () => {
      if (document.hidden && rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      } else {
        startLoopIfNeeded();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('resize', startLoopIfNeeded, { passive: true });

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', startLoopIfNeeded);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [totalCards]);

  const handlePrev = () => {
    targetNudgeRef.current -= singleCardStepRef.current;
  };

  const handleNext = () => {
    targetNudgeRef.current += singleCardStepRef.current;
  };

  const handleDotClick = (dotIndex: number) => {
    const desiredOffset = dotIndex * singleCardStepRef.current;
    const diff = desiredOffset - currentOffsetRef.current;
    targetNudgeRef.current = diff;
  };

  return (
    <section
      ref={sectionRef}
      className="section values sliding-cards-section"
      id="why"
    >
      <div className="wrap sliding-cards-wrap">
        <div className="thoughts-section-heading-bar">
          <span className="eyebrow" style={{ color: '#3b71fe' }}>
            05 / TRAVELLER THOUGHTS
          </span>
          <h2 className="serif thoughts-section-title">
            Stories carried <em style={{ color: '#3b71fe' }}>home.</em>
          </h2>
        </div>

        {/* DESKTOP & TABLET FORMAT (>= 768px): Continuous Right-to-Left Train Slider */}
        <div
          className="tourist-reviews-widget sliding-cards-shell desktop-train-view"
          onMouseEnter={() => {
            isHoveredRef.current = true;
          }}
          onMouseLeave={() => {
            isHoveredRef.current = false;
          }}
        >
          <div className="sliding-cards-stage">
            <button
              type="button"
              className="sliding-cards-arrow prev"
              onClick={handlePrev}
              aria-label="Slide train right"
            >
              <ChevronLeft size={36} strokeWidth={2.4} />
            </button>

            <div className="sliding-cards-viewport">
              <div ref={ribbonRef} className="sliding-train-ribbon">
                {trainCards.map((card, idx) => (
                  <article
                    key={`${card.id}-cart-${idx}`}
                    className="sliding-profile-card train-cart-card"
                  >
                    <div className="sliding-card-image-header">
                      <span className="sliding-card-overlay" />
                      <div className="sliding-card-avatar">
                        <Image
                          src={card.image}
                          alt={card.name}
                          fill
                          sizes="132px"
                          className="sliding-card-avatar-img"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>

                    <div className="sliding-card-body">
                      <h3 className="sliding-card-title">{card.name}</h3>
                      {card.subtitle && (
                        <span className="sliding-card-subtitle">
                          {card.subtitle}
                        </span>
                      )}
                      <p className="sliding-card-desc">{card.thought}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="sliding-cards-arrow next"
              onClick={handleNext}
              aria-label="Slide train left"
            >
              <ChevronRight size={36} strokeWidth={2.4} />
            </button>
          </div>

          <div
            ref={dotsRef}
            className="sliding-cards-dots"
            role="tablist"
            aria-label="Tourist thoughts pagination"
          >
            {cards.map((card, i) => (
              <button
                key={card.id}
                type="button"
                role="tab"
                aria-selected={i === 0}
                className={`sliding-cards-dot ${i === 0 ? 'active' : ''}`}
                onClick={() => handleDotClick(i)}
                aria-label={`Jump to tourist thought ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* MOBILE VERTICAL PHONE FORMAT (<= 767px): 4-Card 2x2 Square Grid Gallery (Non-Touch-Interactive so Normal Downward Scrolling Works) */}
        <div
          className="mobile-thoughts-square-grid"
          aria-label="Tourist thoughts square grid gallery"
        >
          {mobileGridCards.map((card) => (
            <article key={card.id} className="mobile-thought-square-card">
              <div className="mobile-thought-card-top">
                <div className="mobile-thought-avatar">
                  <Image
                    src={card.image}
                    alt={card.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="mobile-thought-meta">
                  <h3 className="mobile-thought-name">{card.name}</h3>
                  {card.subtitle && (
                    <span className="mobile-thought-sub">{card.subtitle}</span>
                  )}
                </div>
              </div>
              <p className="mobile-thought-quote">{card.thought}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
