'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import HomePage from '@/app/page';

const DestinationsPage = dynamic(() => import('@/app/destinations/page'));
const PackagesPage = dynamic(() => import('@/app/packages/page'));
const GuidesPage = dynamic(() => import('@/app/guides/page'));
const StaysPage = dynamic(() => import('@/app/stays/page'));
const GalleryPage = dynamic(() => import('@/app/gallery/page'));
const OurStoryPage = dynamic(() => import('@/app/our-story/page'));
const ContactPage = dynamic(() => import('@/app/contact/page'));
const BookingPage = dynamic(() => import('@/app/booking/page'));
const BookingConfirmationPage = dynamic(
  () => import('@/app/booking/confirmation/page')
);

const VALID_PATHS = new Set([
  '/',
  '/destinations',
  '/packages',
  '/guides',
  '/stays',
  '/gallery',
  '/our-story',
  '/contact',
  '/booking',
  '/booking/confirmation',
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
    window.location.assign(`${nextPathname}${targetUrl.search}${targetUrl.hash}`);
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
  const [clientNav, setClientNav] = useState<{
    basePath: string;
    target: string | null;
  } | null>(null);

  useEffect(() => {
    const onCustomNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        const normalized = normalizeRoutePath(customEvent.detail);
        setClientNav({
          basePath: pathname,
          target: VALID_PATHS.has(normalized) ? normalized : null,
        });
      }
    };

    const onPopState = () => {
      const next = normalizeRoutePath(window.location.pathname);
      setClientNav({
        basePath: pathname,
        target: VALID_PATHS.has(next) ? next : null,
      });
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    };

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

      if (targetRoute === currentRoute && url.hash) {
        return;
      }

      if (VALID_PATHS.has(targetRoute)) {
        e.preventDefault();
        e.stopPropagation();
        navigateToRoute(rawHref);
      } else {
        // Navigating to a dynamic route (e.g. /destinations/sigiriya, /packages/ceylon-grand-circuit, /guides/...)
        // Clear clientNav so Next.js router renders the real dynamic page seamlessly.
        setClientNav(null);
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
  }, [pathname]);

  const clientPath =
    clientNav && clientNav.basePath === pathname ? clientNav.target : null;
  const activeRoute = normalizeRoutePath(clientPath ?? pathname);

  switch (activeRoute) {
    case '/':
      return <HomePage key="route-home" />;
    case '/destinations':
      return <DestinationsPage key="route-destinations" />;
    case '/packages':
      return <PackagesPage key="route-packages" />;
    case '/guides':
      return <GuidesPage key="route-guides" />;
    case '/stays':
      return <StaysPage key="route-stays" />;
    case '/gallery':
      return <GalleryPage key="route-gallery" />;
    case '/our-story':
      return <OurStoryPage key="route-our-story" />;
    case '/contact':
      return <ContactPage key="route-contact" />;
    case '/booking':
      return <BookingPage key="route-booking" />;
    case '/booking/confirmation':
      return <BookingConfirmationPage key="route-booking-confirmation" />;
    default:
      return <>{children}</>;
  }
}

