'use client';

import React from 'react';
import Link from 'next/link';
import { navigateToRoute } from '@/components/InstantRouteManager';

export default function FloatingWhatsApp() {
  const handleBookingClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigateToRoute('/booking');
  };

  return (
    <div className="floating-action-dock" role="region" aria-label="Quick Actions">
      <Link
        href="/booking"
        prefetch={false}
        className="floating floating-booking-btn"
        onClick={handleBookingClick}
        aria-label="Go to online booking page"
      >
        <span>BOOK NOW</span>
        <span aria-hidden="true">↗</span>
      </Link>
    </div>
  );
}
