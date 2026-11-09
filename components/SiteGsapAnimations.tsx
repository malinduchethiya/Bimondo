'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function SiteGsapAnimations() {
  const pathname = usePathname();

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

        // 4. FLYOVER SCROLL STACK FOR ALL SECTIONS AFTER #story
        if (storySection && storySection.parentElement) {
          const allSections = Array.from(
            storySection.parentElement.querySelectorAll(':scope > section')
          ) as HTMLElement[];
          const storyIndex = allSections.indexOf(storySection);

          if (storyIndex !== -1 && storyIndex < allSections.length - 1) {
            const chainSections = allSections.slice(storyIndex);

            chainSections.forEach((sec, idx) => {
              if (idx === 0) {
                sec.classList.add('flyover-anchor-section');
                sec.style.zIndex = '10';
              } else {
                sec.classList.add('flyover-panel');
                sec.style.zIndex = String(10 + idx);
              }
            });

            for (let i = 0; i < chainSections.length - 1; i++) {
              const prevSec = chainSections[i];
              const nextSec = chainSections[i + 1];

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
                  trigger: '.experiences',
                  start: 'top 88%',
                  toggleActions: 'play none none reverse',
                },
              }
            );
          }
        }

        // 6. PLACES SECTION (#places) INTERNAL ANIMATIONS
        const placesSection = document.querySelector('#places');
        if (placesSection) {
          const headEls = placesSection.querySelectorAll(
            '.section-head .eyebrow, .section-head h2, .section-head p'
          );
          const placeCards = placesSection.querySelectorAll('.places .place');

          if (headEls.length > 0) {
            gsap.fromTo(
              headEls,
              { y: moveY, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.75,
                stagger: 0.09,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: placesSection,
                  start: 'top 84%',
                  toggleActions: 'play none none reverse',
                },
              }
            );
          }

          if (placeCards.length > 0) {
            gsap.fromTo(
              placeCards,
              { y: 38, scale: 0.95, opacity: 0 },
              {
                y: 0,
                scale: 1,
                opacity: 1,
                duration: 0.85,
                stagger: 0.12,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: '.places',
                  start: 'top 85%',
                  toggleActions: 'play none none reverse',
                },
              }
            );
          }
        }

        // 7. VALUES SECTION (#why) INTERNAL ANIMATIONS
        const whySection = document.querySelector('#why');
        if (whySection) {
          const headEls = whySection.querySelectorAll(
            '.section-head .eyebrow, .section-head h2, .section-head p'
          );
          const valueCards = whySection.querySelectorAll('.values-grid .value');

          if (headEls.length > 0) {
            gsap.fromTo(
              headEls,
              { y: moveY, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.75,
                stagger: 0.09,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: whySection,
                  start: 'top 84%',
                  toggleActions: 'play none none reverse',
                },
              }
            );
          }

          if (valueCards.length > 0) {
            gsap.fromTo(
              valueCards,
              { y: 32, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.12,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: whySection.querySelector('.values-grid') || whySection,
                  start: 'top 86%',
                  toggleActions: 'play none none reverse',
                },
              }
            );
          }
        }

        // 8. PLANNING & FAQ SECTION (#planning-faq) INTERNAL ANIMATIONS
        const planningSection = document.querySelector('#planning-faq');
        if (planningSection) {
          const introEls = planningSection.querySelectorAll(
            '.planning-intro-col > *'
          );
          const reviewsWidget = planningSection.querySelector(
            '.tourist-reviews-widget'
          );
          const faqBlock = planningSection.querySelector('.minimal-faq-block');
          const faqRows = planningSection.querySelectorAll('.minimal-faq-row');

          if (introEls.length > 0) {
            gsap.fromTo(
              introEls,
              { y: moveY, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.75,
                stagger: 0.08,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: planningSection,
                  start: 'top 84%',
                  toggleActions: 'play none none reverse',
                },
              }
            );
          }

          if (reviewsWidget) {
            gsap.fromTo(
              reviewsWidget,
              { y: 28, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.82,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: reviewsWidget,
                  start: 'top 86%',
                  toggleActions: 'play none none reverse',
                },
              }
            );
          }

          if (faqBlock) {
            gsap.fromTo(
              faqBlock,
              { y: 30, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: faqBlock,
                  start: 'top 88%',
                  toggleActions: 'play none none reverse',
                },
              }
            );
          }

          if (faqRows.length > 0) {
            gsap.fromTo(
              faqRows,
              { y: 14, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.55,
                stagger: 0.04,
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: faqBlock || planningSection,
                  start: 'top 85%',
                  toggleActions: 'play none none reverse',
                },
              }
            );
          }
        }

        // 9. CONTACT SECTION (#contact) INTERNAL ANIMATIONS
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
  }, [pathname]);

  return null;
}
