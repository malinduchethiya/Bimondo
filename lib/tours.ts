export interface TourTheme {
  primary: string;
  accent: string;
  bgGradient: string;
  glowColor: string;
  cardBorder: string;
  tagBg: string;
  tagColor: string;
  waterEffect?: boolean;
  mistEffect?: boolean;
}

export interface Tour {
  id: string;
  name: string;
  days: number;
  durationLabel?: string;
  category: 'heritage' | 'wildlife' | 'coast' | 'adventure' | 'family';
  categoryLabel: string;
  route: string;
  description: string;
  highlights: string;
  image: string;
  theme: TourTheme;
}

export interface ColomboDayExperience {
  id: string;
  name: string;
  duration: string;
  location: string;
  description: string;
  highlights: string;
  image: string;
}

export const TOUR_QUALIFICATION_NOTICE =
  'Routes, durations, hotels and inclusions are confirmed individually at the time of enquiry. Wildlife sightings, sea conditions and adventure activities depend on nature and are never guaranteed.';

const THEME_ADVENTURE: TourTheme = {
  primary: '#125464',
  accent: '#1fb59d',
  bgGradient:
    'linear-gradient(145deg, rgba(220, 249, 246, 0.94) 0%, rgba(206, 244, 237, 0.72) 50%, rgba(228, 251, 248, 0.9) 100%)',
  glowColor: 'rgba(31, 181, 157, 0.3)',
  cardBorder: 'rgba(31, 181, 157, 0.38)',
  tagBg: '#d3f7f0',
  tagColor: '#0c473c',
  waterEffect: true,
};

const THEME_HERITAGE: TourTheme = {
  primary: '#853e28',
  accent: '#d87046',
  bgGradient:
    'linear-gradient(145deg, rgba(254, 240, 233, 0.94) 0%, rgba(246, 228, 218, 0.75) 50%, rgba(252, 244, 238, 0.9) 100%)',
  glowColor: 'rgba(216, 112, 70, 0.26)',
  cardBorder: 'rgba(216, 112, 70, 0.35)',
  tagBg: '#fae3d7',
  tagColor: '#78331e',
  mistEffect: true,
};

const THEME_COAST: TourTheme = {
  primary: '#145d74',
  accent: '#26a9c9',
  bgGradient:
    'linear-gradient(145deg, rgba(223, 248, 252, 0.94) 0%, rgba(210, 243, 247, 0.72) 50%, rgba(232, 251, 253, 0.9) 100%)',
  glowColor: 'rgba(38, 169, 201, 0.3)',
  cardBorder: 'rgba(38, 169, 201, 0.38)',
  tagBg: '#d7f5fa',
  tagColor: '#0e4a5d',
  waterEffect: true,
};

const THEME_WILDLIFE: TourTheme = {
  primary: '#24533a',
  accent: '#c99632',
  bgGradient:
    'linear-gradient(145deg, rgba(230, 247, 237, 0.92) 0%, rgba(242, 243, 220, 0.7) 50%, rgba(225, 246, 238, 0.88) 100%)',
  glowColor: 'rgba(201, 150, 50, 0.24)',
  cardBorder: 'rgba(201, 150, 50, 0.35)',
  tagBg: '#fef1d6',
  tagColor: '#5c430e',
  mistEffect: true,
};

const THEME_FAMILY: TourTheme = {
  primary: '#225d43',
  accent: '#39b884',
  bgGradient:
    'linear-gradient(145deg, rgba(229, 248, 239, 0.94) 0%, rgba(246, 242, 222, 0.7) 50%, rgba(235, 249, 243, 0.9) 100%)',
  glowColor: 'rgba(57, 184, 132, 0.28)',
  cardBorder: 'rgba(57, 184, 132, 0.35)',
  tagBg: '#daf5e8',
  tagColor: '#164d35',
  mistEffect: true,
};

/**
 * Section 09 — The Signature Tour Collection (All 20 Documented Journeys)
 * Source of Truth: Bimondo Travels Company Profile (2026 Edition), Pages 9–11.
 */
export const TOURS: Tour[] = [
  // --- ADVENTURE JOURNEYS (1–4) ---
  {
    id: 'waves-and-rapids',
    name: 'Waves and Rapids',
    days: 8,
    category: 'adventure',
    categoryLabel: 'Adventure Journeys',
    route: 'Kitulgala, Weligama, Mirissa',
    description:
      'Rafting and abseiling in Kitulgala, followed by surf lessons in Weligama and a whale watching trip from Mirissa in season.',
    highlights:
      'Kelani River rafting and waterfall abseiling in Kitulgala, beginner-friendly surf lessons in Weligama bay, and seasonal whale watching from Mirissa.',
    image:
      'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1000&q=85',
    theme: THEME_ADVENTURE,
  },
  {
    id: 'two-coasts-surf-circuit',
    name: 'Two Coasts Surf Circuit',
    days: 10,
    category: 'adventure',
    categoryLabel: 'Adventure Journeys',
    route: 'Weligama and Arugam Bay',
    description:
      'A seasonal surf journey following the waves between the south and east coasts, with a stop in Ella along the way.',
    highlights:
      'Surf sessions across Weligama on the south coast and Arugam Bay on the east coast, connected by a scenic highland stop in Ella.',
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=85',
    theme: THEME_ADVENTURE,
  },
  {
    id: 'wind-and-reef',
    name: 'Wind and Reef',
    days: 6,
    category: 'adventure',
    categoryLabel: 'Adventure Journeys',
    route: 'Kalpitiya and Wilpattu',
    description:
      'Kite surfing lessons on the Kalpitiya lagoon, snorkelling at the Bar Reef, dolphin watching in season and a safari in Wilpattu.',
    highlights:
      'Flat-water kite surfing on Kalpitiya lagoon, Bar Reef marine snorkelling, seasonal dolphin watching, and a wildlife safari in Wilpattu National Park.',
    image:
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1000&q=85',
    theme: THEME_ADVENTURE,
  },
  {
    id: 'sky-sea-and-river',
    name: 'Sky, Sea and River',
    days: 7,
    category: 'adventure',
    categoryLabel: 'Adventure Journeys',
    route: 'Bentota, Kitulgala, Galle',
    description:
      'Paramotoring over Bentota, a river safari, rafting in Kitulgala and diving off Galle.',
    highlights:
      'Powered paraglider flight over the Bentota coastline and river, white-water rafting at Kitulgala, and reef or wreck diving off Galle.',
    image:
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=85',
    theme: THEME_ADVENTURE,
  },

  // --- CULTURE AND HERITAGE JOURNEYS (5–8) ---
  {
    id: 'ancient-kingdoms',
    name: 'Ancient Kingdoms',
    days: 7,
    category: 'heritage',
    categoryLabel: 'Culture and Heritage',
    route: 'Anuradhapura, Polonnaruwa, Sigiriya, Dambulla, Kandy',
    description:
      'The great ancient capitals, the Lion Rock and Pidurangala, the Dambulla cave temple and the Temple of the Tooth.',
    highlights:
      'Sacred capitals of Anuradhapura and Polonnaruwa, Sigiriya Lion Rock and Pidurangala, Dambulla cave temple, and Kandy’s Temple of the Tooth.',
    image:
      'https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=1000&q=85',
    theme: THEME_HERITAGE,
  },
  {
    id: 'sunrise-on-two-rocks',
    name: 'Sunrise on Two Rocks',
    days: 4,
    category: 'heritage',
    categoryLabel: 'Culture and Heritage',
    route: 'Sigiriya, Pidurangala, Minneriya',
    description:
      'A short journey with a sunrise climb of Pidurangala, Sigiriya, village life and the elephant gathering at Minneriya in season.',
    highlights:
      'Dawn climb up Pidurangala rock, Sigiriya fortress exploration, authentic village encounters, and the seasonal Minneriya elephant gathering.',
    image:
      'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1000&q=85',
    theme: THEME_HERITAGE,
  },
  {
    id: 'ceylon-grand-circuit',
    name: 'Ceylon Grand Circuit',
    days: 14,
    category: 'heritage',
    categoryLabel: 'Culture and Heritage',
    route: 'Islandwide (Cultural Triangle, Kandy, Tea Country, Ella, Yala, South Coast)',
    description:
      'The classic first time journey through the Cultural Triangle, Kandy, the tea country, Ella, Yala and the south coast.',
    highlights:
      'Comprehensive private island circuit linking Cultural Triangle landmarks, Kandy, hill-country tea estates, Ella, Yala safaris, and the southern coast.',
    image:
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1000&q=85',
    theme: THEME_HERITAGE,
  },
  {
    id: 'kandy-and-the-hill-capital',
    name: 'Kandy and the Hill Capital',
    days: 5,
    category: 'heritage',
    categoryLabel: 'Culture and Heritage',
    route: 'Kandy, Peradeniya, Nuwara Eliya',
    description:
      'The Temple of the Tooth, the Royal Botanical Gardens, tea estates and the cool hill station of Nuwara Eliya.',
    highlights:
      'Temple of the Sacred Tooth Relic in Kandy, Peradeniya Royal Botanical Gardens, working tea estates, and Nuwara Eliya.',
    image:
      'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1000&q=85',
    theme: THEME_HERITAGE,
  },

  // --- SEA AND SAND ESCAPES (9–11) ---
  {
    id: 'southern-shores-in-luxury',
    name: 'Southern Shores in Luxury',
    days: 8,
    category: 'coast',
    categoryLabel: 'Sea and Sand Escapes',
    route: 'Galle, Unawatuna, Mirissa',
    description:
      'Luxury beach stays with Galle Fort, quiet coves, whale watching in season and spa time.',
    highlights:
      'Four-star to five-star coastal stays across Galle, Unawatuna, and Mirissa with Galle Fort walks, quiet coves, spa relaxation, and seasonal whale watching.',
    image:
      'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1000&q=85',
    theme: THEME_COAST,
  },
  {
    id: 'galle-fort-and-beach-days',
    name: 'Galle Fort and Beach Days',
    days: 5,
    category: 'coast',
    categoryLabel: 'Sea and Sand Escapes',
    route: 'Galle and Unawatuna',
    description:
      'A short escape with a guided walk through Galle Fort, snorkelling and relaxed beach days.',
    highlights:
      'Guided heritage walk inside Galle Fort, coastal snorkelling in calm months, and unhurried beach time in Unawatuna.',
    image:
      'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1000&q=85',
    theme: THEME_COAST,
  },
  {
    id: 'culture-and-coast',
    name: 'Culture and Coast',
    days: 10,
    category: 'coast',
    categoryLabel: 'Sea and Sand Escapes',
    route: 'Cultural Triangle, Kandy, the south coast',
    description:
      'A balanced holiday for first time visitors, combining heritage sites with a long, relaxing beach finish.',
    highlights:
      'Ancient kingdoms of the Cultural Triangle and Kandy paired with an extended, restful stay along Sri Lanka’s south coast.',
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=85',
    theme: THEME_COAST,
  },

  // --- HIKING AND WILDLIFE JOURNEYS (12–15) ---
  {
    id: 'leopards-elephants-whales',
    name: 'Leopards, Elephants and Whales',
    days: 9,
    category: 'wildlife',
    categoryLabel: 'Hiking and Wildlife',
    route: 'Minneriya, Udawalawe, Yala, Mirissa',
    description:
      'A wildlife focused journey with safaris in three national parks and whale watching in season.',
    highlights:
      'Guided safaris across Minneriya, Udawalawe, and Yala National Parks combined with seasonal whale watching from Mirissa.',
    image:
      'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&w=1000&q=85',
    theme: THEME_WILDLIFE,
  },
  {
    id: 'wilpattu-wilderness',
    name: 'Wilpattu Wilderness',
    days: 4,
    category: 'wildlife',
    categoryLabel: 'Hiking and Wildlife',
    route: 'Wilpattu and Anuradhapura',
    description:
      'Safaris in Sri Lanka’s largest national park, known for its lakes and leopards, combined with the sacred city.',
    highlights:
      'Naturalist-guided safaris among the natural lakes (villus) of Wilpattu National Park and heritage visits in sacred Anuradhapura.',
    image:
      'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1000&q=85',
    theme: THEME_WILDLIFE,
  },
  {
    id: 'the-pekoe-trail-walk',
    name: 'The Pekoe Trail Walk',
    days: 8,
    category: 'wildlife',
    categoryLabel: 'Hiking and Wildlife',
    route: 'Kandy, the tea country, Ella',
    description:
      'Selected stages of the Pekoe Trail through tea estates and villages, with comfortable stays and luggage transfers.',
    highlights:
      'Curated walking stages on The Pekoe Trail from Kandy through the highland tea country to Ella, with comfortable stays and point-to-point luggage transfers.',
    image:
      'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1000&q=85',
    theme: THEME_WILDLIFE,
  },
  {
    id: 'rainforest-and-waterfalls',
    name: 'Rainforest and Waterfalls',
    days: 6,
    category: 'wildlife',
    categoryLabel: 'Hiking and Wildlife',
    route: 'Sinharaja, Ella, Horton Plains',
    description:
      'A trek in the Sinharaja rainforest, waterfall hikes around Ella and the walk to World’s End.',
    highlights:
      'Guided rainforest trekking in UNESCO-listed Sinharaja, waterfall trails around Ella, and the highland walk across Horton Plains to World’s End.',
    image:
      'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1000&q=85',
    theme: THEME_WILDLIFE,
  },

  // --- JOURNEYS FOR FAMILIES AND SPECIAL MARKETS (16–20) ---
  {
    id: 'family-island-discovery',
    name: 'Family Island Discovery',
    days: 10,
    category: 'family',
    categoryLabel: 'Families & Special Markets',
    route: 'Islandwide',
    description:
      'Elephants, safaris, turtle hatcheries, train rides and safe beach time, with short drives and family rooms.',
    highlights:
      'Thoughtfully paced family route with shorter driving days, spacious family rooms, safaris, elephants, turtle hatcheries, scenic train rides, and safe beach time.',
    image:
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1000&q=85',
    theme: THEME_FAMILY,
  },
  {
    id: 'little-explorers',
    name: 'Little Explorers',
    days: 6,
    category: 'family',
    categoryLabel: 'Families & Special Markets',
    route: 'Kandy, Udawalawe, Bentota',
    description:
      'A shorter family trip with an elephant transit home visit, a safari, a river safari and beach fun.',
    highlights:
      'Compact 6-day family holiday featuring Kandy, the Udawalawe Elephant Transit Home and national park safari, a Bentota river safari, and relaxed beach time.',
    image:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1000&q=85',
    theme: THEME_FAMILY,
  },
  {
    id: 'india-to-island-express',
    name: 'India to Island Express',
    days: 5,
    category: 'family',
    categoryLabel: 'Families & Special Markets',
    route: 'Colombo, Kandy, Nuwara Eliya',
    description:
      'A short holiday for small Indian groups with city shopping, the hill country and vegetarian friendly hotels.',
    highlights:
      'Designed for couples, families, and small groups flying from India: Colombo shopping, Kandy heritage, cool Nuwara Eliya hills, and vegetarian-friendly hotels.',
    image:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=85',
    theme: THEME_FAMILY,
  },
  {
    id: 'hills-and-beaches-for-friends',
    name: 'Hills and Beaches for Friends',
    days: 7,
    category: 'family',
    categoryLabel: 'Families & Special Markets',
    route: 'Kandy, Nuwara Eliya, Ella, Bentota',
    description:
      'A lively journey for small groups of friends with the Ella train, adventure options and beach days.',
    highlights:
      'Built for small groups of friends combining Kandy, Nuwara Eliya, the scenic Ella highland train, optional adventure activities, and Bentota beach days.',
    image:
      'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1000&q=85',
    theme: THEME_FAMILY,
  },
  {
    id: 'australian-adventure-combo',
    name: 'Australian Adventure Combo',
    days: 12,
    category: 'family',
    categoryLabel: 'Families & Special Markets',
    route: 'Islandwide',
    description:
      'Surfing, safaris, hiking and the Cultural Triangle in one active holiday, timed to the right coast for the season.',
    highlights:
      'Twelve-day active island itinerary combining Cultural Triangle landmarks, highland hiking, wildlife safaris, and seasonal surf coasts.',
    image:
      'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1000&q=85',
    theme: THEME_FAMILY,
  },
];

/**
 * Section 10 — Colombo and Battaramulla Day Experiences
 * Source of Truth: Bimondo Travels Company Profile (2026 Edition), Pages 11–12.
 */
export const COLOMBO_DAY_EXPERIENCES: ColomboDayExperience[] = [
  {
    id: 'thalangama-wetland-birdwalk',
    name: 'Thalangama Wetland Birdwalk',
    duration: 'Half-Day Morning',
    location: 'Thalangama & Battaramulla',
    description:
      'An early morning walk around the Thalangama wetland and paddy fields to see local birdlife and village life on the edge of the city.',
    highlights:
      'Thalangama Tank & Environmental Protection Area · Resident & migratory birds · Village footpaths',
    image:
      'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 'colombo-city-highlights',
    name: 'Colombo City Highlights',
    duration: 'Half-Day or Full-Day',
    location: 'Colombo Fort, Pettah & Galle Face Green',
    description:
      'Gangaramaya temple, Independence Square, the National Museum, the Fort and Pettah areas and sunset at Galle Face Green.',
    highlights:
      'Gangaramaya Temple · Independence Square · National Museum · Fort & Pettah · Galle Face Green sunset',
    image:
      'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 'colombo-food-trail',
    name: 'Colombo Food Trail',
    duration: 'Half-Day Evening / Afternoon',
    location: 'Colombo Local Favourites',
    description:
      'A guided tasting of Sri Lankan street food, rice and curry, hoppers and kottu in local favourites.',
    highlights:
      'Sri Lankan street food · Authentic rice & curry · Fresh hoppers & kottu at trusted local spots',
    image:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 'kotte-heritage-walk',
    name: 'Kotte Heritage Walk',
    duration: 'Half-Day',
    location: 'Sri Jayawardenepura Kotte & Diyawanna Lake',
    description:
      'A walk through the history of the old Kotte kingdom, near the Diyawanna Lake and the Parliament.',
    highlights:
      '15th-century Kingdom of Kotte history · Diyawanna Lake · Parliament surroundings',
    image:
      'https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 'kelaniya-temple-visit',
    name: 'Kelaniya Temple Visit',
    duration: 'Half-Day',
    location: 'Kelaniya Raja Maha Vihara',
    description:
      'A visit to the Kelaniya Raja Maha Vihara, one of the most respected Buddhist temples in the country.',
    highlights:
      'Sacred Kelaniya Raja Maha Vihara · Historic Buddhist murals, architecture & living heritage',
    image:
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 'negombo-lagoon-day',
    name: 'Negombo Lagoon Day',
    duration: 'Half-Day or Full-Day',
    location: 'Negombo Canal & Lagoon',
    description:
      'The fish market, the old Dutch canal and a boat ride on the Negombo lagoon, ideal before an evening flight.',
    highlights:
      'Negombo fish market · Historic Dutch canal · Negombo lagoon boat ride near CMB Airport',
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85',
  },
];
