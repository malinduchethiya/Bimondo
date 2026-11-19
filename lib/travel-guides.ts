import { createImageRef, type CmsImageRef } from '@/lib/cms-defaults';

export type TravelGuideCategoryId =
  | 'planning'
  | 'itineraries'
  | 'comparisons'
  | 'regions';

export interface TravelGuideSection {
  id: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  note?: string;
}

export interface CmsTravelGuide {
  id: string;
  slug: string;
  title: string;
  eyebrow: string;
  category: TravelGuideCategoryId;
  categoryLabel: string;
  readingTime: string;
  summary: string;
  intro: string;
  sections: TravelGuideSection[];
  relatedDestinationSlugs: string[];
  relatedTourIds: string[];
  seoTitle?: string;
  seoDescription?: string;
  imageRef: CmsImageRef;
  publishedAt: string;
  updatedAt: string;
  visible?: boolean;
  order?: number;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export const TRAVEL_GUIDE_CATEGORIES: {
  id: 'all' | TravelGuideCategoryId;
  label: string;
}[] = [
  { id: 'all', label: 'All Travel Guides' },
  { id: 'planning', label: 'Seasonal & Practical Planning' },
  { id: 'itineraries', label: 'Sample Itineraries' },
  { id: 'comparisons', label: 'Destination Comparisons' },
  { id: 'regions', label: 'Regional Deep Dives' },
];

export const DEFAULT_TRAVEL_GUIDES: CmsTravelGuide[] = [
  {
    id: 'guide-best-time-to-visit-sri-lanka',
    slug: 'best-time-to-visit-sri-lanka',
    title: 'Best Time to Visit Sri Lanka: Monsoon Seasons & Regional Guide',
    eyebrow: 'SEASONAL PLANNING',
    category: 'planning',
    categoryLabel: 'Seasonal & Practical Planning',
    readingTime: '6 min read',
    summary:
      'Sri Lanka is a year-round destination shaped by two opposing monsoons. Learn which coasts, national parks, and hill country trails suit each month of the year.',
    intro:
      'Because Sri Lanka is influenced by two alternating monsoon systems, dry sunshine can almost always be found on at least one side of the island. Matching your route to regional seasons—rather than waiting for a single island-wide window—is the key to planning a comfortable private journey.',
    sections: [
      {
        id: 'west-south-hills',
        heading: 'December to April: West Coast, South Coast & Hill Country',
        paragraphs: [
          'From December through April, the southwest and southern coastlines generally experience calmer seas and drier weather. This is the primary season for coastal stays in Bentota, Galle, Unawatuna, Weligama, Mirissa, and Tangalle, as well as offshore whale-watching excursions from Mirissa.',
          'The central highlands—including Kandy, Nuwara Eliya, Haputale, Ella, and Horton Plains—are typically clearest in the early mornings from January to May, making this window ideal for scenic train journeys, tea estate walks, and stages along The Pekoe Trail. The traditional pilgrimage season to Adam’s Peak also runs from December to May.',
        ],
        bullets: [
          'Southwest & South Coast beaches: Bentota, Galle, Unawatuna, Weligama, Mirissa, Tangalle',
          'Highland hiking & viewpoints: Ella, Haputale, Horton Plains & World’s End, Nuwara Eliya',
          'Cultural Triangle heritage sites: Sigiriya, Polonnaruwa, Anuradhapura, Dambulla',
          'Northwest marine & lagoon season: Kalpitiya Bar Reef snorkelling and seasonal dolphin trips (Nov–Apr)',
        ],
      },
      {
        id: 'east-coast-cultural-triangle',
        heading: 'May to September: East Coast & Dry-Zone Wildlife',
        paragraphs: [
          'When the southwest monsoon brings rain and rougher swells to the south and west coasts, the east coast enters its long dry season. Calm bays at Trincomalee, Nilaveli, Pigeon Island, and Pasikudah offer inviting conditions for swimming and snorkelling, while Arugam Bay becomes the island’s premier warm-water surfing destination from May to October.',
          'In the interior dry zone, receding water levels concentrate elephants around major ancient reservoirs—particularly during the seasonal Elephant Gathering at Minneriya National Park and nearby Kaudulla between July and October.',
        ],
        bullets: [
          'East Coast surf & calm bays: Arugam Bay (May–Oct), Trincomalee & Nilaveli, Pasikudah',
          'Dry-zone wildlife viewing: Minneriya National Park, Wilpattu National Park, Kumana National Park',
          'Cultural festivals: Kandy Esala Perahera typically takes place in July or August (lunar calendar)',
          'Kite surfing in Kalpitiya: Main southwest wind window from May to October (and Dec–Mar)',
        ],
      },
      {
        id: 'inter-monsoon-months',
        heading: 'October & November: Inter-Monsoon Shoulder Months',
        paragraphs: [
          'October and November bring inter-monsoon weather across Sri Lanka, characterised by sunny mornings and afternoon or evening showers rather than continuous rain. Landscapes are lush and green, visitor numbers at major heritage sites are lower, and private road journeys remain very rewarding with flexible daily timing.',
        ],
        note: 'Weather patterns, sea conditions, and wildlife movements across Sri Lanka vary naturally from year to year and are never guaranteed. Bimondo Travels adapts daily departure times and regional routing to local conditions.',
      },
    ],
    relatedDestinationSlugs: [
      'sigiriya',
      'ella',
      'mirissa',
      'arugam-bay',
      'minneriya-national-park',
      'trincomalee',
    ],
    relatedTourIds: [
      'ceylon-grand-circuit',
      'east-coast-surf-and-wilderness',
      'southern-shores-in-luxury',
      'australian-adventure-combo',
    ],
    seoTitle: 'Best Time to Visit Sri Lanka: Month-by-Month Monsoon & Coast Guide | Bimondo Travels',
    seoDescription:
      'Plan around Sri Lanka’s two monsoon seasons. Discover the best months for the South Coast, East Coast, Hill Country, Cultural Triangle, and national park safaris.',
    imageRef: createImageRef('', 'Best Time to Visit Sri Lanka'),
    publishedAt: '2026-01-15',
    updatedAt: '2026-03-01',
    visible: true,
    order: 1,
  },
  {
    id: 'guide-best-places-to-visit-sri-lanka',
    slug: 'best-places-to-visit-in-sri-lanka',
    title: 'Best Places to Visit in Sri Lanka: Heritage, Highlands, Wildlife & Coast',
    eyebrow: 'DESTINATION OVERVIEW',
    category: 'regions',
    categoryLabel: 'Regional Deep Dives',
    readingTime: '7 min read',
    summary:
      'An essential overview of Sri Lanka’s top destinations across four distinct landscapes: ancient kingdoms, misty tea hills, wildlife reserves, and tropical beaches.',
    intro:
      'Few islands pack as much geographic and cultural variety into compact driving distances as Sri Lanka. Within a single 7 to 14-day private tour, you can walk through 2,000-year-old capitals, cross misty tea estates by train, track wildlife on a jeep safari, and unwind inside a 17th-century coastal fort.',
    sections: [
      {
        id: 'cultural-triangle',
        heading: 'Ancient Kingdoms & The Cultural Triangle',
        paragraphs: [
          'Northern-central Sri Lanka preserves the island’s earliest royal cities and sacred Buddhist monuments. Sigiriya’s 5th-century rock citadel and water gardens stand alongside Pidurangala Rock, while Dambulla houses five historic cave temples filled with murals and Buddha statues.',
          'Further afield, the sprawling ruins of Anuradhapura and the medieval stone carvings of Polonnaruwa reveal centuries of hydraulic engineering and temple architecture. To the south of the triangle, Kandy serves as the living cultural capital, centred on the Temple of the Sacred Tooth Relic and its serene lake.',
        ],
        bullets: [
          'Sigiriya & Pidurangala Rock — dramatic granite outcrops and ancient royal gardens',
          'Dambulla Cave Temple — UNESCO-listed painted rock sanctuaries',
          'Anuradhapura & Polonnaruwa — monumental stupas, monasteries, and royal palaces',
          'Kandy — sacred heritage, Peradeniya Royal Botanical Gardens, and Kandyan arts',
        ],
      },
      {
        id: 'hill-country',
        heading: 'The Central Highlands & Tea Country',
        paragraphs: [
          'Rising above the lowland plains, the hill country trades tropical heat for crisp mountain air, emerald tea terraces, and cascading waterfalls. Nuwara Eliya retains colonial-era gardens and Gregory Lake, while Haputale overlooks dramatic southern escarpments from Lipton’s Seat.',
          'Ella has become a favourite base for gentle and moderate hikes—including Little Adam’s Peak, Nine Arches Bridge, and Ella Rock—while Horton Plains National Park offers the sweeping cliff drop at World’s End and Baker’s Falls. Travellers seeking wilder trails head to the Knuckles Mountain Range or selected stages of The Pekoe Trail.',
        ],
        bullets: [
          'Ella — Nine Arches Bridge, Little Adam’s Peak, tea hills, and waterfalls',
          'Nuwara Eliya & Haputale — working tea estates, viewpoints, and cool highland stays',
          'Horton Plains & World’s End — cloud-forest plateau and dramatic escarpment',
          'Knuckles Mountain Range — remote valleys, cloud forest trails, and rural villages',
        ],
      },
      {
        id: 'wildlife-rainforest',
        heading: 'National Parks & Rainforest Sanctuaries',
        paragraphs: [
          'Sri Lanka’s diverse ecosystems range from dry-zone scrubland and natural lakes to UNESCO-listed lowland rainforest. Yala National Park and Wilpattu National Park are prized for leopard habitat, sloth bears, and rich birdlife, while Udawalawe National Park and Minneriya National Park are celebrated for wild elephant herds.',
          'In the wet southwest interior, Sinharaja Rainforest protects dense canopy biodiversity and endemic bird species, explored on foot with experienced local trackers.',
        ],
      },
      {
        id: 'beaches-coastal-towns',
        heading: 'Coastlines, Surf Towns & Colonial Forts',
        paragraphs: [
          'On the southwest and south coast, Bentota, Galle, Unawatuna, Weligama, Mirissa, and Tangalle offer boutique beach stays, beginner-friendly surf bays, and Galle Fort’s cobbled ramparts. On the east coast, Trincomalee, Pasikudah, and Arugam Bay shine from May to October, while Kalpitiya on the northwest peninsula attracts kite surfers and marine enthusiasts.',
        ],
      },
    ],
    relatedDestinationSlugs: [
      'sigiriya',
      'kandy',
      'ella',
      'yala-national-park',
      'udawalawe-national-park',
      'galle',
    ],
    relatedTourIds: [
      'ceylon-grand-circuit',
      'culture-and-coast',
      'family-island-discovery',
      'leopards-elephants-whales',
    ],
    seoTitle: 'Best Places to Visit in Sri Lanka: Complete Regional Guide | Bimondo Travels',
    seoDescription:
      'Explore the best places to visit in Sri Lanka across the Cultural Triangle, Hill Country, National Parks, and South & East Coasts with Bimondo Travels.',
    imageRef: createImageRef('', 'Best Places to Visit in Sri Lanka'),
    publishedAt: '2026-01-18',
    updatedAt: '2026-03-01',
    visible: true,
    order: 2,
  },
  {
    id: 'guide-sri-lanka-7-day-itinerary',
    slug: 'sri-lanka-7-day-itinerary',
    title: 'Sri Lanka 7-Day Itinerary: Balanced Heritage, Highlands & Coast',
    eyebrow: 'ONE-WEEK ROUTE GUIDE',
    category: 'itineraries',
    categoryLabel: 'Sample Itineraries',
    readingTime: '6 min read',
    summary:
      'How to structure a realistic, unhurried 7-day private route across Sri Lanka without spending every day on the road.',
    intro:
      'One week in Sri Lanka is enough to experience the island’s defining contrasts—ancient heritage, misty hill country, and a relaxing coastal finish—provided the route stays focused rather than trying to cover every corner of the island. Below is a practical private-chauffeur blueprint that keeps daily driving times comfortable.',
    sections: [
      {
        id: 'days-1-2',
        heading: 'Days 1–2: Arrival & The Cultural Triangle (Sigiriya & Dambulla)',
        paragraphs: [
          'After arriving at Bandaranaike International Airport, drive inland to the Cultural Triangle (typically 3.5 to 4.5 hours depending on traffic and stops). Settle into a tranquil eco-lodge or boutique hotel near Sigiriya or Habarana.',
          'On Day 2, climb Sigiriya Rock Fortress early in the morning before midday heat builds, or hike neighbouring Pidurangala Rock for sunrise views facing Sigiriya. Spend the afternoon visiting Dambulla Cave Temple or taking a late-afternoon elephant safari in Minneriya National Park (depending on seasonal herd movements).',
        ],
      },
      {
        id: 'day-3',
        heading: 'Day 3: Kandy — Sacred Heritage & Botanical Gardens',
        paragraphs: [
          'Travel south to Kandy, Sri Lanka’s historic hill capital. Visit the Royal Botanical Gardens in Peradeniya in the afternoon and attend the evening ritual at the Temple of the Sacred Tooth Relic, followed by a traditional Kandyan cultural performance.',
        ],
      },
      {
        id: 'days-4-5',
        heading: 'Days 4–5: Tea Country & Ella (Scenic Highland Rail)',
        paragraphs: [
          'Ascend into the central highlands past waterfalls and working tea plantations near Nuwara Eliya, then board the scenic hill-country train segment into Ella while your private chauffeur transfers your luggage by road.',
          'In Ella, enjoy morning walks to Little Adam’s Peak and Nine Arches Bridge, with time to relax overlooking the valley or explore nearby waterfalls.',
        ],
      },
      {
        id: 'days-6-7',
        heading: 'Days 6–7: South or Southwest Coast (Galle / Bentota) & Departure',
        paragraphs: [
          'Descend from the hills toward the southern coastline. Option A: Stop en route for a half-day jeep safari in Udawalawe National Park before continuing to Galle Fort and Unawatuna or Bentota. Option B: Head straight to Bentota for two calm nights by the ocean and a river safari before using the Southern Expressway for a smooth airport transfer on Day 7.',
        ],
        note: 'All Bimondo Travels routes are sample frameworks. Exact durations, hotels, train ticket availability, and daily pacing are confirmed individually during consultation.',
      },
    ],
    relatedDestinationSlugs: [
      'sigiriya',
      'dambulla',
      'kandy',
      'nuwara-eliya',
      'ella',
      'bentota',
      'galle',
    ],
    relatedTourIds: [
      'hills-and-beaches-for-friends',
      'little-explorers',
      'kandy-and-the-hill-capital',
      'waves-and-rapids',
    ],
    seoTitle: 'Sri Lanka 7-Day Itinerary: Realistic Private Tour Route | Bimondo Travels',
    seoDescription:
      'A practical 7-day Sri Lanka itinerary covering Sigiriya, Kandy, Ella tea country, optional Udawalawe safari, and the Southwest Coast with private transport.',
    imageRef: createImageRef('', 'Sri Lanka 7-Day Itinerary'),
    publishedAt: '2026-01-22',
    updatedAt: '2026-03-01',
    visible: true,
    order: 3,
  },
  {
    id: 'guide-sri-lanka-10-day-itinerary',
    slug: 'sri-lanka-10-day-itinerary',
    title: 'Sri Lanka 10-Day Itinerary: Culture, Tea Hills, Safari & Beach',
    eyebrow: 'TEN-DAY ROUTE GUIDE',
    category: 'itineraries',
    categoryLabel: 'Sample Itineraries',
    readingTime: '7 min read',
    summary:
      'A well-paced 10-day Sri Lanka circuit designed for first-time international visitors seeking ancient capitals, highland scenery, wildlife safaris, and unhurried beach days.',
    intro:
      'Ten days is widely considered the sweet spot for a first visit to Sri Lanka. With three extra nights compared to a one-week break, you can include both the Cultural Triangle and a dedicated wildlife park—such as Yala or Udawalawe—while still finishing with three restful nights by the Indian Ocean.',
    sections: [
      {
        id: 'days-1-3',
        heading: 'Days 1–3: Cultural Triangle (Sigiriya, Polonnaruwa & Dambulla)',
        paragraphs: [
          'Spend two or three nights in the Cultural Triangle to explore without rushing. Pair an early climb up Sigiriya Rock Fortress with a guided cycling or vehicle tour of the medieval ruins of Polonnaruwa, plus a visit to Dambulla’s cave sanctuaries. Between June and October, add an afternoon safari in Minneriya National Park.',
        ],
      },
      {
        id: 'days-4-5',
        heading: 'Days 4–5: Kandy & The Tea Highlands',
        paragraphs: [
          'Continue south to Kandy for the Temple of the Tooth Relic and Peradeniya Botanical Gardens. The following morning, wind up through lush tea estates around Nuwara Eliya or Hatton, stopping at a working tea factory to learn how Ceylon tea is harvested and processed.',
        ],
      },
      {
        id: 'day-6',
        heading: 'Day 6: Scenic Train to Ella & Mountain Trails',
        paragraphs: [
          'Experience one of Asia’s most scenic rail rides through misty valleys and tea terraces toward Ella. Walk to Nine Arches Bridge and Little Adam’s Peak, or—for keen hikers—schedule an early morning excursion to Horton Plains & World’s End before descending toward the south.',
        ],
      },
      {
        id: 'day-7',
        heading: 'Day 7: Wildlife Safari (Yala or Udawalawe National Park)',
        paragraphs: [
          'Drive south into Sri Lanka’s dry-zone wildlife belt. Choose Udawalawe National Park for reliable elephant herds in open grasslands and a visit to the Elephant Transit Home, or Yala National Park for dramatic coastal scrubland, leopards, sloth bears, and rich birdlife.',
        ],
      },
      {
        id: 'days-8-10',
        heading: 'Days 8–10: Galle Fort & Coastal Relaxation',
        paragraphs: [
          'Conclude your journey on the southern coast from November to April (Galle, Unawatuna, Mirissa, or Tangalle), walking the sunset ramparts of UNESCO-listed Galle Fort and enjoying unhurried seaside mornings. If travelling from May to September, reverse the coastal leg toward Trincomalee or Pasikudah on the dry east coast before returning to Colombo for your departure flight.',
        ],
      },
    ],
    relatedDestinationSlugs: [
      'sigiriya',
      'polonnaruwa',
      'kandy',
      'ella',
      'yala-national-park',
      'udawalawe-national-park',
      'galle',
      'mirissa',
    ],
    relatedTourIds: [
      'culture-and-coast',
      'family-island-discovery',
      'ceylon-grand-circuit',
      'leopards-elephants-whales',
    ],
    seoTitle: 'Sri Lanka 10-Day Itinerary: Culture, Highlands, Safari & Coast | Bimondo Travels',
    seoDescription:
      'Plan an ideal 10-day Sri Lanka private itinerary combining Sigiriya, Polonnaruwa, Kandy, Ella train, Yala or Udawalawe safari, and Galle beaches.',
    imageRef: createImageRef('', 'Sri Lanka 10-Day Itinerary'),
    publishedAt: '2026-01-25',
    updatedAt: '2026-03-01',
    visible: true,
    order: 4,
  },
  {
    id: 'guide-sigiriya-vs-pidurangala',
    slug: 'sigiriya-vs-pidurangala',
    title: 'Sigiriya vs Pidurangala Rock: Which Climb Should You Choose?',
    eyebrow: 'DESTINATION COMPARISON',
    category: 'comparisons',
    categoryLabel: 'Destination Comparisons',
    readingTime: '5 min read',
    summary:
      'Comparing Sri Lanka’s two iconic neighbouring granite formations: archaeology, difficulty, sunrise views, crowds, and how to visit both in one trip.',
    intro:
      'Standing just over a kilometre apart in the heart of Sri Lanka’s Cultural Triangle, Sigiriya (Lion Rock) and Pidurangala Rock are often compared as an either-or choice. In reality, they offer completely different experiences—and many Bimondo Travels guests enjoy both during a two-night stay in the region.',
    sections: [
      {
        id: 'sigiriya-highlights',
        heading: 'Sigiriya Rock Fortress: UNESCO World Heritage & Royal Engineering',
        paragraphs: [
          'Sigiriya is far more than a viewpoint. Built in the 5th century AD under King Kashyapa, the complex encompasses symmetrical royal water gardens, boulder gardens, ancient cave frescoes, the polished Mirror Wall, the monumental Lion’s Paw terrace, and summit palace foundations.',
          'The ascent follows maintained stone steps and metal staircases with handrails. While there are roughly 1,200 steps in total, the route is well-defined and suitable for most travellers taking steady breaks in the cool early morning.',
        ],
        bullets: [
          'Best for: History, UNESCO archaeology, frescoes, royal gardens, and maintained staircases',
          'Best timing: Right at opening (early morning) to beat midday heat and bus crowds',
          'Terrain: Paved paths, stone steps, and steel walkways with handrails',
        ],
      },
      {
        id: 'pidurangala-highlights',
        heading: 'Pidurangala Rock: Panoramic Views Looking Back at Sigiriya',
        paragraphs: [
          'Pidurangala is an ancient forest monastery rock directly north of Sigiriya. Its lower trail passes a historic cave temple and a large reclining brick Buddha statue before ascending through shaded forest.',
          'The final few minutes require scrambling over natural boulders to reach the broad, flat summit. The reward is one of Sri Lanka’s finest panoramas—an unobstructed view of Sigiriya Rock rising dramatically out of the green jungle canopy.',
        ],
        bullets: [
          'Best for: Sunrise photography with Sigiriya in the frame, natural trail atmosphere',
          'Terrain: Forest steps followed by a short rocky boulder scramble near the summit (sturdy closed footwear recommended)',
          'Dress etiquette: Because the lower trail passes an active temple precinct, shoulders and knees must be covered near the temple entrance',
        ],
      },
      {
        id: 'how-to-choose',
        heading: 'Should You Climb One or Both?',
        paragraphs: [
          'If you only have time for one climb and want Sri Lanka’s defining archaeological monument, choose Sigiriya Rock Fortress. If you love sunrise photography and active trails—or are staying two nights in the Sigiriya area—climb Pidurangala at sunrise on one morning and explore Sigiriya Fortress at opening time on the next.',
        ],
      },
    ],
    relatedDestinationSlugs: ['sigiriya', 'pidurangala-rock', 'dambulla', 'polonnaruwa'],
    relatedTourIds: ['ancient-kingdoms', 'ceylon-grand-circuit', 'culture-and-coast'],
    seoTitle: 'Sigiriya vs Pidurangala Rock: Difficulty, Views & Timing Guide | Bimondo Travels',
    seoDescription:
      'Compare Sigiriya Rock Fortress and Pidurangala Rock in Sri Lanka: archaeological significance, trail difficulty, sunrise photography, and how to visit both.',
    imageRef: createImageRef('', 'Sigiriya vs Pidurangala Rock'),
    publishedAt: '2026-02-01',
    updatedAt: '2026-03-01',
    visible: true,
    order: 5,
  },
  {
    id: 'guide-yala-vs-udawalawe-safari',
    slug: 'yala-vs-udawalawe-safari',
    title: 'Yala vs Udawalawe National Park: Choosing the Right Sri Lanka Safari',
    eyebrow: 'WILDLIFE COMPARISON',
    category: 'comparisons',
    categoryLabel: 'Destination Comparisons',
    readingTime: '6 min read',
    summary:
      'An honest comparison of Sri Lanka’s two most visited southern national parks—wildlife habitats, elephant herds, leopard terrain, crowds, and family suitability.',
    intro:
      'Travellers routing between Sri Lanka’s hill country and the southern coast almost always pass close to both Udawalawe National Park and Yala National Park. Choosing the right reserve—or pairing them—depends on what kind of landscape, wildlife focus, and safari atmosphere you prefer.',
    sections: [
      {
        id: 'yala-overview',
        heading: 'Yala National Park: Diverse Habitats & Leopard Country',
        paragraphs: [
          'Bordering the Indian Ocean in the southeast, Yala features dramatic landscapes combining scrub jungle, rocky outcrops, freshwater lagoons, and windswept coastline. It is widely renowned for its population of Sri Lankan leopards, alongside sloth bears, elephants, spotted deer, crocodiles, wild boar, and coastal birdlife.',
          'Because Block 1 is Sri Lanka’s most famous safari sector, it can get busy during peak months. Starting early at dawn or exploring quieter adjacent blocks with an ethical, unhurried naturalist driver makes a meaningful difference.',
        ],
        bullets: [
          'Standout habitat: Coastal lagoons, granite rock formations, and dry monsoon forest',
          'Key species: Sri Lankan leopard, sloth bear, Asian elephant, mugger crocodile, waterbirds',
          'Seasonal note: Sections of Yala traditionally close for dry-season maintenance during parts of September and October',
        ],
      },
      {
        id: 'udawalawe-overview',
        heading: 'Udawalawe National Park: Open Grasslands & Elephant Herds',
        paragraphs: [
          'Built around the Udawalawe Reservoir, Udawalawe National Park features wide-open grasslands and marshes where visibility is excellent. It is one of the finest places in Sri Lanka to observe wild Asian elephant herds—often mothers and calves—in a calmer, less crowded safari setting.',
          'Families especially appreciate pairing a morning jeep safari with a respectful visit to the nearby Elephant Transit Home, where orphaned calves are rehabilitated before eventual release back into the wild.',
        ],
        bullets: [
          'Standout habitat: Open savannah-like grasslands, reservoir shores, and scattered teak groves',
          'Key species: Large wild elephant herds, water buffalo, sambar deer, peacocks, raptors, and wetland birds',
          'Best for: Families, elephant lovers, shorter transfers between Ella and the southwest coast, and quieter trails',
        ],
      },
      {
        id: 'ethical-safari-note',
        heading: 'Also Consider Wilpattu & Minneriya',
        paragraphs: [
          'If your route explores the north-west or Cultural Triangle, Wilpattu National Park offers Sri Lanka’s largest wilderness of natural sand-rimmed lakes (villus) with far fewer vehicles, while Minneriya National Park hosts the famous dry-season Elephant Gathering between July and October.',
        ],
        note: 'All wildlife in Sri Lanka’s national parks is completely wild and free-roaming; specific animal sightings depend on nature and are never guaranteed. Bimondo Travels works with responsible safari drivers who obey park speed limits and never crowd animals.',
      },
    ],
    relatedDestinationSlugs: [
      'yala-national-park',
      'udawalawe-national-park',
      'wilpattu-national-park',
      'minneriya-national-park',
    ],
    relatedTourIds: [
      'leopards-elephants-whales',
      'little-explorers',
      'wilpattu-wilderness',
      'ceylon-grand-circuit',
    ],
    seoTitle: 'Yala vs Udawalawe Safari: Which Sri Lanka National Park Is Better? | Bimondo Travels',
    seoDescription:
      'Compare Yala National Park and Udawalawe National Park for Sri Lanka wildlife safaris: leopards vs elephants, crowds, seasons, and family-friendly routing.',
    imageRef: createImageRef('', 'Yala vs Udawalawe National Park'),
    publishedAt: '2026-02-06',
    updatedAt: '2026-03-01',
    visible: true,
    order: 6,
  },
  {
    id: 'guide-sri-lanka-cultural-triangle',
    slug: 'sri-lanka-cultural-triangle-guide',
    title: 'Sri Lanka Cultural Triangle Guide: Ancient Capitals & Sacred Sites',
    eyebrow: 'REGIONAL DEEP DIVE',
    category: 'regions',
    categoryLabel: 'Regional Deep Dives',
    readingTime: '6 min read',
    summary:
      'How to explore Anuradhapura, Polonnaruwa, Sigiriya, Dambulla, Mihintale, and Kandy—base towns, visiting order, and temple etiquette.',
    intro:
      'Anchored by the historic cities of Anuradhapura in the north, Polonnaruwa in the east, and Kandy in the south—with Sigiriya and Dambulla at its geographic heart—Sri Lanka’s Cultural Triangle preserves more than two millennia of royal cities, irrigation engineering, and living Buddhist heritage.',
    sections: [
      {
        id: 'key-sites',
        heading: 'The Five Pillars of the Cultural Triangle',
        paragraphs: [
          'Each site represents a distinct chapter in Sri Lankan history, so visiting them with a knowledgeable local guide brings the ruins vividly to life:',
        ],
        bullets: [
          'Anuradhapura & Mihintale — Sri Lanka’s first ancient capital, colossal brick stupas, monastic complexes, and the revered Jaya Sri Maha Bodhi tree.',
          'Polonnaruwa — The 12th-century medieval capital celebrated for compact, well-preserved royal palaces, the Quadrangle, and the granite Buddha sculptures of Gal Vihara.',
          'Sigiriya & Pidurangala — Dramatic 5th-century rock fortress gardens paired with neighbouring monastery trails.',
          'Dambulla Cave Temple — Five historic hilltop cave sanctuaries housing ancient statues and vibrant ceiling murals.',
          'Kandy — The last royal highland kingdom, home to the sacred Temple of the Tooth Relic and vibrant traditional arts.',
        ],
      },
      {
        id: 'where-to-base',
        heading: 'Smart Routing & Base Locations',
        paragraphs: [
          'Rather than changing hotels every single night, most travellers base themselves centrally in Sigiriya, Habarana, or Dambulla for 2 to 3 nights. From this central hub, Polonnaruwa, Sigiriya, Pidurangala, Dambulla, and Minneriya National Park are all comfortable day excursions.',
          'If Anuradhapura and Wilpattu National Park are on your itinerary, adding 1 to 2 nights near Anuradhapura keeps driving times relaxed before heading south toward Kandy.',
        ],
      },
      {
        id: 'etiquette-tips',
        heading: 'Practical Advice & Sacred Site Etiquette',
        paragraphs: [
          'Start sightseeing early in the morning (around 07:00–08:00) when temperatures are pleasant and stone courtyards are still cool underfoot. Carry light cotton clothing that covers shoulders and knees for all sacred sites, bring easy-to-remove footwear plus a pair of socks for warm temple paving, and never pose with your back turned directly toward a Buddha statue.',
        ],
      },
    ],
    relatedDestinationSlugs: [
      'anuradhapura',
      'polonnaruwa',
      'sigiriya',
      'dambulla',
      'mihintale',
      'kandy',
    ],
    relatedTourIds: [
      'ancient-kingdoms',
      'sacred-sri-lanka',
      'ceylon-grand-circuit',
      'culture-and-coast',
    ],
    seoTitle: 'Sri Lanka Cultural Triangle Guide: Anuradhapura, Polonnaruwa, Sigiriya & Kandy | Bimondo Travels',
    seoDescription:
      'Plan your visit to Sri Lanka’s Cultural Triangle: Anuradhapura, Polonnaruwa, Sigiriya, Dambulla, Mihintale, and Kandy—with routing tips and temple etiquette.',
    imageRef: createImageRef('', 'Sri Lanka Cultural Triangle Guide'),
    publishedAt: '2026-02-12',
    updatedAt: '2026-03-01',
    visible: true,
    order: 7,
  },
  {
    id: 'guide-sri-lanka-travel-tips-first-time-visitors',
    slug: 'sri-lanka-travel-tips-first-time-visitors',
    title: 'Sri Lanka Travel Tips for First-Time Visitors: Transport, Packing & Etiquette',
    eyebrow: 'PRACTICAL ADVICE',
    category: 'planning',
    categoryLabel: 'Seasonal & Practical Planning',
    readingTime: '6 min read',
    summary:
      'Essential practical guidance for planning a smooth first journey to Sri Lanka: travel times, private chauffeur-guides, clothing, currency, connectivity, and responsible travel.',
    intro:
      'Sri Lanka is welcoming, compact, and deeply rewarding for first-time travellers—especially when you understand a few local realities around road pacing, climate zones, and cultural customs. Here is what our Battaramulla operations team shares with guests before they fly.',
    sections: [
      {
        id: 'distances-and-transport',
        heading: 'Understanding Sri Lankan Travel Times & Private Transport',
        paragraphs: [
          'On a map, Sri Lanka looks small, yet winding highland roads and bustling village corridors mean road speeds are slower than European or Australian motorways. A 120-kilometre transfer in the hill country can easily take 3.5 to 4 hours—which is why realistic daily pacing matters.',
          'Travelling with a dedicated air-conditioned vehicle and licensed local chauffeur-guide lets you stop freely at tea viewpoints, spice gardens, or scenic rail stations, while your luggage travels securely ahead when you board the Kandy-to-Ella highland train.',
        ],
      },
      {
        id: 'packing-climate',
        heading: 'Packing for Multiple Climates in One Trip',
        paragraphs: [
          'Even within a single week, you can move from humid coastal sunshine in Colombo or Galle to cool, misty evenings in Nuwara Eliya, Haputale, or Horton Plains.',
        ],
        bullets: [
          'Breathable cotton or linen clothing for coastal and Cultural Triangle heat',
          'A light fleece, sweater, and compact rain jacket for the hill country and sudden tropical showers',
          'Modest layers covering shoulders and knees for Buddhist temples, Hindu kovils, and sacred heritage sites',
          'Sturdy closed walking shoes for Sigiriya, Pidurangala, Ella trails, Horton Plains, and Sinharaja Rainforest',
          'Reef-safe sun protection, mosquito repellent, and a refillable water bottle to reduce single-use plastic',
        ],
      },
      {
        id: 'visas-currency-connectivity',
        heading: 'Visas, Currency & Practical Preparation',
        paragraphs: [
          'International travellers should verify current Sri Lanka Electronic Travel Authorization (ETA) or visa requirements through official Sri Lankan immigration channels before departure. The local currency is the Sri Lankan Rupee (LKR); major hotels and restaurants in tourist hubs accept international cards, while carrying modest cash in LKR is helpful for small cafés, local markets, and tipping.',
          'Before arrival, Bimondo Travels sends every guest a personalised pre-arrival briefing covering regional weather, dress etiquette, packing reminders, and our 24-hour local assistance contacts.',
        ],
      },
      {
        id: 'responsible-travel',
        heading: 'Travelling Respectfully & Sustainably',
        paragraphs: [
          'Remove hats and shoes before entering temple grounds, ask permission before photographing individuals, and avoid single-use plastics in national parks and coastal zones. Choosing vetted local guides, family-run dining spots, and ethical wildlife operators ensures your journey uplifts Sri Lankan communities while protecting natural habitats.',
        ],
      },
    ],
    relatedDestinationSlugs: [
      'colombo',
      'kandy',
      'sigiriya',
      'ella',
      'galle',
      'udawalawe-national-park',
    ],
    relatedTourIds: [
      'culture-and-coast',
      'ceylon-grand-circuit',
      'family-island-discovery',
      'india-to-island-express',
    ],
    seoTitle: 'Sri Lanka Travel Tips for First-Time Visitors: Complete Planning Guide | Bimondo Travels',
    seoDescription:
      'Practical Sri Lanka travel tips for first-time visitors: realistic driving times, private chauffeur tours, packing for hill country & coast, temple etiquette, and sustainability.',
    imageRef: createImageRef('', 'Sri Lanka Travel Tips for First-Time Visitors'),
    publishedAt: '2026-02-18',
    updatedAt: '2026-03-01',
    visible: true,
    order: 8,
  },
];

export function findTravelGuideBySlug(
  guides: CmsTravelGuide[],
  slug: string
): CmsTravelGuide | undefined {
  const clean = (slug || '').trim().toLowerCase();
  if (!clean) return undefined;
  return guides.find(
    (g) => g.slug.toLowerCase() === clean || g.id.toLowerCase() === clean
  );
}
