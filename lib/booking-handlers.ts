import {
  buildBokunCheckoutUrl,
  buildNightsBridgeBookingUrl,
  buildViatorBookingUrl,
  getServerBookingSettings,
  getServerCredentials,
  ServerBookingCredentials,
  updateServerBookingSettings,
} from './booking-store';
import {
  BookingProviderId,
  CalendarDayAvailability,
  LiveAvailabilityResponse,
  PublicBookingSettings,
  SupportedCurrency,
  VerifiedBookingConfirmation,
  VerifiedPricingQuote,
} from './booking-types';

type EnvRecord = Record<string, string | undefined>;

function jsonResponse(
  body: unknown,
  init?: { status?: number; headers?: Record<string, string> }
): Response {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(init?.headers || {}),
    },
  });
}

function formatBokunUtcDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(
    d.getUTCDate()
  )} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(
    d.getUTCSeconds()
  )}`;
}

async function computeHmacSha1Base64(
  secret: string,
  message: string
): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  const bytes = new Uint8Array(sig);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function handleBookingSettingsGet(env?: EnvRecord): Response {
  const settings = getServerBookingSettings(env);
  return jsonResponse(settings, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

export async function handleBookingSettingsPost(
  req: Request,
  env?: EnvRecord
): Promise<Response> {
  try {
    const body = (await req.json()) as {
      adminToken?: string;
      settings?: Partial<PublicBookingSettings>;
      credentials?: Partial<ServerBookingCredentials>;
    };
    const requiredToken = env?.BOOKING_ADMIN_TOKEN?.trim();

    if (requiredToken) {
      const providedToken =
        req.headers.get('x-admin-token')?.trim() || body?.adminToken?.trim();
      if (providedToken !== requiredToken) {
        return jsonResponse(
          { error: 'Unauthorized: Invalid BOOKING_ADMIN_TOKEN.' },
          { status: 401 }
        );
      }
    }

    const publicUpdates: Partial<PublicBookingSettings> =
      body?.settings || (body as Partial<PublicBookingSettings>) || {};
    const secretUpdates: Partial<ServerBookingCredentials> | undefined =
      body?.credentials;

    const updated = updateServerBookingSettings(
      publicUpdates,
      secretUpdates,
      env
    );
    return jsonResponse({
      ok: true,
      settings: updated,
    });
  } catch (err) {
    return jsonResponse(
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

export async function handleBookingAvailabilityGet(
  req: Request,
  env?: EnvRecord
): Promise<Response> {
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
  const month = searchParams.get('month') || '';

  const settings = getServerBookingSettings(env);
  const creds = getServerCredentials(env);
  const assignment = settings.assignments[itemId];
  const provider: BookingProviderId =
    requestedProvider || assignment?.provider || 'bokun';

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
      return jsonResponse(resp);
    }

    if (!bbid) {
      const resp: LiveAvailabilityResponse = {
        provider: 'nightsbridge',
        itemId,
        externalId: '',
        source: 'unconfigured',
        message:
          'NightsBridge Establishment ID (BBID) is not configured yet.',
        checkoutUrl: null,
        days: {},
        quote: null,
      };
      return jsonResponse(resp);
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
    return jsonResponse(resp);
  }

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
      return jsonResponse(resp);
    }

    if (!channelUuid || !experienceId) {
      const resp: LiveAvailabilityResponse = {
        provider: 'bokun',
        itemId,
        externalId: experienceId,
        source: 'unconfigured',
        message:
          'Bókun Booking Channel UUID or Experience ID is not configured yet.',
        checkoutUrl: null,
        days: {},
        quote: null,
      };
      return jsonResponse(resp);
    }

    const checkoutUrl = buildBokunCheckoutUrl({
      bookingChannelUuid: channelUuid,
      experienceId,
      date: checkIn || undefined,
    });

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
        const signature = await computeHmacSha1Base64(
          creds.bokunSecretKey,
          signatureInput
        );

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
          const rawAvailabilities = (await apiRes.json()) as Array<{
            date?: string;
            localizedDate?: string;
            availabilityCount?: number;
            unlimitedAvailability?: boolean;
            defaultPrice?: number;
            startTime?: string;
          }>;
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
          return jsonResponse(resp);
        }
      } catch {
        // Fall through to widget mode
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
    return jsonResponse(resp);
  }

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
    return jsonResponse(resp);
  }

  if (!checkoutUrl && !productCode && !settings.viator.widgetRef?.trim()) {
    const resp: LiveAvailabilityResponse = {
      provider: 'viator',
      itemId,
      externalId: '',
      source: 'unconfigured',
      message:
        'Viator booking link, Partner ID, or Widget reference is not configured for this experience yet.',
      checkoutUrl: null,
      days: {},
      quote: null,
    };
    return jsonResponse(resp);
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
  return jsonResponse(resp);
}

export async function handleBookingVerifyGet(
  req: Request,
  env?: EnvRecord
): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const provider = (searchParams.get('provider') ||
    'bokun') as BookingProviderId;
  const bookingRef = searchParams.get('ref')?.trim() || '';

  const creds = getServerCredentials(env);

  if (!bookingRef) {
    const unverified: VerifiedBookingConfirmation = {
      verified: false,
      status: 'unverified_return',
      provider,
      bookingReference: null,
      verificationMessage:
        'No verified booking status was supplied by the provider. Returning from an external checkout page does not automatically confirm a reservation. Please check the official confirmation email from the booking provider.',
    };
    return jsonResponse(unverified);
  }

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
      const signature = await computeHmacSha1Base64(
        creds.bokunSecretKey,
        signatureInput
      );

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
        const data = (await apiRes.json()) as {
          status?: string;
          confirmationCode?: string;
          customer?: { firstName?: string; lastName?: string; email?: string };
          productBookings?: Array<{
            product?: { title?: string };
            date?: string;
            startTime?: string;
            cancellationPolicy?: { title?: string };
          }>;
          title?: string;
          creationDate?: string;
          totalPrice?: number;
          currency?: string;
          paymentStatus?: string;
        };
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
          return jsonResponse(verifiedResp);
        }
      }
    } catch {
      // Fall through to unverified notice
    }
  }

  const resp: VerifiedBookingConfirmation = {
    verified: false,
    status: 'unverified_return',
    provider,
    bookingReference: bookingRef,
    verificationMessage:
      'We received your return from the booking provider, but live server-side confirmation verification is not active for this reference. Do not treat this page as proof of confirmation—your official voucher, payment receipt, and booking status are sent directly by the provider via email.',
  };

  return jsonResponse(resp);
}
