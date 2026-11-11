import { TOURS, Tour } from '@/lib/tours';
import { ACCOMMODATIONS, AccommodationItem } from '@/lib/booking-types';

export type StaggerSlideVariant =
  | 'tall-up'
  | 'low-down'
  | 'mid-up'
  | 'compact-mid'
  | 'tall-deep';

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
  staggerVariant?: StaggerSlideVariant;
}

export interface CmsGalleryPhoto {
  id: string;
  title: string;
  location: string;
  category: 'culture' | 'highlands' | 'wildlife' | 'coast';
  categoryLabel: string;
  image: string;
  description: string;
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
}

export interface CmsFaqItem {
  id: string;
  category: 'private' | 'stays' | 'booking';
  q: string;
  a: string;
}

export interface CmsCustomerEnquiry {
  id: string;
  createdAt: string;
  name: string;
  email: string;
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
  tripadvisorEnabled?: boolean;
  tripadvisorBrand?: string;
  tripadvisorRating?: string;
  tripadvisorReviewsText?: string;
}

export interface SiteCmsData {
  updatedAt: string;
  general: CmsGeneralSettings;
  tours: Tour[];
  stays: AccommodationItem[];
  destinations: CmsDestination[];
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
    image:
      'https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=1000&q=85',
    staggerVariant: 'tall-up',
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
    image:
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1000&q=85',
    staggerVariant: 'compact-mid',
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
    image:
      'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1000&q=85',
    staggerVariant: 'low-down',
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
    image:
      'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&w=1000&q=85',
    staggerVariant: 'mid-up',
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
    image:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=85',
    staggerVariant: 'tall-deep',
  },
  {
    id: 'galle-sea-and-sand',
    name: 'Galle, Unawatuna, Mirissa, Weligama, Arugam Bay, Kalpitiya & Bentota',
    region: 'coast',
    regionLabel: 'Sea and Sand',
    season: 'South/West Nov – Apr · East Coast May – Oct',
    tagline: 'Galle Fort heritage, seasonal surf bays, diving & lagoon adventures',
    description:
      'From coastal stays in Galle, Unawatuna, and Mirissa to surfing at Weligama (Nov–Apr) and Arugam Bay (May–Oct), paramotoring at Bentota, and diving or kite surfing in Kalpitiya—matched carefully to the island’s two coastal seasons.',
    highlights: [
      'Galle, Unawatuna & Mirissa coastal escapes',
      'Surfing at Weligama (Nov–Apr) & Arugam Bay (May–Oct)',
      'Kalpitiya Bar Reef diving, kite surfing & Bentota paramotoring',
    ],
    image:
      'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1000&q=85',
    staggerVariant: 'mid-up',
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
    image:
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1000&q=85',
    staggerVariant: 'low-down',
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
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=85',
    staggerVariant: 'compact-mid',
  },
];

export const DEFAULT_GALLERY: CmsGalleryPhoto[] = [
  {
    id: 'dancer-welcome',
    title: 'Living Heritage in Kandy',
    location: 'Kandy · Culture and Heritage',
    category: 'culture',
    categoryLabel: 'Culture & Heritage',
    image: '/images/kandyan-ves-dancer.jpg',
    description:
      'Traditional Kandyan cultural heritage—visited with respect for local customs, dress, and living traditions.',
  },
  {
    id: 'sigiriya-citadel',
    title: 'Sigiriya & Pidurangala at First Light',
    location: 'Sigiriya · Cultural Triangle',
    category: 'culture',
    categoryLabel: 'Culture & Heritage',
    image:
      'https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=1200&q=85',
    description:
      'Morning mist over Sigiriya Rock Fortress and the surrounding forests of the Cultural Triangle.',
  },
  {
    id: 'nine-arch-bridge',
    title: 'Hill Country Rail & Tea Trails',
    location: 'Ella & Nuwara Eliya · Hill Country',
    category: 'highlands',
    categoryLabel: 'Hill Country & Hiking',
    image:
      'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1200&q=85',
    description:
      'The scenic mountain railway and walking routes linking Kandy, Nuwara Eliya, and Ella.',
  },
  {
    id: 'kandy-temple-dance',
    title: 'Sacred Traditions of the Island',
    location: 'Kandy & Kelaniya',
    category: 'culture',
    categoryLabel: 'Culture & Heritage',
    image: '/images/sri-lankan-dancer-matching.jpg',
    description:
      'Sacred temples, historic shrines, and centuries of Buddhist art and craftsmanship across Sri Lanka.',
  },
  {
    id: 'galle-lighthouse',
    title: 'Galle Fort & The Southern Coast',
    location: 'Galle, Unawatuna & Mirissa',
    category: 'coast',
    categoryLabel: 'Sea & Sand',
    image:
      'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=85',
    description:
      'Historic ramparts at Galle Fort and relaxed coastal days along the southern shores.',
  },
  {
    id: 'wild-elephant-lake',
    title: 'Elephants in Open National Parks',
    location: 'Minneriya & Udawalawe',
    category: 'wildlife',
    categoryLabel: 'Wildlife & Nature',
    image:
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=85',
    description:
      'Responsible wildlife safaris observing wild elephant herds across Minneriya and Udawalawe.',
  },
  {
    id: 'leopard-safari',
    title: 'Wilderness Tracks of Yala & Wilpattu',
    location: 'Yala & Wilpattu National Parks',
    category: 'wildlife',
    categoryLabel: 'Wildlife & Nature',
    image:
      'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&w=1200&q=85',
    description:
      'Early morning safaris with operators who respect park rules and animal welfare.',
  },
  {
    id: 'ceylon-tea-valleys',
    title: 'Walking The Pekoe Trail',
    location: 'Kandy, Nuwara Eliya & Ella',
    category: 'highlands',
    categoryLabel: 'Hill Country & Hiking',
    image:
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=85',
    description:
      'Walking through working tea estates, highland villages, and cool mountain ridges.',
  },
  {
    id: 'coastal-slow-living',
    title: 'Surf Bays & Coastal Escapes',
    location: 'Weligama, Arugam Bay & Kalpitiya',
    category: 'coast',
    categoryLabel: 'Sea & Sand',
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85',
    description:
      'Warm Indian Ocean swells and quiet sandy bays planned around the best coastal seasons.',
  },
];

// Default Tourist Thoughts cards displayed in the Homepage #why train slider and editable in /admin
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
    image:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
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
    image:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
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
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
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
    image:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
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
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
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
    image:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
  },
];

export const DEFAULT_FAQS: CmsFaqItem[] = [
  {
    id: 'who-is-bimondo',
    category: 'private',
    q: 'Who is Bimondo Travels and where are you based?',
    a: 'Bimondo Travels is a Sri Lankan travel company founded in 2022 by I.M. Bimsara Illangasinghe and based at No. 596/1, Thalangama South, Battaramulla, near Colombo. We plan and operate private, tailor-made journeys across Sri Lanka for solo travellers, couples, families, and small private groups.',
  },
  {
    id: 'how-journey-works',
    category: 'booking',
    q: 'How does planning and booking a journey with Bimondo Travels work?',
    a: 'Every journey follows a clear 7-step process: (01) Enquiry via our website, email, or WhatsApp; (02) Personal consultation on your dates, interests, pace, and budget; (03) Custom day-by-day itinerary design; (04) Transparent quotation and booking confirmation; (05) Pre-arrival information on packing, weather, and your driver/guide; (06) Airport greeting, private journey, and 24-hour on-call support; and (07) Airport transfer on departure and post-trip follow-up.',
  },
  {
    id: 'truly-private',
    category: 'private',
    q: 'Are your tours private or shared with other travellers?',
    a: 'Our journeys are private and personal. Every itinerary is built around your own dates, pace, and interests—rather than rushing you through a fixed group bus schedule.',
  },
  {
    id: 'accommodation-options',
    category: 'stays',
    q: 'What types of accommodation do you arrange?',
    a: 'We arrange a curated range of four-star hotels, characterful boutique properties, and five-star luxury resorts across Sri Lanka. Hotels and inclusions are selected and confirmed individually at the time of enquiry according to your route and preferences.',
  },
  {
    id: 'drivers-and-guides',
    category: 'stays',
    q: 'What transport, drivers, and guides are provided during the journey?',
    a: 'We provide private transport with professional drivers and licensed guides, together with specialist local guides for activities such as hiking on The Pekoe Trail, birdwatching in Thalangama or Sinharaja, and adventure sports.',
  },
  {
    id: 'wildlife-and-nature',
    category: 'private',
    q: 'How do you approach wildlife safaris and adventure activities?',
    a: 'We work with safari operators in Yala, Udawalawe, Wilpattu, and Minneriya who respect park rules and animal welfare, and with vetted, safety-checked operators for surfing, rafting in Kitulgala, paramotoring in Bentota, and diving or kite surfing in Kalpitiya. Please note that wildlife sightings, sea conditions, and adventure activities depend on nature and are never guaranteed.',
  },
  {
    id: 'best-seasons',
    category: 'booking',
    q: 'How do Sri Lanka’s seasons affect where we should travel?',
    a: 'Sri Lanka is a year-round destination with two distinct coastal seasons. For example, Weligama and the South/West Coast are best from November to April, while Arugam Bay and the East Coast are best from May to October. During consultation, we design your route around the best weather for your travel dates.',
  },
  {
    id: 'colombo-day-trips',
    category: 'private',
    q: 'Can we arrange short half-day or full-day experiences around Colombo and Battaramulla?',
    a: 'Yes. Because our office is in Thalangama South, Battaramulla, we offer six dedicated day experiences ideal at the start or end of a trip: the Thalangama Wetland Birdwalk, Colombo City Highlights, Colombo Food Trail, Kotte Heritage Walk, Kelaniya Temple Visit, and Negombo Lagoon Day.',
  },
  {
    id: 'on-call-support',
    category: 'stays',
    q: 'What support is available while we are travelling in Sri Lanka?',
    a: 'Alongside your dedicated driver and guide, our team in Battaramulla is available on call 24 hours a day throughout your stay in Sri Lanka to assist with arrangements, schedule adjustments, or any support you need.',
  },
];

export const DEFAULT_ENQUIRIES: CmsCustomerEnquiry[] = [];

export function getDefaultCmsData(): SiteCmsData {
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
      websiteUrl: 'https://www.bimondo.com',
      primaryMarkets:
        'United Kingdom, Europe, Australia, India, and the Middle East',
      tripadvisorEnabled: true,
      tripadvisorBrand: 'Tripadvisor',
      tripadvisorRating: '5.0',
      tripadvisorReviewsText: 'Based on 165 reviews',
    },
    tours: TOURS,
    stays: ACCOMMODATIONS,
    destinations: DEFAULT_DESTINATIONS,
    gallery: DEFAULT_GALLERY,
    reviews: DEFAULT_REVIEWS,
    faqs: DEFAULT_FAQS,
    enquiries: DEFAULT_ENQUIRIES,
  };
}
