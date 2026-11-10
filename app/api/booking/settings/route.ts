import { NextRequest, NextResponse } from 'next/server';
import {
  getServerBookingSettings,
  ServerBookingCredentials,
  updateServerBookingSettings,
} from '@/lib/booking-store';
import { PublicBookingSettings } from '@/lib/booking-types';

export async function GET() {
  const settings = getServerBookingSettings();
  return NextResponse.json(settings, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const requiredToken = process.env.BOOKING_ADMIN_TOKEN?.trim();

    if (requiredToken) {
      const providedToken =
        req.headers.get('x-admin-token')?.trim() || body?.adminToken?.trim();
      if (providedToken !== requiredToken) {
        return NextResponse.json(
          { error: 'Unauthorized: Invalid BOOKING_ADMIN_TOKEN.' },
          { status: 401 }
        );
      }
    }

    const publicUpdates: Partial<PublicBookingSettings> =
      body?.settings || body || {};
    const secretUpdates: Partial<ServerBookingCredentials> | undefined =
      body?.credentials;

    const updated = updateServerBookingSettings(publicUpdates, secretUpdates);
    return NextResponse.json({
      ok: true,
      settings: updated,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Failed to update booking settings.',
      },
      { status: 400 }
    );
  }
}
