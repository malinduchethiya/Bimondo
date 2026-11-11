import { TOURS, Tour } from '@/lib/tours';
import { ACCOMMODATIONS, AccommodationItem } from '@/lib/booking-types';

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
      'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1000&q=85',
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

// No fabricated reviews by default. Verified guest reviews can be added via the Admin Panel.
export const DEFAULT_REVIEWS: CmsReviewItem[] = [];

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
