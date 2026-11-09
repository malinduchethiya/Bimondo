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
  category: 'heritage' | 'wildlife' | 'coast' | 'adventure' | 'family';
  categoryLabel: string;
  route: string;
  description: string;
  highlights: string;
  image: string;
  theme: TourTheme;
}

export const TOURS: Tour[] = [
  {
    id: 'ceylon-grand-circuit',
    name: 'Ceylon Grand Circuit',
    days: 14,
    category: 'heritage',
    categoryLabel: 'Culture & heritage',
    route: 'Cultural Triangle · Kandy · Ella · Yala · South Coast',
    description: 'A beautiful first introduction to Sri Lanka: ancient cities, tea country, wildlife and the sea.',
    highlights: 'Sigiriya, hill-country scenery, safari opportunities and a relaxing beach finish.',
    image: 'https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=1000&q=85',
    theme: {
      primary: '#1c583e',
      accent: '#2db879',
      bgGradient: 'linear-gradient(145deg, rgba(225, 248, 236, 0.92) 0%, rgba(205, 242, 226, 0.7) 50%, rgba(230, 249, 241, 0.85) 100%)',
      glowColor: 'rgba(45, 184, 121, 0.28)',
      cardBorder: 'rgba(45, 184, 121, 0.35)',
      tagBg: '#d8f6e7',
      tagColor: '#144d34',
      mistEffect: true,
    },
  },
  {
    id: 'ancient-kingdoms',
    name: 'Ancient Kingdoms',
    days: 7,
    category: 'heritage',
    categoryLabel: 'Culture & heritage',
    route: 'Anuradhapura · Polonnaruwa · Sigiriya · Dambulla · Kandy',
    description: 'Walk through the island’s remarkable heritage, sacred places and centuries-old stories.',
    highlights: 'Historic capitals, Sigiriya, cave temples and the Temple of the Tooth.',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1000&q=85',
    theme: {
      primary: '#853e28',
      accent: '#d87046',
      bgGradient: 'linear-gradient(145deg, rgba(254, 240, 233, 0.94) 0%, rgba(246, 228, 218, 0.75) 50%, rgba(252, 244, 238, 0.9) 100%)',
      glowColor: 'rgba(216, 112, 70, 0.26)',
      cardBorder: 'rgba(216, 112, 70, 0.35)',
      tagBg: '#fae3d7',
      tagColor: '#78331e',
      mistEffect: true,
    },
  },
  {
    id: 'leopards-elephants-whales',
    name: 'Leopards, Elephants & Whales',
    days: 9,
    category: 'wildlife',
    categoryLabel: 'Wildlife & nature',
    route: 'Minneriya · Udawalawe · Yala · Mirissa',
    description: 'An unforgettable nature-focused journey across Sri Lanka’s wild places.',
    highlights: 'Guided safaris and seasonal whale watching; sightings are never guaranteed.',
    image: 'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&w=1000&q=85',
    theme: {
      primary: '#24533a',
      accent: '#c99632',
      bgGradient: 'linear-gradient(145deg, rgba(230, 247, 237, 0.92) 0%, rgba(242, 243, 220, 0.7) 50%, rgba(225, 246, 238, 0.88) 100%)',
      glowColor: 'rgba(201, 150, 50, 0.24)',
      cardBorder: 'rgba(201, 150, 50, 0.35)',
      tagBg: '#fef1d6',
      tagColor: '#5c430e',
      waterEffect: true,
    },
  },
  {
    id: 'southern-shores-in-luxury',
    name: 'Southern Shores in Luxury',
    days: 8,
    category: 'coast',
    categoryLabel: 'Coast & slow living',
    route: 'Galle · Unawatuna · Mirissa',
    description: 'Slow coastal days, boutique stays, beautiful beaches and the charm of Galle Fort.',
    highlights: 'Galle Fort, beach escapes, spa time and seasonal ocean experiences.',
    image: 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1000&q=85',
    theme: {
      primary: '#145d74',
      accent: '#26a9c9',
      bgGradient: 'linear-gradient(145deg, rgba(223, 248, 252, 0.94) 0%, rgba(210, 243, 247, 0.72) 50%, rgba(232, 251, 253, 0.9) 100%)',
      glowColor: 'rgba(38, 169, 201, 0.3)',
      cardBorder: 'rgba(38, 169, 201, 0.38)',
      tagBg: '#d7f5fa',
      tagColor: '#0e4a5d',
      waterEffect: true,
    },
  },
  {
    id: 'waves-and-rapids',
    name: 'Waves & Rapids',
    days: 8,
    category: 'adventure',
    categoryLabel: 'Adventure',
    route: 'Kitulgala · Weligama · Mirissa',
    description: 'An active island adventure combining river thrills and the rhythm of the ocean.',
    highlights: 'Rafting, abseiling, surf lessons and seasonal whale watching.',
    image: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1000&q=85',
    theme: {
      primary: '#125464',
      accent: '#1fb59d',
      bgGradient: 'linear-gradient(145deg, rgba(220, 249, 246, 0.94) 0%, rgba(206, 244, 237, 0.72) 50%, rgba(228, 251, 248, 0.9) 100%)',
      glowColor: 'rgba(31, 181, 157, 0.3)',
      cardBorder: 'rgba(31, 181, 157, 0.38)',
      tagBg: '#d3f7f0',
      tagColor: '#0c473c',
      waterEffect: true,
    },
  },
  {
    id: 'family-island-discovery',
    name: 'Family Island Discovery',
    days: 10,
    category: 'family',
    categoryLabel: 'Family',
    route: 'Custom islandwide family route',
    description: 'A thoughtfully paced adventure for families, with room for little explorers.',
    highlights: 'Wildlife, scenic train journeys, beach time and family-friendly stays.',
    image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1000&q=85',
    theme: {
      primary: '#225d43',
      accent: '#39b884',
      bgGradient: 'linear-gradient(145deg, rgba(229, 248, 239, 0.94) 0%, rgba(246, 242, 222, 0.7) 50%, rgba(235, 249, 243, 0.9) 100%)',
      glowColor: 'rgba(57, 184, 132, 0.28)',
      cardBorder: 'rgba(57, 184, 132, 0.35)',
      tagBg: '#daf5e8',
      tagColor: '#164d35',
      mistEffect: true,
    },
  },
  {
    id: 'the-pekoe-trail-walk',
    name: 'The Pekoe Trail Walk',
    days: 8,
    category: 'adventure',
    categoryLabel: 'Adventure',
    route: 'Kandy · Tea Country · Ella',
    description: 'Explore the island’s beautiful tea country on selected walking trails.',
    highlights: 'Tea estates, villages, mountain landscapes and comfortable stays.',
    image: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1000&q=85',
    theme: {
      primary: '#194d33',
      accent: '#269e65',
      bgGradient: 'linear-gradient(145deg, rgba(224, 247, 235, 0.95) 0%, rgba(210, 242, 225, 0.75) 50%, rgba(230, 250, 240, 0.9) 100%)',
      glowColor: 'rgba(38, 158, 101, 0.3)',
      cardBorder: 'rgba(38, 158, 101, 0.4)',
      tagBg: '#d6f4e4',
      tagColor: '#11442b',
      mistEffect: true,
    },
  },
  {
    id: 'sunrise-on-two-rocks',
    name: 'Sunrise on Two Rocks',
    days: 4,
    category: 'heritage',
    categoryLabel: 'Culture & heritage',
    route: 'Sigiriya · Pidurangala · Minneriya',
    description: 'A short escape into sunrise views, heritage and village life.',
    highlights: 'Pidurangala sunrise, Sigiriya and seasonal elephant gatherings.',
    image: 'https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=1000&q=85',
    theme: {
      primary: '#8c4b26',
      accent: '#df7939',
      bgGradient: 'linear-gradient(145deg, rgba(254, 243, 233, 0.94) 0%, rgba(248, 231, 219, 0.72) 50%, rgba(253, 245, 238, 0.9) 100%)',
      glowColor: 'rgba(223, 121, 57, 0.28)',
      cardBorder: 'rgba(223, 121, 57, 0.38)',
      tagBg: '#fae6d9',
      tagColor: '#703314',
      mistEffect: true,
    },
  },
  {
    id: 'india-to-island-express',
    name: 'India to Island Express',
    days: 5,
    category: 'family',
    categoryLabel: 'Family',
    route: 'Colombo · Kandy · Nuwara Eliya',
    description: 'A refreshing short getaway with city discoveries and cool hill-country air.',
    highlights: 'Colombo, Kandy, tea country and flexible hotel options.',
    image: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1000&q=85',
    theme: {
      primary: '#1d554a',
      accent: '#289d87',
      bgGradient: 'linear-gradient(145deg, rgba(225, 248, 244, 0.94) 0%, rgba(212, 244, 238, 0.7) 50%, rgba(231, 250, 246, 0.9) 100%)',
      glowColor: 'rgba(40, 157, 135, 0.28)',
      cardBorder: 'rgba(40, 157, 135, 0.36)',
      tagBg: '#d8f6f0',
      tagColor: '#12453b',
      mistEffect: true,
    },
  },
];
