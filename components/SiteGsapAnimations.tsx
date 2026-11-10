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
      const moveY = isMobile ? 20 : isTablet ? 26 : 36;

      ctx = gsap.context(() => {
        // 1. HERO SECTION & PAGE BANNERS
        const heroCopy = document.querySelector('.hero .hero-copy');
        if (heroCopy) {
          const eyebrow = heroCopy.querySelector('.hero-eyebrow');
          const heading = heroCopy.querySelector('h1');
          const desc = heroCopy.querySelector('p');
          const actions = heroCopy.querySelectorAll('.hero-actions .pill');

          const heroTl = gsap.timeline({
            defaults: { ease: 'power3.out' },
          });

          if (eyebrow) {
            heroTl.fromTo(
              eyebrow,
              { y: 18, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.65 }
            );
          }
          if (heading) {
            heroTl.fromTo(
              heading,
              { y: moveY, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.85 },
              '-=0.42'
            );
          }
          if (desc) {
            heroTl.fromTo(
              desc,
              { y: 20, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.7 },
              '-=0.5'
            );
          }
          if (actions.length > 0) {
            heroTl.fromTo(
              actions,
              { y: 18, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.6, stagger: 0.08 },
              '-=0.45'
            );
          }
        }

        const heroPhoto = document.querySelector('.hero .hero-photo');
        if (heroPhoto) {
          gsap.fromTo(
            heroPhoto,
            { scale: 1.05, yPercent: 0 },
            {
              scale: 1,
              yPercent: isMobile ? 8 : 12,
              ease: 'none',
              scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: true,
              },
            }
          );
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
                duration: 0.8,
                stagger: 0.1,
                ease: 'power3.out',
              }
            );
          }
        }

        // 2. HERO TRANSITION STRIP (3-pillar card)
        const transitionSection = document.querySelector(
          '.hero-transition-section'
        );
        if (transitionSection) {
          const cards = transitionSection.querySelectorAll('.transition-card');
          gsap.fromTo(
            transitionSection,
            { y: 24, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.75,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: transitionSection,
                start: 'top 94%',
                toggleActions: 'play none none reverse',
              },
            }
          );

          if (cards.length > 0) {
            gsap.fromTo(
              cards,
              { y: 18, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.65,
                stagger: 0.1,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: transitionSection,
                  start: 'top 92%',
                  toggleActions: 'play none none reverse',
                },
              }
            );
          }
        }

        // 3. STORY SECTION ("Come as a traveller. Leave as a friend.")
        const storySection = document.querySelector('#story') as HTMLElement | null;
        if (storySection) {
          const mainImg = storySection.querySelector('.story-images .main');
          const smallImg = storySection.querySelector('.story-images .small');
          const storyCopyEls = storySection.querySelectorAll(
            ':scope > div:last-child > *'
          );

          if (mainImg) {
            gsap.fromTo(
              mainImg,
              { x: isMobile ? -20 : -40, y: 22, scale: 0.95, opacity: 0 },
              {
                x: 0,
                y: 0,
                scale: 1,
                opacity: 1,
                duration: 0.9,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: storySection,
                  start: 'top 85%',
                  toggleActions: 'play none none reverse',
                },
              }
            );
          }

          if (smallImg) {
            gsap.fromTo(
              smallImg,
              { x: isMobile ? 18 : 34, y: 28, scale: 0.92, opacity: 0 },
              {
                x: 0,
                y: 0,
                scale: 1,
                opacity: 1,
                duration: 0.9,
                delay: 0.12,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: storySection,
                  start: 'top 83%',
                  toggleActions: 'play none none reverse',
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
                duration: 0.75,
                stagger: 0.09,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: storySection,
                  start: 'top 80%',
                  toggleActions: 'play none none reverse',
                },
              }
            );
          }
        }

        // 4. FLYOVER SCROLL FOR #story -> #destinations-slider, THEN HORIZONTAL SCROLL FOR #discover AND BEYOND
        if (storySection && storySection.parentElement) {
          const allDirectSections = Array.from(
            storySection.parentElement.querySelectorAll(':scope > section')
          ) as HTMLElement[];
          const storyIndex = allDirectSections.indexOf(storySection);

          // 4A. Flyover stack ONLY for direct sections from #story up to #destinations-slider
          if (storyIndex !== -1 && storyIndex < allDirectSections.length - 1) {
            const flyoverSections = allDirectSections.slice(storyIndex);

            flyoverSections.forEach((sec, idx) => {
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

              gsap.fromTo(
                prevSec,
                {
                  y: 0,
                  scale: 1,
                  filter: 'brightness(1)',
                },
                {
                  y: isMobile ? 56 : isTablet ? 84 : 120,
                  scale: isMobile ? 0.955 : isTablet ? 0.945 : 0.935,
                  filter: 'brightness(0.85)',
                  transformOrigin: 'center bottom',
                  ease: 'none',
                  scrollTrigger: {
                    trigger: nextSec,
                    start: 'top 95%',
                    end: 'top 14%',
                    scrub: 0.5,
                  },
                }
              );

              gsap.fromTo(
                nextSec,
                {
                  y: isMobile ? 42 : isTablet ? 60 : 76,
                  scale: isMobile ? 0.98 : isTablet ? 0.974 : 0.968,
                },
                {
                  y: 0,
                  scale: 1,
                  transformOrigin: 'center top',
                  ease: 'power2.out',
                  scrollTrigger: {
                    trigger: nextSec,
                    start: 'top 98%',
                    end: 'top 22%',
                    scrub: 0.45,
                  },
                }
              );
            }
          }
        }

        // 4B. Alternating Horizontal Scroll Sequence (Right -> Left -> Right -> Left)
        const horizontalWrap = document.getElementById(
          'horizontal-scroll-wrap'
        ) as HTMLElement | null;
        const horizontalTrack = document.getElementById(
          'horizontal-scroll-track'
        ) as HTMLElement | null;

        if (horizontalWrap && horizontalTrack) {
          const panels = Array.from(
            horizontalTrack.querySelectorAll(':scope > section')
          ) as HTMLElement[];

          panels.forEach((sec, idx) => {
            sec.classList.remove('flyover-panel', 'flyover-anchor-section');
            sec.classList.add('horizontal-panel-section');
            sec.style.zIndex = String(10 + idx);
          });

          if (panels.length > 1) {
            // Set initial positions:
            // idx 0 (#discover): centered at xPercent: 0
            // idx 1 (#places): starts on RIGHT (+100%) -> slides to 0
            // idx 2 (#why): starts on LEFT (-100%) -> slides to 0
            // idx 3 (#planning-faq): starts on RIGHT (+100%) -> slides to 0
            // idx 4 (#contact): starts on LEFT (-100%) -> slides to 0
            gsap.set(panels[0], { xPercent: 0 });
            for (let i = 1; i < panels.length; i++) {
              const comesFromRight = i % 2 === 1;
              gsap.set(panels[i], { xPercent: comesFromRight ? 100 : -100 });
            }

            const holdDuration = 0.48;
            const slideDuration = 1;
            const getPanelHoldDistance = () =>
              Math.round(window.innerHeight * 0.55);
            const getTransitionDistance = () =>
              (panels.length - 1) * window.innerWidth;

            const horizTl = gsap.timeline({
              scrollTrigger: {
                trigger: horizontalWrap,
                pin: true,
                pinSpacing: true,
                start: 'top top',
                end: () =>
                  `+=${
                    panels.length * getPanelHoldDistance() +
                    getTransitionDistance()
                  }`,
                scrub: 0.3,
                invalidateOnRefresh: true,
                anticipatePin: 1,
              },
            });

            // 1. Initial full-screen hold on #discover before sliding to #places (and when scrolling back up)
            horizTl.to(panels[0], {
              xPercent: 0,
              ease: 'none',
              duration: holdDuration,
            });

            // 2. Alternating horizontal transitions + full-screen hold on each page upon arrival
            for (let i = 0; i < panels.length - 1; i++) {
              const currentPanel = panels[i];
              const nextPanel = panels[i + 1];
              const nextIndex = i + 1;
              // Odd nextIndex (1=#places, 3=#planning-faq) comes from RIGHT (+100 -> 0) while current exits LEFT (0 -> -100)
              // Even nextIndex (2=#why, 4=#contact) comes from LEFT (-100 -> 0) while current exits RIGHT (0 -> +100)
              const nextComesFromRight = nextIndex % 2 === 1;
              const stepLabel = `panelStep_${nextIndex}`;

              horizTl.addLabel(stepLabel);

              horizTl.fromTo(
                currentPanel,
                { xPercent: 0 },
                {
                  xPercent: nextComesFromRight ? -100 : 100,
                  ease: 'none',
                  duration: slideDuration,
                  immediateRender: false,
                },
                stepLabel
              );

              horizTl.fromTo(
                nextPanel,
                { xPercent: nextComesFromRight ? 100 : -100 },
                {
                  xPercent: 0,
                  ease: 'none',
                  duration: slideDuration,
                  immediateRender: false,
                },
                stepLabel
              );

              // Subtle internal element reveal synced with the panel's arrival
              const innerEls = nextPanel.querySelectorAll(
                '.section-head > *, .place, .value, .planning-intro-col > *, .tourist-reviews-widget, .minimal-faq-block'
              );
              if (innerEls.length > 0) {
                horizTl.fromTo(
                  innerEls,
                  {
                    x: nextComesFromRight ? 20 : -20,
                    opacity: 0.35,
                  },
                  {
                    x: 0,
                    opacity: 1,
                    duration: 0.65,
                    stagger: 0.02,
                    ease: 'power2.out',
                    immediateRender: false,
                  },
                  `${stepLabel}+=0.1`
                );
              }

              // Hold the newly arrived page at full screen (xPercent: 0) for extra mouse scroll before moving left or right
              horizTl.to(
                nextPanel,
                {
                  xPercent: 0,
                  ease: 'none',
                  duration: holdDuration,
                  immediateRender: false,
                },
                `${stepLabel}+=${slideDuration}`
              );
            }
          }
        }

        // 5. EXPERIENCE SECTION (#discover) INTERNAL ANIMATIONS
        const discoverSection = document.querySelector('#discover');
        if (discoverSection) {
          const leftCopyEls = discoverSection.querySelectorAll(
            '.experience-grid > div:first-child > *'
          );
          const expPhoto = discoverSection.querySelector('.experience-photo');
          const expCards = discoverSection.querySelectorAll('.experiences .exp');

          if (leftCopyEls.length > 0) {
            gsap.fromTo(
              leftCopyEls,
              { y: moveY, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.75,
                stagger: 0.09,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: discoverSection,
                  start: 'top 82%',
                  toggleActions: 'play none none reverse',
                },
              }
            );
          }

          if (expPhoto) {
            gsap.fromTo(
              expPhoto,
              { y: 30, scale: 0.94, opacity: 0 },
              {
                y: 0,
                scale: 1,
                opacity: 1,
                duration: 0.85,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: discoverSection,
                  start: 'top 80%',
                  toggleActions: 'play none none reverse',
                },
              }
            );
          }

          if (expCards.length > 0) {
            gsap.fromTo(
              expCards,
              { y: 26, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.7,
                stagger: 0.08,
                ease: 'back.out(1.2)',
                scrollTrigger: {
                  trigger: discoverSection,
                  start: 'top 75%',
                  toggleActions: 'play none none reverse',
                },
              }
            );
          }
        }

        // 6–9. STANDALONE SUBPAGE ANIMATIONS (When not inside horizontal-scroll-track, e.g. on /contact)
        if (!horizontalTrack) {
          const contactSection = document.querySelector('#contact');
          if (contactSection) {
            const leftEls = contactSection.querySelectorAll(
              '.contact-grid > div:first-child > *'
            );
            const enquiryForm = contactSection.querySelector(
              '#enquiry'
            ) as HTMLElement | null;

            if (leftEls.length > 0) {
              gsap.fromTo(
                leftEls,
                { y: moveY, opacity: 0 },
                {
                  y: 0,
                  opacity: 1,
                  duration: 0.75,
                  stagger: 0.09,
                  ease: 'power3.out',
                  scrollTrigger: {
                    trigger: contactSection,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse',
                  },
                }
              );
            }

            if (
              enquiryForm &&
              enquiryForm.style &&
              typeof enquiryForm.style.removeProperty === 'function'
            ) {
              gsap.fromTo(
                enquiryForm,
                { y: 32, scale: 0.97, opacity: 0 },
                {
                  y: 0,
                  scale: 1,
                  opacity: 1,
                  duration: 0.85,
                  ease: 'power3.out',
                  scrollTrigger: {
                    trigger: enquiryForm,
                    start: 'top 86%',
                    toggleActions: 'play none none reverse',
                  },
                }
              );
            }
          }
        }

        // 10. SUBPAGE GRIDS & CARDS
        const subpageCards = document.querySelectorAll(
          '.destination-detail-card, .package-card, .gallery-item, .tour-card, .founder-quote-card, .dest-custom-cta-box'
        );
        subpageCards.forEach((card, i) => {
          gsap.fromTo(
            card,
            { y: 30, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.72,
              delay: isMobile ? 0 : (i % 3) * 0.07,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: card,
                start: 'top 90%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        });
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
