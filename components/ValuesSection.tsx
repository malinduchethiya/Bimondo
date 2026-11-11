'use client';

import React, { useState, useEffect, useRef } from 'react';
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

// Train speed in pixels per second moving from right to left
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
            DEFAULT_TOURIST_THOUGHTS[idx % DEFAULT_TOURIST_THOUGHTS.length]
              .image,
        }))
      : DEFAULT_TOURIST_THOUGHTS;

  const totalCards = cards.length;
  // Duplicate cards 3x so the train track never runs out of carriages during continuous motion or manual nudges
  const trainCards = [...cards, ...cards, ...cards];

  const ribbonRef = useRef<HTMLDivElement | null>(null);
  const firstSetWidthRef = useRef<number>(0);
  const singleCardStepRef = useRef<number>(330);
  const currentOffsetRef = useRef<number>(0);
  const targetNudgeRef = useRef<number>(0);
  const isHoveredRef = useRef<boolean>(false);
  const currentVelocityFactorRef = useRef<number>(1);
  const [activeDot, setActiveDot] = useState<number>(0);

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
    window.addEventListener('resize', measureTrack);
    return () => window.removeEventListener('resize', measureTrack);
  }, [totalCards]);

  useEffect(() => {
    let rafId: number;
    let lastTime = performance.now();
    let lastReportedDot = 0;

    const animateTrain = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
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
        // Keep offset wrapped seamlessly within [0, setWidth)
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
          setActiveDot(currentDot);
        }
      }

      if (ribbonRef.current) {
        ribbonRef.current.style.transform = `translate3d(-${currentOffsetRef.current.toFixed(
          2
        )}px, 0, 0)`;
      }

      rafId = window.requestAnimationFrame(animateTrain);
    };

    rafId = window.requestAnimationFrame(animateTrain);
    return () => window.cancelAnimationFrame(rafId);
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
    <section className="section values sliding-cards-section" id="why">
      <div className="wrap sliding-cards-wrap">
        <div
          className="tourist-reviews-widget sliding-cards-shell"
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
            className="sliding-cards-dots"
            role="tablist"
            aria-label="Tourist thoughts pagination"
          >
            {cards.map((card, i) => (
              <button
                key={card.id}
                type="button"
                role="tab"
                aria-selected={activeDot === i}
                className={`sliding-cards-dot ${
                  activeDot === i ? 'active' : ''
                }`}
                onClick={() => handleDotClick(i)}
                aria-label={`Jump to tourist thought ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
