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
    subtitle: 'Sri Lanka, The Royal Sky Citadel',
    headline: 'Where History Meets Tranquility',
    description:
      'Wander through centuries-old royal water gardens, climb past 5th-century frescoes, and breathe in the beauty of misty jungle canopies from the summit of Lion Rock.',
    ctaText: 'FIND YOUR WONDER',
    ctaTourId: 'ancient-kingdoms',
    heroImage:
      'https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=1200&q=85',
    pathwayImage:
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=85',
    exploreTitle: 'Explore',
    exploreText:
      'Sigiriya Rock Fortress & Pidurangala, with its ancient royal water gardens and sky terraces.',
    tallSceneImage:
      'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=85',
    stayTitle: 'Stay',
    stayText: 'Luxury eco-pavilion with private plunge pool',
    natureImage:
      'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=85',
    cuisineTitle: 'Cuisine',
    cuisineText: 'Traditional clay-pot village dining',
    cuisineImage:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=85',
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
    subtitle: 'Sri Lanka, Sacred Hill Capital',
    headline: 'Where Sacred Heritage Meets Mountain Mist',
    description:
      'Stroll alongside the tranquil lake at dusk, witness evening pooja rhythms at the Temple of the Sacred Tooth, and breathe in cool highland tea estates and cloud forests.',
    ctaText: 'FIND YOUR SERENITY',
    ctaTourId: 'ceylon-grand-circuit',
    heroImage:
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=85',
    pathwayImage:
      'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=800&q=85',
    exploreTitle: 'Explore',
    exploreText:
      'Temple of the Sacred Tooth Relic, Royal Botanical Gardens & misty Knuckles ridge trails.',
    tallSceneImage:
      'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=800&q=85',
    stayTitle: 'Stay',
    stayText: 'Heritage tea planter’s bungalow with valley views',
    natureImage:
      'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=85',
    cuisineTitle: 'Cuisine',
    cuisineText: 'Single-estate Ceylon high tea & spices',
    cuisineImage:
      'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=85',
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
    subtitle: 'Sri Lanka, Colonial Coastal Splendour',
    headline: 'Where Old-World Charm Meets the Ocean',
    description:
      'Wander narrow cobblestone streets framed by 17th-century Dutch ramparts, browse artisan boutiques, and watch golden-hour waves along palm-fringed southern shores.',
    ctaText: 'EXPLORE THE COAST',
    ctaTourId: 'southern-shores-in-luxury',
    heroImage:
      'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=85',
    pathwayImage:
      'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=800&q=85',
    exploreTitle: 'Explore',
    exploreText:
      'UNESCO Galle Fort bastions, historic lighthouse & secret southern coves.',
    tallSceneImage:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=85',
    stayTitle: 'Stay',
    stayText: 'Restored fort courtyard mansion with private pool',
    natureImage:
      'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=85',
    cuisineTitle: 'Cuisine',
    cuisineText: 'Coastal lagoon crab & saffron coconut curry',
    cuisineImage:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=85',
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
    subtitle: 'Sri Lanka, The Highland Cloud Ridge',
    headline: 'Where Emerald Valleys Meet Slow Journeys',
    description:
      'Watch the iconic blue train cross the Nine Arch Bridge through morning mist, hike scenic Pekoe tea trails to Little Adam’s Peak, and wake up above the clouds.',
    ctaText: 'EXPERIENCE ELLA',
    ctaTourId: 'the-pekoe-trail-walk',
    heroImage:
      'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1200&q=85',
    pathwayImage:
      'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=800&q=85',
    exploreTitle: 'Explore',
    exploreText:
      'Nine Arch Bridge, Ravana Falls cascade & The Pekoe Trail mountain stages.',
    tallSceneImage:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=85',
    stayTitle: 'Stay',
    stayText: 'Boutique mountain chalet overlooking Ella Gap',
    natureImage:
      'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=800&q=85',
    cuisineTitle: 'Cuisine',
    cuisineText: 'Warm hopper feasts & wild kitul treacle',
    cuisineImage:
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=85',
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
    subtitle: 'Sri Lanka, The Untamed Safari Coast',
    headline: 'Where Wild Encounters Meet Golden Shores',
    description:
      'Track elusive leopards and wild elephant herds across sun-dappled scrub forest and coastal lagoons by day, then unwind beside the Indian Ocean under starlit skies.',
    ctaText: 'VENTURE ON SAFARI',
    ctaTourId: 'leopards-elephants-whales',
    heroImage:
      'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&w=1200&q=85',
    pathwayImage:
      'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=85',
    exploreTitle: 'Explore',
    exploreText:
      'Private guided safaris in Yala & Kumana, home to leopards, elephants and sloth bears.',
    tallSceneImage:
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=85',
    stayTitle: 'Stay',
    stayText: 'Luxury tented safari camp by the ocean dunes',
    natureImage:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=85',
    cuisineTitle: 'Cuisine',
    cuisineText: 'Lantern-lit bush dining under the stars',
    cuisineImage:
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=85',
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
