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
      // Ensure no flyover classes or inline transforms remain on homepage sections (including #discover)
      const allMainSections = document.querySelectorAll('main > section');
      allMainSections.forEach((sec) => {
        const el = sec as HTMLElement;
        el.classList.remove(
          'flyover-panel',
          'flyover-anchor-section',
          'horizontal-panel-section'
        );
        el.style.removeProperty('z-index');
        el.style.removeProperty('transform');
      });

      const width = window.innerWidth;
      const isMobile = width < 768;
      const moveY = isMobile ? 12 : 18;

      ctx = gsap.context(() => {
        // Lightweight once-only hero entrance
        const heroCopy = document.querySelector('.hero .hero-copy');
        if (heroCopy) {
          const eyebrow = heroCopy.querySelector('.hero-eyebrow');
          const heading = heroCopy.querySelector('h1');
          const desc = heroCopy.querySelector('p');
          const actions = heroCopy.querySelectorAll('.hero-actions .pill');

          const heroTl = gsap.timeline({
            defaults: { ease: 'power2.out' },
          });

          if (eyebrow) {
            heroTl.fromTo(
              eyebrow,
              { y: 10, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.45 }
            );
          }
          if (heading) {
            heroTl.fromTo(
              heading,
              { y: moveY, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.55 },
              '-=0.32'
            );
          }
          if (desc) {
            heroTl.fromTo(
              desc,
              { y: 12, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.45 },
              '-=0.38'
            );
          }
          if (actions.length > 0) {
            heroTl.fromTo(
              actions,
              { y: 10, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.4, stagger: 0.05 },
              '-=0.32'
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
                duration: 0.5,
                stagger: 0.06,
                ease: 'power2.out',
              }
            );
          }
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
