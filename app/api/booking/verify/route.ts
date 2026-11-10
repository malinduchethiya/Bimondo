import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getServerCredentials } from '@/lib/booking-store';
import {
  BookingProviderId,
  SupportedCurrency,
  VerifiedBookingConfirmation,
} from '@/lib/booking-types';

function formatBokunUtcDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(
    d.getUTCDate()
  )} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(
    d.getUTCSeconds()
  )}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const provider = (searchParams.get('provider') ||
    'bokun') as BookingProviderId;
  const bookingRef = searchParams.get('ref')?.trim() || '';

  const creds = getServerCredentials();

  if (!bookingRef) {
    const unverified: VerifiedBookingConfirmation = {
      verified: false,
      status: 'unverified_return',
      provider,
      bookingReference: null,
      verificationMessage:
        'No verified booking status was supplied by the provider. Returning from an external checkout page does not automatically confirm a reservation. Please check the official confirmation email from the booking provider.',
    };
    return NextResponse.json(unverified);
  }

  // If provider is Bókun and server-side API credentials are configured, verify the booking directly against Bókun API
  if (
    provider === 'bokun' &&
    creds.bokunAccessKey &&
    creds.bokunSecretKey
  ) {
    try {
      const now = new Date();
      const bokunDate = formatBokunUtcDate(now);
      const pathWithQuery = `/booking.json/booking/${encodeURIComponent(
        bookingRef
      )}`;
      const signatureInput = `${bokunDate}${creds.bokunAccessKey}GET${pathWithQuery}`;
      const signature = crypto
        .createHmac('sha1', creds.bokunSecretKey)
        .update(signatureInput)
        .digest('base64');

      const apiRes = await fetch(`https://api.bokun.io${pathWithQuery}`, {
        method: 'GET',
        headers: {
          'X-Bokun-Date': bokunDate,
          'X-Bokun-AccessKey': creds.bokunAccessKey,
          'X-Bokun-Signature': signature,
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      if (apiRes.ok) {
        const data = await apiRes.json();
        const isConfirmed =
          data?.status === 'CONFIRMED' || data?.status === 'RESERVED';

        if (isConfirmed) {
          const verifiedResp: VerifiedBookingConfirmation = {
            verified: true,
            status: 'confirmed',
            provider: 'bokun',
            bookingReference: String(
              data.confirmationCode || bookingRef
            ),
            customerName: data.customer
              ? `${data.customer.firstName || ''} ${
                  data.customer.lastName || ''
                }`.trim()
              : null,
            customerEmail: data.customer?.email || null,
            itemName:
              data.productBookings?.[0]?.product?.title ||
              data.title ||
              'Bimondo Private Experience',
            dates: {
              checkInOrStart:
                data.productBookings?.[0]?.date || data.creationDate || '',
              departureTime:
                data.productBookings?.[0]?.startTime || undefined,
            },
            totalPrice:
              typeof data.totalPrice === 'number'
                ? {
                    amount: data.totalPrice,
                    currency: (data.currency || 'USD') as SupportedCurrency,
                  }
                : null,
            paymentStatus: data.paymentStatus || data.status,
            cancellationPolicy:
              data.productBookings?.[0]?.cancellationPolicy?.title ||
              'Refer to your Bókun voucher for full cancellation terms.',
            verificationMessage:
              'Booking status has been cryptographically verified with the Bókun API.',
            verifiedAt: new Date().toISOString(),
          };
          return NextResponse.json(verifiedResp);
        }
      }
    } catch {
      // Fall through to unverified notice
    }
  }

  // Honest unverified state: never claim a booking is confirmed simply because a visitor returns with a query parameter
  const resp: VerifiedBookingConfirmation = {
    verified: false,
    status: 'unverified_return',
    provider,
    bookingReference: bookingRef,
    verificationMessage:
      'We received your return from the booking provider, but live server-side confirmation verification is not active for this reference. Do not treat this page as proof of confirmation—your official voucher, payment receipt, and booking status are sent directly by the provider via email.',
  };

  return NextResponse.json(resp);
}
