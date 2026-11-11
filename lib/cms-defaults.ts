import { TOURS, Tour } from '@/lib/tours';
import { ACCOMMODATIONS, AccommodationItem } from '@/lib/booking-types';

export interface CmsDestination {
  id: string;
  name: string;
  region: 'culture' | 'hills' | 'coast' | 'wildlife';
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
    id: 'sigiriya',
    name: 'Sigiriya & The Cultural Triangle',
    region: 'culture',
    regionLabel: 'Culture & Heritage',
    season: 'Best Nov – Sep',
    tagline: 'Ancient sky fortress & sacred ruins',
    description:
      'Climb the 5th-century rock fortress of King Kashyapa, explore the ancient capitals of Anuradhapura and Polonnaruwa, and marvel at the cave temples of Dambulla.',
    highlights: [
      'Sigiriya Lion Rock climb',
      'Pidurangala sunrise panorama',
      'Dambulla Golden Cave Temples',
    ],
    image:
      'https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=1000&q=85',
  },
  {
    id: 'kandy-hills',
    name: 'Kandy & Knuckles Mountain Range',
    region: 'hills',
    regionLabel: 'Central Highlands',
    season: 'Year-round · Cooler Dec – Mar',
    tagline: 'Sacred relic, lake breeze & cloud forests',
    description:
      'Sri Lanka’s cultural crown surrounded by mist-draped peaks. Home to the Temple of the Sacred Tooth Relic, vibrant Kandyan dance rituals, and pristine hiking.',
    highlights: [
      'Temple of the Tooth Relic',
      'Kandy Lake evening walks',
      'Knuckles UNESCO wilderness hike',
    ],
    image:
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1000&q=85',
  },
  {
    id: 'ella-nuwara-eliya',
    name: 'Ella, Nuwara Eliya & Tea Country',
    region: 'hills',
    regionLabel: 'Central Highlands',
    season: 'Best Jan – May',
    tagline: 'Misty tea estates, waterfalls & slow trains',
    description:
      'Cool mountain air, endless emerald hills, and colonial heritage. Take the iconic blue train through pine forests, hike Little Adam’s Peak, and sip single-origin Ceylon tea.',
    highlights: [
      'Nine Arch Bridge train crossing',
      'Tea factory tasting & picking',
      'Little Adam’s Peak trek',
    ],
    image:
      'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1000&q=85',
  },
  {
    id: 'galle-south-coast',
    name: 'Galle Fort & The Southern Riviera',
    region: 'coast',
    regionLabel: 'Coast & Beaches',
    season: 'Best Nov – Apr',
    tagline: 'Dutch ramparts, surf bays & slow living',
    description:
      'Wander cobblestone lanes lined with 17th-century colonial villas, watch local stilt fishermen at golden hour, and relax along golden palm-fringed beaches.',
    highlights: [
      'UNESCO Galle Fort walking tour',
      'Mirissa blue whale watching',
      'Weligama gentle surf lessons',
    ],
    image:
      'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1000&q=85',
  },
  {
    id: 'yala-wildlife',
    name: 'Yala & Udawalawe National Parks',
    region: 'wildlife',
    regionLabel: 'Wildlife & Nature',
    season: 'Best Feb – Oct',
    tagline: 'Leopard prowls, elephant herds & wild lagoons',
    description:
      'Sri Lanka boasts one of the highest densities of wild leopards on earth. Ride open-top 4x4 jeeps across scrub jungle, waterholes, and coastal lagoons.',
    highlights: [
      'Guided leopard tracking safaris',
      'Udawalawe elephant transit home',
      'Crocodiles & exotic birdlife',
    ],
    image:
      'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&w=1000&q=85',
  },
  {
    id: 'minneriya',
    name: 'Minneriya & Kaudulla Gathering',
    region: 'wildlife',
    regionLabel: 'Wildlife & Nature',
    season: 'Peak Jul – Oct',
    tagline: 'The largest Asian elephant gathering',
    description:
      'During the dry season, up to 300 wild elephants congregate around ancient 3rd-century irrigation reservoirs. A breathtaking natural spectacle unique to Sri Lanka.',
    highlights: [
      'The Great Elephant Gathering',
      'Ancient lake ecosystems',
      'Sunset open-air jeep drives',
    ],
    image:
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1000&q=85',
  },
];

export const DEFAULT_GALLERY: CmsGalleryPhoto[] = [
  {
    id: 'dancer-welcome',
    title: 'Ayubowan — May You Live Long',
    location: 'Kandy & Central Province',
    category: 'culture',
    categoryLabel: 'Culture & Heritage',
    image: '/images/kandyan-ves-dancer.jpg',
    description:
      'A traditional Sri Lankan Kandyan dancer in sacred regalia offering the reverent hands-together Ayubowan greeting.',
  },
  {
    id: 'sigiriya-citadel',
    title: 'Sunrise Over the Sky Citadel',
    location: 'Sigiriya, Cultural Triangle',
    category: 'culture',
    categoryLabel: 'Culture & Heritage',
    image:
      'https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=1200&q=85',
    description:
      'The 5th-century rock fortress of King Kashyapa rising 200 metres above misty tropical jungle canopy.',
  },
  {
    id: 'nine-arch-bridge',
    title: 'The Blue Train at Demodara',
    location: 'Ella, Highlands',
    category: 'highlands',
    categoryLabel: 'Highlands & Tea',
    image:
      'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1200&q=85',
    description:
      'The colonial stone Nine Arch Bridge gracefully spanning dense tea terraces and eucalyptus forests in the morning mist.',
  },
  {
    id: 'kandy-temple-dance',
    title: 'Sacred Kandyan Drumming & Dance',
    location: 'Temple of the Tooth, Kandy',
    category: 'culture',
    categoryLabel: 'Culture & Heritage',
    image: '/images/sri-lankan-dancer-matching.jpg',
    description:
      'Ancient rhythms and ritual movements passed down through generations during cultural temple celebrations.',
  },
  {
    id: 'galle-lighthouse',
    title: 'Sunset at Galle Fort Ramparts',
    location: 'Galle, Southern Coast',
    category: 'coast',
    categoryLabel: 'Coast & Oceans',
    image:
      'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=85',
    description:
      'The iconic 1939 white lighthouse standing sentinel above 17th-century Dutch fortifications and coral reefs.',
  },
  {
    id: 'wild-elephant-lake',
    title: 'The Gathering at Kaudulla',
    location: 'Minneriya & Kaudulla',
    category: 'wildlife',
    categoryLabel: 'Wildlife & Nature',
    image:
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=85',
    description:
      'Wild Asian elephant herds gathering peacefully by the shores of ancient 3rd-century reservoirs at golden hour.',
  },
  {
    id: 'leopard-safari',
    title: 'Granite Boulders of Yala',
    location: 'Yala National Park',
    category: 'wildlife',
    categoryLabel: 'Wildlife & Nature',
    image:
      'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&w=1200&q=85',
    description:
      'Sri Lanka’s untamed wilderness, home to the world’s densest wild leopard population and coastal lagoons.',
  },
  {
    id: 'ceylon-tea-valleys',
    title: 'Emerald Terraces of Nuwara Eliya',
    location: 'Central Highlands',
    category: 'highlands',
    categoryLabel: 'Highlands & Tea',
    image:
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=85',
    description:
      'Rolling carpets of single-origin Ceylon tea bushes glistening with cool morning dew in the hill country.',
  },
  {
    id: 'coastal-slow-living',
    title: 'Golden Sands of the South',
    location: 'Mirissa & Tangalle',
    category: 'coast',
    categoryLabel: 'Coast & Oceans',
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85',
    description:
      'Pristine curving palm bays where tropical turquoise waters meet secluded boutique beach retreats.',
  },
];

export const DEFAULT_REVIEWS: CmsReviewItem[] = [
  {
    id: 'rev-1',
    name: 'Elena & Marcus Weber',
    location: 'Munich, Germany',
    rating: 5,
    tour: '14-Day Ceylon Grand Circuit',
    date: 'Visited February 2026',
    quote:
      '“Our chauffeur-guide Nimal felt like family from day one. No tour bus crowds, gorgeous boutique tea villas in Ella, and spontaneous stops for fresh king coconuts. Bimondo made Sri Lanka truly unforgettable.”',
  },
  {
    id: 'rev-2',
    name: 'The Jenkins Family (4 guests)',
    location: 'Melbourne, Australia',
    rating: 5,
    tour: '10-Day Family Island Discovery',
    date: 'Visited December 2025',
    quote:
      '“Travelling with two kids aged 8 and 11 can be daunting, but Bimondo took care of every single detail. Watching hundreds of wild elephants gather at Minneriya was a lifelong memory for our boys.”',
  },
  {
    id: 'rev-3',
    name: 'Claire & Antoine Dupont',
    location: 'Paris, France',
    rating: 5,
    tour: '8-Day Southern Shores in Luxury',
    date: 'Visited January 2026',
    quote:
      '“From watching sunrise over Pidurangala to quiet sunset walks along Galle Fort ramparts. The 24/7 WhatsApp concierge was always reassuring. An authentic, private experience we will cherish.”',
  },
  {
    id: 'rev-4',
    name: 'Liam & Sophie Campbell',
    location: 'Edinburgh, UK',
    rating: 5,
    tour: '8-Day The Pekoe Trail Walk',
    date: 'Visited March 2026',
    quote:
      '“Incredible walks through emerald tea valleys with our naturalist guide. Every hotel had character and warmth. You truly come as a traveller and leave as a lifelong friend.”',
  },
];

export const DEFAULT_FAQS: CmsFaqItem[] = [
  {
    id: 'who-is-bimondo',
    category: 'private',
    q: 'Who is Bimondo Travels and how do your private journeys work?',
    a: 'Founded in Colombo in 2022 by Bimsara Illangasinghe, Bimondo Travels designs 100% private, tailor-made journeys across Sri Lanka. You share your travel dates, pace, and interests, and our local specialists craft a bespoke route with handpicked stays and your own dedicated chauffeur-guide.',
  },
  {
    id: 'truly-private',
    category: 'private',
    q: 'Are all Bimondo itineraries completely private to our group?',
    a: 'Yes, always. You never share a vehicle or guide with strangers. Whether you are travelling solo, as a couple, or with family, your vehicle and chauffeur-guide are exclusively yours from airport pickup to departure.',
  },
  {
    id: 'chauffeur-guide',
    category: 'stays',
    q: 'Is a private air-conditioned vehicle and licensed chauffeur-guide included?',
    a: 'Every Bimondo journey includes a modern, air-conditioned private vehicle, fuel, parking, highway tolls, and an experienced, licensed English-speaking Sri Lankan chauffeur-guide who accompanies you throughout.',
  },
  {
    id: 'customize-hotels',
    category: 'stays',
    q: 'Can we customize our boutique hotels, villas, and daily pace?',
    a: 'Completely. We match every stay to your taste—from historic tea planter bungalows in the hills and architect-designed coastal villas to luxury tented safari camps. During the trip, your daily schedule remains flexible if you wish to linger longer or stop along the way.',
  },
  {
    id: 'best-season',
    category: 'booking',
    q: 'When is the best time of year to visit Sri Lanka?',
    a: 'Sri Lanka is a year-round island destination thanks to two complementary monsoon seasons. November to April brings golden sunshine to the South & West Coasts, Cultural Triangle, and Hill Country, while May to September is ideal for the East Coast (Trincomalee, Pasikudah & Arugam Bay) and northern cultural capitals.',
  },
  {
    id: 'wildlife-ethics',
    category: 'private',
    q: 'How does Bimondo ensure ethical wildlife safaris and local sustainability?',
    a: 'We partner exclusively with conservation-minded naturalists and experienced jeep trackers who strictly respect park distances and animal welfare. We also prioritize quieter park gates, dawn entries, and locally owned lodges that directly benefit surrounding communities.',
  },
  {
    id: 'on-trip-support',
    category: 'stays',
    q: 'What support is provided once we land in Sri Lanka?',
    a: 'Alongside your dedicated chauffeur-guide, our Colombo concierge team is available 24/7 via WhatsApp and phone to handle restaurant reservations, spontaneous route adjustments, or any special requests.',
  },
  {
    id: 'dietary-family',
    category: 'stays',
    q: 'Do you accommodate families with children or specific dietary requirements?',
    a: 'Yes. We provide child car seats on request, pace drive times gently for younger travellers, and brief every hotel and local host in advance on vegetarian, vegan, gluten-free, halal, or allergy-safe dining.',
  },
  {
    id: 'booking-deposit',
    category: 'booking',
    q: 'How far in advance should we book, and how are reservations confirmed?',
    a: 'For peak winter and summer months, we recommend starting 2 to 6 months ahead to secure Sri Lanka’s most intimate boutique villas. Once you approve your custom route and transparent quote, a deposit locks in all hotels, vehicles, and scenic train seats.',
  },
  {
    id: 'airport-transfers',
    category: 'booking',
    q: 'Are Bandaranaike International Airport (CMB) greetings and transfers included?',
    a: 'Yes. Your personal chauffeur-guide greets you inside the arrivals concourse at Colombo Bandaranaike International Airport (CMB) and sees you all the way back to departures at the end of your journey.',
  },
];

export const DEFAULT_ENQUIRIES: CmsCustomerEnquiry[] = [
  {
    id: 'enq-sample-1',
    createdAt: '2026-04-12T09:30:00.000Z',
    name: 'Hannah & Oliver Lindqvist',
    email: 'hannah.lindqvist@example.com',
    arrival: '2026-12-14',
    guests: '2 travellers',
    duration: '11–16 days',
    style: 'Culture & heritage',
    message:
      'We would love a private 14-day honeymoon itinerary combining Sigiriya, tea estates in Ella, a quiet leopard safari, and 4 nights in a boutique villa near Galle Fort.',
    status: 'new',
    adminNotes:
      'Assign senior chauffeur-guide Nimal; send Ceylon Grand Circuit + Tea Bungalow options.',
  },
  {
    id: 'enq-sample-2',
    createdAt: '2026-04-10T15:15:00.000Z',
    name: 'Dr. Rajesh & Priya Patel',
    email: 'r.patel@example.co.uk',
    arrival: '2026-08-05',
    guests: '3–4 travellers',
    duration: '7–10 days',
    style: 'Wildlife & nature',
    message:
      'Travelling with our two teenagers in August. Very keen on the Minneriya Elephant Gathering and Trincomalee east coast beach stays.',
    status: 'in_progress',
    adminNotes:
      'Sent initial quote via WhatsApp; awaiting flight confirmation.',
  },
];

export function getDefaultCmsData(): SiteCmsData {
  return {
    updatedAt: '2026-04-12T10:00:00.000Z',
    general: {
      siteName: 'Bimondo Travels',
      tagline: 'Not a place you visit, but a feeling you carry home.',
      whatsappNumber: '94762232054',
      contactEmail: 'tours@bimondo.com',
      instagramUrl: 'https://www.instagram.com/bimondo.tours/',
      locationLabel: 'Battaramulla, Sri Lanka',
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
