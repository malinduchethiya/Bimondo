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
    name: 'Cultural Triangle Boutique & Luxury Stays',
    location: 'Sigiriya, Dambulla & Habarana · Cultural Triangle',
    region: 'culture',
    regionLabel: 'Cultural Triangle',
    tagline: 'Four-star hotels, boutique properties, and five-star luxury resorts near Sigiriya',
    description:
      'Selected according to your route, budget, and preference in Sri Lanka’s Cultural Triangle—positioned for early morning climbs at Sigiriya and Pidurangala, Dambulla cave visits, and afternoon safaris at Minneriya.',
    highlights: [
      'Four-star, boutique, and five-star options',
      'Convenient access to Sigiriya, Pidurangala & Dambulla',
      'Confirmed individually at the time of enquiry',
    ],
    maxGuestsPerRoom: 3,
    image:
      'https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=1000&q=85',
  },
  {
    id: 'stay-kandy-planter-bungalow',
    name: 'Kandy & Sacred Hill Capital Stays',
    location: 'Kandy · Central Province',
    region: 'hills',
    regionLabel: 'Central Highlands',
    tagline: 'Hillside boutique properties and four-to-five-star hotels in Kandy',
    description:
      'Carefully chosen properties in and around Kandy offering peaceful hillside or lakeside settings, well placed for visiting the Temple of the Tooth and beginning The Pekoe Trail.',
    highlights: [
      'Four-star hotels, boutique stays & five-star resorts',
      'Easy access to the Temple of the Tooth & Kandy Lake',
      'Selected around your preferred travel pace',
    ],
    maxGuestsPerRoom: 3,
    image:
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1000&q=85',
  },
  {
    id: 'stay-ella-nine-skies-bungalow',
    name: 'Nuwara Eliya & Ella Tea Country Stays',
    location: 'Nuwara Eliya & Ella · Hill Country',
    region: 'hills',
    regionLabel: 'Tea Country',
    tagline: 'Highland hotels, tea-country boutique stays, and luxury retreats',
    description:
      'Set in the cool mountain air of Nuwara Eliya and Ella, these properties are selected for travellers exploring tea estates, the scenic hill train, Little Adam’s Peak, Ella Rock, and Horton Plains.',
    highlights: [
      'Four-star, boutique & five-star hill country properties',
      'Positioned for The Pekoe Trail & Horton Plains',
      'Matched to couples, families, or solo travellers',
    ],
    maxGuestsPerRoom: 4,
    image:
      'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1000&q=85',
  },
  {
    id: 'stay-galle-fort-courtyard',
    name: 'Galle & Unawatuna Heritage & Coastal Stays',
    location: 'Galle & Unawatuna · South Coast',
    region: 'coast',
    regionLabel: 'South Coast',
    tagline: 'Boutique fort properties and four-to-five-star southern coastal resorts',
    description:
      'From heritage boutique stays in and around Galle to beachfront resorts along Unawatuna and Bentota, selected according to season and your preferred level of comfort.',
    highlights: [
      'Boutique properties, four-star & five-star coastal resorts',
      'Ideal for Galle Fort walks & southern beach days',
      'Best visited from November to April',
    ],
    maxGuestsPerRoom: 3,
    image:
      'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1000&q=85',
  },
  {
    id: 'stay-yala-wild-camp',
    name: 'Yala, Udawalawe & Wilpattu Safari Stays',
    location: 'Yala, Udawalawe & Wilpattu · National Park Regions',
    region: 'wildlife',
    regionLabel: 'Wildlife & Nature',
    tagline: 'Safari lodges, four-star hotels, and five-star wilderness resorts',
    description:
      'Positioned close to Sri Lanka’s principal national parks—Yala, Udawalawe, and Wilpattu—allowing early morning and late afternoon safari departures with responsible park operators.',
    highlights: [
      'Close to Yala, Udawalawe & Wilpattu park gates',
      'Four-star, boutique & five-star safari accommodation',
      'Coordinated with private 4x4 safari departures',
    ],
    maxGuestsPerRoom: 3,
    image:
      'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&w=1000&q=85',
  },
  {
    id: 'stay-mirissa-ocean-villa',
    name: 'Mirissa, Weligama & East Coast Beach Stays',
    location: 'Mirissa, Weligama, Arugam Bay & Kalpitiya',
    region: 'coast',
    regionLabel: 'Sea & Sand Escapes',
    tagline: 'Seasonal coastal stays from the South Coast to Arugam Bay and Kalpitiya',
    description:
      'Whether surfing at Weligama (November–April) or Arugam Bay (May–October), kite surfing in Kalpitiya, or relaxing in Mirissa, we recommend four-star, boutique, and five-star beachfront stays suited to the season.',
    highlights: [
      'Seasonally matched South, West & East Coast properties',
      'Four-star hotels, boutique stays & five-star beach resorts',
      'Tailored for beach relaxation, surfing, or family stays',
    ],
    maxGuestsPerRoom: 4,
    image:
      'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1000&q=85',
  },
];

