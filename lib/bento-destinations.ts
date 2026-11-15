export interface BentoTheme {
  frameBg: string;
  cardBg: string;
  cardAltBg: string;
  descGradient: string;
  highlightBg: string;
  ctaGradient: string;
  navBg: string;
  navHoverBg: string;
  glowColor: string;
}

export interface BentoDestination {
  id: string;
  name: string;
  subtitle: string;
  headline: string;
  description: string;
  ctaText: string;
  ctaTourId: string;
  heroImage: string;
  pathwayImage: string;
  exploreTitle: string;
  exploreText: string;
  tallSceneImage: string;
  stayTitle: string;
  stayText: string;
  natureImage: string;
  cuisineTitle: string;
  cuisineText: string;
  cuisineImage: string;
  theme: BentoTheme;
}

export const BENTO_DESTINATIONS: BentoDestination[] = [
  {
    id: 'sigiriya',
    name: 'Sigiriya',
    subtitle: 'Sri Lanka · Culture and Heritage',
    headline: 'Ancient Capitals & Rock Fortresses',
    description:
      'Explore Sri Lanka’s UNESCO-listed Cultural Triangle at your own pace—climbing Sigiriya Rock Fortress and Pidurangala at dawn, and visiting Dambulla, Anuradhapura, and Polonnaruwa with your private guide.',
    ctaText: 'EXPLORE HERITAGE',
    ctaTourId: 'ancient-kingdoms',
    heroImage: '',
    pathwayImage: '',
    exploreTitle: 'Highlights',
    exploreText:
      'Sigiriya Rock Fortress, Pidurangala sunrise views, Dambulla Cave Temple, Anuradhapura & Polonnaruwa.',
    tallSceneImage: '',
    stayTitle: 'Accommodation',
    stayText: 'Four-star hotels, boutique properties & five-star luxury resorts',
    natureImage: '',
    cuisineTitle: 'Season & Pace',
    cuisineText: 'Private journeys paced around early morning climbs & quiet hours',
    cuisineImage: '',
    theme: {
      frameBg: '#160c09',
      cardBg: '#361b15',
      cardAltBg: '#2b1510',
      descGradient: 'linear-gradient(180deg, #27130f 0%, #48241c 100%)',
      highlightBg: '#8e360f',
      ctaGradient: 'linear-gradient(90deg, #632108 0%, #a84214 100%)',
      navBg: '#24120e',
      navHoverBg: '#3d1f18',
      glowColor: 'rgba(176, 74, 26, 0.42)',
    },
  },
  {
    id: 'kandy',
    name: 'Kandy',
    subtitle: 'Sri Lanka · Sacred Hill Capital',
    headline: 'Living Tradition & Tea Country Gateway',
    description:
      'Visit the sacred Temple of the Tooth in Kandy, walk beside Kandy Lake, and begin the scenic highland transition toward Nuwara Eliya, tea estates, and the opening stages of The Pekoe Trail.',
    ctaText: 'DISCOVER KANDY',
    ctaTourId: 'ceylon-grand-circuit',
    heroImage: '',
    pathwayImage: '',
    exploreTitle: 'Highlights',
    exploreText:
      'Temple of the Sacred Tooth, Kandyan cultural heritage & gateway to The Pekoe Trail.',
    tallSceneImage: '',
    stayTitle: 'Accommodation',
    stayText: 'Handpicked hillside boutique stays & four-to-five-star hotels',
    natureImage: '',
    cuisineTitle: 'Experience',
    cuisineText: 'Respectful temple visits with proper dress & local cultural context',
    cuisineImage: '',
    theme: {
      frameBg: '#091519',
      cardBg: '#152c33',
      cardAltBg: '#102228',
      descGradient: 'linear-gradient(180deg, #102126 0%, #1e3f47 100%)',
      highlightBg: '#8c3d19',
      ctaGradient: 'linear-gradient(90deg, #63270c 0%, #a8481d 100%)',
      navBg: '#0e1d22',
      navHoverBg: '#1b3740',
      glowColor: 'rgba(168, 72, 29, 0.35)',
    },
  },
  {
    id: 'galle',
    name: 'Galle',
    subtitle: 'Sri Lanka · Sea and Sand Escapes',
    headline: 'Historic Ramparts & Southern Shores',
    description:
      'Walk the historic walls of Galle Fort and unwind along the southern coast at Unawatuna, Mirissa, and Weligama—combining heritage architecture, surf bays, and coastal relaxation.',
    ctaText: 'EXPLORE THE COAST',
    ctaTourId: 'southern-shores-in-luxury',
    heroImage: '',
    pathwayImage: '',
    exploreTitle: 'Highlights',
    exploreText:
      'Galle Fort heritage walks, Unawatuna & Mirissa beaches, and seasonal Weligama surf.',
    tallSceneImage: '',
    stayTitle: 'Accommodation',
    stayText: 'Coastal boutique properties, four-star hotels & five-star luxury resorts',
    natureImage: '',
    cuisineTitle: 'Seasonality',
    cuisineText: 'South & West Coast best from November to April',
    cuisineImage: '',
    theme: {
      frameBg: '#140c0a',
      cardBg: '#321c17',
      cardAltBg: '#261511',
      descGradient: 'linear-gradient(180deg, #24130f 0%, #42241d 100%)',
      highlightBg: '#943a12',
      ctaGradient: 'linear-gradient(90deg, #682509 0%, #ad4617 100%)',
      navBg: '#20110e',
      navHoverBg: '#361e19',
      glowColor: 'rgba(173, 70, 23, 0.4)',
    },
  },
  {
    id: 'ella',
    name: 'Ella',
    subtitle: 'Sri Lanka · Hill Country and Hiking',
    headline: 'Tea Trails, Mountain Ridges & Scenic Trains',
    description:
      'Experience Sri Lanka’s cooler hill country across Nuwara Eliya and Ella—walking selected stages of The Pekoe Trail, hiking Little Adam’s Peak, Ella Rock, and Horton Plains to World’s End.',
    ctaText: 'EXPLORE HILL COUNTRY',
    ctaTourId: 'the-pekoe-trail-walk',
    heroImage: '',
    pathwayImage: '',
    exploreTitle: 'Highlights',
    exploreText:
      'The Pekoe Trail stages, Horton Plains & World’s End, Little Adam’s Peak & Ella Rock.',
    tallSceneImage: '',
    stayTitle: 'Accommodation',
    stayText: 'Hill country boutique stays & four-to-five-star mountain retreats',
    natureImage: '',
    cuisineTitle: 'Journey Style',
    cuisineText: 'Guided hill walks, scenic rail journeys & tea estate visits',
    cuisineImage: '',
    theme: {
      frameBg: '#120d0a',
      cardBg: '#2e1d15',
      cardAltBg: '#231610',
      descGradient: 'linear-gradient(180deg, #21140e 0%, #3d261b 100%)',
      highlightBg: '#8c3b12',
      ctaGradient: 'linear-gradient(90deg, #612508 0%, #a34516 100%)',
      navBg: '#1d120d',
      navHoverBg: '#332017',
      glowColor: 'rgba(163, 69, 22, 0.38)',
    },
  },
  {
    id: 'yala',
    name: 'Yala',
    subtitle: 'Sri Lanka · Wildlife and Nature',
    headline: 'Responsible Safaris & National Parks',
    description:
      'Set out on private safaris across Yala, Udawalawe, Wilpattu, and Minneriya with operators who respect park rules and animal welfare—paired with rainforest walks in UNESCO-listed Sinharaja.',
    ctaText: 'EXPLORE WILDLIFE',
    ctaTourId: 'leopards-elephants-whales',
    heroImage: '',
    pathwayImage: '',
    exploreTitle: 'Highlights',
    exploreText:
      'Yala, Udawalawe & Wilpattu safaris, Minneriya elephant gathering & Sinharaja rainforest.',
    tallSceneImage: '',
    stayTitle: 'Accommodation',
    stayText: 'Safari lodges, four-star hotels & five-star luxury wilderness resorts',
    natureImage: '',
    cuisineTitle: 'Wilderness Ethics',
    cuisineText: 'Respectful viewing distances; wildlife sightings depend on nature',
    cuisineImage: '',
    theme: {
      frameBg: '#140c08',
      cardBg: '#331e14',
      cardAltBg: '#26160f',
      descGradient: 'linear-gradient(180deg, #24150e 0%, #44281a 100%)',
      highlightBg: '#913c11',
      ctaGradient: 'linear-gradient(90deg, #662709 0%, #aa4715 100%)',
      navBg: '#20120c',
      navHoverBg: '#382116',
      glowColor: 'rgba(170, 71, 21, 0.42)',
    },
  },
];
