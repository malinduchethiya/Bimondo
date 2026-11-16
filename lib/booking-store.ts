import {
  ACCOMMODATIONS,
  BookingProviderId,
  ItemBookingAssignment,
  PublicBookingSettings,
} from '@/lib/booking-types';
import { COLOMBO_DAY_EXPERIENCES, TOURS } from '@/lib/tours';
import { DEFAULT_DESTINATIONS } from '@/lib/cms-defaults';

export interface ServerBookingCredentials {
  nightsbridgeClientKey: string;
  bokunAccessKey: string;
  bokunSecretKey: string;
  viatorApiKey: string;
}

type EnvRecord = Record<string, string | undefined>;

function readEnv(env?: EnvRecord): EnvRecord {
  if (env) return env;
  return typeof process !== 'undefined' && process.env ? process.env : {};
}

function buildDefaultAssignments(env?: EnvRecord): Record<string, ItemBookingAssignment> {
  const e = readEnv(env);
  const map: Record<string, ItemBookingAssignment> = {};

  const envBbid = e.NIGHTSBRIDGE_BBID?.trim() || '';
  const envBokunExp = '';
  const envViatorPartner = e.VIATOR_PARTNER_ID?.trim() || '';

  // Default assignments for Accommodations -> NightsBridge
  ACCOMMODATIONS.forEach((stay) => {
    map[stay.id] = {
      itemId: stay.id,
      itemName: stay.name,
      itemType: 'accommodation',
      provider: 'nightsbridge',
      externalId: envBbid,
      externalUrl: envBbid
        ? `https://book.nightsbridge.com/${encodeURIComponent(envBbid)}`
        : '',
      embedCode: '',
      openMode: 'modal',
      buttonLabel: 'CHECK NIGHTSBRIDGE AVAILABILITY',
    };
  });

  // Default assignments for all 20 Signature Journeys -> Bókun (first 12) & Viator (remaining 8)
  TOURS.forEach((tour, idx) => {
    const defaultProvider: BookingProviderId = idx < 12 ? 'bokun' : 'viator';
    map[tour.id] = {
      itemId: tour.id,
      itemName: `${tour.name} (${tour.days} Days)`,
      itemType: 'tour',
      provider: defaultProvider,
      externalId: defaultProvider === 'bokun' ? envBokunExp : '',
      externalUrl:
        defaultProvider === 'viator' && envViatorPartner
          ? `https://www.viator.com/Sri-Lanka/d19-ttd?pid=${encodeURIComponent(
              envViatorPartner
            )}`
          : '',
      embedCode: '',
      openMode: defaultProvider === 'viator' ? 'redirect' : 'modal',
      buttonLabel:
        defaultProvider === 'bokun'
          ? 'BOOK VIA BÓKUN'
          : 'BOOK ON VIATOR',
    };
  });

  // Default assignments for the 6 Colombo & Battaramulla Day Experiences
  COLOMBO_DAY_EXPERIENCES.forEach((exp, idx) => {
    const provider: BookingProviderId = idx % 2 === 0 ? 'bokun' : 'viator';
    map[exp.id] = {
      itemId: exp.id,
      itemName: `${exp.name} (${exp.duration})`,
      itemType: 'experience',
      provider,
      externalId: '',
      externalUrl: '',
      embedCode: '',
      openMode: provider === 'viator' ? 'redirect' : 'modal',
      buttonLabel:
        provider === 'viator'
          ? 'BOOK DAY TRIP ON VIATOR'
          : 'BOOK DAY TRIP VIA BÓKUN',
    };
  });

  // Regional Destinations
  DEFAULT_DESTINATIONS.forEach((dest, idx) => {
    const provider: BookingProviderId = idx % 2 === 0 ? 'viator' : 'bokun';
    map[dest.id] = {
      itemId: dest.id,
      itemName: dest.name,
      itemType: 'experience',
      provider,
      externalId: '',
      externalUrl: '',
      embedCode: '',
      openMode: provider === 'viator' ? 'redirect' : 'modal',
      buttonLabel:
        provider === 'viator'
          ? 'VIEW ON VIATOR'
          : 'CHECK BÓKUN DATES',
    };
  });

  return map;
}

export function getDefaultBookingSettings(env?: EnvRecord): PublicBookingSettings {
  const e = readEnv(env);
  const envBbid = e.NIGHTSBRIDGE_BBID?.trim() || '';
  const envBokunChannel = e.BOKUN_BookingChannelUUID?.trim() || '';
  const envViatorPartner = e.VIATOR_PARTNER_ID?.trim() || '';

  return {
    defaultCurrency: 'USD',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'LKR'],
    nightsbridge: {
      enabled: true,
      bbid: envBbid,
      widgetBaseUrl: 'https://book.nightsbridge.com',
      openMode: 'modal',
      buttonLabel: 'BOOK ACCOMMODATION',
      hasServerCredentials: Boolean(e.NIGHTSBRIDGE_CLIENT_KEY?.trim()),
    },
    bokun: {
      enabled: true,
      bookingChannelUuid: envBokunChannel,
      defaultExperienceId: '',
      widgetScriptUrl:
        'https://widgets.bokun.io/assets/javascripts/apps/build/BokunWidgetsLoader.js',
      openMode: 'modal',
      buttonLabel: 'BOOK TOUR VIA BÓKUN',
      hasServerCredentials: Boolean(
        e.BOKUN_ACCESS_KEY?.trim() && e.BOKUN_SECRET_KEY?.trim()
      ),
    },
    viator: {
      enabled: true,
      partnerId: envViatorPartner,
      widgetRef: '',
      defaultBookingUrl: '',
      openMode: 'redirect',
      buttonLabel: 'BOOK EXPERIENCE ON VIATOR',
      hasServerCredentials: Boolean(e.VIATOR_API_KEY?.trim()),
    },
    assignments: buildDefaultAssignments(e),
    updatedAt: new Date().toISOString(),
  };
}

let memorySettings: PublicBookingSettings | null = null;
const memoryCredentials: ServerBookingCredentials = {
  nightsbridgeClientKey: '',
  bokunAccessKey: '',
  bokunSecretKey: '',
  viatorApiKey: '',
};

function resolvedCredentials(env?: EnvRecord): ServerBookingCredentials {
  const e = readEnv(env);
  return {
    nightsbridgeClientKey:
      memoryCredentials.nightsbridgeClientKey ||
      e.NIGHTSBRIDGE_CLIENT_KEY?.trim() ||
      '',
    bokunAccessKey:
      memoryCredentials.bokunAccessKey || e.BOKUN_ACCESS_KEY?.trim() || '',
    bokunSecretKey:
      memoryCredentials.bokunSecretKey || e.BOKUN_SECRET_KEY?.trim() || '',
    viatorApiKey:
      memoryCredentials.viatorApiKey || e.VIATOR_API_KEY?.trim() || '',
  };
}

export function getServerBookingSettings(env?: EnvRecord): PublicBookingSettings {
  const base = memorySettings || getDefaultBookingSettings(env);
  const creds = resolvedCredentials(env);

  return {
    ...base,
    nightsbridge: {
      ...base.nightsbridge,
      hasServerCredentials: Boolean(creds.nightsbridgeClientKey),
    },
    bokun: {
      ...base.bokun,
      hasServerCredentials: Boolean(
        creds.bokunAccessKey && creds.bokunSecretKey
      ),
    },
    viator: {
      ...base.viator,
      hasServerCredentials: Boolean(creds.viatorApiKey),
    },
  };
}

export function getServerCredentials(env?: EnvRecord): ServerBookingCredentials {
  return resolvedCredentials(env);
}

export function updateServerBookingSettings(
  nextPublic: Partial<PublicBookingSettings>,
  nextSecrets?: Partial<ServerBookingCredentials>,
  env?: EnvRecord
): PublicBookingSettings {
  const current = getServerBookingSettings(env);

  if (nextSecrets) {
    if (typeof nextSecrets.nightsbridgeClientKey === 'string') {
      memoryCredentials.nightsbridgeClientKey =
        nextSecrets.nightsbridgeClientKey.trim();
    }
    if (typeof nextSecrets.bokunAccessKey === 'string') {
      memoryCredentials.bokunAccessKey = nextSecrets.bokunAccessKey.trim();
    }
    if (typeof nextSecrets.bokunSecretKey === 'string') {
      memoryCredentials.bokunSecretKey = nextSecrets.bokunSecretKey.trim();
    }
    if (typeof nextSecrets.viatorApiKey === 'string') {
      memoryCredentials.viatorApiKey = nextSecrets.viatorApiKey.trim();
    }
  }

  const creds = resolvedCredentials(env);

  const merged: PublicBookingSettings = {
    ...current,
    ...nextPublic,
    nightsbridge: {
      ...current.nightsbridge,
      ...(nextPublic.nightsbridge || {}),
      hasServerCredentials: Boolean(creds.nightsbridgeClientKey),
    },
    bokun: {
      ...current.bokun,
      ...(nextPublic.bokun || {}),
      hasServerCredentials: Boolean(
        creds.bokunAccessKey && creds.bokunSecretKey
      ),
    },
    viator: {
      ...current.viator,
      ...(nextPublic.viator || {}),
      hasServerCredentials: Boolean(creds.viatorApiKey),
    },
    assignments: {
      ...current.assignments,
      ...(nextPublic.assignments || {}),
    },
    updatedAt: new Date().toISOString(),
  };

  memorySettings = merged;
  return merged;
}

/**
 * Helper to construct the official NightsBridge booking engine URL with check-in/out & guest parameters
 */
export function buildNightsBridgeBookingUrl(params: {
  bbid: string;
  widgetBaseUrl?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  rooms?: number;
  currency?: string;
}): string | null {
  const cleanBbid = params.bbid.trim();
  if (!cleanBbid) return null;
  const base = (params.widgetBaseUrl || 'https://book.nightsbridge.com').replace(
    /\/+$/,
    ''
  );
  const url = new URL(`${base}/${encodeURIComponent(cleanBbid)}`);
  if (params.checkIn) url.searchParams.set('startdate', params.checkIn);
  if (params.checkOut) url.searchParams.set('enddate', params.checkOut);
  if (params.adults) url.searchParams.set('adults', String(params.adults));
  if (typeof params.children === 'number') {
    url.searchParams.set('children', String(params.children));
  }
  if (params.rooms) url.searchParams.set('rooms', String(params.rooms));
  if (params.currency) url.searchParams.set('currency', params.currency);
  return url.toString();
}

/**
 * Helper to construct the official Bókun online booking widget URL when opened in standalone/iframe or redirect mode
 */
export function buildBokunCheckoutUrl(params: {
  bookingChannelUuid: string;
  experienceId: string;
  date?: string;
}): string | null {
  const uuid = params.bookingChannelUuid.trim();
  const expId = params.experienceId.trim();
  if (!uuid || !expId) return null;
  const url = new URL(
    `https://widgets.bokun.io/online-sales/${encodeURIComponent(
      uuid
    )}/experience-calendar/${encodeURIComponent(expId)}`
  );
  if (params.date) {
    url.searchParams.set('date', params.date);
  }
  return url.toString();
}

/**
 * Helper to construct an official Viator checkout/listing URL with affiliate tracking parameters
 */
export function buildViatorBookingUrl(params: {
  externalUrl?: string;
  defaultBookingUrl?: string;
  productCode?: string;
  partnerId?: string;
  currency?: string;
}): string | null {
  const rawBase =
    params.externalUrl?.trim() || params.defaultBookingUrl?.trim() || '';
  if (!rawBase) return null;

  try {
    const url = new URL(rawBase);
    if (params.partnerId?.trim()) {
      url.searchParams.set('pid', params.partnerId.trim());
    }
    if (params.currency?.trim()) {
      url.searchParams.set('currency', params.currency.trim());
    }
    return url.toString();
  } catch {
    return null;
  }
}
