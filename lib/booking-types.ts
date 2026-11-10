export type BookingProviderId = 'nightsbridge' | 'bokun' | 'viator';

export type SupportedCurrency = 'USD' | 'EUR' | 'GBP' | 'LKR';

export type BookingOpenMode = 'inline' | 'modal' | 'redirect';

export type BookingItemType = 'tour' | 'accommodation' | 'experience';

export interface NightsBridgeConfig {
  enabled: boolean;
  /** Official NightsBridge Establishment ID (BBID), e.g. used in https://book.nightsbridge.com/{bbid} */
  bbid: string;
  /** Official NightsBridge booking engine base URL */
  widgetBaseUrl: string;
  openMode: BookingOpenMode;
  buttonLabel: string;
  /** Read-only flag indicating whether server-side NightsBridge API credentials are set */
  hasServerCredentials?: boolean;
}

export interface BokunConfig {
  enabled: boolean;
  /** Official Bókun bookingChannelUUID used by BokunWidgetsLoader.js */
  bookingChannelUuid: string;
  /** Default Bókun experience / activity ID if an item does not override it */
  defaultExperienceId: string;
  /** Official Bókun widget loader script URL */
  widgetScriptUrl: string;
  openMode: BookingOpenMode;
  buttonLabel: string;
  /** Read-only flag indicating whether server-side BOKUN_ACCESS_KEY & BOKUN_SECRET_KEY are set */
  hasServerCredentials?: boolean;
}

export interface ViatorConfig {
  enabled: boolean;
  /** Official Viator Partner / Affiliate ID (PID / MCID) */
  partnerId: string;
  /** Optional Viator widget data-partner-id / banner ref */
  widgetRef: string;
  /** Default Viator destination or tour URL */
  defaultBookingUrl: string;
  openMode: BookingOpenMode;
  buttonLabel: string;
  /** Read-only flag indicating whether server-side VIATOR_API_KEY is set */
  hasServerCredentials?: boolean;
}

export interface ItemBookingAssignment {
  itemId: string;
  itemName: string;
  itemType: BookingItemType;
  provider: BookingProviderId;
  /** Provider-specific identifier: NightsBridge BBID, Bókun Activity ID, or Viator Product Code */
  externalId: string;
  /** Direct official provider checkout or listing URL (required for Viator link mode or custom overrides) */
  externalUrl: string;
  /** Optional raw official embed snippet provided by the operator */
  embedCode?: string;
  openMode: BookingOpenMode;
  buttonLabel: string;
}

export interface PublicBookingSettings {
  defaultCurrency: SupportedCurrency;
  supportedCurrencies: SupportedCurrency[];
  nightsbridge: NightsBridgeConfig;
  bokun: BokunConfig;
  viator: ViatorConfig;
  assignments: Record<string, ItemBookingAssignment>;
  updatedAt: string;
}

export interface AvailabilitySlot {
  time: string;
  availableCount?: number;
  rateLabel?: string;
}

export interface CalendarDayAvailability {
  date: string; // YYYY-MM-DD
  available: boolean;
  startingPrice?: number;
  currency?: SupportedCurrency;
  seasonalTier?: string;
  departureTimes?: AvailabilitySlot[];
}

export interface VerifiedPricingLineItem {
  label: string;
  amount: number;
  currency: SupportedCurrency;
}

export interface VerifiedPricingQuote {
  currency: SupportedCurrency;
  pricingBasis: 'per_person' | 'per_night' | 'private_group';
  adultRate?: number;
  childRate?: number;
  nightlyRate?: number;
  privateSupplement?: number;
  seasonalLabel?: string;
  subtotal: number;
  taxesAndFees: number;
  total: number;
  lineItems: VerifiedPricingLineItem[];
  verifiedAt: string;
  expiresAt: string;
}

export interface LiveAvailabilityResponse {
  provider: BookingProviderId;
  itemId: string;
  externalId: string;
  /**
   * 'live_provider_api' — Real availability & rates retrieved from the provider API.
   * 'widget_only' — Provider is configured for official widget/redirect checkout, but live API availability is not enabled; user must check live dates inside the official provider widget/checkout.
   * 'unconfigured' — Provider credentials or widget IDs are not configured yet.
   * 'error' — Provider API returned an error.
   */
  source: 'live_provider_api' | 'widget_only' | 'unconfigured' | 'error';
  message: string;
  checkoutUrl: string | null;
  days: Record<string, CalendarDayAvailability>;
  quote: VerifiedPricingQuote | null;
}

export interface VerifiedBookingConfirmation {
  verified: boolean;
  status: 'confirmed' | 'unverified_return' | 'unconfigured' | 'failed';
  provider: BookingProviderId;
  bookingReference: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  itemName?: string | null;
  dates?: {
    checkInOrStart: string;
    checkOutOrEnd?: string;
    departureTime?: string;
  } | null;
  guests?: {
    adults: number;
    children: number;
    rooms?: number;
  } | null;
  totalPrice?: {
    amount: number;
    currency: SupportedCurrency;
  } | null;
  paymentStatus?: string | null;
  cancellationPolicy?: string | null;
  verificationMessage: string;
  verifiedAt?: string | null;
}

export interface AccommodationItem {
  id: string;
  name: string;
  location: string;
  region: 'culture' | 'hills' | 'coast' | 'wildlife';
  regionLabel: string;
  tagline: string;
  description: string;
  highlights: string[];
  maxGuestsPerRoom: number;
  image: string;
}

export const ACCOMMODATIONS: AccommodationItem[] = [
  {
    id: 'stay-sigiriya-water-gardens',
    name: 'Sigiriya Sanctuary Pool Villa',
    location: 'Sigiriya · Cultural Triangle',
    region: 'culture',
    regionLabel: 'Cultural Triangle',
    tagline: 'Private plunge pools facing the 5th-century Lion Rock',
    description:
      'Set amidst lotus ponds and rustling teak forest, this intimate boutique sanctuary offers uninterrupted views of Sigiriya Rock Fortress and dawn birdlife walks.',
    highlights: [
      'Direct views of Sigiriya Lion Rock',
      'Private plunge pool & verandah',
      '20 minutes from Minneriya safari gate',
    ],
    maxGuestsPerRoom: 3,
    image:
      'https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=1000&q=85',
  },
  {
    id: 'stay-kandy-planter-bungalow',
    name: 'Hanthana Estate Planter’s Bungalow',
    location: 'Kandy · Central Highlands',
    region: 'hills',
    regionLabel: 'Central Highlands',
    tagline: 'Restored 19th-century hill residence above Kandy valley',
    description:
      'Tucked high in the misty Hanthana mountain range, this heritage bungalow pairs crackling fireplaces and butler service with direct access to Stage 1 of The Pekoe Trail.',
    highlights: [
      'Historic colonial verandah & gardens',
      'Direct access to The Pekoe Trail',
      'Farm-to-table Sri Lankan rice & curry dining',
    ],
    maxGuestsPerRoom: 3,
    image:
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1000&q=85',
  },
  {
    id: 'stay-ella-nine-skies-bungalow',
    name: 'Demodara Cloud Tea Bungalow',
    location: 'Ella · Tea Country',
    region: 'hills',
    regionLabel: 'Tea Country',
    tagline: 'Five-suite tea estate hideaway overlooking Demodara loop',
    description:
      'Surrounded by working organic tea fields and cloud forest ridges, wake up to mountain mist, garden-Plucked Ceylon tea, and infinity pool views across Ella Gap.',
    highlights: [
      'Heated garden pool over tea valleys',
      'Private guided walks to Nine Arch Bridge',
      'Personal chef & afternoon high tea',
    ],
    maxGuestsPerRoom: 4,
    image:
      'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1000&q=85',
  },
  {
    id: 'stay-galle-fort-courtyard',
    name: 'Galle Fort Rampart Courtyard House',
    location: 'Galle Fort · South Coast',
    region: 'coast',
    regionLabel: 'Southern Riviera',
    tagline: '17th-century Dutch merchant house inside UNESCO Galle Fort',
    description:
      'Tall teak colonnades, frangipani courtyards, and cool coral-stone suites steps from the historic lighthouse and ocean ramparts of Galle Fort.',
    highlights: [
      'Inside UNESCO World Heritage Galle Fort',
      'Courtyard lap pool & library lounge',
      'Evening rampart & architectural walks',
    ],
    maxGuestsPerRoom: 3,
    image:
      'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1000&q=85',
  },
  {
    id: 'stay-yala-wild-camp',
    name: 'Yala Dunes Luxury Safari Camp',
    location: 'Yala National Park Border',
    region: 'wildlife',
    regionLabel: 'Wildlife & Safari',
    tagline: 'Tented wilderness pavilions where jungle meets the Indian Ocean',
    description:
      'Bordering quieter park buffer zones near Yala, these air-conditioned canvas pavilions include dawn and dusk private 4x4 leopard-tracking drives with senior naturalists.',
    highlights: [
      'Private naturalist-guided 4x4 game drives',
      'Canvas suites with outdoor copper tubs',
      'Campfire dining under southern stars',
    ],
    maxGuestsPerRoom: 3,
    image:
      'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&w=1000&q=85',
  },
  {
    id: 'stay-mirissa-ocean-villa',
    name: 'Mirissa Coconut Headland Villa',
    location: 'Mirissa · South Coast',
    region: 'coast',
    regionLabel: 'Southern Riviera',
    tagline: 'Clifftop palm grove suites overlooking secret surf coves',
    description:
      'Perched on a quiet headland between Weligama and Mirissa, enjoy private ocean terraces, Ayurvedic spa rituals, and seasonal blue-whale departures.',
    highlights: [
      'Panoramic Indian Ocean sunset terrace',
      'Private path to secluded sandy cove',
      '10 minutes from Mirissa harbour',
    ],
    maxGuestsPerRoom: 4,
    image:
      'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1000&q=85',
  },
];
