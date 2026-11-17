'use client';

import React, { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSiteCms } from '@/hooks/useSiteCms';
import { CmsImageRef, createImageRef } from '@/lib/cms-defaults';
import CmsImage from '@/components/CmsImage';

interface TouristThoughtCard {
  id: string;
  name: string;
  subtitle: string;
  thought: string;
  image: string;
  imageRef: CmsImageRef;
}

const TRAIN_SPEED_PX_PER_SEC = 85;

const DOCUMENTED_PROFILE_MAP: Record<
  string,
  { name: string; location: string; tour: string; quote: string }
> = {
  'thought-1': {
    name: 'United Kingdom & Europe Travellers',
    location: 'United Kingdom & Europe',
    tour: 'Ceylon Grand Circuit & Ancient Kingdoms',
    quote:
      'Longer 10 to 14-day private island journeys combining the ancient capitals of Sigiriya, Anuradhapura, Polonnaruwa, and Kandy with tea-country rail journeys, national park safaris, and unhurried south-coast stays.',
  },
  'thought-2': {
    name: 'Hiking, Tea Hills & Slow Travel',
    location: 'United Kingdom & Europe',
    tour: 'The Pekoe Trail Walk & Galle Coast',
    quote:
      'Curated walking stages on The Pekoe Trail from Kandy through the highland tea estates to Ella with point-to-point luggage transfers, followed by boutique heritage stays and coastal relaxation in Galle.',
  },
  'thought-3': {
    name: 'Australian Surf & Active Travellers',
    location: 'Australia',
    tour: 'Australian Adventure Combo & Surf Circuits',
    quote:
      'Active 8 to 12-day journeys timed to the right coast for the season—pairing warm-water surf breaks in Weligama (Nov–Apr) or Arugam Bay (May–Oct) with highland hikes, wildlife safaris, and 24-hour local support.',
  },
  'thought-4': {
    name: 'Indian Couples, Families & Small Groups',
    location: 'India',
    tour: 'India to Island Express & Hill Country',
    quote:
      'Convenient short and medium breaks connecting Colombo shopping, Kandy heritage, cool Nuwara Eliya tea hills, and Bentota beaches—with private air-conditioned vehicles and vegetarian-friendly four-star to five-star hotels.',
  },
  'thought-5': {
    name: 'Wildlife, Rainforest & Nature Lovers',
    location: 'International Private Guests',
    tour: 'Leopards, Elephants, Whales & Sinharaja',
    quote:
      'Responsible wildlife safaris across Yala, Udawalawe, Wilpattu, and Minneriya with experienced naturalists, UNESCO Sinharaja rainforest walks, and early morning birdwalks around Thalangama Wetland near Colombo.',
  },
  'thought-6': {
    name: 'Families & Multi-Generational Guests',
    location: 'Families & Private Groups',
    tour: 'Family Island Discovery & Little Explorers',
    quote:
      'Thoughtfully paced family holidays with shorter driving days, interconnecting family rooms, safe beaches, the Udawalawe Elephant Transit Home, scenic highland train rides, and attentive private drivers.',
  },
};

const UNVERIFIED_NAMES = new Set([
  'David & Sarah Miller',
  'Claire Dubois',
  'Liam & Chloe Reynolds',
  'Ananya & Rohan Sharma',
  'Lukas & Hannah Weber',
  'Sofía & Mateo Rossi',
]);

export default function ValuesSection() {
  const { cms } = useSiteCms();
  const reviewsHeading = cms.pages.home.valuesReviews;

  const visibleReviews = Array.isArray(cms.reviews)
    ? [...cms.reviews]
        .filter((r) => r.visible !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : [];

  const cards: TouristThoughtCard[] = visibleReviews.map((rev, idx) => {
    const fallbackProfile = DOCUMENTED_PROFILE_MAP[rev.id];
    const isLegacyUnverified =
      UNVERIFIED_NAMES.has(rev.name) && Boolean(fallbackProfile);
    const displayName = isLegacyUnverified ? fallbackProfile.name : rev.name;
    const displayLocation = isLegacyUnverified
      ? fallbackProfile.location
      : rev.location;
    const displayTour = isLegacyUnverified ? fallbackProfile.tour : rev.tour;
    const displayQuote = isLegacyUnverified ? fallbackProfile.quote : rev.quote;

    return {
      id: rev.id || `rev-${idx}`,
      name: displayName,
      subtitle: [displayLocation, displayTour].filter(Boolean).join(' · '),
      thought: displayQuote,
      image: rev.imageRef?.url || rev.image || '',
      imageRef: rev.imageRef || createImageRef(rev.image || '', displayName),
    };
  });

  const totalCards = cards.length;
  const trainCards = totalCards > 0 ? [...cards, ...cards] : [];
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
    if (totalCards === 0) return;
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
    if (totalCards === 0) return;
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

      const targetVel = isHoveredRef.current ? 0 : 1;
      currentVelocityFactorRef.current +=
        (targetVel - currentVelocityFactorRef.current) * Math.min(1, dt * 8);

      currentOffsetRef.current +=
        TRAIN_SPEED_PX_PER_SEC * currentVelocityFactorRef.current * dt;

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

  if (reviewsHeading.visible === false || totalCards === 0) {
    return null;
  }

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
            {reviewsHeading.eyebrow}
          </span>
          <h2 className="serif thoughts-section-title">
            {reviewsHeading.headingPrefix}{' '}
            <em style={{ color: '#3b71fe' }}>{reviewsHeading.headingItalic}</em>
          </h2>
        </div>

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
                        <CmsImage
                          imageRef={card.imageRef}
                          src={card.image}
                          alt={card.imageRef?.alt || card.name}
                          fill
                          sizes="132px"
                          loading={idx < totalCards ? 'eager' : 'lazy'}
                          className="sliding-card-avatar-img"
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

        <div
          className="mobile-thoughts-square-grid"
          aria-label="Tourist thoughts square grid gallery"
        >
          {mobileGridCards.map((card) => (
            <article key={card.id} className="mobile-thought-square-card">
              <div className="mobile-thought-card-top">
                <div className="mobile-thought-avatar">
                  <CmsImage
                    imageRef={card.imageRef}
                    src={card.image}
                    alt={card.imageRef?.alt || card.name}
                    fill
                    sizes="56px"
                    loading="eager"
                    className="object-cover"
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
