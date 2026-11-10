import fs from 'fs';
import path from 'path';
import {
  ACCOMMODATIONS,
  BookingProviderId,
  ItemBookingAssignment,
  PublicBookingSettings,
} from '@/lib/booking-types';
import { TOURS } from '@/lib/tours';

const SETTINGS_FILE_PATH = path.join(
  process.cwd(),
  '.aistudio-booking-settings.json'
);

export interface ServerBookingCredentials {
  nightsbridgeClientKey: string;
  bokunAccessKey: string;
  bokunSecretKey: string;
  viatorApiKey: string;
}

function buildDefaultAssignments(): Record<string, ItemBookingAssignment> {
  const map: Record<string, ItemBookingAssignment> = {};

  const envBbid = process.env.NIGHTSBRIDGE_BBID?.trim() || '';
  const envBokunExp = '';
  const envViatorPartner = process.env.VIATOR_PARTNER_ID?.trim() || '';

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

  // Default assignments for Tours -> Bókun (first 6) & Viator (remaining 3)
  TOURS.forEach((tour, idx) => {
    const defaultProvider: BookingProviderId = idx < 6 ? 'bokun' : 'viator';
    map[tour.id] = {
      itemId: tour.id,
      itemName: tour.name,
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

  // Destinations / Experiences
  const destinationIds = [
    { id: 'sigiriya', name: 'Sigiriya & The Cultural Triangle Experience' },
    { id: 'kandy-hills', name: 'Kandy & Knuckles Guided Experience' },
    { id: 'ella-nuwara-eliya', name: 'Ella & Tea Country Experience' },
    { id: 'galle-south-coast', name: 'Galle Fort & Southern Coast Experience' },
    { id: 'yala-wildlife', name: 'Yala & Udawalawe Private Safari' },
    { id: 'minneriya', name: 'Minneriya Elephant Gathering Safari' },
  ];

  destinationIds.forEach((dest, idx) => {
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

export function getDefaultBookingSettings(): PublicBookingSettings {
  const envBbid = process.env.NIGHTSBRIDGE_BBID?.trim() || '';
  const envBokunChannel = process.env.BOKUN_BookingChannelUUID?.trim() || '';
  const envViatorPartner = process.env.VIATOR_PARTNER_ID?.trim() || '';

  return {
    defaultCurrency: 'USD',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'LKR'],
    nightsbridge: {
      enabled: true,
      bbid: envBbid,
      widgetBaseUrl: 'https://book.nightsbridge.com',
      openMode: 'modal',
      buttonLabel: 'BOOK ACCOMMODATION',
      hasServerCredentials: Boolean(process.env.NIGHTSBRIDGE_CLIENT_KEY?.trim()),
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
        process.env.BOKUN_ACCESS_KEY?.trim() &&
          process.env.BOKUN_SECRET_KEY?.trim()
      ),
    },
    viator: {
      enabled: true,
      partnerId: envViatorPartner,
      widgetRef: '',
      defaultBookingUrl: '',
      openMode: 'redirect',
      buttonLabel: 'BOOK EXPERIENCE ON VIATOR',
      hasServerCredentials: Boolean(process.env.VIATOR_API_KEY?.trim()),
    },
    assignments: buildDefaultAssignments(),
    updatedAt: new Date().toISOString(),
  };
}

let memorySettings: PublicBookingSettings | null = null;
let memoryCredentials: ServerBookingCredentials = {
  nightsbridgeClientKey: process.env.NIGHTSBRIDGE_CLIENT_KEY?.trim() || '',
  bokunAccessKey: process.env.BOKUN_ACCESS_KEY?.trim() || '',
  bokunSecretKey: process.env.BOKUN_SECRET_KEY?.trim() || '',
  viatorApiKey: process.env.VIATOR_API_KEY?.trim() || '',
};

export function getServerBookingSettings(): PublicBookingSettings {
  if (!memorySettings) {
    try {
      if (fs.existsSync(SETTINGS_FILE_PATH)) {
        const raw = fs.readFileSync(SETTINGS_FILE_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.publicSettings) {
          memorySettings = {
            ...getDefaultBookingSettings(),
            ...parsed.publicSettings,
            assignments: {
              ...buildDefaultAssignments(),
              ...(parsed.publicSettings.assignments || {}),
            },
          };
        }
        if (parsed && parsed.serverCredentials) {
          memoryCredentials = {
            ...memoryCredentials,
            ...parsed.serverCredentials,
          };
        }
      }
    } catch {
      // Fallback to in-memory defaults if file read fails
    }
  }

  const base = memorySettings || getDefaultBookingSettings();

  return {
    ...base,
    nightsbridge: {
      ...base.nightsbridge,
      hasServerCredentials: Boolean(memoryCredentials.nightsbridgeClientKey),
    },
    bokun: {
      ...base.bokun,
      hasServerCredentials: Boolean(
        memoryCredentials.bokunAccessKey && memoryCredentials.bokunSecretKey
      ),
    },
    viator: {
      ...base.viator,
      hasServerCredentials: Boolean(memoryCredentials.viatorApiKey),
    },
  };
}

export function getServerCredentials(): ServerBookingCredentials {
  getServerBookingSettings();
  return memoryCredentials;
}

export function updateServerBookingSettings(
  nextPublic: Partial<PublicBookingSettings>,
  nextSecrets?: Partial<ServerBookingCredentials>
): PublicBookingSettings {
  const current = getServerBookingSettings();

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

  const merged: PublicBookingSettings = {
    ...current,
    ...nextPublic,
    nightsbridge: {
      ...current.nightsbridge,
      ...(nextPublic.nightsbridge || {}),
      hasServerCredentials: Boolean(memoryCredentials.nightsbridgeClientKey),
    },
    bokun: {
      ...current.bokun,
      ...(nextPublic.bokun || {}),
      hasServerCredentials: Boolean(
        memoryCredentials.bokunAccessKey && memoryCredentials.bokunSecretKey
      ),
    },
    viator: {
      ...current.viator,
      ...(nextPublic.viator || {}),
      hasServerCredentials: Boolean(memoryCredentials.viatorApiKey),
    },
    assignments: {
      ...current.assignments,
      ...(nextPublic.assignments || {}),
    },
    updatedAt: new Date().toISOString(),
  };

  memorySettings = merged;

  try {
    fs.writeFileSync(
      SETTINGS_FILE_PATH,
      JSON.stringify(
        {
          publicSettings: merged,
          serverCredentials: memoryCredentials,
        },
        null,
        2
      ),
      'utf8'
    );
  } catch {
    // Ignore read-only filesystem errors; memorySettings remains updated
  }

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
