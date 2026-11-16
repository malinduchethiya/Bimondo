'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Uses hardware-accelerated native browser scrolling for zero input latency,
 * while handling in-page #anchor links and route-change scroll resets cleanly.
 */
export default function MomentumScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a[href*="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      const hashIndex = href.indexOf('#');
      if (hashIndex === -1) return;

      const pathPart = href.slice(0, hashIndex);
      const hashPart = href.slice(hashIndex);

      if (
        hashPart.length > 1 &&
        (pathPart === '' || pathPart === window.location.pathname)
      ) {
        const targetEl = document.querySelector(hashPart) as HTMLElement | null;
        if (targetEl) {
          e.preventDefault();
          const top =
            targetEl.getBoundingClientRect().top + window.scrollY - 72;
          window.scrollTo({
            top: Math.max(0, top),
            behavior: 'smooth',
          });
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => {
      document.removeEventListener('click', handleAnchorClick);
    };
  }, []);

  useEffect(() => {
    const resetScroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    };

    resetScroll();
    window.addEventListener('bimondo:navigate', resetScroll);
    window.addEventListener('popstate', resetScroll);
    return () => {
      window.removeEventListener('bimondo:navigate', resetScroll);
      window.removeEventListener('popstate', resetScroll);
    };
  }, [pathname]);

  return null;
}
