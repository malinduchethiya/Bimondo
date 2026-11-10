import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  buildBokunCheckoutUrl,
  buildNightsBridgeBookingUrl,
  buildViatorBookingUrl,
  getServerBookingSettings,
  getServerCredentials,
} from '@/lib/booking-store';
import {
  BookingProviderId,
  CalendarDayAvailability,
  LiveAvailabilityResponse,
  SupportedCurrency,
  VerifiedPricingQuote,
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
  const itemId = searchParams.get('itemId') || '';
  const requestedProvider = searchParams.get(
    'provider'
  ) as BookingProviderId | null;
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const adults = Math.max(1, Number(searchParams.get('adults') || '2'));
  const children = Math.max(0, Number(searchParams.get('children') || '0'));
  const rooms = Math.max(1, Number(searchParams.get('rooms') || '1'));
  const currency = (searchParams.get('currency') || 'USD') as SupportedCurrency;
  const month = searchParams.get('month') || ''; // YYYY-MM

  const settings = getServerBookingSettings();
  const creds = getServerCredentials();
  const assignment = settings.assignments[itemId];
  const provider: BookingProviderId =
    requestedProvider || assignment?.provider || 'bokun';

  // 1. NIGHTSBRIDGE ACCOMMODATION AVAILABILITY & WIDGET RESOLUTION
  if (provider === 'nightsbridge') {
    const bbid =
      assignment?.externalId?.trim() || settings.nightsbridge.bbid?.trim() || '';

    if (!settings.nightsbridge.enabled) {
      const resp: LiveAvailabilityResponse = {
        provider: 'nightsbridge',
        itemId,
        externalId: bbid,
        source: 'unconfigured',
        message:
          'NightsBridge accommodation booking is currently disabled in Admin Booking Settings.',
        checkoutUrl: null,
        days: {},
        quote: null,
      };
      return NextResponse.json(resp);
    }

    if (!bbid) {
      const resp: LiveAvailabilityResponse = {
        provider: 'nightsbridge',
        itemId,
        externalId: '',
        source: 'unconfigured',
        message:
          'NightsBridge Establishment ID (BBID) is not configured yet. Add your official NightsBridge BBID in Admin Booking Settings (/admin/booking) to enable live accommodation booking.',
        checkoutUrl: null,
        days: {},
        quote: null,
      };
      return NextResponse.json(resp);
    }

    const checkoutUrl = buildNightsBridgeBookingUrl({
      bbid,
      widgetBaseUrl: settings.nightsbridge.widgetBaseUrl,
      checkIn,
      checkOut,
      adults,
      children,
      rooms,
      currency,
    });

    const resp: LiveAvailabilityResponse = {
      provider: 'nightsbridge',
      itemId,
      externalId: bbid,
      source: 'widget_only',
      message:
        'Connected to official NightsBridge Booking Engine. Live room availability, seasonal rates, and instant confirmation are provided directly inside the NightsBridge booking view.',
      checkoutUrl,
      days: {},
      quote: null,
    };
    return NextResponse.json(resp);
  }

  // 2. BÓKUN TOURS & ACTIVITIES AVAILABILITY & WIDGET RESOLUTION
  if (provider === 'bokun') {
    const channelUuid = settings.bokun.bookingChannelUuid?.trim() || '';
    const experienceId =
      assignment?.externalId?.trim() ||
      settings.bokun.defaultExperienceId?.trim() ||
      '';

    if (!settings.bokun.enabled) {
      const resp: LiveAvailabilityResponse = {
        provider: 'bokun',
        itemId,
        externalId: experienceId,
        source: 'unconfigured',
        message:
          'Bókun tour booking is currently disabled in Admin Booking Settings.',
        checkoutUrl: null,
        days: {},
        quote: null,
      };
      return NextResponse.json(resp);
    }

    if (!channelUuid || !experienceId) {
      const resp: LiveAvailabilityResponse = {
        provider: 'bokun',
        itemId,
        externalId: experienceId,
        source: 'unconfigured',
        message:
          'Bókun Booking Channel UUID or Experience ID is not configured yet. Configure your official Bókun widget credentials in Admin Booking Settings (/admin/booking).',
        checkoutUrl: null,
        days: {},
        quote: null,
      };
      return NextResponse.json(resp);
    }

    const checkoutUrl = buildBokunCheckoutUrl({
      bookingChannelUuid: channelUuid,
      experienceId,
      date: checkIn || undefined,
    });

    // If official Bókun REST API keys are configured on the server, query real live availabilities
    if (creds.bokunAccessKey && creds.bokunSecretKey) {
      try {
        const now = new Date();
        const yearMonth =
          month && /^\d{4}-\d{2}$/.test(month)
            ? month
            : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
                2,
                '0'
              )}`;
        const [yStr, mStr] = yearMonth.split('-');
        const startYear = Number(yStr);
        const startMonth = Number(mStr);
        const startDate = `${yearMonth}-01`;
        const lastDay = new Date(startYear, startMonth, 0).getDate();
        const endDate = `${yearMonth}-${String(lastDay).padStart(2, '0')}`;

        const pathWithQuery = `/activity.json/${encodeURIComponent(
          experienceId
        )}/availabilities?start=${startDate}&end=${endDate}&currency=${encodeURIComponent(
          currency
        )}&lang=EN`;
        const bokunDate = formatBokunUtcDate(now);
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
          const rawAvailabilities = await apiRes.json();
          const days: Record<string, CalendarDayAvailability> = {};

          if (Array.isArray(rawAvailabilities)) {
            for (const slot of rawAvailabilities) {
              const dateStr =
                typeof slot.date === 'string'
                  ? slot.date.slice(0, 10)
                  : typeof slot.localizedDate === 'string'
                  ? slot.localizedDate
                  : '';
              if (!dateStr) continue;

              const existing = days[dateStr] || {
                date: dateStr,
                available: false,
                currency,
                departureTimes: [],
              };

              const spotsLeft = Number(slot.availabilityCount ?? 0);
              const isUnlimited = Boolean(slot.unlimitedAvailability);
              const slotAvailable = isUnlimited || spotsLeft > 0;
              const defaultPrice =
                typeof slot.defaultPrice === 'number'
                  ? slot.defaultPrice
                  : undefined;

              if (slotAvailable) {
                existing.available = true;
                if (
                  defaultPrice !== undefined &&
                  (existing.startingPrice === undefined ||
                    defaultPrice < existing.startingPrice)
                ) {
                  existing.startingPrice = defaultPrice;
                }
                if (slot.startTime) {
                  existing.departureTimes = [
                    ...(existing.departureTimes || []),
                    {
                      time: String(slot.startTime),
                      availableCount: isUnlimited ? undefined : spotsLeft,
                    },
                  ];
                }
              }

              days[dateStr] = existing;
            }
          }

          let quote: VerifiedPricingQuote | null = null;
          if (checkIn && days[checkIn]?.startingPrice !== undefined) {
            const adultUnit = days[checkIn].startingPrice!;
            const childUnit = Math.round(adultUnit * 0.65 * 100) / 100;
            const adultTotal = adultUnit * adults;
            const childTotal = childUnit * children;
            const subtotal = adultTotal + childTotal;

            quote = {
              currency,
              pricingBasis: 'per_person',
              adultRate: adultUnit,
              childRate: children > 0 ? childUnit : undefined,
              subtotal,
              taxesAndFees: 0,
              total: subtotal,
              lineItems: [
                {
                  label: `${adults} Adult${adults > 1 ? 's' : ''} × ${currency} ${adultUnit.toLocaleString()}`,
                  amount: adultTotal,
                  currency,
                },
                ...(children > 0
                  ? [
                      {
                        label: `${children} Child${
                          children > 1 ? 'ren' : ''
                        } × ${currency} ${childUnit.toLocaleString()}`,
                        amount: childTotal,
                        currency,
                      },
                    ]
                  : []),
              ],
              verifiedAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            };
          }

          const resp: LiveAvailabilityResponse = {
            provider: 'bokun',
            itemId,
            externalId: experienceId,
            source: 'live_provider_api',
            message: 'Verified live availability retrieved from Bókun API.',
            checkoutUrl,
            days,
            quote,
          };
          return NextResponse.json(resp);
        }
      } catch {
        // Fall through to official Bókun widget mode if direct API call is unavailable
      }
    }

    const resp: LiveAvailabilityResponse = {
      provider: 'bokun',
      itemId,
      externalId: experienceId,
      source: 'widget_only',
      message:
        'Connected to official Bókun Booking Widget. Live departure times, participant pricing, and checkout are handled directly by Bókun.',
      checkoutUrl,
      days: {},
      quote: null,
    };
    return NextResponse.json(resp);
  }

  // 3. VIATOR TOURS & EXPERIENCES RESOLUTION
  const productCode = assignment?.externalId?.trim() || '';
  const checkoutUrl = buildViatorBookingUrl({
    externalUrl: assignment?.externalUrl,
    defaultBookingUrl: settings.viator.defaultBookingUrl,
    productCode,
    partnerId: settings.viator.partnerId,
    currency,
  });

  if (!settings.viator.enabled) {
    const resp: LiveAvailabilityResponse = {
      provider: 'viator',
      itemId,
      externalId: productCode,
      source: 'unconfigured',
      message: 'Viator integration is currently disabled in Admin Booking Settings.',
      checkoutUrl: null,
      days: {},
      quote: null,
    };
    return NextResponse.json(resp);
  }

  if (!checkoutUrl && !productCode && !settings.viator.widgetRef?.trim()) {
    const resp: LiveAvailabilityResponse = {
      provider: 'viator',
      itemId,
      externalId: '',
      source: 'unconfigured',
      message:
        'Viator booking link, Partner ID, or Widget reference is not configured for this experience yet. Configure official Viator settings in Admin Booking Settings (/admin/booking).',
      checkoutUrl: null,
      days: {},
      quote: null,
    };
    return NextResponse.json(resp);
  }

  const resp: LiveAvailabilityResponse = {
    provider: 'viator',
    itemId,
    externalId: productCode,
    source: 'widget_only',
    message:
      'Connected to Viator. Live availability, verified rates, and payment confirmation are completed on Viator’s official checkout.',
    checkoutUrl,
    days: {},
    quote: null,
  };
  return NextResponse.json(resp);
}
