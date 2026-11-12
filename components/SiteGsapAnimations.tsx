'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function SiteGsapAnimations() {
  const pathname = usePathname();
  const [clientPath, setClientPath] = useState<string | null>(null);

  useEffect(() => {
    const onNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setClientPath(customEvent.detail);
      }
    };
    const onPopState = () => {
      setClientPath(window.location.pathname);
    };
    window.addEventListener('bimondo:navigate', onNavigate);
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('bimondo:navigate', onNavigate);
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  const activeRoute = clientPath ?? pathname;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let ctx: gsap.Context | null = null;
    let rafId: number | null = null;

    rafId = window.requestAnimationFrame(() => {
      const width = window.innerWidth;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width <= 1080;
      const moveY = isMobile ? 16 : isTablet ? 22 : 28;

      ctx = gsap.context(() => {
        // 1. HERO SECTION & PAGE BANNERS
        const heroCopy = document.querySelector('.hero .hero-copy');
        if (heroCopy) {
          const eyebrow = heroCopy.querySelector('.hero-eyebrow');
          const heading = heroCopy.querySelector('h1');
          const desc = heroCopy.querySelector('p');
          const actions = heroCopy.querySelectorAll('.hero-actions .pill');

          const heroTl = gsap.timeline({
            defaults: { ease: 'power3.out', force3D: true },
          });

          if (eyebrow) {
            heroTl.fromTo(
              eyebrow,
              { y: 14, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.55 }
            );
          }
          if (heading) {
            heroTl.fromTo(
              heading,
              { y: moveY, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.7 },
              '-=0.38'
            );
          }
          if (desc) {
            heroTl.fromTo(
              desc,
              { y: 16, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.6 },
              '-=0.45'
            );
          }
          if (actions.length > 0) {
            heroTl.fromTo(
              actions,
              { y: 14, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.5, stagger: 0.06 },
              '-=0.4'
            );
          }
        }

        const pageBanner = document.querySelector('.page-banner');
        if (pageBanner) {
          const bannerEls = pageBanner.querySelectorAll('.eyebrow, h1');
          if (bannerEls.length > 0) {
            gsap.fromTo(
              bannerEls,
              { y: moveY, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.65,
                stagger: 0.08,
                ease: 'power3.out',
                force3D: true,
              }
            );
          }
        }

        // 2. HERO TRANSITION STRIP (3-pillar card)
        const transitionSection = document.querySelector(
          '.hero-transition-section'
        );
        if (transitionSection) {
          gsap.fromTo(
            transitionSection,
            { y: 20, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.6,
              ease: 'power3.out',
              force3D: true,
              scrollTrigger: {
                trigger: transitionSection,
                start: 'top 94%',
                once: true,
              },
            }
          );
        }

        // 3. STORY SECTION ("Come as a traveller. Leave as a friend.")
        const storySection = document.querySelector(
          '#story'
        ) as HTMLElement | null;
        if (storySection) {
          const mainImg = storySection.querySelector('.story-images .main');
          const smallImg = storySection.querySelector('.story-images .small');
          const storyCopyEls = storySection.querySelectorAll(
            ':scope > div:last-child > *'
          );

          if (mainImg) {
            gsap.fromTo(
              mainImg,
              { y: 20, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.7,
                ease: 'power3.out',
                force3D: true,
                scrollTrigger: {
                  trigger: storySection,
                  start: 'top 85%',
                  once: true,
                },
              }
            );
          }

          if (smallImg) {
            gsap.fromTo(
              smallImg,
              { y: 24, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.7,
                delay: 0.08,
                ease: 'power3.out',
                force3D: true,
                scrollTrigger: {
                  trigger: storySection,
                  start: 'top 83%',
                  once: true,
                },
              }
            );
          }

          if (storyCopyEls.length > 0) {
            gsap.fromTo(
              storyCopyEls,
              { y: moveY, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.65,
                stagger: 0.06,
                ease: 'power3.out',
                force3D: true,
                scrollTrigger: {
                  trigger: storySection,
                  start: 'top 82%',
                  once: true,
                },
              }
            );
          }
        }

        // 4. VERTICAL FLYOVER SECTION STACK (From #story through #contact)
        // Subtle, clean downward flyover effect across all homepage sections
        if (storySection && storySection.parentElement) {
          const allDirectSections = Array.from(
            storySection.parentElement.querySelectorAll(':scope > section')
          ) as HTMLElement[];
          const storyIndex = allDirectSections.indexOf(storySection);

          if (storyIndex !== -1 && storyIndex < allDirectSections.length - 1) {
            const flyoverSections = allDirectSections.slice(storyIndex);

            flyoverSections.forEach((sec, idx) => {
              sec.classList.remove('horizontal-panel-section');
              if (idx === 0) {
                sec.classList.add('flyover-anchor-section');
                sec.style.zIndex = '10';
              } else {
                sec.classList.add('flyover-panel');
                sec.style.zIndex = String(10 + idx);
              }
            });

            for (let i = 0; i < flyoverSections.length - 1; i++) {
              const prevSec = flyoverSections[i];
              const nextSec = flyoverSections[i + 1];

              // Previous section gently recedes as the next section flies over it
              gsap.fromTo(
                prevSec,
                {
                  y: 0,
                  scale: 1,
                },
                {
                  y: isMobile ? 24 : isTablet ? 36 : 48,
                  scale: isMobile ? 0.985 : isTablet ? 0.98 : 0.975,
                  transformOrigin: 'center bottom',
                  ease: 'none',
                  force3D: true,
                  scrollTrigger: {
                    trigger: nextSec,
                    start: 'top 96%',
                    end: 'top 20%',
                    scrub: true,
                  },
                }
              );

              // Subtle flyover lift on the incoming section's inner content
              const innerTarget =
                (nextSec.querySelector(':scope > .wrap') as HTMLElement) ||
                (nextSec.querySelector(
                  ':scope > .planning-top-split'
                ) as HTMLElement);
              if (innerTarget) {
                gsap.fromTo(
                  innerTarget,
                  { y: isMobile ? 18 : 26, opacity: 0.92 },
                  {
                    y: 0,
                    opacity: 1,
                    duration: 0.65,
                    ease: 'power2.out',
                    force3D: true,
                    scrollTrigger: {
                      trigger: nextSec,
                      start: 'top 88%',
                      once: true,
                    },
                  }
                );
              }
            }
          }
        }

        // 5. SUBPAGE GRIDS & CARDS (Once-only GPU reveal)
        const subpageCards = document.querySelectorAll(
          '.destination-detail-card, .package-card, .gallery-item, .tour-card, .founder-quote-card, .dest-custom-cta-box'
        );
        if (subpageCards.length > 0) {
          subpageCards.forEach((card) => {
            gsap.fromTo(
              card,
              { y: 20, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.55,
                ease: 'power2.out',
                force3D: true,
                scrollTrigger: {
                  trigger: card,
                  start: 'top 92%',
                  once: true,
                },
              }
            );
          });
        }
      });

      ScrollTrigger.refresh();
    });

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      if (ctx) {
        ctx.revert();
        ctx = null;
      }
    };
  }, [activeRoute]);

  return null;
}
