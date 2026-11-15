'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  navigateToRoute,
  normalizeRoutePath,
} from '@/components/InstantRouteManager';
import { useSiteCms } from '@/hooks/useSiteCms';

export default function FloatingWhatsApp() {
  const { cms } = useSiteCms();
  const footer = cms.pages.shared.footer;
  const pathname = usePathname();
  if (normalizeRoutePath(pathname).startsWith('/admin')) {
    return null;
  }

  const targetHref = footer.floatingCtaHref || '/booking';
  const targetLabel = footer.floatingCtaLabel ?? 'BOOK NOW';

  const handleBookingClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigateToRoute(targetHref);
  };

  return (
    <div
      className="floating-action-dock"
      role="region"
      aria-label="Quick Actions"
    >
      <Link
        href={targetHref}
        prefetch={false}
        className="floating floating-booking-btn"
        onClick={handleBookingClick}
        aria-label="Go to online booking page"
      >
        <span>{targetLabel}</span>
        <span aria-hidden="true">↗</span>
      </Link>
    </div>
  );
}
