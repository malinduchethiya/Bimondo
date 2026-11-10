'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HomePage from '@/app/page';
import DestinationsPage from '@/app/destinations/page';
import PackagesPage from '@/app/packages/page';
import StaysPage from '@/app/stays/page';
import GalleryPage from '@/app/gallery/page';
import OurStoryPage from '@/app/our-story/page';
import ContactPage from '@/app/contact/page';
import BookingConfirmationPage from '@/app/booking/confirmation/page';
import AdminBookingSettingsPage from '@/app/admin/booking/page';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const VALID_PATHS = new Set([
  '/',
  '/destinations',
  '/packages',
  '/stays',
  '/gallery',
  '/our-story',
  '/contact',
  '/booking/confirmation',
  '/admin/booking',
]);

export function normalizeRoutePath(rawPath: string | null | undefined): string {
  if (!rawPath) return '/';
  const cleaned = rawPath.split('?')[0].split('#')[0].replace(/\/+$/, '');
  return cleaned === '' ? '/' : cleaned;
}

export function navigateToRoute(targetHref: string) {
  if (typeof window === 'undefined') return;

  let targetUrl: URL;
  try {
    targetUrl = new URL(targetHref, window.location.origin);
  } catch {
    return;
  }

  if (targetUrl.origin !== window.location.origin) {
    return;
  }

  const nextPathname = normalizeRoutePath(targetUrl.pathname);
  if (!VALID_PATHS.has(nextPathname)) {
    return;
  }

  const currentPathname = normalizeRoutePath(window.location.pathname);

  if (nextPathname === currentPathname) {
    if (targetUrl.hash) {
      const hashEl = document.querySelector(targetUrl.hash);
      if (hashEl) {
        hashEl.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  // Unwrap any GSAP ScrollTrigger pin-spacers before React unmounts the current route's DOM
  try {
    ScrollTrigger.getAll().forEach((st) => st.kill(true));
  } catch {
    // ignore cleanup errors
  }

  const fullTarget = `${nextPathname}${targetUrl.search}${targetUrl.hash}`;
  window.history.pushState(null, '', fullTarget);
  window.dispatchEvent(
    new CustomEvent<string>('bimondo:navigate', { detail: nextPathname })
  );
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
}

export default function InstantRouteManager({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [clientPath, setClientPath] = useState<string | null>(null);

  useEffect(() => {
    const onCustomNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setClientPath(normalizeRoutePath(customEvent.detail));
      }
    };

    const onPopState = () => {
      try {
        ScrollTrigger.getAll().forEach((st) => st.kill(true));
      } catch {
        // ignore
      }
      setClientPath(normalizeRoutePath(window.location.pathname));
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    };

    // Global capture-phase click listener to intercept internal route links before Next.js RSC fetch
    const onDocumentClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;

      if (
        anchor.target &&
        anchor.target !== '' &&
        anchor.target !== '_self'
      ) {
        return;
      }

      const rawHref = anchor.getAttribute('href');
      if (
        !rawHref ||
        rawHref.startsWith('#') ||
        rawHref.startsWith('mailto:') ||
        rawHref.startsWith('tel:') ||
        rawHref.startsWith('javascript:')
      ) {
        return;
      }

      let url: URL;
      try {
        url = new URL(rawHref, window.location.origin);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) {
        return;
      }

      const targetRoute = normalizeRoutePath(url.pathname);
      const currentRoute = normalizeRoutePath(window.location.pathname);

      // Allow same-page hash anchors (e.g. /#discover when already on /) to be handled by MomentumScroll
      if (targetRoute === currentRoute && url.hash) {
        return;
      }

      if (VALID_PATHS.has(targetRoute)) {
        e.preventDefault();
        e.stopPropagation();
        navigateToRoute(rawHref);
      }
    };

    window.addEventListener('bimondo:navigate', onCustomNavigate);
    window.addEventListener('popstate', onPopState);
    document.addEventListener('click', onDocumentClick, true);

    return () => {
      window.removeEventListener('bimondo:navigate', onCustomNavigate);
      window.removeEventListener('popstate', onPopState);
      document.removeEventListener('click', onDocumentClick, true);
    };
  }, []);

  const activeRoute = normalizeRoutePath(clientPath ?? pathname);

  switch (activeRoute) {
    case '/':
      return <HomePage key="route-home" />;
    case '/destinations':
      return <DestinationsPage key="route-destinations" />;
    case '/packages':
      return <PackagesPage key="route-packages" />;
    case '/stays':
      return <StaysPage key="route-stays" />;
    case '/gallery':
      return <GalleryPage key="route-gallery" />;
    case '/our-story':
      return <OurStoryPage key="route-our-story" />;
    case '/contact':
      return <ContactPage key="route-contact" />;
    case '/booking/confirmation':
      return <BookingConfirmationPage key="route-booking-confirmation" />;
    case '/admin/booking':
      return <AdminBookingSettingsPage key="route-admin-booking" />;
    default:
      return <>{children}</>;
  }
}
