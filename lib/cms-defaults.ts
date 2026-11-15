import {
  TOURS,
  Tour,
  COLOMBO_DAY_EXPERIENCES,
  ColomboDayExperience,
  TOUR_QUALIFICATION_NOTICE,
} from '@/lib/tours';
import { ACCOMMODATIONS, AccommodationItem } from '@/lib/booking-types';
import { BENTO_DESTINATIONS, BentoDestination } from '@/lib/bento-destinations';

export type StaggerSlideVariant =
  | 'tall-up'
  | 'low-down'
  | 'mid-up'
  | 'compact-mid'
  | 'tall-deep';

/**
 * Structured image reference with reserved R2 object key.
 * - url: existing image URL or asset path
 * - key: null for existing assets; reserved for a future R2 object key
 * - alt: image description
 */
export interface CmsImageRef {
  url: string;
  key: string | null;
  alt: string;
}

export function createImageRef(
  url = '',
  alt = '',
  key: string | null = null
): CmsImageRef {
  return {
    url: typeof url === 'string' ? url.trim() : '',
    key: key ?? null,
    alt: typeof alt === 'string' ? alt : '',
  };
}

export interface CmsNavLinkItem {
  id: string;
  label: string;
  href: string;
  visible: boolean;
  order: number;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export interface CmsHeroSlideItem {
  id: string;
  image: CmsImageRef;
  visible: boolean;
  order: number;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export interface CmsDestination {
  id: string;
  name: string;
  region: 'culture' | 'hills' | 'coast' | 'wildlife' | 'colombo';
  regionLabel: string;
  season: string;
  tagline: string;
  description: string;
  highlights: string[];
  image: string;
  imageRef: CmsImageRef;
  staggerVariant?: StaggerSlideVariant;
  visible?: boolean;
  order?: number;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export interface CmsGalleryPhoto {
  id: string;
  title: string;
  location: string;
  category: 'culture' | 'highlands' | 'wildlife' | 'coast';
  categoryLabel: string;
  image: string;
  imageRef: CmsImageRef;
  description: string;
  visible?: boolean;
  order?: number;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export interface CmsReviewItem {
  id: string;
  name: string;
  location: string;
  rating: number;
  tour: string;
  date: string;
  quote: string;
  image?: string;
  imageRef: CmsImageRef;
  visible?: boolean;
  order?: number;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export interface CmsFaqItem {
  id: string;
  category: 'private' | 'stays' | 'booking';
  q: string;
  a: string;
  visible?: boolean;
  order?: number;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export interface CmsTourItem extends Tour {
  imageRef: CmsImageRef;
  visible?: boolean;
  order?: number;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export interface CmsStayItem extends AccommodationItem {
  imageRef: CmsImageRef;
  visible?: boolean;
  order?: number;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export interface CmsColomboExperienceItem extends ColomboDayExperience {
  imageRef: CmsImageRef;
  visible?: boolean;
  order?: number;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export interface CmsBentoSlideItem extends BentoDestination {
  heroImageRef: CmsImageRef;
  pathwayImageRef: CmsImageRef;
  tallSceneImageRef: CmsImageRef;
  natureImageRef: CmsImageRef;
  cuisineImageRef: CmsImageRef;
  visible?: boolean;
  order?: number;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export type BookingSubmissionMethod =
  | 'direct_admin'
  | 'whatsapp'
  | 'email'
  | 'callback'
  | 'manual';

export interface CmsCustomerEnquiry {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone?: string;
  bookingMethod?: BookingSubmissionMethod;
  selectedPackage?: string;
  arrival: string;
  guests: string;
  duration: string;
  style: string;
  message: string;
  status: 'new' | 'in_progress' | 'replied' | 'archived';
  adminNotes: string;
}

export interface CmsGeneralSettings {
  siteName: string;
  tagline: string;
  whatsappNumber: string;
  contactEmail: string;
  instagramUrl: string;
  locationLabel: string;
  foundedYear: string;
  founderName?: string;
  facebookLabel?: string;
  websiteUrl?: string;
  primaryMarkets?: string;
  heroImages?: string[];
  storyMainImage?: string;
  storySecondaryImage?: string;
  experienceImage?: string;
  tripadvisorEnabled?: boolean;
  tripadvisorBrand?: string;
  tripadvisorRating?: string;
  tripadvisorReviewsText?: string;
}

export interface CmsSharedPageContent {
  header: {
    brandMonogram: string;
    brandName: string;
    brandSubtitle: string;
    navLinks: CmsNavLinkItem[];
    ctaLabel: string;
    ctaHref: string;
  };
  footer: {
    brandMonogram: string;
    brandName: string;
    tagline: string;
    addressLine: string;
    founderMarketsLine: string;
    exploreHeading: string;
    exploreLinks: CmsNavLinkItem[];
    bookingsHeading: string;
    bookingsLinks: CmsNavLinkItem[];
    contactHeading: string;
    email: string;
    whatsappDisplay: string;
    whatsappUrl: string;
    instagramDisplay: string;
    instagramUrl: string;
    facebookDisplay: string;
    websiteDisplay: string;
    copyrightAddress: string;
    bottomRightNote: string;
    floatingCtaLabel: string;
    floatingCtaHref: string;
  };
}

export interface CmsHomePageContent {
  hero: {
    visible: boolean;
    deletedAt?: string | null;
    deletedBy?: string | null;
    eyebrow: string;
    headlinePart1: string;
    headlineHighlight1: string;
    headlineItalic: string;
    headlineHighlight2: string;
    description: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
    tripadvisorEnabled: boolean;
    tripadvisorBrand: string;
    tripadvisorRating: string;
    tripadvisorReviewsText: string;
    slides: CmsHeroSlideItem[];
  };
  heroTransition: {
    visible: boolean;
    deletedAt?: string | null;
    deletedBy?: string | null;
    pillars: {
      id: string;
      num: string;
      badge: string;
      title: string;
      desc: string;
    }[];
  };
  story: {
    visible: boolean;
    deletedAt?: string | null;
    deletedBy?: string | null;
    eyebrow: string;
    headingLine1: string;
    headingLine2: string;
    headingItalic: string;
    paragraph1: string;
    paragraph2: string;
    quote: string;
    ctaLabel: string;
    ctaHref: string;
    mainImage: CmsImageRef;
    secondaryImage: CmsImageRef;
  };
  bentoSlider: {
    visible: boolean;
    deletedAt?: string | null;
    deletedBy?: string | null;
    prevButtonLabel: string;
    nextButtonLabel: string;
  };
  experience: {
    visible: boolean;
    deletedAt?: string | null;
    deletedBy?: string | null;
    eyebrow: string;
    headingLine1: string;
    headingLine2Prefix: string;
    headingItalic: string;
    headingLine3: string;
    description: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
    featureImage: CmsImageRef;
    items: {
      id: string;
      num: string;
      title: string;
      desc: string;
    }[];
  };
  places: {
    visible: boolean;
    deletedAt?: string | null;
    deletedBy?: string | null;
    eyebrow: string;
    headingLine1: string;
    headingItalic: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
  };
  valuesReviews: {
    visible: boolean;
    deletedAt?: string | null;
    deletedBy?: string | null;
    eyebrow: string;
    headingPrefix: string;
    headingItalic: string;
  };
  planningFaq: {
    visible: boolean;
    deletedAt?: string | null;
    deletedBy?: string | null;
    eyebrow: string;
    headingLine1: string;
    headingItalic: string;
    lead: string;
    steps: {
      id: string;
      num: string;
      title: string;
      desc: string;
    }[];
    stepCtaKicker: string;
    stepCtaLabel: string;
    stepCtaHref: string;
    faqEyebrow: string;
    faqHeading: string;
    categoryLabels: {
      all: string;
      private: string;
      stays: string;
      booking: string;
    };
  };
  contactSection: {
    visible: boolean;
    deletedAt?: string | null;
    deletedBy?: string | null;
    eyebrow: string;
    headingLine1: string;
    headingLine2: string;
    headingItalic: string;
    lead: string;
    methods: {
      id: BookingSubmissionMethod;
      label: string;
      shortDesc: string;
      submitText: string;
    }[];
    footnote: string;
  };
}

export interface CmsDestinationsPageContent {
  banner: {
    eyebrow: string;
    title: string;
  };
  regionalSection: {
    eyebrow: string;
    headingLine1: string;
    headingLine2Prefix: string;
    headingItalic: string;
    description: string;
    highlightsHeading: string;
    toursButtonLabel: string;
    toursButtonHref: string;
    bookButtonLabel: string;
  };
  colomboSection: {
    eyebrow: string;
    headingPrefix: string;
    headingItalic: string;
    description: string;
    bookButtonLabel: string;
    enquireButtonLabel: string;
    enquireButtonHref: string;
  };
  customCtaBox: {
    eyebrow: string;
    heading: string;
    description: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
  };
}

export interface CmsPackagesPageContent {
  banner: {
    eyebrow: string;
    title: string;
  };
  introSection: {
    eyebrow: string;
    headingPrefix: string;
    headingItalic: string;
    description: string;
    qualificationLabel: string;
    qualificationNotice: string;
    routeDetailsButtonLabel: string;
    bookButtonLabel: string;
  };
  colomboSection: {
    eyebrow: string;
    headingPrefix: string;
    headingItalic: string;
    description: string;
    bookButtonLabel: string;
    whatsappButtonLabel: string;
  };
  customCtaBox: {
    eyebrow: string;
    heading: string;
    description: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
  };
}

export interface CmsStaysPageContent {
  banner: {
    eyebrow: string;
    title: string;
  };
  introSection: {
    eyebrow: string;
    headingPrefix: string;
    headingItalic: string;
    description: string;
    policyLabel: string;
    policyNotice: string;
    badgeLabel: string;
    standardsHeading: string;
    providerNote: string;
    checkButtonLabel: string;
  };
  customCtaBox: {
    eyebrow: string;
    heading: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
  };
}

export interface CmsGalleryPageContent {
  banner: {
    eyebrow: string;
    title: string;
  };
  introSection: {
    eyebrow: string;
    headingPrefix: string;
    headingItalic: string;
    description: string;
  };
  customCtaBox: {
    eyebrow: string;
    heading: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
  };
}

export interface CmsOurStoryPageContent {
  banner: {
    eyebrow: string;
    title: string;
  };
  identitySection: {
    eyebrow: string;
    headingPrefix: string;
    headingItalic: string;
    description: string;
    cards: {
      id: string;
      kicker: string;
      title: string;
      description: string;
    }[];
  };
  valuesSection: {
    eyebrow: string;
    headingPrefix: string;
    headingItalic: string;
    visionLabel: string;
    visionText: string;
    missionLabel: string;
    missionText: string;
    coreValues: {
      id: string;
      number: string;
      title: string;
      desc: string;
    }[];
  };
  founderSection: {
    eyebrow: string;
    founderName: string;
    credentialsLine: string;
    bioParagraph: string;
    quote: string;
    ctaLabel: string;
    ctaHref: string;
    glanceHeading: string;
    leadershipValues: {
      id: string;
      title: string;
      desc: string;
    }[];
    primaryMarketsText: string;
    supportText: string;
  };
  roadmapSection: {
    eyebrow: string;
    headingPrefix: string;
    headingItalic: string;
    description: string;
    stages: {
      id: string;
      stage: string;
      title: string;
      desc: string;
    }[];
  };
}

export interface CmsContactPageContent {
  banner: {
    eyebrow: string;
    title: string;
  };
  detailsSection: {
    eyebrow: string;
    headingPrefix: string;
    headingItalic: string;
    description: string;
    items: {
      id: string;
      label: string;
      value: string;
    }[];
  };
  faqSection: {
    eyebrow: string;
    headingLine1: string;
    headingItalic: string;
    lead: string;
    ctaPrompt: string;
    ctaLabel: string;
    ctaHref: string;
    items: {
      id: string;
      category: string;
      question: string;
      answer: string;
    }[];
  };
}

export interface CmsBookingPageContent {
  banner: {
    eyebrow: string;
    title: string;
  };
  selectorSection: {
    qualificationLabel: string;
    qualificationNotice: string;
    stepEyebrow: string;
    stepHeadingPrefix: string;
    stepHeadingItalic: string;
    tabToursLabel: string;
    tabDayExpLabel: string;
    tabStaysLabel: string;
    quickLinkToursLabel: string;
    quickLinkToursHref: string;
    quickLinkStaysLabel: string;
    quickLinkStaysHref: string;
    quickLinkVerifyLabel: string;
    quickLinkVerifyHref: string;
  };
  confirmationPage: {
    bannerEyebrow: string;
    bannerTitle: string;
    formEyebrow: string;
    formHeading: string;
    formDescription: string;
    submitButtonLabel: string;
  };
}

export interface CmsPagesMap {
  shared: CmsSharedPageContent;
  home: CmsHomePageContent;
  destinationsPage: CmsDestinationsPageContent;
  packagesPage: CmsPackagesPageContent;
  staysPage: CmsStaysPageContent;
  galleryPage: CmsGalleryPageContent;
  ourStoryPage: CmsOurStoryPageContent;
  contactPage: CmsContactPageContent;
  bookingPage: CmsBookingPageContent;
}

export const DEFAULT_HERO_IMAGES: string[] = [];

export interface SiteCmsData {
  updatedAt: string;
  general: CmsGeneralSettings;
  pages: CmsPagesMap;
  tours: CmsTourItem[];
  stays: CmsStayItem[];
  destinations: CmsDestination[];
  colomboExperiences: CmsColomboExperienceItem[];
  bentoDestinations: CmsBentoSlideItem[];
  gallery: CmsGalleryPhoto[];
  reviews: CmsReviewItem[];
  faqs: CmsFaqItem[];
  enquiries: CmsCustomerEnquiry[];
}

export const DEFAULT_DESTINATIONS: CmsDestination[] = [
  {
    id: 'sigiriya-cultural-triangle',
    name: 'Sigiriya, Pidurangala & Ancient Kingdoms',
    region: 'culture',
    regionLabel: 'Culture and Heritage',
    season: 'Year-round · Dry season May – Sep',
    tagline: 'Sigiriya, Pidurangala, Anuradhapura, Polonnaruwa & Dambulla',
    description:
      'Explore Sri Lanka’s Cultural Triangle with time to appreciate its history properly—climbing Sigiriya Rock Fortress and Pidurangala, and visiting the sacred cave temples of Dambulla alongside the ancient capitals of Anuradhapura and Polonnaruwa.',
    highlights: [
      'Sigiriya Rock Fortress & Pidurangala sunrise views',
      'Anuradhapura & Polonnaruwa ancient capitals',
      'Dambulla Cave Temple & Cultural Triangle heritage',
    ],
    image: '',
    imageRef: createImageRef('', 'Sigiriya, Pidurangala & Ancient Kingdoms'),
    staggerVariant: 'tall-up',
    visible: true,
    order: 1,
  },
  {
    id: 'kandy-sacred-capital',
    name: 'Kandy & The Temple of the Tooth',
    region: 'culture',
    regionLabel: 'Culture and Heritage',
    season: 'Year-round · Best Dec – Apr',
    tagline: 'Sacred hill capital, living traditions & gateway to the hills',
    description:
      'Home to the sacred Temple of the Tooth, Kandy bridges Sri Lanka’s ancient royal heritage with the cool central mountains—serving as the cultural heart of the island and the starting point of The Pekoe Trail.',
    highlights: [
      'Temple of the Sacred Tooth in Kandy',
      'Respectful cultural visits & local traditions',
      'Starting point for highland rail & trail journeys',
    ],
    image: '',
    imageRef: createImageRef('', 'Kandy & The Temple of the Tooth'),
    staggerVariant: 'compact-mid',
    visible: true,
    order: 2,
  },
  {
    id: 'ella-hill-country',
    name: 'Ella, Nuwara Eliya & Hill Country Trails',
    region: 'hills',
    regionLabel: 'Hill Country and Hiking',
    season: 'Best Jan – May',
    tagline: 'Nuwara Eliya, Ella, The Pekoe Trail & Horton Plains',
    description:
      'Discover Sri Lanka’s tea hills by scenic train and on foot—walking selected stages of The Pekoe Trail through tea estates and villages, trekking Horton Plains to World’s End, and climbing Little Adam’s Peak and Ella Rock.',
    highlights: [
      'Selected stages of The Pekoe Trail',
      'Horton Plains & World’s End plateau walk',
      'Little Adam’s Peak, Ella Rock & scenic hill train',
    ],
    image: '',
    imageRef: createImageRef('', 'Ella, Nuwara Eliya & Hill Country Trails'),
    staggerVariant: 'low-down',
    visible: true,
    order: 3,
  },
  {
    id: 'yala-wildlife-rainforest',
    name: 'Yala, Udawalawe, Wilpattu, Minneriya & Sinharaja',
    region: 'wildlife',
    regionLabel: 'Wildlife and Nature',
    season: 'Year-round · Minneriya Gathering Jul – Oct',
    tagline: 'National park safaris & UNESCO Sinharaja rainforest walks',
    description:
      'Experience Sri Lanka’s wildlife responsibly across Yala, Udawalawe, and Wilpattu National Parks, witness the seasonal elephant gathering at Minneriya, and walk with naturalists for endemic birdlife inside Sinharaja Rainforest.',
    highlights: [
      'Private safaris in Yala, Udawalawe & Wilpattu',
      'Seasonal Minneriya elephant gathering',
      'Sinharaja rainforest walks & endemic birdwatching',
    ],
    image: '',
    imageRef: createImageRef(
      '',
      'Yala, Udawalawe, Wilpattu, Minneriya & Sinharaja'
    ),
    staggerVariant: 'mid-up',
    visible: true,
    order: 4,
  },
  {
    id: 'kitulgala-horton-plains',
    name: 'Kitulgala, Horton Plains & Highland Waterfalls',
    region: 'hills',
    regionLabel: 'Hill Country and Hiking',
    season: 'Year-round · Best Dec – May',
    tagline: 'Kelani River white-water rafting, cloud forests & waterfalls',
    description:
      'Adventure through the lush rainforest gorges of Kitulgala for white-water rafting on the Kelani River, and ascend into the misty cloud forests and dramatic waterfalls of Horton Plains and the central highlands.',
    highlights: [
      'White-water rafting on the Kelani River in Kitulgala',
      'Highland waterfalls & cloud forest trails',
      'Horton Plains & World’s End escarpment',
    ],
    image: '',
    imageRef: createImageRef(
      '',
      'Kitulgala, Horton Plains & Highland Waterfalls'
    ),
    staggerVariant: 'tall-deep',
    visible: true,
    order: 5,
  },
  {
    id: 'galle-sea-and-sand',
    name: 'Galle, Unawatuna, Mirissa, Weligama, Arugam Bay, Kalpitiya & Bentota',
    region: 'coast',
    regionLabel: 'Sea and Sand',
    season: 'South/West Nov – Apr · East Coast May – Oct',
    tagline:
      'Galle Fort heritage, seasonal surf bays, diving & lagoon adventures',
    description:
      'From coastal stays in Galle, Unawatuna, and Mirissa to surfing at Weligama (Nov–Apr) and Arugam Bay (May–Oct), paramotoring at Bentota, and diving or kite surfing in Kalpitiya—matched carefully to the island’s two coastal seasons.',
    highlights: [
      'Galle, Unawatuna & Mirissa coastal escapes',
      'Surfing at Weligama (Nov–Apr) & Arugam Bay (May–Oct)',
      'Kalpitiya Bar Reef diving, kite surfing & Bentota paramotoring',
    ],
    image: '',
    imageRef: createImageRef(
      '',
      'Galle, Unawatuna, Mirissa, Weligama, Arugam Bay, Kalpitiya & Bentota'
    ),
    staggerVariant: 'mid-up',
    visible: true,
    order: 6,
  },
  {
    id: 'minneriya-wilpattu-parks',
    name: 'Minneriya Gathering & Wilpattu Wilderness',
    region: 'wildlife',
    regionLabel: 'Wildlife and Nature',
    season: 'Minneriya Jul – Oct · Wilpattu Year-round',
    tagline: 'Ancient tank elephant gatherings & northwest forest villus',
    description:
      'Witness one of Asia’s greatest wildlife spectacles as wild elephant herds gather along the shores of Minneriya Tank, or track elusive leopards and sloth bears across the quiet natural lakes (villus) of Wilpattu.',
    highlights: [
      'Seasonal elephant gathering at Minneriya',
      'Uncrowded game drives in Wilpattu National Park',
      'Private 4x4 jeeps with experienced naturalists',
    ],
    image: '',
    imageRef: createImageRef('', 'Minneriya Gathering & Wilpattu Wilderness'),
    staggerVariant: 'low-down',
    visible: true,
    order: 7,
  },
  {
    id: 'colombo-battaramulla',
    name: 'Colombo, Battaramulla, Thalangama Wetland, Kotte, Kelaniya & Negombo',
    region: 'colombo',
    regionLabel: 'Colombo Area & Home Base',
    season: 'Year-round · Ideal on arrival or departure',
    tagline: 'Our home base in Battaramulla, urban wetlands & historic capitals',
    description:
      'Based in Thalangama South, Battaramulla—where quiet wetland birdlife meets Sri Lanka’s capital—we offer half-day and full-day experiences across Thalangama Lake, Colombo, the 15th-century Kingdom of Kotte, Kelaniya Raja Maha Vihara, and Negombo Lagoon.',
    highlights: [
      'Thalangama Wetland Birdwalk & Kotte Heritage Walk',
      'Colombo City Highlights & Colombo Food Trail',
      'Kelaniya Temple Visit & Negombo Lagoon Day',
    ],
    image: '',
    imageRef: createImageRef(
      '',
      'Colombo, Battaramulla, Thalangama Wetland, Kotte, Kelaniya & Negombo'
    ),
    staggerVariant: 'compact-mid',
    visible: true,
    order: 8,
  },
];

export const DEFAULT_GALLERY: CmsGalleryPhoto[] = [];

export const DEFAULT_REVIEWS: CmsReviewItem[] = [
  {
    id: 'thought-1',
    name: 'David & Sarah Miller',
    location: 'United Kingdom',
    rating: 5,
    tour: 'Grand Island Journey',
    date: 'Visited 2026',
    quote:
      '“Traveling privately with Bimondo made Sri Lanka feel effortless. From climbing Sigiriya at dawn to quiet tea hills in Ella, every day moved at our own pace.”',
    image: '',
    imageRef: createImageRef('', 'David & Sarah Miller'),
    visible: true,
    order: 1,
  },
  {
    id: 'thought-2',
    name: 'Claire Dubois',
    location: 'France',
    rating: 5,
    tour: 'Pekoe Trail & South Coast',
    date: 'Visited 2026',
    quote:
      '“Walking stages of The Pekoe Trail and finishing along the southern coast in Galle was unforgettable. Our guide shared the real Sri Lanka with such warmth.”',
    image: '',
    imageRef: createImageRef('', 'Claire Dubois'),
    visible: true,
    order: 2,
  },
  {
    id: 'thought-3',
    name: 'Liam & Chloe Reynolds',
    location: 'Australia',
    rating: 5,
    tour: 'Surf, Safari & Coast',
    date: 'Visited 2026',
    quote:
      '“Morning surf sessions in Weligama, watching wild elephants gather in Udawalawe, and 24-hour support from the Battaramulla team — truly a feeling you carry home.”',
    image: '',
    imageRef: createImageRef('', 'Liam & Chloe Reynolds'),
    visible: true,
    order: 3,
  },
  {
    id: 'thought-4',
    name: 'Ananya & Rohan Sharma',
    location: 'India',
    rating: 5,
    tour: 'Cultural Triangle & Hills',
    date: 'Visited 2026',
    quote:
      '“Every detail was thoughtfully arranged for our family. Visiting Kandy, Nuwara Eliya, and Bentota with a private driver made the whole trip calm and memorable.”',
    image: '',
    imageRef: createImageRef('', 'Ananya & Rohan Sharma'),
    visible: true,
    order: 4,
  },
  {
    id: 'thought-5',
    name: 'Lukas & Hannah Weber',
    location: 'Germany',
    rating: 5,
    tour: 'Wildlife & Rainforests',
    date: 'Visited 2026',
    quote:
      '“Our safaris in Yala and Wilpattu were handled with genuine respect for nature. Starting with the Thalangama wetland walk near Colombo was a wonderful touch.”',
    image: '',
    imageRef: createImageRef('', 'Lukas & Hannah Weber'),
    visible: true,
    order: 5,
  },
  {
    id: 'thought-6',
    name: 'Sofía & Mateo Rossi',
    location: 'Italy',
    rating: 5,
    tour: 'Romance in Ceylon',
    date: 'Visited 2026',
    quote:
      '“From candlelit hill-country stays in Ella to sunset walks along Galle Fort ramparts, our honeymoon felt completely personal from arrival to departure.”',
    image: '',
    imageRef: createImageRef('', 'Sofía & Mateo Rossi'),
    visible: true,
    order: 6,
  },
];

export const DEFAULT_FAQS: CmsFaqItem[] = [
  {
    id: 'who-is-bimondo',
    category: 'private',
    q: 'Who is Bimondo Travels and where are you based?',
    a: 'Bimondo Travels is a Sri Lankan travel company founded in 2022 by I.M. Bimsara Illangasinghe and based at No. 596/1, Thalangama South, Battaramulla, near Colombo. We plan and operate private, tailor-made journeys across Sri Lanka for solo travellers, couples, families, and small private groups.',
    visible: true,
    order: 1,
  },
  {
    id: 'how-journey-works',
    category: 'booking',
    q: 'How does planning and booking a journey with Bimondo Travels work?',
    a: 'Every journey follows a clear 7-step process: (01) Enquiry via our website, email, or WhatsApp; (02) Personal consultation on your dates, interests, pace, and budget; (03) Custom day-by-day itinerary design; (04) Transparent quotation and booking confirmation; (05) Pre-arrival information on packing, weather, and your driver/guide; (06) Airport greeting, private journey, and 24-hour on-call support; and (07) Airport transfer on departure and post-trip follow-up.',
    visible: true,
    order: 2,
  },
  {
    id: 'truly-private',
    category: 'private',
    q: 'Are your tours private or shared with other travellers?',
    a: 'Our journeys are private and personal. Every itinerary is built around your own dates, pace, and interests—rather than rushing you through a fixed group bus schedule.',
    visible: true,
    order: 3,
  },
  {
    id: 'accommodation-options',
    category: 'stays',
    q: 'What types of accommodation do you arrange?',
    a: 'We arrange a curated range of four-star hotels, characterful boutique properties, and five-star luxury resorts across Sri Lanka. Hotels and inclusions are selected and confirmed individually at the time of enquiry according to your route and preferences.',
    visible: true,
    order: 4,
  },
  {
    id: 'drivers-and-guides',
    category: 'stays',
    q: 'What transport, drivers, and guides are provided during the journey?',
    a: 'We provide private transport with professional drivers and licensed guides, together with specialist local guides for activities such as hiking on The Pekoe Trail, birdwatching in Thalangama or Sinharaja, and adventure sports.',
    visible: true,
    order: 5,
  },
  {
    id: 'wildlife-and-nature',
    category: 'private',
    q: 'How do you approach wildlife safaris and adventure activities?',
    a: 'We work with safari operators in Yala, Udawalawe, Wilpattu, and Minneriya who respect park rules and animal welfare, and with vetted, safety-checked operators for surfing, rafting in Kitulgala, paramotoring in Bentota, and diving or kite surfing in Kalpitiya. Please note that wildlife sightings, sea conditions, and adventure activities depend on nature and are never guaranteed.',
    visible: true,
    order: 6,
  },
  {
    id: 'best-seasons',
    category: 'booking',
    q: 'How do Sri Lanka’s seasons affect where we should travel?',
    a: 'Sri Lanka is a year-round destination with two distinct coastal seasons. For example, Weligama and the South/West Coast are best from November to April, while Arugam Bay and the East Coast are best from May to October. During consultation, we design your route around the best weather for your travel dates.',
    visible: true,
    order: 7,
  },
  {
    id: 'colombo-day-trips',
    category: 'private',
    q: 'Can we arrange short half-day or full-day experiences around Colombo and Battaramulla?',
    a: 'Yes. Because our office is in Thalangama South, Battaramulla, we offer six dedicated day experiences ideal at the start or end of a trip: the Thalangama Wetland Birdwalk, Colombo City Highlights, Colombo Food Trail, Kotte Heritage Walk, Kelaniya Temple Visit, and Negombo Lagoon Day.',
    visible: true,
    order: 8,
  },
  {
    id: 'on-call-support',
    category: 'stays',
    q: 'What support is available while we are travelling in Sri Lanka?',
    a: 'Alongside your dedicated driver and guide, our team in Battaramulla is available on call 24 hours a day throughout your stay in Sri Lanka to assist with arrangements, schedule adjustments, or any support you need.',
    visible: true,
    order: 9,
  },
];

export const DEFAULT_ENQUIRIES: CmsCustomerEnquiry[] = [];

export function buildDefaultPagesMap(): CmsPagesMap {
  return {
    shared: {
      header: {
        brandMonogram: 'b',
        brandName: 'bimondo',
        brandSubtitle: 'TRAVELS',
        navLinks: [
          {
            id: 'nav-destinations',
            label: 'Destinations',
            href: '/destinations',
            visible: true,
            order: 1,
          },
          {
            id: 'nav-packages',
            label: 'Packages',
            href: '/packages',
            visible: true,
            order: 2,
          },
          {
            id: 'nav-stays',
            label: 'Stays',
            href: '/stays',
            visible: true,
            order: 3,
          },
          {
            id: 'nav-gallery',
            label: 'Gallery',
            href: '/gallery',
            visible: true,
            order: 4,
          },
          {
            id: 'nav-our-story',
            label: 'Our story',
            href: '/our-story',
            visible: true,
            order: 5,
          },
        ],
        ctaLabel: 'PLAN YOUR JOURNEY ↗',
        ctaHref: '/contact',
      },
      footer: {
        brandMonogram: 'b',
        brandName: 'bimondo',
        tagline: 'Not a place you visit, but a feeling you carry home.',
        addressLine:
          'No. 596/1, Thalangama South, Battaramulla, Sri Lanka · Est. 2022',
        founderMarketsLine:
          'Founded by I.M. Bimsara Illangasinghe · Primary Markets: UK & Europe · India · Australia',
        exploreHeading: 'Explore',
        exploreLinks: [
          {
            id: 'foot-exp-destinations',
            label: 'Destinations & Day Trips',
            href: '/destinations',
            visible: true,
            order: 1,
          },
          {
            id: 'foot-exp-packages',
            label: 'Signature Journeys (20)',
            href: '/packages',
            visible: true,
            order: 2,
          },
          {
            id: 'foot-exp-stays',
            label: 'Accommodation Options',
            href: '/stays',
            visible: true,
            order: 3,
          },
          {
            id: 'foot-exp-gallery',
            label: 'Gallery',
            href: '/gallery',
            visible: true,
            order: 4,
          },
          {
            id: 'foot-exp-story',
            label: 'Our Story & Values',
            href: '/our-story',
            visible: true,
            order: 5,
          },
        ],
        bookingsHeading: 'Bookings',
        bookingsLinks: [
          {
            id: 'foot-bk-stays',
            label: 'NightsBridge Stays',
            href: '/stays',
            visible: true,
            order: 1,
          },
          {
            id: 'foot-bk-tours',
            label: 'Bókun & Viator Tours',
            href: '/packages',
            visible: true,
            order: 2,
          },
          {
            id: 'foot-bk-desk',
            label: 'Online Booking Desk',
            href: '/booking',
            visible: true,
            order: 3,
          },
          {
            id: 'foot-bk-verify',
            label: 'Verify Booking',
            href: '/booking/confirmation',
            visible: true,
            order: 4,
          },
        ],
        contactHeading: 'Contact',
        email: 'tours@bimondo.com',
        whatsappDisplay: '+94 76 223 2054 (WhatsApp)',
        whatsappUrl: 'https://wa.me/94762232054',
        instagramDisplay: 'Instagram: @Bimondo.tours',
        instagramUrl: 'https://www.instagram.com/bimondo.tours/',
        facebookDisplay: 'Facebook: Bimondo tours',
        websiteDisplay: 'www.bimondotours.com',
        copyrightAddress:
          'Bimondo Travels · No. 596/1, Thalangama South, Battaramulla, Sri Lanka.',
        bottomRightNote:
          'Private, authentic journeys across Sri Lanka · 24-hour local support',
        floatingCtaLabel: 'BOOK NOW',
        floatingCtaHref: '/booking',
      },
    },
    home: {
      hero: {
        visible: true,
        eyebrow:
          'BIMONDO TRAVELS — PRIVATE, AUTHENTIC JOURNEYS ACROSS SRI LANKA',
        headlinePart1: 'Not a place',
        headlineHighlight1: 'you visit',
        headlineItalic: 'but a feeling',
        headlineHighlight2: 'you carry home',
        description:
          'Private, tailor-made journeys across Sri Lanka—spanning adventure, culture and heritage, sea and sand, and hiking and wildlife—planned personally by our local team in Battaramulla since 2022.',
        primaryCtaLabel: 'EXPLORE OUR JOURNEYS ↗',
        primaryCtaHref: '/packages',
        secondaryCtaLabel: 'OUR STORY ↓',
        secondaryCtaHref: '/our-story',
        tripadvisorEnabled: true,
        tripadvisorBrand: 'Tripadvisor',
        tripadvisorRating: '5.0',
        tripadvisorReviewsText: 'Based on 165 reviews',
        slides: [
          {
            id: 'hero-slide-1',
            image: createImageRef('', 'Sri Lanka Hero Slide 1'),
            visible: true,
            order: 1,
          },
        ],
      },
      heroTransition: {
        visible: true,
        pillars: [
          {
            id: 'pillar-1',
            num: '01',
            badge: 'TAILOR-MADE PACE',
            title: 'Private and Personal',
            desc: 'Every journey is planned around your interests, pace, preferences, and budget—for solo travellers, couples, families, and small private groups.',
          },
          {
            id: 'pillar-2',
            num: '02',
            badge: 'LOCAL INTEGRITY',
            title: 'Authentic and Responsible',
            desc: 'Real local experiences, respect for Sri Lanka’s heritage, responsible wildlife practices, and direct support for local communities.',
          },
          {
            id: 'pillar-3',
            num: '03',
            badge: '24-HOUR CARE',
            title: 'Reliable Local Support',
            desc: 'Professional drivers and licensed guides, clear written arrangements, and our Battaramulla team available on call 24 hours a day.',
          },
        ],
      },
      story: {
        visible: true,
        eyebrow: '01 / OUR STORY · EST. 2022 IN BATTARAMULLA',
        headingLine1: 'Through the people',
        headingLine2: 'who call this',
        headingItalic: 'island home.',
        paragraph1:
          'In the quiet suburb of Thalangama South in Battaramulla, where the morning mist rises off the wetland and the green edge of the countryside meets the energy of Colombo, Bimondo Travels was founded in 2022 by I.M. Bimsara Illangasinghe on a simple belief: the best way to experience Sri Lanka is not through a window on a rushed bus tour, but through the people who call this island home.',
        paragraph2:
          'Instead of selling one-size-fits-all packages, we plan journeys around the traveller—whether you want to surf warm southern swells, climb ancient rock fortresses at dawn, walk through misty tea hills, or sit quietly in a jeep watching elephants gather by a lake.',
        quote: '“Not a place you visit, but a feeling you carry home.”',
        ctaLabel: 'READ OUR FULL STORY ↗',
        ctaHref: '/our-story',
        mainImage: createImageRef('', 'Our Story in Sri Lanka'),
        secondaryImage: createImageRef(
          '',
          'Living cultural traditions of Sri Lanka'
        ),
      },
      bentoSlider: {
        visible: true,
        prevButtonLabel: 'PREVIOUS',
        nextButtonLabel: 'NEXT',
      },
      experience: {
        visible: true,
        eyebrow: '03 / WHAT WE DO · FOUR CORE EXPERIENCES',
        headingLine1: 'Tailor-made',
        headingLine2Prefix: 'around',
        headingItalic: 'how',
        headingLine3: 'you travel.',
        description:
          'We design and operate private, tailor-made journeys across Sri Lanka—combining safety-checked adventure operators, unhurried cultural discovery, seasonal coastal stays, and responsible wildlife and highland hiking.',
        primaryCtaLabel: 'VIEW ALL 20 JOURNEYS ↗',
        primaryCtaHref: '/packages',
        secondaryCtaLabel: 'DESIGN A CUSTOM TRIP ↗',
        secondaryCtaHref: '/contact',
        featureImage: createImageRef(
          '',
          'Sri Lanka coastal and highland landscapes'
        ),
        items: [
          {
            id: 'exp-1',
            num: '01',
            title: 'Adventure Tours',
            desc: 'Surfing at Weligama (Nov–Apr) & Arugam Bay (May–Oct), white-water rafting & waterfall abseiling in Kitulgala, paramotoring in Bentota, and diving & kite surfing in Kalpitiya.',
          },
          {
            id: 'exp-2',
            num: '02',
            title: 'Culture & Heritage',
            desc: 'Sigiriya Rock Fortress, Pidurangala, the Temple of the Tooth in Kandy, Dambulla cave temple, and the ancient capitals of Anuradhapura and Polonnaruwa.',
          },
          {
            id: 'exp-3',
            num: '03',
            title: 'Sea & Sand Escapes',
            desc: 'Relaxed coastal stays in Galle, Unawatuna, Mirissa, Weligama, Bentota, Kalpitiya, and Arugam Bay matched carefully to the island’s seasons.',
          },
          {
            id: 'exp-4',
            num: '04',
            title: 'Hiking & Wildlife',
            desc: 'Safaris in Yala, Udawalawe, Wilpattu & Minneriya, walks along The Pekoe Trail, Sinharaja rainforest, Horton Plains & World’s End, Little Adam’s Peak, and Ella Rock.',
          },
        ],
      },
      places: {
        visible: true,
        eyebrow: '04 / REGIONS WE COVER ACROSS SRI LANKA',
        headingLine1: 'From ancient capitals',
        headingItalic: 'to wild coasts.',
        description:
          'Including our Colombo & Battaramulla home base—with half-day and full-day experiences across Thalangama Wetland, Colombo, Kotte, Kelaniya, and Negombo Lagoon.',
        ctaLabel: 'EXPLORE ALL DESTINATIONS & DAY TRIPS ↗',
        ctaHref: '/destinations',
      },
      valuesReviews: {
        visible: true,
        eyebrow: '05 / TRAVELLER THOUGHTS',
        headingPrefix: 'Stories carried',
        headingItalic: 'home.',
      },
      planningFaq: {
        visible: true,
        eyebrow: '06 / HOW A BIMONDO JOURNEY WORKS',
        headingLine1: 'Seven clear steps.',
        headingItalic: 'Personal from day one.',
        lead: 'From your first message to your departure flight, every itinerary is designed around your pace with clear written arrangements and 24-hour local support.',
        steps: [
          {
            id: 'step-01',
            num: '01',
            title: 'Enquiry',
            desc: 'Reach us via website, email, or WhatsApp.',
          },
          {
            id: 'step-02',
            num: '02',
            title: 'Consultation',
            desc: 'Discuss your pace, stays, and interests.',
          },
          {
            id: 'step-03',
            num: '03',
            title: 'Itinerary Design',
            desc: 'Custom day-by-day route & hotel curation.',
          },
          {
            id: 'step-04',
            num: '04',
            title: 'Confirmation',
            desc: 'Clear quotation & confirmed reservations.',
          },
          {
            id: 'step-05',
            num: '05',
            title: 'Pre-Arrival',
            desc: 'Packing notes, etiquette & guide details.',
          },
          {
            id: 'step-06',
            num: '06',
            title: 'Arrival & Journey',
            desc: 'Airport greeting & 24-hour local support.',
          },
          {
            id: 'step-07',
            num: '07',
            title: 'Follow-Up',
            desc: 'Departure transfer & post-trip care.',
          },
        ],
        stepCtaKicker: 'START YOUR JOURNEY',
        stepCtaLabel: 'Step 01 — Enquire ↗',
        stepCtaHref: '/contact',
        faqEyebrow: 'COMMON QUESTIONS',
        faqHeading: 'Planning Your Private Journey',
        categoryLabels: {
          all: 'All FAQs',
          private: 'Private Journeys',
          stays: 'Stays & Guides',
          booking: 'Seasons & Booking',
        },
      },
      contactSection: {
        visible: true,
        eyebrow: '07 / CONTACT & MULTI-CHANNEL BOOKING',
        headingLine1: 'Plan your',
        headingLine2: 'Sri Lanka',
        headingItalic: 'journey.',
        lead: 'Choose how you prefer to book or enquire. Every method prepares your request for our Battaramulla travel desk with an instant booking reference.',
        methods: [
          {
            id: 'direct_admin',
            label: 'Direct Booking Request',
            shortDesc: 'Instant booking request for our Battaramulla travel desk',
            submitText: 'SEND BOOKING REQUEST →',
          },
          {
            id: 'whatsapp',
            label: 'WhatsApp Concierge',
            shortDesc: 'Prepares booking summary + opens WhatsApp chat',
            submitText: 'PREPARE & OPEN WHATSAPP ↗',
          },
          {
            id: 'email',
            label: 'Email Quote Request',
            shortDesc: 'Prepares formal email quote request',
            submitText: 'PREPARE EMAIL QUOTE REQUEST ↗',
          },
          {
            id: 'callback',
            label: 'Phone / Call Back',
            shortDesc: 'Request a priority concierge callback',
            submitText: 'REQUEST CONCIERGE CALLBACK →',
          },
        ],
        footnote:
          'All booking enquiries are securely recorded for our Battaramulla travel desk.',
      },
    },
    destinationsPage: {
      banner: {
        eyebrow: 'BIMONDO DESTINATIONS  /  SRI LANKA',
        title: 'From ancient kingdoms and tea hills to wild parks and coasts.',
      },
      regionalSection: {
        eyebrow: 'DESTINATIONS BY REGION',
        headingLine1: 'Five regions across',
        headingLine2Prefix: 'our',
        headingItalic: 'island home.',
        description:
          "Every itinerary connects Sri Lanka's Cultural Triangle, Hill Country, National Parks, Southern and Eastern Coasts, and our Colombo & Battaramulla home base with private transport and licensed local guides.",
        highlightsHeading: 'Documented places & experiences:',
        toursButtonLabel: 'TOURS IN REGION',
        toursButtonHref: '/packages',
        bookButtonLabel: 'BOOK / ENQUIRE ↗',
      },
      colomboSection: {
        eyebrow: 'SECTION 10 · COLOMBO & BATTARAMULLA DAY EXPERIENCES',
        headingPrefix: 'Six short experiences from',
        headingItalic: 'our Battaramulla base.',
        description:
          'Because our office is located at No. 596/1, Thalangama South, Battaramulla, we offer half-day and full-day experiences around Colombo, Kotte, Kelaniya, Thalangama Wetland, and Negombo Lagoon.',
        bookButtonLabel: 'BOOK EXPERIENCE ↗',
        enquireButtonLabel: 'ENQUIRE',
        enquireButtonHref: '/contact',
      },
      customCtaBox: {
        eyebrow: 'CUSTOM ROUTING & ACCOMMODATION',
        heading: 'Want to combine culture, tea hills, wildlife & the sea?',
        description:
          'Our team in Battaramulla designs private day-by-day itineraries matched to the season, your preferred travel pace, and four-star, boutique, or five-star accommodation.',
        primaryCtaLabel: 'VIEW 20 SIGNATURE TOURS ↗',
        primaryCtaHref: '/packages',
        secondaryCtaLabel: 'DESIGN MY ROUTE ↗',
        secondaryCtaHref: '/contact',
      },
    },
    packagesPage: {
      banner: {
        eyebrow: 'BIMONDO SIGNATURE JOURNEYS  /  20 DOCUMENTED TOURS',
        title: 'Private, tailor-made journeys across Sri Lanka.',
      },
      introSection: {
        eyebrow: 'SECTION 09 · SIGNATURE JOURNEYS & ONLINE BOOKING',
        headingPrefix: 'Twenty curated routes',
        headingItalic: 'built around you.',
        description:
          'Every sample itinerary below can be adapted to your travel dates, preferred pace, and accommodation style (four-star hotels, boutique properties, or five-star luxury resorts). Select any journey to inspect its route or check availability via Bókun and Viator.',
        qualificationLabel: 'Important Note:',
        qualificationNotice: TOUR_QUALIFICATION_NOTICE,
        routeDetailsButtonLabel: 'ROUTE DETAILS',
        bookButtonLabel: 'BOOK / ENQUIRE ↗',
      },
      colomboSection: {
        eyebrow: 'SECTION 10 · COLOMBO & BATTARAMULLA DAY EXPERIENCES',
        headingPrefix: 'Half-day & full-day',
        headingItalic: 'experiences from our home base.',
        description:
          'Operated directly from our base in Thalangama South, Battaramulla—ideal at the beginning or end of your Sri Lanka journey, or for visitors staying in Colombo.',
        bookButtonLabel: 'BOOK DAY EXPERIENCE ↗',
        whatsappButtonLabel: 'WHATSAPP ENQUIRY',
      },
      customCtaBox: {
        eyebrow: 'TAILOR-MADE ITINERARIES & ACCOMMODATION',
        heading: 'Prefer a custom route built around your dates?',
        description:
          'Share your travel dates, group size, and preferred accommodation tier (four-star hotels, boutique properties, or five-star luxury resorts), and our Battaramulla team will design a day-by-day itinerary for you.',
        primaryCtaLabel: 'ACCOMMODATION OPTIONS ↗',
        primaryCtaHref: '/stays',
        secondaryCtaLabel: 'REQUEST CUSTOM ITINERARY ↗',
        secondaryCtaHref: '/contact',
      },
    },
    staysPage: {
      banner: {
        eyebrow: 'BIMONDO ACCOMMODATION STANDARDS  /  NIGHTSBRIDGE BOOKING',
        title:
          'Four-star hotels, boutique properties & five-star luxury resorts.',
      },
      introSection: {
        eyebrow: 'SECTION 13 · ACCOMMODATION OPTIONS & NIGHTSBRIDGE',
        headingPrefix: 'Selected around your',
        headingItalic: 'route, pace & preference.',
        description:
          'Across Sri Lanka, we arrange a curated range of four-star hotels, characterful boutique properties, and five-star luxury resorts. Select your check-in and check-out dates below to check availability through our official NightsBridge accommodation integration, or enquire with our team for a complete tailor-made itinerary.',
        policyLabel: 'Accommodation Policy:',
        policyNotice: TOUR_QUALIFICATION_NOTICE,
        badgeLabel: '4★ HOTELS · BOUTIQUE · 5★ LUXURY',
        standardsHeading: 'Accommodation standards:',
        providerNote: 'NIGHTSBRIDGE / CUSTOM ENQUIRY',
        checkButtonLabel: 'CHECK AVAILABILITY ↗',
      },
      customCtaBox: {
        eyebrow: 'TAILOR-MADE STAYS & PRIVATE TRANSPORT',
        heading: 'Planning a multi-stop journey across Sri Lanka?',
        description:
          'Our Battaramulla team coordinates all hotel reservations, private transport with professional drivers and licensed guides, and 24-hour on-call support throughout your stay.',
        ctaLabel: 'ENQUIRE WITH OUR TEAM ↗',
        ctaHref: '/contact',
      },
    },
    galleryPage: {
      banner: {
        eyebrow: 'BIMONDO GALLERY  /  SRI LANKA',
        title: 'Landscapes, heritage, wildlife and coasts across Sri Lanka.',
      },
      introSection: {
        eyebrow: 'VISUAL JOURNEY ACROSS THE ISLAND',
        headingPrefix: 'Not a place you visit,',
        headingItalic: 'but a feeling you carry home.',
        description:
          'From the ancient capitals of Sigiriya, Anuradhapura, Polonnaruwa, and Kandy to The Pekoe Trail in the tea hills, national park safaris, and seasonal coastal escapes.',
      },
      customCtaBox: {
        eyebrow: 'PRIVATE JOURNEYS ACROSS SRI LANKA',
        heading: 'Experience Sri Lanka at your own pace',
        description:
          'Let our team in Thalangama South, Battaramulla design a private, tailor-made route through these regions with your own driver and licensed guide.',
        ctaLabel: 'START YOUR JOURNEY ↗',
        ctaHref: '/contact',
      },
    },
    ourStoryPage: {
      banner: {
        eyebrow: 'BIMONDO TRAVELS  /  COMPANY PROFILE (2026 EDITION)',
        title: 'Not a place you visit, but a feeling you carry home.',
      },
      identitySection: {
        eyebrow: '02 / COMPANY IDENTITY & HOME BASE',
        headingPrefix: 'Rooted in Sri Lanka.',
        headingItalic: 'Open to the world.',
        description:
          'Founded in 2022 by I.M. Bimsara Illangasinghe at No. 596/1, Thalangama South, Battaramulla, Sri Lanka.',
        cards: [
          {
            id: 'identity-name',
            kicker: 'THE NAME “BIMONDO”',
            title: 'Bimsara + Mondo',
            description:
              'The name Bimondo combines a personal echo of the founder’s name, Bimsara, with the Italian word mondo—meaning “world.” It reflects a company deeply rooted in Sri Lanka and open to travellers from around the world.',
          },
          {
            id: 'identity-base',
            kicker: 'BASE OF OPERATIONS',
            title: 'Thalangama South, Battaramulla',
            description:
              'Located in Sri Lanka’s administrative capital near the Parliament complex, Diyawanna Lake, and the historic Kingdom of Kotte, our office sits minutes from Colombo and the expressway network linking Bandaranaike International Airport (CMB) with the south, central hills, and ancient capitals.',
          },
          {
            id: 'identity-wetland',
            kicker: 'THALANGAMA WETLAND',
            title: 'Nature on Our Doorstep',
            description:
              'Right in our neighbourhood lies the Thalangama Tank and Environmental Protection Area—home to over a hundred species of resident and migratory birds, purple-faced leaf monkeys, water monitors, and quiet village footpaths.',
          },
        ],
      },
      valuesSection: {
        eyebrow: '05 / VISION, MISSION & SIX CORE VALUES',
        headingPrefix: 'Principles that guide',
        headingItalic: 'every itinerary.',
        visionLabel: 'Our Vision:',
        visionText:
          'To be a trusted and admired Sri Lankan travel company known for authentic experiences, responsible tourism, and warm, personal service.',
        missionLabel: 'Our Mission:',
        missionText:
          "To design and deliver well-planned journeys across Sri Lanka that connect travellers with the island's landscapes, heritage, wildlife, and people—while supporting local communities and protecting the places we visit.",
        coreValues: [
          {
            id: 'val-01',
            number: '01',
            title: 'Authenticity',
            desc: 'We show the real Sri Lanka—local food, working villages, living traditions, and honest conversations.',
          },
          {
            id: 'val-02',
            number: '02',
            title: 'Personal Service',
            desc: 'Every traveller is different. We listen carefully, plan thoughtfully, and adapt each itinerary to the people we are hosting.',
          },
          {
            id: 'val-03',
            number: '03',
            title: 'Sustainability',
            desc: 'Tourism should protect nature and benefit local communities. We choose responsible wildlife operators, local guides, and locally owned stays wherever possible.',
          },
          {
            id: 'val-04',
            number: '04',
            title: 'Innovation',
            desc: 'We combine traditional Sri Lankan hospitality with modern convenience—clear digital itineraries, fast communication via WhatsApp and email, and online booking confirmations.',
          },
          {
            id: 'val-05',
            number: '05',
            title: 'Reliability',
            desc: 'Good travel planning means clear communication, punctual transport, dependable guides, and steady support from arrival to departure.',
          },
          {
            id: 'val-06',
            number: '06',
            title: 'Respect for Heritage',
            desc: 'We approach Sri Lanka’s sacred places, traditions, and history with care, ensuring every visit is respectful and meaningful.',
          },
        ],
      },
      founderSection: {
        eyebrow: '03 / FOUNDER & LEADERSHIP · OUR PROMISE',
        founderName: 'I.M. Bimsara Illangasinghe',
        credentialsLine:
          'Founder, Bimondo Travels · Established 2022 · No. 596/1, Thalangama South, Battaramulla, Sri Lanka.',
        bioParagraph:
          'Bimondo Travels was founded by I.M. Bimsara Illangasinghe with a hands-on approach to travel planning and guest care. Every itinerary is shaped with direct attention to route pacing, accommodation quality, guide selection, and on-the-ground reliability.',
        quote:
          '“When you travel with Bimondo Travels, you are not a booking number on a manifest. You are our guest in our home country. We promise honest advice before you book, thoughtful planning tailored to your interests, reliable people on the ground, respect for Sri Lanka’s nature and culture, and a team that stays with you from arrival to departure.”',
        ctaLabel: 'PLAN YOUR JOURNEY WITH US ↗',
        ctaHref: '/contact',
        glanceHeading: 'Leadership Values & At a Glance',
        leadershipValues: [
          {
            id: 'lead-1',
            title: 'Personal Accountability',
            desc: 'Direct involvement in trip planning, supplier selection, and guest satisfaction.',
          },
          {
            id: 'lead-2',
            title: 'Local Knowledge',
            desc: 'First-hand understanding of routes, seasons, hotels, guides, and local communities across Sri Lanka.',
          },
          {
            id: 'lead-3',
            title: 'Fair Partnerships',
            desc: 'Long-term relationships with drivers, specialist guides, small hotels, and activity providers.',
          },
          {
            id: 'lead-4',
            title: 'Attention to Detail',
            desc: 'Careful pacing, realistic driving times, and thoughtful touches that make a journey run smoothly.',
          },
          {
            id: 'lead-5',
            title: 'Continuous Improvement',
            desc: 'Refining itineraries and services based on direct feedback from every guest.',
          },
        ],
        primaryMarketsText: 'United Kingdom & Europe · India · Australia',
        supportText: '24-hour on-call assistance (+94 76 223 2054)',
      },
      roadmapSection: {
        eyebrow: '17 / LOOKING AHEAD',
        headingPrefix: 'Realistic growth',
        headingItalic: 'roadmap.',
        description:
          'Growing steadily while keeping our service personal, hands-on, and grounded in Battaramulla.',
        stages: [
          {
            id: 'stage-1',
            stage: 'STAGE ONE · 2022 – 2026',
            title: 'Foundation',
            desc: 'Establishing Bimondo Travels in Battaramulla, building a trusted network of drivers, guides, and hotel partners, and refining our core tour collection across adventure, culture, coast, and wildlife.',
          },
          {
            id: 'stage-2',
            stage: 'STAGE TWO · 2026 – 2028',
            title: 'Strengthening Partnerships',
            desc: 'Expanding relationships with overseas travel advisors and tour operators in the UK, Europe, India, and Australia, while enhancing our digital itinerary and online booking tools.',
          },
          {
            id: 'stage-3',
            stage: 'STAGE THREE · 2028 – 2031',
            title: 'Sustainable Growth',
            desc: 'Developing deeper regional experiences—including walking stages of The Pekoe Trail, community-led rural visits, and conservation-focused wildlife journeys—while keeping our service personal and hands-on.',
          },
        ],
      },
    },
    contactPage: {
      banner: {
        eyebrow: 'BIMONDO TRAVELS  /  CONTACT & COMPANY DETAILS',
        title: 'Plan your private journey across Sri Lanka.',
      },
      detailsSection: {
        eyebrow: '19 / OFFICIAL COMPANY PROFILE DETAILS',
        headingPrefix: 'Direct contact &',
        headingItalic: 'office information.',
        description:
          'Reach our team in Thalangama South, Battaramulla directly by WhatsApp, phone, or email—with 24-hour on-call support for guests travelling in Sri Lanka.',
        items: [
          { id: 'cd-company', label: 'Company Name', value: 'Bimondo Travels' },
          {
            id: 'cd-founder',
            label: 'Founder',
            value: 'I.M. Bimsara Illangasinghe',
          },
          { id: 'cd-year', label: 'Year Established', value: '2022' },
          {
            id: 'cd-address',
            label: 'Address',
            value: 'No. 596/1, Thalangama South, Battaramulla, Sri Lanka',
          },
          {
            id: 'cd-phone',
            label: 'Phone / WhatsApp',
            value: '+94 76 223 2054',
          },
          { id: 'cd-email', label: 'Email', value: 'tours@bimondo.com' },
          { id: 'cd-website', label: 'Website', value: 'www.bimondotours.com' },
          { id: 'cd-facebook', label: 'Facebook', value: 'Bimondo tours' },
          { id: 'cd-instagram', label: 'Instagram', value: '@Bimondo.tours' },
          {
            id: 'cd-markets',
            label: 'Primary Markets',
            value: 'United Kingdom and Europe · India · Australia',
          },
        ],
      },
      faqSection: {
        eyebrow: '08 / GOOD TO KNOW',
        headingLine1: 'Questions,',
        headingItalic: 'answered clearly.',
        lead: 'Practical information on how we plan, confirm, and support your private journey across Sri Lanka from our base in Battaramulla.',
        ctaPrompt: 'Have a question about travel dates or a custom route?',
        ctaLabel: 'SPEAK WITH OUR TEAM ↗',
        ctaHref: '/contact',
        items: [
          {
            id: 'cfaq-1',
            category: 'PRIVATE JOURNEYS',
            question:
              'Are all Bimondo Travels itineraries private and tailor-made?',
            answer:
              'Yes. Every journey is planned around your interests, preferred pace, accommodation style, and budget—whether you are travelling solo, as a couple, with family, or in a small private group.',
          },
          {
            id: 'cfaq-2',
            category: '7-STEP PROCESS',
            question:
              'How does the guest journey work from first enquiry to departure?',
            answer:
              'We follow seven clear steps: (01) Enquiry via website, email, or WhatsApp; (02) Personal consultation; (03) Custom day-by-day itinerary design; (04) Clear quotation and booking confirmation; (05) Pre-arrival information on packing, weather, cultural etiquette, and driver/guide details; (06) Airport greeting, private journey, and 24-hour on-call support; and (07) Departure transfer and post-trip follow-up.',
          },
          {
            id: 'cfaq-3',
            category: 'ACCOMMODATION & TRANSPORT',
            question:
              'What accommodation and transport standards do you provide?',
            answer:
              'We arrange a curated range of four-star hotels, boutique properties, and five-star luxury resorts across Sri Lanka, paired with private transport, professional drivers, licensed guides, and specialist local guides for hiking, birdwatching, and adventure sports.',
          },
          {
            id: 'cfaq-4',
            category: 'SEASONS & COASTS',
            question:
              'When is the best time of year to visit different parts of Sri Lanka?',
            answer:
              'Sri Lanka is a year-round destination with two distinct coastal seasons. Weligama and the South and West Coasts are best from November to April, while Arugam Bay and the East Coast are best from May to October.',
          },
          {
            id: 'cfaq-5',
            category: 'RESPONSIBLE TRAVEL',
            question:
              'How do you approach wildlife safaris and nature experiences?',
            answer:
              'We partner with safari operators in Yala, Udawalawe, Wilpattu, and Minneriya who respect park rules and animal welfare, and with vetted, safety-checked adventure operators. Routes, durations, hotels, and inclusions are confirmed individually at the time of enquiry; wildlife sightings, sea conditions, and adventure activities depend on nature and are never guaranteed.',
          },
          {
            id: 'cfaq-6',
            category: 'HOME BASE IN BATTARAMULLA',
            question: 'Where is Bimondo Travels located in Sri Lanka?',
            answer:
              'Our office is located at No. 596/1, Thalangama South, Battaramulla, Sri Lanka—close to Colombo, Kotte, Thalangama Wetland, and the expressway network linking Bandaranaike International Airport (CMB) with the rest of the island.',
          },
        ],
      },
    },
    bookingPage: {
      banner: {
        eyebrow: 'BIMONDO ONLINE BOOKING  /  NIGHTSBRIDGE · BÓKUN · VIATOR',
        title: 'Check real-time availability & book your Sri Lanka journey.',
      },
      selectorSection: {
        qualificationLabel: 'Important Note:',
        qualificationNotice: TOUR_QUALIFICATION_NOTICE,
        stepEyebrow:
          'STEP 1 · SELECT YOUR JOURNEY, DAY EXPERIENCE OR ACCOMMODATION',
        stepHeadingPrefix: 'What would you like to',
        stepHeadingItalic: 'book today?',
        tabToursLabel: 'Signature Journeys (20)',
        tabDayExpLabel: 'Colombo Day Experiences (6)',
        tabStaysLabel: 'Accommodation (NightsBridge)',
        quickLinkToursLabel: 'VIEW ALL 20 TOURS',
        quickLinkToursHref: '/packages',
        quickLinkStaysLabel: 'ACCOMMODATION OPTIONS',
        quickLinkStaysHref: '/stays',
        quickLinkVerifyLabel: 'VERIFY EXISTING BOOKING',
        quickLinkVerifyHref: '/booking/confirmation',
      },
      confirmationPage: {
        bannerEyebrow: 'BIMONDO TRAVELS  /  BOOKING VERIFICATION',
        bannerTitle: 'Booking Status & Provider Confirmation',
        formEyebrow: 'VERIFY PROVIDER RESERVATION',
        formHeading: 'Check Verified Booking Status',
        formDescription:
          'Returning from an external checkout page does not automatically confirm a reservation. Enter your official booking reference from NightsBridge, Bókun, or Viator to verify its status.',
        submitButtonLabel: 'VERIFY STATUS',
      },
    },
  };
}

export function getDefaultCmsData(): SiteCmsData {
  const pages = buildDefaultPagesMap();
  return {
    updatedAt: '2026-04-12T10:00:00.000Z',
    general: {
      siteName: 'Bimondo Travels',
      tagline: 'Not a place you visit, but a feeling you carry home.',
      whatsappNumber: '94762232054',
      contactEmail: 'tours@bimondo.com',
      instagramUrl: 'https://www.instagram.com/bimondo.tours/',
      locationLabel: 'No. 596/1, Thalangama South, Battaramulla, Sri Lanka',
      foundedYear: '2022',
      founderName: 'I.M. Bimsara Illangasinghe',
      facebookLabel: 'Bimondo',
      websiteUrl: 'https://www.bimondotours.com',
      primaryMarkets:
        'United Kingdom, Europe, Australia, India, and the Middle East',
      heroImages: DEFAULT_HERO_IMAGES,
      storyMainImage: '',
      storySecondaryImage: '',
      experienceImage: '',
      tripadvisorEnabled: true,
      tripadvisorBrand: 'Tripadvisor',
      tripadvisorRating: '5.0',
      tripadvisorReviewsText: 'Based on 165 reviews',
    },
    pages,
    tours: TOURS.map((t, idx) => ({
      ...t,
      imageRef: createImageRef(t.image, t.name),
      visible: true,
      order: idx + 1,
    })),
    stays: ACCOMMODATIONS.map((s, idx) => ({
      ...s,
      imageRef: createImageRef(s.image, s.name),
      visible: true,
      order: idx + 1,
    })),
    destinations: DEFAULT_DESTINATIONS,
    colomboExperiences: COLOMBO_DAY_EXPERIENCES.map((e, idx) => ({
      ...e,
      imageRef: createImageRef(e.image, e.name),
      visible: true,
      order: idx + 1,
    })),
    bentoDestinations: BENTO_DESTINATIONS.map((b, idx) => ({
      ...b,
      heroImageRef: createImageRef(b.heroImage, b.name),
      pathwayImageRef: createImageRef(b.pathwayImage, `${b.name} pathway`),
      tallSceneImageRef: createImageRef(
        b.tallSceneImage,
        `${b.name} atmosphere`
      ),
      natureImageRef: createImageRef(b.natureImage, `${b.name} nature`),
      cuisineImageRef: createImageRef(b.cuisineImage, `${b.name} cuisine`),
      visible: true,
      order: idx + 1,
    })),
    gallery: DEFAULT_GALLERY,
    reviews: DEFAULT_REVIEWS,
    faqs: DEFAULT_FAQS,
    enquiries: DEFAULT_ENQUIRIES,
  };
}
