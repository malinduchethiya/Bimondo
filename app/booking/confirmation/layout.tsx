import React from 'react';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Booking Confirmation & Status Verification | Bimondo Travels',
  description:
    'Verify your official provider booking reference and reservation confirmation with Bimondo Travels.',
  path: '/booking/confirmation',
  noIndex: true,
});

export default function BookingConfirmationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
