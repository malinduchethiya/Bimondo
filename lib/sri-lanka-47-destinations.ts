import type {
  CmsDestination,
  DestinationCategoryId,
  DestinationDiningOption,
  StaggerSlideVariant,
} from '@/lib/cms-defaults';

export interface DestinationCategoryMeta {
  id: 'all' | DestinationCategoryId;
  label: string;
  shortLabel: string;
  description: string;
}

export const DESTINATION_CATEGORY_FILTERS: DestinationCategoryMeta[] = [
  {
    id: 'all',
    label: 'All Destinations',
    shortLabel: 'All',
    description:
      'All 47 Sri Lankan destinations across heritage kingdoms, misty highlands, wildlife parks, seasonal coastlines, and islands.',
  },
  {
    id: 'culture-heritage',
    label: 'Culture & Heritage',
    shortLabel: 'Culture & Heritage',
    description:
      'Ancient royal capitals, UNESCO cave temples, rock fortresses, monastic forest ruins, and living sacred sites.',
  },
  {
    id: 'hill-country-hiking',
    label: 'Hill Country & Hiking',
    shortLabel: 'Hill Country & Hiking',
    description:
      'Misty Ceylon tea estates, cloud-forest plateaus, mountain passes, scenic highland rail routes, and guided walking trails.',
  },
  {
    id: 'wildlife-nature',
    label: 'Wildlife & Nature',
    shortLabel: 'Wildlife & Nature',
    description:
      'National park safaris, seasonal wild elephant gatherings, leopard habitats, and primary tropical rainforest reserves.',
  },
  {
    id: 'beaches-coast',
    label: 'Beaches & Coast',
    shortLabel: 'Beaches & Coast',
    description:
      'South, west, and east coast bays matched to the island’s two monsoon seasons for calm swimming, reef snorkelling, and coastal stays.',
  },
  {
    id: 'adventure',
    label: 'Adventure',
    shortLabel: 'Adventure',
    description:
      'Warm-water surf breaks, Kelani River white-water rafting, Kalpitiya kite surfing, scuba diving, and mountain trekking.',
  },
  {
    id: 'cities-local',
    label: 'Cities & Local Experiences',
    shortLabel: 'Cities & Local Experiences',
    description:
      'Historic port towns, northern islands, lagoon communities, culinary walks, and cultural encounters.',
  },
];

interface RawCatalogDestination {
  id: string;
  slug: string;
  entryNumber: number;
  name: string;
  region: 'culture' | 'hills' | 'coast' | 'wildlife' | 'colombo';
  regionLabel: string;
  categories: DestinationCategoryId[];
  season: string;
  tagline: string;
  description: string;
  overview: string;
  highlights: string[];
  thingsToSee: string[];
  thingsToDo: string[];
  hikingTrails?: string[];
  seasonalActivities: string[];
  festivals?: string[];
  diningOptions?: DestinationDiningOption[];
  specialConsiderations: string[];
  relatedTourIds: string[];
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  staggerVariant?: StaggerSlideVariant;
  featuredOnHome?: boolean;
  order: number;
}

const RAW_47_DESTINATIONS: RawCatalogDestination[] = [
  // ===========================================================================
  // ANCIENT HERITAGE AND CULTURE (10)
  // ===========================================================================
  {
    id: 'sigiriya-cultural-triangle',
    slug: 'sigiriya',
    entryNumber: 1,
    name: 'Sigiriya',
    region: 'culture',
    regionLabel: 'Cultural Triangle · North Central Province',
    categories: ['culture-heritage', 'adventure'],
    season: 'Year-round · Drier months Jan – Sep',
    tagline: 'Fifth-century sky fortress, water gardens & ancient frescoes',
    description:
      'Rising dramatically above the dry-zone plains of Sri Lanka’s Cultural Triangle, the 5th-century UNESCO World Heritage rock fortress of Sigiriya combines royal citadel ruins, symmetrical water gardens, and celebrated cave frescoes.',
    overview:
      'Built by King Kashyapa I in the 5th century AD, Sigiriya—the Lion Rock—is one of Asia’s most remarkable archaeological landscapes. Visitors walk through symmetrically engineered moats, boulder gardens, and hydraulic fountain terraces before ascending past the famous Sigiriya damsels frescoes and the polished Mirror Wall to the Lion Paws terrace and summit palace foundations.',
    highlights: [
      'UNESCO-listed 5th-century Lion Rock citadel & summit palace ruins',
      'Symmetrical royal water gardens, boulder gardens & Mirror Wall',
      'Ancient frescoes & panoramic views across the Cultural Triangle',
    ],
    thingsToSee: [
      'Sigiriya Rock Fortress Summit — Palace foundations, rock-cut cisterns, and sweeping 360-degree views across forest and tanks',
      'Water Gardens & Boulder Gardens — Ancient hydraulic engineering with gravity-fed fountains that still operate during rainy months',
      'Sigiriya Frescoes & Mirror Wall — 5th-century paintings sheltered in a rock gallery above the spiral staircase and ancient inscriptions',
      'Lion Paws Terrace — Monumental brick and plaster paws flanking the final staircase to the upper citadel',
      'Sigiriya Museum — Archaeological exhibits detailing excavation history, hydraulic systems, and regional artifacts',
    ],
    thingsToDo: [
      'Early morning climb of Sigiriya Rock Fortress to avoid midday heat and crowds',
      'Guided archaeological walk through the royal water, terraced, and boulder gardens',
      'Cycling or walking along quiet village lanes and irrigation tanks surrounding the rock',
      'Birdwatching in the Sigiriya sanctuary forest edge at dawn or late afternoon',
    ],
    hikingTrails: [
      'Sigiriya Citadel Ascent — Stepped pathway and metal stairways through boulder gardens, fresco gallery, and Lion Paws terrace to the summit plateau',
      'Pidurangala Neighbouring Trail — Adjacent forest-and-boulder walk offering a direct view back toward the face of Sigiriya Rock',
    ],
    seasonalActivities: [
      'January to September generally offers drier mornings for climbing the exposed summit steps',
      'May to September brings stronger afternoon winds at the summit; early starts at opening time are recommended year-round',
      'July to October pairs well with afternoon wildlife safaris at nearby Minneriya or Kaudulla reservoirs',
    ],
    festivals: [
      'Poson Poya (June) — White-clad pilgrims visit regional temples across the North Central plains',
      'Sinhala & Tamil New Year (Mid-April) — Traditional village games and seasonal sweets in surrounding Cultural Triangle communities',
    ],
    diningOptions: [
      {
        name: 'Kenoli Restaurant',
        cuisine: 'Traditional Sri Lankan Rice & Curry',
        contact: 'Sigiriya Road, Inamaluwa / Sigiriya',
        notes: 'Casual family-run spot known for wood-fired clay-pot curries.',
        verified: false,
      },
      {
        name: 'Pradeep Restaurant',
        cuisine: 'Sri Lankan & Fresh Fruit Juices',
        contact: 'Sigiriya Village',
        notes: 'Relaxed local dining near the fortress approach.',
        verified: false,
      },
    ],
    specialConsiderations: [
      'Begin the climb early (around 6:30–7:00 AM) to avoid strong midday heat on the exposed rock steps.',
      'Photography is strictly prohibited inside the frescoes pocket; follow archaeological department signage.',
      'Remain quiet around wild rock bee (giant honeybee) nests along the cliff face and follow ranger instructions if warning signs are posted.',
    ],
    relatedTourIds: [
      'ancient-kingdoms',
      'sunrise-on-two-rocks',
      'ceylon-grand-circuit',
      'culture-and-coast',
      'australian-adventure-combo',
    ],
    tags: [
      'sigiriya',
      'lion rock',
      'cultural triangle',
      'unesco',
      'fortress',
      'frescoes',
      'heritage',
      'climbing',
    ],
    seoTitle: 'Sigiriya Travel Guide | Lion Rock Fortress & Cultural Triangle',
    seoDescription:
      'Plan your visit to Sigiriya in Sri Lanka’s Cultural Triangle: Lion Rock fortress highlights, water gardens, seasonal advice, visitor tips, and private tours.',
    staggerVariant: 'tall-up',
    featuredOnHome: true,
    order: 1,
  },
  {
    id: 'kandy-sacred-capital',
    slug: 'kandy',
    entryNumber: 2,
    name: 'Kandy',
    region: 'culture',
    regionLabel: 'Central Highlands · Sacred Hill Capital',
    categories: ['culture-heritage', 'hill-country-hiking', 'cities-local'],
    season: 'Year-round · Drier months Dec – Apr',
    tagline: 'Sacred Temple of the Tooth, royal lake & gateway to the tea hills',
    description:
      'Set around a tranquil central lake framed by forested hills, Kandy was the last royal capital of the Sinhalese kings and remains the spiritual heart of Sri Lanka—home to the UNESCO-listed Temple of the Sacred Tooth Relic.',
    overview:
      'Kandy bridges Sri Lanka’s dry-zone ancient kingdoms and the cool central tea highlands. Centered on Kandy Lake and the Sri Dalada Maligawa (Temple of the Sacred Tooth Relic), the city preserves Kandyan architecture, ritual drumming, classical dance, the Royal Botanical Gardens at Peradeniya, and the starting stage of The Pekoe Trail.',
    highlights: [
      'Temple of the Sacred Tooth Relic (Sri Dalada Maligawa)',
      'Royal Botanical Gardens in Peradeniya & Udawattakele Forest Sanctuary',
      'Kandy Lake walks & starting point of the scenic hill-country train',
    ],
    thingsToSee: [
      'Sri Dalada Maligawa (Temple of the Sacred Tooth Relic) — Revered Buddhist temple complex housing the sacred tooth relic alongside royal audience halls',
      'Kandy Lake (Kiri Muhuda) — Historic artificial lake created in 1807 by King Sri Wickrama Rajasinghe right beside the temple precinct',
      'Royal Botanical Gardens, Peradeniya — 147-acre landscaped gardens renowned for its Orchid House, giant Java fig, and palm avenues',
      'Udawattakele Forest Sanctuary — Historic royal forest reserve rising above the temple with shaded walking trails and birdlife',
      'Three Temples Loop (Gadaladeniya, Lankatilaka & Embekke) — 14th-century shrines on the outskirts of Kandy celebrated for stone and wood carvings',
    ],
    thingsToDo: [
      'Attend an evening or morning puja ceremony at the Temple of the Sacred Tooth with a licensed cultural guide',
      'Stroll the shaded avenues and spice collections of Peradeniya Royal Botanical Gardens',
      'Walk Stage 1 of The Pekoe Trail from Hanthana above Kandy through historic tea estates',
      'Board the scenic highland train from Kandy or Peradeniya Junction toward Nuwara Eliya and Ella',
    ],
    hikingTrails: [
      'Hanthana Mountain Range & Pekoe Trail Stage 1 — Scenic ridge and tea-estate walk starting near the Ceylon Tea Museum in Hanthana',
      'Udawattakele Sanctuary Forest Walk — Gentle shaded nature trail through canopy forest above Kandy Lake',
    ],
    seasonalActivities: [
      'December to April offers crisp mornings and pleasant conditions for walking Hanthana and exploring outdoor gardens',
      'July or August features the historic Kandy Esala Perahera procession over ten evenings',
    ],
    festivals: [
      'Kandy Esala Perahera (July or August) — One of Asia’s most celebrated Buddhist pageants featuring traditional Kandyan dancers, drummers, and ceremonial processions',
      'Vesak Poya (May) — Lantern displays and illuminated pandals around Kandy Lake and temple streets',
    ],
    diningOptions: [
      {
        name: 'The Empire Cafe',
        cuisine: 'Sri Lankan & Cafe Classics',
        contact: '21 Temple Street, Kandy',
        notes: 'Historic colonial-era building directly beside the Temple of the Tooth precinct.',
        verified: false,
      },
      {
        name: 'Balaji Dosai',
        cuisine: 'South Indian Vegetarian',
        contact: 'DS Senanayake Veediya, Kandy',
        notes: 'Popular central spot for crisp dosas and vegetarian thalis.',
        verified: false,
      },
    ],
    specialConsiderations: [
      'Modest attire covering shoulders and knees is mandatory inside the Temple of the Sacred Tooth Relic; shoes and hats must be removed at the entrance.',
      'During the Esala Perahera season in July/August, central roads close in the evenings and advance hotel and seating arrangements are essential.',
    ],
    relatedTourIds: [
      'ancient-kingdoms',
      'kandy-and-the-hill-capital',
      'the-pekoe-trail-walk',
      'ceylon-grand-circuit',
      'india-to-island-express',
    ],
    tags: [
      'kandy',
      'temple of the tooth',
      'peradeniya',
      'botanical gardens',
      'pekoe trail',
      'esala perahera',
      'unesco',
      'culture',
    ],
    seoTitle: 'Kandy Travel Guide | Temple of the Tooth, Gardens & Highland Gateway',
    seoDescription:
      'Explore Kandy, Sri Lanka: Temple of the Sacred Tooth Relic, Peradeniya Botanical Gardens, Hanthana hikes, Esala Perahera insights, and private tours.',
    staggerVariant: 'compact-mid',
    featuredOnHome: true,
    order: 2,
  },
  {
    id: 'polonnaruwa',
    slug: 'polonnaruwa',
    entryNumber: 3,
    name: 'Polonnaruwa',
    region: 'culture',
    regionLabel: 'Cultural Triangle · North Central Province',
    categories: ['culture-heritage'],
    season: 'Year-round · Best May – Sep',
    tagline: 'Medieval Chola and Sinhalese royal capital beside Parakrama Samudra',
    description:
      'Sri Lanka’s 11th- to 13th-century medieval capital preserves compact, tree-shaded stone monuments, royal council chambers, lotus baths, and the rock-carved Buddha statues of Gal Vihara beside the vast Parakrama Samudra reservoir.',
    overview:
      'Following the decline of Anuradhapura, Polonnaruwa flourished as a royal and religious center under kings Vijayabahu I, Parakramabahu I, and Nissanka Malla. Because its archaeological park is compact and well-preserved, visitors can explore the Royal Palace complex, the Sacred Quadrangle (Dalada Maluwa), Rankoth Vehera, and the masterpieces of Gal Vihara by bicycle or private vehicle.',
    highlights: [
      'Gal Vihara rock-cut Buddha statues carved from a single granite face',
      'Sacred Quadrangle (Vatadage, Hatadage & Nissanka Lata Mandapaya)',
      'Parakrama Samudra ancient reservoir & Royal Palace ruins',
    ],
    thingsToSee: [
      'Gal Vihara (Uttararama) — Four serene Buddha images carved into a single granite wall, representing a pinnacle of Sinhalese stone sculpture',
      'Sacred Quadrangle (Dalada Maluwa) — Raised terrace housing the circular Polonnaruwa Vatadage, Hatadage, Atadage, and Gal Potha stone book',
      'Royal Palace of King Parakramabahu — Massive brick palace walls, audience hall with carved stone lions, and the Kumara Pokuna royal bath',
      'Rankoth Vehera & Lankatilaka Image House — Towering 12th-century brick stupa and dramatic high-walled image house containing a standing Buddha',
      'Parakrama Samudra (Sea of Parakrama) — Expansive ancient irrigation reservoir linking five tanks along the western edge of the city',
    ],
    thingsToDo: [
      'Cycle between the shaded archaeological zones of the ancient city with a licensed heritage guide',
      'Visit the Polonnaruwa Archaeological Museum beside the reservoir bund before touring the ruins',
      'Combine a morning heritage tour with an afternoon elephant safari in nearby Minneriya or Kaudulla National Park',
    ],
    seasonalActivities: [
      'Dry-season months from May to September offer clear skies for cycling through the archaeological park',
      'Early morning or late afternoon visits provide softer light and cooler stone surfaces at barefoot shrine areas',
    ],
    festivals: [
      'Poson Poya (June) — Devotees gather at Rankoth Vehera and Gal Vihara for commemorative observances',
    ],
    diningOptions: [
      {
        name: 'Priyamali Gedara',
        cuisine: 'Traditional Village Rice & Curry Buffet',
        contact: 'Polonnaruwa',
        notes: 'Set amid paddy fields; serves clay-pot lunches using local produce.',
        verified: false,
      },
    ],
    specialConsiderations: [
      'Bring socks for walking on sun-warmed stone pavements at the Sacred Quadrangle and Gal Vihara where footwear must be removed.',
      'Never pose with your back turned directly to Buddha statues when taking photographs, as this is considered disrespectful in Sri Lanka.',
    ],
    relatedTourIds: [
      'ancient-kingdoms',
      'ceylon-grand-circuit',
      'culture-and-coast',
    ],
    tags: [
      'polonnaruwa',
      'gal vihara',
      'vatadage',
      'cultural triangle',
      'unesco',
      'cycling',
      'ancient capital',
    ],
    seoTitle: 'Polonnaruwa Travel Guide | Gal Vihara, Sacred Quadrangle & Cycling',
    seoDescription:
      'Discover Polonnaruwa, Sri Lanka’s medieval UNESCO capital: Gal Vihara stone sculptures, the Sacred Quadrangle, cycling routes, and visitor etiquette.',
    featuredOnHome: false,
    order: 9,
  },
  {
    id: 'anuradhapura',
    slug: 'anuradhapura',
    entryNumber: 4,
    name: 'Anuradhapura',
    region: 'culture',
    regionLabel: 'Cultural Triangle · North Central Province',
    categories: ['culture-heritage'],
    season: 'Year-round · Best Apr – Sep',
    tagline: 'First ancient capital, colossal stupas & the sacred Jaya Sri Maha Bodhi',
    description:
      'Founded in the 4th century BC, Anuradhapura served as Sri Lanka’s royal and monastic capital for over a millennium—home to the sacred Jaya Sri Maha Bodhi tree and some of the largest brick stupas of the ancient world.',
    overview:
      'Across a vast parkland of ancient reservoirs (wewas) and banyan groves, Anuradhapura remains a living pilgrimage city. Devotees dressed in white gather daily around the Jaya Sri Maha Bodhi—grown from a southern branch of the historical Bodhi tree in India—and walk clockwise around the gleaming white dome of Ruwanwelisaya, alongside the monastic complexes of Jetavanaramaya and Abhayagiri.',
    highlights: [
      'Jaya Sri Maha Bodhi — Sacred fig tree documented since 288 BC',
      'Ruwanwelisaya, Jetavanaramaya & Abhayagiriya monumental stupas',
      'Isurumuniya rock temple, Kuttam Pokuna twin ponds & Samadhi Buddha',
    ],
    thingsToSee: [
      'Jaya Sri Maha Bodhi — Revered sacred fig tree tended continuously for over two thousand years',
      'Ruwanwelisaya Stupa — Iconic white stupa built by King Dutugemunu in the 2nd century BC, especially atmospheric at dusk',
      'Jetavanaramaya & Abhayagiri Dagobas — Colossal ancient brick stupas and vast monastic precincts',
      'Kuttam Pokuna (Twin Ponds) & Samadhi Buddha — Masterpieces of ancient hydrological engineering and serene stone sculpture',
      'Mihintale (Nearby) — Cradle of Buddhism in Sri Lanka located just east of Anuradhapura, accessed via a wide granite stairway',
    ],
    thingsToDo: [
      'Explore the sprawling sacred city by private vehicle or bicycle between monastic complexes',
      'Experience the evening puja atmosphere at Ruwanwelisaya and Jaya Sri Maha Bodhi',
      'Climb Mihintale at late afternoon for panoramic views over the North Central plains',
      'Pair Anuradhapura with a wildlife safari in nearby Wilpattu National Park',
    ],
    seasonalActivities: [
      'Year-round pilgrimage destination; mornings and evenings are the most comfortable times to explore',
      'June (Poson Poya) brings hundreds of thousands of pilgrims to Anuradhapura and Mihintale',
    ],
    festivals: [
      'Poson Poya (June) — Commemorates the introduction of Buddhism to Sri Lanka by Arahat Mahinda at Mihintale, with lanterns and almsgiving stalls (dansalas)',
    ],
    specialConsiderations: [
      'Anuradhapura is an active sacred site; wear white or modest clothing that covers shoulders and knees.',
      'Because sites are spread across a wide area, plan transfers between monument clusters rather than walking in midday heat.',
    ],
    relatedTourIds: [
      'ancient-kingdoms',
      'wilpattu-wilderness',
      'ceylon-grand-circuit',
    ],
    tags: [
      'anuradhapura',
      'sri maha bodhi',
      'ruwanwelisaya',
      'mihintale',
      'cultural triangle',
      'unesco',
      'buddhist heritage',
    ],
    seoTitle: 'Anuradhapura Travel Guide | Sacred Bodhi Tree, Stupas & Mihintale',
    seoDescription:
      'Explore Anuradhapura, Sri Lanka’s ancient sacred capital: Jaya Sri Maha Bodhi, Ruwanwelisaya, Jetavanaramaya, Mihintale, and private Cultural Triangle tours.',
    featuredOnHome: false,
    order: 10,
  },
  {
    id: 'dambulla',
    slug: 'dambulla',
    entryNumber: 5,
    name: 'Dambulla',
    region: 'culture',
    regionLabel: 'Cultural Triangle · Central Province',
    categories: ['culture-heritage'],
    season: 'Year-round',
    tagline: 'UNESCO Golden Cave Temple complex & vibrant central crossroads',
    description:
      'Carved beneath a towering granite overhang, the Dambulla Royal Cave Temple (Rangiri Dambulla Viharaya) is Sri Lanka’s best-preserved cave sanctuary, containing five shrines filled with over 150 Buddha statues and expansive ceiling murals.',
    overview:
      'Dating back to the 1st century BC under King Valagamba and embellished through the Polonnaruwa and Kandyan periods, Dambulla’s five cave shrines sit high on a rock ridge overlooking the Cultural Triangle. Beyond the caves, Dambulla is known for the tranquil ironwood forest of Popham’s Arboretum and the serene rose-quartz hills of Jathika Namal Uyana.',
    highlights: [
      'UNESCO Dambulla Cave Temple with 5 painted rock-shelter shrines',
      'Over 150 Buddha statues and centuries of Kandyan ceiling murals',
      'Popham’s Arboretum dry-zone forest walks & Namal Uyana ironwood reserve',
    ],
    thingsToSee: [
      'Devaraja Lena (Cave 1) — Houses a 14-meter reclining Buddha carved from solid rock',
      'Maharaja Lena (Cave 2) — The largest cave shrine, featuring a stupa surrounded by dozens of statues and natural spring water dripping from the ceiling',
      'Maha Aluth Viharaya (Cave 3) — 18th-century Kandyan artistry with intricate ceiling paintings',
      'Popham’s Arboretum — Dry-zone arboretum near Dambulla known for native trees, birds, and guided dusk walks',
      'Jathika Namal Uyana — Ancient ironwood forest and rose-quartz mountain reserve within driving distance of Dambulla',
    ],
    thingsToDo: [
      'Climb the rock walkway to the five Dambulla Cave shrines in the cool early morning or late afternoon',
      'Join a guided naturalist walk at Popham’s Arboretum',
      'Stop in Dambulla en route between Kandy and Sigiriya or Polonnaruwa',
    ],
    seasonalActivities: [
      'Accessible year-round as the main shrines are sheltered inside natural rock caves',
    ],
    specialConsiderations: [
      'The ticket counter is located at the base of the hill before climbing; ensure you obtain tickets before ascending the steps.',
      'Shoulders and knees must be covered, and shoes are removed before entering the upper temple courtyard.',
    ],
    relatedTourIds: [
      'ancient-kingdoms',
      'ceylon-grand-circuit',
      'culture-and-coast',
    ],
    tags: [
      'dambulla',
      'cave temple',
      'golden temple',
      'cultural triangle',
      'unesco',
      'murals',
    ],
    seoTitle: 'Dambulla Travel Guide | Royal Cave Temple & Cultural Triangle',
    seoDescription:
      'Visit Dambulla Cave Temple in Sri Lanka: explore the five UNESCO painted cave shrines, visitor tips, ticket counter advice, and Cultural Triangle itineraries.',
    featuredOnHome: false,
    order: 11,
  },
  {
    id: 'pidurangala-rock',
    slug: 'pidurangala-rock',
    entryNumber: 13,
    name: 'Pidurangala Rock',
    region: 'culture',
    regionLabel: 'Cultural Triangle · North Central Province',
    categories: ['culture-heritage', 'hill-country-hiking', 'adventure'],
    season: 'Year-round · Best Jan – Sep',
    tagline: 'Ancient forest monastery climb & iconic sunrise view facing Sigiriya',
    description:
      'Directly north of Sigiriya, Pidurangala Rock combines a quiet cave monastery at its base with a forested trail and short boulder scramble leading to a sweeping rock summit facing Lion Rock.',
    overview:
      'Historically linked to King Kashyapa, who relocated the monks of Sigiriya to a new monastery here in the 5th century, Pidurangala offers a more natural, rugged climb than its neighbour. Passing the whitewashed cave temple at the base and a large brick reclining Buddha near the upper ridge, hikers scramble through a short section of boulders onto an expansive open granite summit with unobstructed views of Sigiriya Rock Fortress.',
    highlights: [
      'Panoramic open-rock summit looking directly across at Sigiriya',
      'Ancient Pidurangala Raja Maha Vihara cave temple at the trailhead',
      'Historic brick reclining Buddha beneath the upper rock overhang',
    ],
    thingsToSee: [
      'Pidurangala Summit Plateau — Wide granite dome offering 360-degree views of Sigiriya Rock, Kandalama hills, and dry-zone forest',
      'Reclining Buddha Statue — Historic brick-and-plaster reclining Buddha sheltered beneath the cliff near the top of the steps',
      'Pidurangala Raja Maha Vihara — Cave temple at the base where visitors pass before ascending the forest steps',
    ],
    thingsToDo: [
      'Hike Pidurangala at dawn to watch sunrise illuminate the eastern face of Sigiriya Rock Fortress',
      'Climb in the late afternoon for golden-hour views over the forest canopy',
    ],
    hikingTrails: [
      'Pidurangala Summit Trail — Stepped forest path through shaded boulders followed by a 5–10 minute hands-and-feet scramble between large rocks to reach the summit plateau',
    ],
    seasonalActivities: [
      'Dry mornings from January to September offer the clearest sunrise visibility and dry footing on the final boulder scramble',
    ],
    specialConsiderations: [
      'Wear closed-toe walking shoes with good grip for the final boulder section near the summit.',
      'Because the trail passes through the Pidurangala temple grounds at the base, cover shoulders and knees when passing the shrine area.',
      'Bring a headlamp or torch if starting before dawn for sunrise.',
    ],
    relatedTourIds: [
      'sunrise-on-two-rocks',
      'ancient-kingdoms',
      'australian-adventure-combo',
    ],
    tags: [
      'pidurangala',
      'sigiriya view',
      'sunrise hike',
      'cultural triangle',
      'hiking',
    ],
    seoTitle: 'Pidurangala Rock Guide | Sunrise Hike & Sigiriya Viewpoint',
    seoDescription:
      'Complete guide to climbing Pidurangala Rock near Sigiriya: trail details, sunrise advice, temple dress code, and private Cultural Triangle itineraries.',
    featuredOnHome: false,
    order: 12,
  },
  {
    id: 'kataragama',
    slug: 'kataragama',
    entryNumber: 28,
    name: 'Kataragama',
    region: 'culture',
    regionLabel: 'Deep South · Uva / Southern Border',
    categories: ['culture-heritage', 'cities-local'],
    season: 'Year-round · Festival season Jul – Aug',
    tagline: 'Multi-faith pilgrimage town beside the Menik Ganga near Yala',
    description:
      'Set along the banks of the Menik Ganga river on the edge of Yala National Park, Kataragama is one of Sri Lanka’s most important multi-religious pilgrimage towns, revered by Buddhists, Hindus, Muslims, and the Indigenous Vedda community.',
    overview:
      'Unlike archaeological ruins, Kataragama is experienced through its living devotional energy. Each evening, pilgrims gather along the Menik Ganga before crossing into the Maha Devale precinct carrying fruit offerings, while nearby stands the ancient white dome of Kiri Vehera—one of the sixteen sacred Buddhist pilgrimage sites (Solosmasthana) of Sri Lanka.',
    highlights: [
      'Ruhunu Maha Kataragama Devale evening puja & fruit offerings',
      'Ancient Kiri Vehera Buddhist stupa dating back to the 3rd century BC',
      'Multi-faith shrine precinct along the sacred Menik Ganga river',
    ],
    thingsToSee: [
      'Ruhunu Maha Kataragama Devale — Sacred shrine dedicated to Kataragama Deviyo (Skanda/Murugan) where evening bell and oil-lamp rituals take place',
      'Kiri Vehera — Gleaming white ancient Buddhist stupa reached via a serene tree-lined avenue from the Devale',
      'Sella Kataragama & Wedihiti Kanda — Nearby shrines and hilltop viewpoint associated with the legends of Kataragama',
    ],
    thingsToDo: [
      'Attend the atmospheric evening puja at Kataragama Devale and walk along the illuminated path to Kiri Vehera',
      'Combine an evening cultural visit to Kataragama with a morning wildlife safari in Yala National Park',
    ],
    hikingTrails: [
      'Wedihiti Kanda (Peak of the Elders) — Pilgrim footpath ascending the hill overlooking Kataragama town and surrounding dry-zone forests',
    ],
    seasonalActivities: [
      'Visited year-round; evenings around 6:30 PM are the best time to witness temple rituals',
    ],
    festivals: [
      'Kataragama Esala Festival (July or August) — Two-week multi-faith pilgrimage festival featuring nightly processions, kavadi dancing, and traditional rituals',
    ],
    specialConsiderations: [
      'Dress modestly in white or light respectful clothing covering shoulders and knees; footwear is removed throughout the sacred precinct.',
      'During the July/August festival period, the town is extremely busy with pilgrims walking from across the island.',
    ],
    relatedTourIds: ['ceylon-grand-circuit', 'leopards-elephants-whales'],
    tags: [
      'kataragama',
      'kiri vehera',
      'pilgrimage',
      'devale',
      'yala',
      'culture',
    ],
    seoTitle: 'Kataragama Travel Guide | Kiri Vehera, Maha Devale & Esala Festival',
    seoDescription:
      'Visit sacred Kataragama near Yala National Park: evening puja rituals, Kiri Vehera stupa, Esala festival insights, and respectful visitor guidance.',
    featuredOnHome: false,
    order: 13,
  },
  {
    id: 'ritigala',
    slug: 'ritigala',
    entryNumber: 30,
    name: 'Ritigala',
    region: 'culture',
    regionLabel: 'Cultural Triangle · North Central Province',
    categories: ['culture-heritage', 'wildlife-nature', 'hill-country-hiking'],
    season: 'Year-round · Best Jan – Sep',
    tagline: 'Misty forest monastery ruins inside a Strict Natural Reserve',
    description:
      'Rising abruptly from the dry plains between Habarana and Anuradhapura, Ritigala combines an ancient forest monastery of the Pansukulika monks with a microclimate cloud-forest reserve rich in medicinal herbs.',
    overview:
      'Because Ritigala is higher than the surrounding plains, its upper ridges capture mist and moisture, creating a cool canopy sheltering rare plants and quiet stone ruins. Unlike the grand royal stupas of Anuradhapura, Ritigala’s 1st-century BC to 10th-century AD monastery was built for ascetic forest monks, featuring unadorned stone bridges, meditation pathways (padhanaghara), a monumental stone reservoir (Banda Pokuna), and carved urinal stones.',
    highlights: [
      'Shaded stone walkways, bridges & double-platform meditation halls',
      'Banda Pokuna polygonal stone-paved bathing reservoir',
      'Protected Strict Natural Reserve forest canopy & medicinal flora',
    ],
    thingsToSee: [
      'Banda Pokuna — Large polygonal stone-stepped reservoir engineered at the entrance to the monastic complex',
      'Stone Bridges & Paved Pathways — Smoothly cut granite walkways winding beneath giant forest trees',
      'Padhanaghara Meditation Platforms — Double-platform stone structures connected by monolithic bridges used by forest-dwelling monks',
    ],
    thingsToDo: [
      'Walk the peaceful shaded stone trails through the archaeological zone with a guide',
      'Combine Ritigala with Sigiriya or Anuradhapura for a quieter, off-the-beaten-path Cultural Triangle morning',
    ],
    hikingTrails: [
      'Ritigala Monastic Forest Walk — Stepped stone pathway winding through the lower archaeological reserve under dense forest canopy (note: the upper Strict Natural Reserve peak requires special conservation permission)',
    ],
    seasonalActivities: [
      'Cooler under the forest canopy year-round compared to open dry-zone ruins',
    ],
    specialConsiderations: [
      'Wild elephants inhabit the surrounding forest corridor; remain within the designated archaeological visitor zone and leave before dusk.',
    ],
    relatedTourIds: ['ancient-kingdoms', 'ceylon-grand-circuit'],
    tags: [
      'ritigala',
      'forest monastery',
      'cultural triangle',
      'archaeology',
      'nature reserve',
    ],
    seoTitle: 'Ritigala Travel Guide | Ancient Forest Monastery & Nature Reserve',
    seoDescription:
      'Explore Ritigala Strict Natural Reserve and ancient forest monastery in Sri Lanka’s Cultural Triangle: stone pathways, Banda Pokuna, and visitor tips.',
    featuredOnHome: false,
    order: 14,
  },
  {
    id: 'buduruwagala',
    slug: 'buduruwagala',
    entryNumber: 31,
    name: 'Buduruwagala',
    region: 'culture',
    regionLabel: 'Uva Province · Near Wellawaya',
    categories: ['culture-heritage'],
    season: 'Year-round',
    tagline: 'Tenth-century Mahayana rock-relief carvings in a tranquil forest glade',
    description:
      'Tucked inside a quiet dry-zone forest near Wellawaya between Ella and the south coast, Buduruwagala features seven monumental 9th- to 10th-century Mahayana Buddhist figures carved into an elephant-shaped granite cliff.',
    overview:
      'Meaning "Rock of Buddhist Sculptures," Buduruwagala is home to the tallest standing rock-cut Buddha image on the island (approximately 51 feet / 15.5 meters high), flanked by Avalokiteshvara and Vajrapani bodhisattva triads. Traces of original stucco and orange robe paint still cling to the central figure, and a small carved hollow beneath smells faintly of natural mustard-oil seepage.',
    highlights: [
      '51-foot standing Buddha rock carving—the tallest of its kind in Sri Lanka',
      'Rare Mahayana Buddhist bodhisattva triad reliefs with original stucco traces',
      'Peaceful lake-and-forest approach road near Wellawaya',
    ],
    thingsToSee: [
      'Central Standing Buddha Relief — Towering rock-cut figure still bearing patches of ancient white and ochre plaster',
      'Avalokiteshvara & Tara Carvings — Finely detailed figures to the right of the central statue',
      'Maitreya & Vajrapani Group — Sculpted figures on the left holding a rare double-thunderbolt (vajra) symbol',
    ],
    thingsToDo: [
      'Stop at Buduruwagala on a private transfer between Ella in the hill country and Udawalawe, Yala, or the south coast',
      'Enjoy birdwatching along the quiet tank and forest lane leading to the rock cliff',
    ],
    seasonalActivities: [
      'Morning light illuminates the east-facing rock cliff beautifully for photography and quiet contemplation',
    ],
    specialConsiderations: [
      'Modest temple attire (covered shoulders and knees) is required at the rock shrine.',
    ],
    relatedTourIds: [
      'ceylon-grand-circuit',
      'leopards-elephants-whales',
      'rainforest-and-waterfalls',
    ],
    tags: [
      'buduruwagala',
      'wellawaya',
      'rock carvings',
      'mahayana',
      'buddha statue',
      'heritage',
    ],
    seoTitle: 'Buduruwagala Travel Guide | Ancient Rock Carvings Near Wellawaya & Ella',
    seoDescription:
      'Visit Buduruwagala rock temple between Ella and the south coast: explore Sri Lanka’s tallest standing rock-carved Buddha and Mahayana reliefs.',
    featuredOnHome: false,
    order: 15,
  },
  {
    id: 'matale',
    slug: 'matale',
    entryNumber: 37,
    name: 'Matale',
    region: 'culture',
    regionLabel: 'Central Province · Northern Gateway to Kandy',
    categories: ['culture-heritage', 'hill-country-hiking'],
    season: 'Year-round · Best Jan – Apr & Jul – Sep',
    tagline: 'Historic Aluvihare Rock Temple, spice valleys & Knuckles foothills',
    description:
      'Set in a fertile valley between Dambulla and Kandy framed by the Knuckles foothills, Matale is renowned for the historic Aluvihare Rock Cave Temple—where the Buddhist Pali Canon (Tripitaka) was first committed to writing on palm leaves.',
    overview:
      'For centuries, travellers moving between the dry-zone kingdoms and the hill capital of Kandy have passed through the valley of Matale. Here, cinnamon, cardamom, pepper, and nutmeg grow on shaded hillsides alongside the sacred caves of Aluvihare, the vibrant Sri Muthumariamman Hindu kovil in Matale town, and the mountain road climbing toward Riverston and Pitawala Pathana.',
    highlights: [
      'Aluvihare Rock Cave Temple — Where the Tripitaka was written on ola leaves in the 1st century BC',
      'Sri Muthumariamman Kovil with its ornate 108-foot raja gopuram tower',
      'Gateway to Riverston, Sera Ella waterfall & the northern Knuckles slopes',
    ],
    thingsToSee: [
      'Aluvihare Rock Cave Temple — Historic cave shrines and ola-leaf manuscript demonstrations explaining how palm-leaf texts are inscribed and preserved',
      'Sri Muthumariamman Temple — Colourful Hindu temple in Matale town center founded by the Tamil trading community in the 19th century',
      'Nalanda Gedige (North of Matale) — Unique 8th- to 10th-century stone temple blending Hindu and Buddhist architectural motifs on an island in Bowatenna reservoir',
      'Riverston & Pitawala Pathana — Windswept mountain gap and mini World’s End escarpment in the Matale district of the Knuckles range',
    ],
    thingsToDo: [
      'Visit Aluvihare Rock Temple to see traditional ola-leaf manuscript writing',
      'Stop at Nalanda Gedige en route between Dambulla and Kandy',
      'Take a scenic excursion up to Riverston and Pitawala Pathana in the Knuckles foothills',
    ],
    hikingTrails: [
      'Pitawala Pathana & Riverston Ridge Walk — Short grassland plateau walk leading to a sheer cliff drop overlooking the Dumbara valley',
    ],
    seasonalActivities: [
      'January to April and July to September offer clear views on the drive up to Riverston',
    ],
    festivals: [
      'Matale Muthumariamman Chariot (Ther) Festival (February or March) — Colourful annual procession through Matale town',
    ],
    specialConsiderations: [
      'If visiting spice gardens along the Matale highway, we recommend educational stops with no purchasing pressure.',
    ],
    relatedTourIds: ['ancient-kingdoms', 'kandy-and-the-hill-capital'],
    tags: [
      'matale',
      'aluvihare',
      'nalanda gedige',
      'riverston',
      'spices',
      'culture',
    ],
    seoTitle: 'Matale Travel Guide | Aluvihare Cave Temple, Nalanda Gedige & Riverston',
    seoDescription:
      'Explore Matale between Dambulla and Kandy: Aluvihare Rock Cave Temple, Nalanda Gedige stone shrine, Riverston viewpoints, and cultural journeys.',
    featuredOnHome: false,
    order: 16,
  },

  // ===========================================================================
  // WILDLIFE AND NATURE (6)
  // ===========================================================================
  {
    id: 'yala-wildlife-rainforest',
    slug: 'yala-national-park',
    entryNumber: 6,
    name: 'Yala National Park',
    region: 'wildlife',
    regionLabel: 'Southeastern Dry Zone · Hambantota & Monaragala',
    categories: ['wildlife-nature', 'adventure'],
    season: 'Year-round · Prime dry months Feb – Jul',
    tagline: 'Sri Lankan leopards, elephants, sloth bears & coastal lagoons',
    description:
      'Spanning dry monsoon forest, rocky outcrops, freshwater waterholes, and Indian Ocean dunes in southeastern Sri Lanka, Yala (Ruhuna) National Park is the island’s premier reserve for spotting the endemic Sri Lankan leopard alongside wild elephants and sloth bears.',
    overview:
      'Divided into five blocks alongside the quieter adjoining Kumana (Yala East) and Lunugamvehera sectors, Yala offers diverse habitats where granite kopjes, brackish lagoons, and open scrubland meet the sea. Guided 4x4 safaris at dawn or late afternoon track Sri Lankan leopards (Panthera pardus kotiya), Asian elephants, mugger crocodiles, sambar deer, and over 200 species of resident and migratory birds.',
    highlights: [
      'World-renowned habitat for the Sri Lankan leopard (Panthera pardus kotiya)',
      'Wild Asian elephants, sloth bears (May–Jul palu season) & coastal birdlife',
      'Quieter Block 5, Lunugamvehera & Sithulpawwa ancient rock monastery',
    ],
    thingsToSee: [
      'Yala Block 1 (Palatupana) — Iconic lagoon-and-rock landscape dotted with natural waterholes and rocky leopard lookouts',
      'Yala Block 5 & Lunugamvehera — Less-crowded forest and river corridors ideal for unhurried wildlife tracking',
      'Sithulpawwa Rock Monastery — 2nd-century BC forest monastery located inside the wider Yala ecosystem with panoramic rock views',
      'Buttuwa & Patanangala Coastline — Where dry-zone wilderness meets dramatic Indian Ocean boulders and beaches',
    ],
    thingsToDo: [
      'Embark on an early morning (6:00 AM gate entry) or late afternoon private 4x4 safari with an experienced naturalist',
      'Explore quieter park blocks or neighbouring Bundala / Kumana for wetland and migratory birdwatching',
      'Visit the ancient rock-cave monastery of Sithulpawwa',
    ],
    seasonalActivities: [
      'February to July brings lower water levels that concentrate wildlife around permanent waterholes',
      'May to July is the ripening season of the Palu (ironwood) fruit berry, offering the best chance to spot Sri Lankan sloth bears',
      'Note: Yala Block 1 occasionally closes for annual drought maintenance in September/October; alternative blocks (such as Block 5) remain open—verify current park notices before travel',
    ],
    specialConsiderations: [
      'We work exclusively with ethical safari drivers who keep respectful distances, never crowd animals, and obey park speed limits.',
      'Wildlife sightings are natural occurrences and can never be guaranteed.',
    ],
    relatedTourIds: [
      'leopards-elephants-whales',
      'ceylon-grand-circuit',
      'family-island-discovery',
    ],
    tags: [
      'yala',
      'yala national park',
      'leopards',
      'elephants',
      'sloth bear',
      'safari',
      'wildlife',
    ],
    seoTitle: 'Yala National Park Guide | Ethical Leopard & Elephant Safaris',
    seoDescription:
      'Plan a responsible wildlife safari in Yala National Park, Sri Lanka: leopard and sloth bear seasons, quieter park blocks, ethical viewing rules, and tours.',
    staggerVariant: 'mid-up',
    featuredOnHome: true,
    order: 4,
  },
  {
    id: 'udawalawe-national-park',
    slug: 'udawalawe-national-park',
    entryNumber: 7,
    name: 'Udawalawe National Park',
    region: 'wildlife',
    regionLabel: 'Sabaragamuwa & Uva Border · Southern Plains',
    categories: ['wildlife-nature'],
    season: 'Year-round · Best May – Sep',
    tagline: 'Open grassland reservoir habitat & Sri Lanka’s most reliable wild elephant sightings',
    description:
      'Centered on the vast Udawalawe Reservoir fed by the Walawe River, Udawalawe National Park features open grasslands and scrub plains that make it the finest year-round sanctuary in Sri Lanka for observing wild Asian elephant herds.',
    overview:
      'Created in 1972 to protect the catchment of the Udawalawe Reservoir, the park’s open savanna-like terrain provides exceptional visibility compared to denser forest reserves. Visitors frequently observe multi-generational elephant families feeding and bathing near the water, alongside water buffalo, mugger crocodiles, jackals, painted storks, and raptors such as changeable hawk-eagles and white-bellied sea eagles. Just outside the park boundary, the Department of Wildlife Conservation operates the Udawalawe Elephant Transit Home (ETH), where orphaned elephant calves are rehabilitated for release back into the wild without human contact.',
    highlights: [
      'Year-round sightings of wild Asian elephant herds across open grasslands',
      'Udawalawe Elephant Transit Home (ETH) conservation viewing platform',
      'Rich reservoir birdlife including eagles, pelicans, and endemic hornbills',
    ],
    thingsToSee: [
      'Udawalawe Reservoir Shores — Open plains and dead-tree silhouettes where elephant herds, water buffalo, and waterbirds congregate',
      'Udawalawe Elephant Transit Home (ETH) — Ethical rehabilitation center where visitors watch orphaned calves being fed from a distance before rewilding',
      'Walawe River Gallery Forest — Shaded riverbanks inhabited by toque macaques, tufted grey langurs, and forest birds',
    ],
    thingsToDo: [
      'Take a private morning or afternoon 4x4 game drive across the park’s grasslands and reservoir tracks',
      'Visit the Elephant Transit Home during scheduled feeding times from the visitor observation gallery',
      'Include Udawalawe as a natural stopover between Ella in the hills and Galle, Tangalle, orBentota on the coast',
    ],
    seasonalActivities: [
      'Reliable year-round for elephant sightings; drier months from May to September draw larger herds to the main reservoir edge',
      'November to March brings migratory birds from northern latitudes to the reservoir wetlands',
    ],
    specialConsiderations: [
      'The Udawalawe Elephant Transit Home strictly prohibits touching, riding, or hand-feeding elephants so calves remain wild—making it an ethical choice for families.',
      'Instruct your jeep driver not to approach elephant mothers with young calves too closely.',
    ],
    relatedTourIds: [
      'leopards-elephants-whales',
      'little-explorers',
      'family-island-discovery',
    ],
    tags: [
      'udawalawe',
      'elephants',
      'elephant transit home',
      'safari',
      'wildlife',
      'family friendly',
    ],
    seoTitle: 'Udawalawe National Park Guide | Wild Elephants & Elephant Transit Home',
    seoDescription:
      'Discover Udawalawe National Park in Sri Lanka: wild Asian elephant safaris, the ethical Elephant Transit Home, best seasons, and family-friendly tours.',
    featuredOnHome: false,
    order: 17,
  },
  {
    id: 'minneriya-wilpattu-parks',
    slug: 'minneriya-national-park',
    entryNumber: 8,
    name: 'Minneriya National Park',
    region: 'wildlife',
    regionLabel: 'Cultural Triangle · North Central Province',
    categories: ['wildlife-nature'],
    season: 'Dry-season Gathering Jul – Oct · Eco-corridor year-round',
    tagline: 'Ancient Minneriya Tank & the seasonal wild elephant Gathering',
    description:
      'Built around the 3rd-century AD Minneriya Tank created by King Mahasena, Minneriya National Park hosts one of Asia’s greatest wildlife spectacles during the dry season when wild elephants congregate on the receding reservoir grasslands.',
    overview:
      'Located in the heart of the Cultural Triangle near Habarana, Sigiriya, and Polonnaruwa, Minneriya forms a vital wildlife corridor alongside neighbouring Kaudulla and Hurulu Eco Park. As dry-season waters recede between July and October, fresh shoots of grass emerge along the tank bed, drawing herds of wild elephants from surrounding forests to socialize, graze, and bathe in the late afternoon light.',
    highlights: [
      'The Seasonal Elephant Gathering along the shores of ancient Minneriya Tank',
      'Connected wildlife corridor with Kaudulla National Park & Hurulu Eco Park',
      'Flocks of painted storks, spot-billed pelicans, and grey-headed fish eagles',
    ],
    thingsToSee: [
      'Minneriya Tank Bed & Grasslands — Historic reservoir built in the 3rd century AD that sustains regional wildlife through the dry season',
      'Scrub & Monsoon Forest Tracks — Habitat for sambar deer, purple-faced leaf monkeys, Sri Lankan junglefowl, and endemic hornbills',
      'Kaudulla & Hurulu Corridor — Adjacent reserves where elephant herds naturally move when water levels fluctuate',
    ],
    thingsToDo: [
      'Take an afternoon 4x4 safari (typically 2:30–6:00 PM) when elephant herds emerge from the forest shade onto the tank edge',
      'Consult with local trackers on the day of your safari to confirm whether herds are currently concentrated in Minneriya, Kaudulla, or Hurulu',
    ],
    seasonalActivities: [
      'July to October (dry season) is the prime window for the Minneriya Elephant Gathering',
      'When unseasonal rains raise water levels in Minneriya Tank, herds often shift to neighbouring Kaudulla or Hurulu Eco Park',
    ],
    specialConsiderations: [
      'Because elephants move freely between Minneriya, Kaudulla, and Hurulu depending on water levels, let your naturalist guide select the least crowded and most active park on the day.',
    ],
    relatedTourIds: [
      'sunrise-on-two-rocks',
      'leopards-elephants-whales',
      'ceylon-grand-circuit',
    ],
    tags: [
      'minneriya',
      'elephant gathering',
      'kaudulla',
      'elephants',
      'safari',
      'cultural triangle',
      'wildlife',
    ],
    seoTitle: 'Minneriya National Park Guide | The Great Elephant Gathering & Safari Tips',
    seoDescription:
      'Plan your Minneriya National Park safari in Sri Lanka’s Cultural Triangle: seasonal elephant gathering dates (Jul–Oct), Kaudulla corridor tips, and private tours.',
    staggerVariant: 'low-down',
    featuredOnHome: true,
    order: 7,
  },
  {
    id: 'wilpattu-national-park',
    slug: 'wilpattu-national-park',
    entryNumber: 9,
    name: 'Wilpattu National Park',
    region: 'wildlife',
    regionLabel: 'Northwest Lowlands · Puttalam & Anuradhapura',
    categories: ['wildlife-nature', 'adventure'],
    season: 'Year-round · Prime dry months Feb – Oct',
    tagline: 'Sri Lanka’s largest national park of natural sand-rimmed lakes (villus) & leopards',
    description:
      'Stretching from the northwest coast inland toward Anuradhapura, Wilpattu—"Land of Lakes"—is Sri Lanka’s largest and oldest national park, prized for its quiet forest tracks, natural rainwater basins (villus), leopards, and sloth bears.',
    overview:
      'What makes Wilpattu distinct is its chain of natural, sand-rimmed water basins known as villus, surrounded by dense dry-zone forest and copper-red soil tracks. Because visitor numbers are far lower than in the south, game drives in Wilpattu offer a deep sense of wilderness while tracking Sri Lankan leopards, sloth bears, barking deer, spotted deer, mugger crocodiles, and forest owls.',
    highlights: [
      'Natural sand-rimmed villu lakes attracting leopards, sloth bears & deer',
      'Uncrowded wilderness game drives in Sri Lanka’s largest national park',
      'Easy pairing with sacred Anuradhapura or coastal Kalpitiya',
    ],
    thingsToSee: [
      'Natural Villu Lakes (Kumbukwila, Kokmote, Mahapatessa & Borupan Wila) — Open grassy clearings and water basins where wildlife comes to drink',
      'Thambapanni & Kuweni Ruins — Western coastal edge of the park linked to Sri Lanka’s earliest historical chronicles',
      'Kala Oya & Modaragam Aru River Corridors — Shaded riverine habitats supporting elephants and birdlife',
    ],
    thingsToDo: [
      'Embark on a dawn or full-day private 4x4 safari with a packed breakfast beside a designated park rest stop',
      'Combine Wilpattu with Anuradhapura to the east or dolphin and reef trips in Kalpitiya to the southwest',
    ],
    seasonalActivities: [
      'Open year-round; February to October offers drier tracks and higher wildlife concentration around the villus',
      'May to July is excellent for spotting sloth bears feeding on fallen forest fruit',
    ],
    specialConsiderations: [
      'Wilpattu is vast; allow a full morning (entering at 6:00 AM) or full-day safari rather than a rushed two-hour drive, as reaching the central villu zone takes time.',
    ],
    relatedTourIds: ['wilpattu-wilderness', 'wind-and-reef'],
    tags: [
      'wilpattu',
      'wilpattu national park',
      'leopards',
      'sloth bear',
      'villus',
      'safari',
      'wildlife',
    ],
    seoTitle: 'Wilpattu National Park Guide | Villu Lakes, Leopards & Uncrowded Safaris',
    seoDescription:
      'Explore Wilpattu National Park, Sri Lanka’s largest wildlife reserve: natural villu lakes, leopard and sloth bear tracking, best seasons, and safari tours.',
    featuredOnHome: false,
    order: 18,
  },
  {
    id: 'sinharaja-rainforest',
    slug: 'sinharaja-rainforest',
    entryNumber: 10,
    name: 'Sinharaja Rainforest',
    region: 'wildlife',
    regionLabel: 'Sabaragamuwa & Southern Provinces · Lowland Wet Zone',
    categories: ['wildlife-nature', 'hill-country-hiking'],
    season: 'Drier windows Jan – Apr & Aug – Sep',
    tagline: 'UNESCO Biosphere Reserve, primary lowland rainforest & endemic bird flocks',
    description:
      'A UNESCO World Heritage Site and International Biosphere Reserve, Sinharaja Forest Reserve protects Sri Lanka’s last viable expanse of primary tropical lowland rainforest—a biodiversity hotspot for endemic birds, amphibians, and trees.',
    overview:
      'Over 60% of Sinharaja’s trees are endemic to Sri Lanka, and its multi-layered canopy shelters virtually all of the island’s endemic bird species. Accessed on foot with a mandatory forestry guide from northern (Kudawa/Weddagala) or eastern (Deniyaya/Medripitiya) entrances, Sinharaja is famous for its mixed-species bird feeding flocks led by the Sri Lanka drongo and orange-billed babbler, alongside Sri Lanka blue magpies, red-faced malkohas, purple-faced leaf monkeys, and green pit vipers.',
    highlights: [
      'UNESCO World Heritage tropical rainforest & endemic birdwatching capital',
      'Mixed-species avian feeding flocks, Sri Lanka blue magpie & frogmouth',
      'Guided forest trails to clear rainforest streams and waterfalls',
    ],
    thingsToSee: [
      'Primary Lowland Dipterocarp Canopy — Towering rainforest trees draped in lianas, orchids, and ferns ( accessed via Kudawa or Deniyaya)',
      'Mixed-Species Bird Flocks — Up to 30–40 bird species moving together through the mid-canopy in coordinated waves',
      'Kekuna Ella & Brahmana Ella Waterfalls — Natural rainforest cascades and crystal-clear streams along the Deniyaya/Lankagama sector',
      'Endemic Herpetofauna — Kangaroo lizards, hump-nosed lizards, and endemic tree frogs',
    ],
    thingsToDo: [
      'Walk with a specialist ornithological or forestry guide at dawn to observe endemic bird flocks',
      'Trek shaded forest trails to natural waterfalls and rainforest pools',
    ],
    hikingTrails: [
      'Kudawa Research Station Nature Trails — Classic birdwatching and botany footpaths through primary lowland forest',
      'Deniyaya / Pitadeniya Waterfall Trail — Forest walk following clear streams to Kekuna Ella and Brahmana Ella cascades',
      'Mulawella Peak Trail — Steeper rainforest ridge hike offering canopy views across the reserve',
    ],
    seasonalActivities: [
      'January to April and August to September generally experience lower rainfall, making trails less slippery and birdwatching clearer',
      'May to July and October to December bring heavier southwest and inter-monsoon rains',
    ],
    specialConsiderations: [
      'All visitors must be accompanied by an official Forest Department guide.',
      'Wear leech socks and sturdy closed-toe walking shoes, carry a lightweight rain poncho, and avoid bright clothing when birdwatching.',
    ],
    relatedTourIds: ['rainforest-and-waterfalls'],
    tags: [
      'sinharaja',
      'rainforest',
      'unesco',
      'birdwatching',
      'endemic birds',
      'trekking',
      'nature',
    ],
    seoTitle: 'Sinharaja Rainforest Guide | UNESCO Birdwatching & Trekking in Sri Lanka',
    seoDescription:
      'Plan a guided walk in UNESCO-listed Sinharaja Rainforest: endemic birdwatching flocks, Kudawa vs Deniyaya entrances, best dry months, and packing advice.',
    featuredOnHome: false,
    order: 19,
  },
  {
    id: 'kanneliya-rainforest',
    slug: 'kanneliya-rainforest',
    entryNumber: 32,
    name: 'Kanneliya Rainforest',
    region: 'wildlife',
    regionLabel: 'Southern Province · Galle District Hinterland',
    categories: ['wildlife-nature', 'hill-country-hiking'],
    season: 'Year-round · Best Dec – Apr & Aug – Sep',
    tagline: 'UNESCO Biosphere Reserve in the Galle hinterland with waterfalls & giant creepers',
    description:
      'Located roughly an hour inland from Galle, the Kanneliya-Dediyagala-Nakiyadeniya (KDN) forest complex is a UNESCO Biosphere Reserve offering accessible lowland rainforest trails, waterfalls, and endemic flora.',
    overview:
      'Serving as an important catchment for the Gin and Nilwala rivers, Kanneliya allows travellers staying on the south coast near Galle or Unawatuna to experience a genuine tropical rainforest on a day excursion. Accompanied by local conservation guides, visitors follow well-maintained forest trails past the giant Pus Wela (Entada rheedii) liana creeper, natural rock caves, and the twin cascades of Anagimale Ella and Narangas Ella.',
    highlights: [
      'Accessible lowland rainforest day trip from Galle and the south coast',
      'Anagimale Ella waterfall, Narangas Ella & giant Pus Wela creeper',
      'Kabbale Mountain trail & high concentration of endemic woody plants',
    ],
    thingsToSee: [
      'Anagimale Ella Waterfall — Picturesque rainforest cascade surrounded by ferns and mossy boulders',
      'Giant Pus Wela Liana — Massive woody rainforest vine twisting across the forest floor',
      'Narangas Ella & Natural Bat Cave — Deeper forest trail landmarks along crystal-clear mountain streams',
    ],
    thingsToDo: [
      'Take a guided morning rainforest walk (2 to 4 hours) along the Anagimale Ella trail',
      'Spot endemic birds, purple-faced langurs, and colourful forest butterflies',
    ],
    hikingTrails: [
      'Anagimale Ella Trail — Gentle-to-moderate guided rainforest walk passing the giant creeper to the main waterfall',
      'Kabbale Mountain Trail — Longer, steeper rainforest ascent for experienced hikers seeking canopy views',
    ],
    seasonalActivities: [
      'December to April pairs effortlessly with south-coast beach stays in Galle, Unawatuna, or Mirissa',
    ],
    specialConsiderations: [
      'Forest Department guides are mandatory at the Kanneliya entrance center; wear closed shoes and leech socks.',
    ],
    relatedTourIds: ['rainforest-and-waterfalls', 'southern-shores-in-luxury'],
    tags: [
      'kanneliya',
      'rainforest',
      'galle day trip',
      'waterfalls',
      'biosphere reserve',
      'hiking',
    ],
    seoTitle: 'Kanneliya Rainforest Guide | Waterfalls & Biosphere Trails Near Galle',
    seoDescription:
      'Explore Kanneliya Rainforest Reserve inland from Galle: Anagimale Ella waterfall, guided biosphere walks, endemic wildlife, and south coast day trips.',
    featuredOnHome: false,
    order: 20,
  },

  // ===========================================================================
  // HILL COUNTRY AND HIKING (8)
  // ===========================================================================
  {
    id: 'horton-plains-worlds-end',
    slug: 'horton-plains-worlds-end',
    entryNumber: 11,
    name: "Horton Plains & World's End",
    region: 'hills',
    regionLabel: 'Central Highlands · Nuwara Eliya District',
    categories: ['hill-country-hiking', 'wildlife-nature'],
    season: 'Best Jan – Apr · Dawn departures essential',
    tagline: 'High-altitude cloud forest plateau, Baker’s Falls & the sheer World’s End escarpment',
    description:
      'Set over 2,100 meters above sea level in Sri Lanka’s Central Highlands UNESCO World Heritage property, Horton Plains National Park is a windswept plateau of montane grassland (patana) and gnarled cloud forest culminating at the dramatic cliff drop of World’s End.',
    overview:
      'Where montane tussock grasslands meet stunted dwarf cloud forest draped in old-man’s-beard lichen, Horton Plains feels unlike anywhere else on the island. A well-marked circular walking trail leads across open frost-touched plains to Mini World’s End, the sheer 880-meter precipice of Greater World’s End, and the roaring cascade of Baker’s Falls—home to sambar deer, bear monkeys, endemic highland birds such as the Sri Lanka whistling thrush, and horned lizards.',
    highlights: [
      '9.5 km circular plateau walk to Mini World’s End & Greater World’s End',
      'Baker’s Falls cascading through rhododendron and fern forest',
      'Sambar deer, endemic highland birds & UNESCO montane cloud forest',
    ],
    thingsToSee: [
      'Greater World’s End — Sheer cliff escarpment dropping nearly 880 meters to the southern tea plains, with views to the coast on clear mornings',
      'Mini World’s End — First cliff viewpoint along the loop trail overlooking the valley below',
      'Baker’s Falls — Broad highland waterfall fed by the Belihul Oya tributary amid cool mist and ferns',
      'Chimney Pool & Cloud Forest Canopy — Reflective highland pools and stunted rhododendron trees blooming in crimson',
    ],
    thingsToDo: [
      'Enter the park at 6:00 AM to reach World’s End before mid-morning valley clouds rise',
      'Spot sambar deer grazing near the trailhead and look for endemic highland bird species',
    ],
    hikingTrails: [
      'Horton Plains Circular Loop — Well-defined walking loop linking the trailhead, Mini World’s End, Greater World’s End, and Baker’s Falls across grassland and cloud-forest paths',
    ],
    seasonalActivities: [
      'January to April offers the crispest, clearest dawn skies before 9:00 AM',
      'Regardless of season, mist typically rolls up the escarpment by 9:30–10:00 AM, making a 6:00 AM arrival critical',
    ],
    specialConsiderations: [
      'Single-use plastics and polythene wrappers are strictly checked and prohibited at the park entrance to protect wildlife.',
      'Morning temperatures on the plateau can drop below 10°C (50°F); dress in warm layers and wear comfortable walking shoes.',
    ],
    relatedTourIds: [
      'rainforest-and-waterfalls',
      'the-pekoe-trail-walk',
      'kandy-and-the-hill-capital',
    ],
    tags: [
      'horton plains',
      'worlds end',
      'bakers falls',
      'hiking',
      'cloud forest',
      'unesco',
      'hill country',
    ],
    seoTitle: "Horton Plains & World's End Guide | Dawn Hike, Baker's Falls & Tips",
    seoDescription:
      "Plan your hike across Horton Plains National Park to World's End and Baker's Falls: dawn arrival timing, weather advice, plastic rules, and highland tours.",
    featuredOnHome: false,
    order: 21,
  },
  {
    id: 'knuckles-mountain-range',
    slug: 'knuckles-mountain-range',
    entryNumber: 12,
    name: 'Knuckles Mountain Range',
    region: 'hills',
    regionLabel: 'Central Highlands · Kandy & Matale Districts',
    categories: ['hill-country-hiking', 'wildlife-nature', 'adventure'],
    season: 'Best Feb – Sep',
    tagline: 'UNESCO wilderness peaks, terraced paddy villages & cloud-forest trails',
    description:
      'Named for its profile resembling a clenched fist northeast of Kandy, the Knuckles Conservation Forest (Dumbara Hills) is a UNESCO World Heritage mountain wilderness of rugged peaks, cascading streams, terraced rice villages, and isolated cloud forests.',
    overview:
      'Spanning multiple climatic zones across 34 mountain peaks, the Knuckles range remains one of Sri Lanka’s most rewarding regions for serious walkers and nature lovers. Trails wind from remote tea estates around Corbett’s Gap, Rangala, Deanston, and Riverston into pygmy cloud forests, past hidden waterfalls such as Sera Ella and Duwili Ella, and through traditional terraced farming hamlets.',
    highlights: [
      'UNESCO-protected mountain range with cloud forests & dramatic ridges',
      'Corbett’s Gap, Mini World’s End (Deanston/Pitawala) & Nitro Cave viewpoints',
      'Remote terraced rice villages, cardamom forests & multi-day treks',
    ],
    thingsToSee: [
      'Corbett’s Gap — Dramatic mountain pass northeast of Kandy with sweeping views between high peaks',
      'Mini World’s End (Deanston / Pitawala Pathana) — Sheer escarpment viewpoints overlooking the eastern valleys',
      'Sera Ella & Duwili Ella Waterfalls — Scenic mountain cascades tucked inside the conservation reserve',
    ],
    thingsToDo: [
      'Undertake a guided half-day or full-day mountain trek from Corbett’s Gap, Deanston, or Bambarella',
      'Walk through terraced paddy fields and traditional foothills villages with a local mountain naturalist',
    ],
    hikingTrails: [
      'Deanston Mini World’s End Trail — Accessible forest-and-ridge walk to a panoramic escarpment viewpoint',
      'Dothalugala Nature Trail — Cloud-forest hike from Deanston ascending through montane flora',
      'Five Peaks / Kalupahana to Meemure Crossings — Challenging guided mountain treks for experienced hikers',
    ],
    seasonalActivities: [
      'February to September generally provides drier mountain trails and clearer ridge visibility',
      'October to January brings the northeast monsoon with heavy mist and rain across the eastern slopes',
    ],
    specialConsiderations: [
      'Weather in the Knuckles changes rapidly from sunshine to dense mist; always hike with an experienced local guide, carry rain gear, and wear leech socks.',
    ],
    relatedTourIds: ['the-pekoe-trail-walk', 'rainforest-and-waterfalls'],
    tags: [
      'knuckles',
      'knuckles mountain range',
      'trekking',
      'hiking',
      'cloud forest',
      'unesco',
      'corbetts gap',
    ],
    seoTitle: 'Knuckles Mountain Range Guide | UNESCO Trekking & Highland Trails',
    seoDescription:
      'Explore the Knuckles Mountain Range near Kandy and Matale: guided cloud-forest hikes, Corbett’s Gap, Mini World’s End, best trekking months, and safety tips.',
    featuredOnHome: false,
    order: 22,
  },
  {
    id: 'ella-hill-country',
    slug: 'ella',
    entryNumber: 14,
    name: 'Ella',
    region: 'hills',
    regionLabel: 'Uva Highlands · Badulla District',
    categories: ['hill-country-hiking', 'adventure'],
    season: 'Year-round · Best Jan – May',
    tagline: 'Nine Arch Bridge, Little Adam’s Peak, Ella Rock & the scenic highland train',
    description:
      'Perched at the southern rim of the central highlands overlooking the Ella Gap, Ella is Sri Lanka’s most celebrated hill-country base for tea-estate hikes, colonial railway viaducts, waterfalls, and relaxed mountain cafes.',
    overview:
      'Where the cool central mountains drop toward the southern plains through the dramatic Ella Gap, Ella brings together several of Sri Lanka’s signature highland experiences: watching the blue train cross the stone arches of the Nine Arch Bridge in Demodara, hiking through tea plantations to Little Adam’s Peak and Ella Rock, tasting orthodox Uva teas at Halpewatte Tea Factory, and cooling off near Ravana Falls.',
    highlights: [
      'Nine Arch Bridge in Demodara & the Kandy–Nanu Oya–Ella scenic train',
      'Little Adam’s Peak sunrise walk & Ella Rock panoramic hike',
      'Final stage of The Pekoe Trail, Halpewatte Tea Factory & Ravana Falls',
    ],
    thingsToSee: [
      'Nine Arch Bridge — Early 20th-century stone-and-brick railway viaduct framed by tea slopes and bamboo forest between Ella and Demodara stations',
      'Little Adam’s Peak — Accessible ridge viewpoint rising above green tea estates with views across the Ella Gap to Ella Rock',
      'Ella Rock — High cliff viewpoint on the opposite side of the valley offering expansive vistas toward the southern plains',
      'Ravana Falls & Diyaluma Falls (Nearby) — Roadside cascade below Ella pass and Sri Lanka’s second-highest waterfall near Koslanda',
      'Uva Halpewatte Tea Factory — Working highland factory offering guided tours of tea withering, rolling, grading, and tasting',
    ],
    thingsToDo: [
      'Ride the scenic highland train into Ella from Nanu Oya or Haputale',
      'Walk through tea estates to Little Adam’s Peak at sunrise or late afternoon',
      'Hike Ella Rock with a local trail guide',
      'Walk the final stages of The Pekoe Trail around Demodara and Ella',
    ],
    hikingTrails: [
      'Little Adam’s Peak Trail — Easy-to-moderate tea-estate walk and stepped ridge path suitable for most travellers',
      'Ella Rock Trail — Moderate-to-challenging hike ascending through eucalyptus forest and tea paths to the cliff summit',
      'The Pekoe Trail (Stages 21 & 22) — Scenic walking stages linking Kandapola, Pedro, and Demodara into Ella',
    ],
    seasonalActivities: [
      'January to May offers clear mornings over Ella Gap and dry hiking paths',
      'June to September remains pleasant in the Uva basin even when the southwest coast experiences monsoon showers',
    ],
    diningOptions: [
      {
        name: 'Cafe Chill',
        cuisine: 'Sri Lankan Rice & Curry and International Cafe',
        contact: 'Wellawaya Road, Ella',
        notes: 'Lively timber-decked restaurant in central Ella town.',
        verified: false,
      },
      {
        name: 'Matey Hut',
        cuisine: 'Home-Style Sri Lankan Curries & Kottu',
        contact: 'Ella Pass Road, Ella',
        notes: 'Compact kitchen serving freshly cooked curries and cooking classes.',
        verified: false,
      },
    ],
    specialConsiderations: [
      'Do not walk inside active railway tunnels or stand on tracks when trains are approaching at the Nine Arch Bridge or on the Ella Rock approach.',
      'Reserved seats on the Kandy–Ella train sell out weeks in advance; book early so your private vehicle can meet you at the arrival station with your luggage.',
    ],
    relatedTourIds: [
      'the-pekoe-trail-walk',
      'rainforest-and-waterfalls',
      'ceylon-grand-circuit',
      'two-coasts-surf-circuit',
      'hills-and-beaches-for-friends',
    ],
    tags: [
      'ella',
      'nine arch bridge',
      'little adams peak',
      'ella rock',
      'scenic train',
      'tea country',
      'pekoe trail',
      'hiking',
    ],
    seoTitle: 'Ella Travel Guide | Nine Arch Bridge, Little Adam’s Peak & Scenic Train',
    seoDescription:
      'Plan your stay in Ella, Sri Lanka: Nine Arch Bridge train viewing, Little Adam’s Peak and Ella Rock hikes, tea factory tours, and custom highland itineraries.',
    staggerVariant: 'low-down',
    featuredOnHome: true,
    order: 3,
  },
  {
    id: 'nuwara-eliya',
    slug: 'nuwara-eliya',
    entryNumber: 15,
    name: 'Nuwara Eliya',
    region: 'hills',
    regionLabel: 'Central Highlands · Nuwara Eliya District',
    categories: ['hill-country-hiking', 'culture-heritage'],
    season: 'Year-round · Best Feb – May',
    tagline: 'Cool-climate highland tea capital beneath Pidurutalagala & Pedro Estate',
    description:
      'Located nearly 1,868 meters above sea level in the shadow of Sri Lanka’s highest mountain, Nuwara Eliya is the historic heart of Ceylon tea production—known for its cool mountain air, manicured gardens, Lake Gregory, and colonial-era bungalows.',
    overview:
      'Established in the 19th century as a hill station by British planters, Nuwara Eliya sits in a high valley surrounded by manicured tea estates such as Pedro, Lovers Leap, and Damro (Labookellie). Visitors tour heritage tea factories, stroll through Victoria Park and Hakgala Botanical Garden, walk stages of The Pekoe Trail, and use Nuwara Eliya as the closest base for dawn trips to Horton Plains & World’s End.',
    highlights: [
      'Pedro Tea Estate, Damro Labookellie & Lovers Leap waterfall walks',
      'Victoria Park highland birdwatching, Lake Gregory & Tudor-style Post Office',
      'Closest highland base for dawn excursions to Horton Plains & World’s End',
    ],
    thingsToSee: [
      'Pedro Tea Estate & Lovers Leap Waterfall — Historic high-grown tea estate founded in 1885 with views toward Lovers Leap cascade',
      'Victoria Park — Central park known for seasonal floral displays and migratory Himalayan birds (such as the Kashmir flycatcher and pied thrush) from November to April',
      'Lake Gregory & Galway’s Land National Park — Highland lake promenade and compact montane forest bird sanctuary',
      'Hakgala Botanical Garden & Seetha Amman Temple — High-altitude rose and fern gardens alongside a colourful Hindu temple on the road toward Ella',
      'Nuwara Eliya Post Office — Iconic 1894 red-brick Tudor-style post office still in operation',
    ],
    thingsToDo: [
      'Tour a high-grown Ceylon tea factory and taste light, fragrant Orange Pekoe teas',
      'Board the highland train at Nanu Oya station for the journey over the ridges to Ella',
      'Walk a high-altitude stage of The Pekoe Trail through Kandapola and Pedro tea estates',
    ],
    hikingTrails: [
      'Lovers Leap Tea Trail — Scenic walk through Pedro tea slopes to the base and viewpoint of Lovers Leap waterfall',
      'Single Tree Hill — Morning ridge walk above Nuwara Eliya town overlooking Lake Gregory',
    ],
    seasonalActivities: [
      'February to May offers sunny, crisp days; April is the traditional Sinhala & Tamil New Year holiday season in Nuwara Eliya',
      'November to March is prime season for spotting migratory Himalayan birds in Victoria Park',
    ],
    festivals: [
      'Nuwara Eliya April Season (April) — Flower shows, heritage motor events, and New Year festivities across the hill station',
    ],
    diningOptions: [
      {
        name: 'Grand Indian',
        cuisine: 'North & South Indian Cuisine',
        contact: 'Grand Hotel Road, Nuwara Eliya',
        notes: 'Refined Indian dining adjacent to The Grand Hotel.',
        verified: false,
      },
      {
        name: 'The Grand Hotel High Tea',
        cuisine: 'Ceylon High Tea & Pastries',
        contact: 'Hill Street, Nuwara Eliya',
        notes: 'Classic afternoon tea served on the manicured lawn or tea lounge.',
        verified: false,
      },
    ],
    specialConsiderations: [
      'Evenings in Nuwara Eliya are genuinely cool (often 10–14°C); bring a warm sweater or fleece jacket.',
      'April is a peak domestic holiday month in Nuwara Eliya, so accommodations should be reserved well ahead.',
    ],
    relatedTourIds: [
      'kandy-and-the-hill-capital',
      'the-pekoe-trail-walk',
      'india-to-island-express',
      'hills-and-beaches-for-friends',
    ],
    tags: [
      'nuwara eliya',
      'ceylon tea',
      'pedro tea estate',
      'lake gregory',
      'victoria park',
      'hill country',
      'high tea',
    ],
    seoTitle: 'Nuwara Eliya Travel Guide | Ceylon Tea Estates, Gardens & Highland Stays',
    seoDescription:
      'Explore Nuwara Eliya in Sri Lanka’s tea country: Pedro Tea Estate, Victoria Park, Lake Gregory, Nanu Oya train tips, and private hill-country tours.',
    featuredOnHome: false,
    order: 23,
  },
  {
    id: 'haputale',
    slug: 'haputale',
    entryNumber: 16,
    name: 'Haputale',
    region: 'hills',
    regionLabel: 'Southern Highland Rim · Badulla District',
    categories: ['hill-country-hiking', 'culture-heritage'],
    season: 'Year-round · Clearest mornings Jan – May',
    tagline: 'Lipton’s Seat, Dambatenne Tea Factory & dramatic ridge views to the south coast',
    description:
      'Straddling a narrow mountain ridge at 1,430 meters where the central highlands plunge precipitously toward the southern plains, Haputale offers some of the grandest tea-country panoramas in Sri Lanka—crowned by Lipton’s Seat.',
    overview:
      'Less bustling than Ella, Haputale is an authentic working tea ridge where clouds drift across the railway tracks. Sir Thomas Lipton established his flagship Dambatenne Tea Factory here in 1890, and on clear early mornings from Lipton’s Seat, visitors can look across multiple provinces all the way to the southern coastline and Hambantota lighthouses. Nearby stand the stone-built St. Andrew’s Church, the serene Benedictine monastery of Adisham Bungalow, and Sri Lanka’s highest waterfall, Bambarakanda Falls.',
    highlights: [
      'Dawn walk or tuk-tuk ride through Dambatenne estate to Lipton’s Seat',
      'Historic 1890 Dambatenne Tea Factory tour & Adisham Bungalow',
      'Bambarakanda Falls (Sri Lanka’s highest waterfall) & Pekoe Trail stages',
    ],
    thingsToSee: [
      'Lipton’s Seat — High ridge lookout where Sir Thomas Lipton surveyed his tea empire across the southern valleys',
      'Dambatenne Tea Factory — One of Sri Lanka’s longest-operating colonial tea factories, demonstrating traditional orthodox tea manufacture',
      'Adisham Hall (St. Benedict’s Monastery) — 1931 Tudor-style country manor built of granite and bordered by orchards and Tangamalai bird sanctuary',
      'Bambarakanda Falls & Lanka Ella — 263-meter pine-framed waterfall located in the Kalupahana valley below Haputale',
    ],
    thingsToDo: [
      'Reach Lipton’s Seat at sunrise (before 8:30 AM) and walk down through the tea pluckers’ footpaths to Dambatenne Factory',
      'Hike the Bambarakanda Falls and Lanka Ella natural pool trail',
      'Ride the scenic train between Haputale, Idalgashinna, and Ella along the exposed mountain ridge',
    ],
    hikingTrails: [
      'Dambatenne to Lipton’s Seat Tea Walk — Winding estate paths and stone shortcuts through high-grown tea bushes to the summit lookout',
      'Idalgashinna to Haputale Ridge Walk (Pekoe Trail) — Dramatic cloud-line walk where both sides of the mountain ridge drop away into valleys',
      'Bambarakanda to Lanka Ella Trail — Pine-forest and stream walk linking Sri Lanka’s tallest waterfall with a secluded mountain cascade',
    ],
    seasonalActivities: [
      'January to May and July to September offer clear dawn views from Lipton’s Seat before valley mist rises around mid-morning',
    ],
    specialConsiderations: [
      'Adisham Bungalow is an active monastery and is generally open to visitors only on weekends and public/school holidays; check opening days before visiting.',
    ],
    relatedTourIds: [
      'the-pekoe-trail-walk',
      'rainforest-and-waterfalls',
      'ceylon-grand-circuit',
    ],
    tags: [
      'haputale',
      'liptons seat',
      'dambatenne',
      'adisham bungalow',
      'bambarakanda',
      'pekoe trail',
      'hiking',
    ],
    seoTitle: "Haputale Travel Guide | Lipton's Seat, Dambatenne Tea & Ridge Hikes",
    seoDescription:
      "Plan your visit to Haputale in Sri Lanka’s tea hills: Lipton's Seat sunrise advice, Dambatenne Tea Factory, Bambarakanda Falls, and Pekoe Trail walks.",
    featuredOnHome: false,
    order: 24,
  },
  {
    id: 'adams-peak-sri-pada',
    slug: 'adams-peak-sri-pada',
    entryNumber: 29,
    name: "Adam's Peak (Sri Pada)",
    region: 'hills',
    regionLabel: 'Central Highlands · Ratnapura & Nuwara Eliya Border',
    categories: ['hill-country-hiking', 'culture-heritage', 'adventure'],
    season: 'Pilgrimage Season: Unduvap Poya (Dec) – Vesak Poya (May)',
    tagline: 'Sacred 2,243-meter pilgrimage summit & the dawn shadow of the peak',
    description:
      'Rising in a symmetrical cone to 2,243 meters inside the Peak Wilderness Sanctuary, Sri Pada (Adam’s Peak) has been a revered multi-faith pilgrimage mountain for over a thousand years, climbed overnight by an illuminated stairway to witness sunrise at the summit shrine.',
    overview:
      'At the summit rests the Sri Pada ("Sacred Footprint"), venerated by Buddhists as the footprint of the Buddha, by Hindus as Shiva’s, and by Muslims and Christians as Adam’s or St. Thomas’s. During the official pilgrimage season from December full moon to May full moon, the primary Hatton–Nallathanniya route is lit with strings of lights, tea stalls, and rest shelters as travellers and pilgrims ascend thousands of steps through the night to watch dawn break and the triangular shadow of the peak project across the western clouds.',
    highlights: [
      'Overnight illuminated stairway climb to the 2,243-meter sacred summit',
      'Spectacular sunrise & triangular shadow of the mountain over the mist',
      'Surrounding Peak Wilderness Sanctuary biodiversity & Maskeliya reservoirs',
    ],
    thingsToSee: [
      'Summit Shrine & Sacred Footprint — Bell tower and shrine at the mountain peak where pilgrims ring the bell according to the number of climbs completed',
      'Dawn Shadow of the Peak — Optical phenomenon at sunrise where the conical mountain casts a sharp triangular shadow onto the lower cloud deck',
      'Peace Pagoda (Sama Chaitiya) — Japanese Peace Pagoda passed halfway up the Nallathanniya route',
      'Castlereagh & Maussakelle Reservoirs — Scenic tea-ringed lakes along the Hatton/Dickoya and Maskeliya approach',
    ],
    thingsToDo: [
      'Begin the ascent from Nallathanniya (Dalhousie) around 1:30–2:30 AM with a guide to reach the summit just before dawn',
      'Rest and recover at a tea-estate bungalow around Hatton, Dickoya, or Maskeliya after descending',
    ],
    hikingTrails: [
      'Hatton–Nallathanniya (Dalhousie) Route — The shortest and most popular stepped trail, illuminated and serviced with tea stalls during the December–May pilgrimage season',
      'Ratnapura–Palabaddala & Kuruwita–Erathna Routes — Longer, steeper historic forest pilgrimage paths ascending from the southern wet-zone lowlands',
    ],
    seasonalActivities: [
      'December (Unduvap Poya) to May (Vesak Poya) is the official pilgrimage season when path lights are switched on, tea shops are open, and weather is clearest',
      'June to November is the off-season: the summit shrine is closed, path lights are off, and heavy southwest monsoon rains and mist make climbing hazardous',
    ],
    festivals: [
      'Sri Pada Pilgrimage Season (December Full Moon to May Full Moon) — Five-month devotional season with traditional pilgrim chants (tunsarana) along the stairway',
    ],
    specialConsiderations: [
      'Avoid climbing on Poya (full moon) weekends, New Year holidays in April, and long weekends when severe crowd bottlenecks can stall the upper steps for hours.',
      'The summit before dawn is freezing and windy; bring a warm jacket, beanie, gloves, and knee support or trekking poles for the steep descent.',
    ],
    relatedTourIds: ['the-pekoe-trail-walk', 'rainforest-and-waterfalls'],
    tags: [
      'adams peak',
      'sri pada',
      'pilgrimage',
      'sunrise hike',
      'nallathanniya',
      'hatton',
      'maskeliya',
      'hiking',
    ],
    seoTitle: "Adam's Peak (Sri Pada) Guide | Pilgrimage Season, Night Climb & Tips",
    seoDescription:
      "Plan your climb of Adam's Peak (Sri Pada) in Sri Lanka: December–May pilgrimage season dates, Nallathanniya route tips, crowd advice, and highland stays.",
    featuredOnHome: false,
    order: 25,
  },
  {
    id: 'belihuloya',
    slug: 'belihuloya',
    entryNumber: 33,
    name: 'Belihuloya',
    region: 'hills',
    regionLabel: 'Sabaragamuwa Escarpment · Ratnapura District',
    categories: ['hill-country-hiking', 'wildlife-nature', 'adventure'],
    season: 'Year-round · Best Jan – Apr & Jul – Sep',
    tagline: 'Eco-trekking valley where the central highlands meet the southern plains',
    description:
      'Nestled at the climatic transition zone where the cool central mountains descend into the warm southern plains, Belihuloya is a tranquil river valley renowned for clear mountain streams, canoeing on Samanalawewa Reservoir, and uncrowded hill trails.',
    overview:
      'Fed by streams flowing off the Horton Plains escarpment above, Belihuloya spans wet, intermediate, and dry microclimates within a few kilometers. It is a favorite stopover between Ratnapura/Colombo and Haputale/Udawalawe for nature walks along the Belihul Oya river, kayaking on the still waters of Samanalawewa Reservoir, and visiting Pahanthudawa and Bambarakanda waterfalls.',
    highlights: [
      'Natural river pools along the Belihul Oya & Pahanthudawa waterfall',
      'Flat-water canoeing and kayaking at Samanalawewa Reservoir',
      'Old Nonpareil / Hawagala mountain trekking trails below Horton Plains',
    ],
    thingsToSee: [
      'Pahanthudawa Waterfall — Unique lamp-wick-shaped cascade plunging into a deep emerald rock pool surrounded by forest',
      'Samanalawewa Reservoir & Leak Point — Scenic highland reservoir surrounded by mountains and pine forests',
      'Hawagala Peak — Striking pyramid-shaped mountain rising above the Belihuloya valley',
    ],
    thingsToDo: [
      'Walk village, paddy-field, and river trails with an eco-guide',
      'Canoe or kayak across the calm waters of Samanalawewa Reservoir in the early morning',
      'Hike Hawagala Peak or the historic Nonpareil estate bridle paths',
    ],
    hikingTrails: [
      'Hawagala Mountain Trail — Rewarding half-day ascent through tea estates and montane grassland to a panoramic summit',
      'Kinchigune Nature Trail — Gentle riverside and village walk ending at Samanalawewa Reservoir',
    ],
    seasonalActivities: [
      'January to April and July to September offer pleasant walking conditions and safe water levels along river trails',
    ],
    specialConsiderations: [
      'Water levels in mountain rivers and waterfalls like Pahanthudawa can rise suddenly after rain in the upper Horton Plains catchment; never swim during or after upstream rain.',
    ],
    relatedTourIds: ['rainforest-and-waterfalls', 'the-pekoe-trail-walk'],
    tags: [
      'belihuloya',
      'pahanthudawa',
      'samanalawewa',
      'hawagala',
      'eco tourism',
      'hiking',
      'kayaking',
    ],
    seoTitle: 'Belihuloya Travel Guide | River Trails, Samanalawewa & Eco-Trekking',
    seoDescription:
      'Discover Belihuloya in Sri Lanka: Pahanthudawa waterfall, Samanalawewa canoeing, Hawagala hikes, and quiet highland nature retreats.',
    featuredOnHome: false,
    order: 26,
  },
  {
    id: 'meemure',
    slug: 'meemure',
    entryNumber: 46,
    name: 'Meemure',
    region: 'hills',
    regionLabel: 'Knuckles Wilderness · Kandy District Border',
    categories: ['hill-country-hiking', 'culture-heritage', 'adventure'],
    season: 'Best Feb – Sep',
    tagline: 'Isolated mountain village beneath the iconic monolith of Lakegala',
    description:
      'Tucked deep inside a valley of the Knuckles Mountain Range and reached via the winding Loolwatte mountain road, Meemure is one of Sri Lanka’s most secluded traditional villages—framed by terraced paddy fields and the pyramid rock face of Lakegala.',
    overview:
      'For generations, Meemure was accessible only by foot or pack bullock through the Knuckles passes. Today, it retains its slow village rhythm of spring-fed rice terraces, kithul palm treacle tapping, and crystal-clear mountain rivers flowing beneath the striking triangular peak of Lakegala.',
    highlights: [
      'Dramatic view of the pyramid-shaped Lakegala monolith',
      'Traditional terraced paddy fields, village homes & kithul tapping',
      'Crystal-clear mountain river pools & Seven Waterfalls forest trek',
    ],
    thingsToSee: [
      'Lakegala Rock Monolith — Iconic triangular rock peak towering over the Meemure valley and steeped in local folklore',
      'Meemure Terraced Paddy Fields — Spring-fed rice terraces stepping down the mountain slopes',
      'Suriyagaha Fang & Mountain Streams — Clear rock pools and cascades fed by the Knuckles conservation forest',
    ],
    thingsToDo: [
      'Walk through the traditional village and terraced paddy fields with a resident local guide',
      'Hike to natural forest waterfalls and freshwater rock pools',
    ],
    hikingTrails: [
      'Meemure Village & Paddy Terrace Walk — Gentle cultural and nature walk around the valley floor',
      'Seven Waterfalls (Sathmahal Ella) Forest Trek — Guided mountain-stream hike inside the surrounding Knuckles forest',
    ],
    seasonalActivities: [
      'February to September is the drier window; avoid visiting during heavy northeast monsoon rains from November to January when the narrow mountain access road can become slippery',
    ],
    specialConsiderations: [
      'Mobile phone coverage in Meemure is minimal or absent, and the final mountain road from Hunnasgiriya/Loolwatte is narrow and winding—travel with an experienced hill driver.',
      'Respect village privacy and local customs when walking through residential compounds.',
    ],
    relatedTourIds: ['the-pekoe-trail-walk', 'rainforest-and-waterfalls'],
    tags: [
      'meemure',
      'lakegala',
      'knuckles',
      'remote village',
      'trekking',
      'nature',
    ],
    seoTitle: 'Meemure Travel Guide | Lakegala Peak, Knuckles Village & Nature Walks',
    seoDescription:
      'Visit remote Meemure village in the Knuckles Mountain Range: Lakegala viewpoints, traditional paddy terraces, river hikes, and travel advice.',
    featuredOnHome: false,
    order: 27,
  },

  // ===========================================================================
  // BEACHES AND COASTAL DESTINATIONS (15)
  // ===========================================================================
  {
    id: 'galle-sea-and-sand',
    slug: 'galle',
    entryNumber: 18,
    name: 'Galle',
    region: 'coast',
    regionLabel: 'Southern Coast · UNESCO Fort & Heritage Town',
    categories: ['beaches-coast', 'culture-heritage', 'cities-local'],
    season: 'Year-round · Prime coast season Nov – Apr',
    tagline: 'UNESCO 17th-century Dutch Fort ramparts, cobblestone lanes & boutique stays',
    description:
      'Built on a rocky peninsula facing the Indian Ocean, the UNESCO World Heritage Galle Fort is South Asia’s finest living fortified town—where 17th-century coral-and-granite ramparts enclose cobblestone streets, Dutch Reformed churches, lighthouse views, and intimate boutique hotels.',
    overview:
      'First fortified by the Portuguese in 1588 and extensively walled by the Dutch East India Company (VOC) from the 1660s onward, Galle Fort remains a vibrant, lived-in neighbourhood rather than a static museum. Visitors walk the full circuit of the sea walls at sunset from Flag Rock Bastion to the Galle Lighthouse, browse independent jewellery, textile, and book boutiques along Pedlar Street and Church Street, and use Galle as a refined base for exploring the southern coast.',
    highlights: [
      'UNESCO Galle Fort rampart walk from Flag Rock to Galle Lighthouse',
      'Dutch Reformed Church (Groote Kerk), Old Dutch Hospital & Maritime Museum',
      'Boutique heritage architecture, dining & gateway to southern beaches',
    ],
    thingsToSee: [
      'Galle Fort Ramparts & Bastions — Sea-facing stone walls linking Flag Rock, Triton, Utrecht (Lighthouse), and Star Bastions',
      'Galle Lighthouse & Point Utrecht — Iconic white lighthouse standing above palm trees at the southeastern corner of the fort',
      'Dutch Reformed Church (1755) & All Saints’ Anglican Church — Historic churches featuring tombstones of VOC commanders and stained-glass windows',
      'Old Dutch Hospital Precinct — Restored colonial colonnade overlooking the harbour, now home to restaurants and boutiques',
      'National Maritime Museum & Historical Mansion — Exhibits on Indian Ocean trade, shipwrecks, and colonial decorative arts',
    ],
    thingsToDo: [
      'Take a private guided walking tour of Galle Fort’s architecture and history in the cool morning or late afternoon',
      'Watch sunset along the western ramparts between Flag Rock and Moon Bastion',
      'Combine a boutique stay inside or near Galle Fort with beach time at Unawatuna, Dalawella, or Talpe',
    ],
    hikingTrails: [
      'Full Galle Rampart Circuit — 2.5 km level heritage walk tracing the entire perimeter of the sea and land fortifications',
    ],
    seasonalActivities: [
      'Galle Fort itself is an atmospheric year-round destination',
      'November to April brings the calmest, sunniest sea conditions along the neighbouring southern beaches',
    ],
    festivals: [
      'Galle Literary Festival (Typically January or February) — Celebrated international gathering of authors, poets, and cultural talks held inside historic fort venues',
    ],
    diningOptions: [
      {
        name: 'Church Street Social (Fort Bazaar)',
        cuisine: 'Contemporary Sri Lankan & Mediterranean',
        contact: '26 Church Street, Galle Fort',
        notes: 'Elegant courtyard and veranda dining inside a restored merchant townhouse.',
        verified: false,
      },
      {
        name: 'A Minute by Tuk Tuk',
        cuisine: 'Sri Lankan Seafood & Coastal Fusion',
        contact: 'Old Dutch Hospital, Galle Fort',
        notes: 'Upper-veranda ocean views overlooking Galle Bay.',
        verified: false,
      },
      {
        name: 'Pedlar’s Inn Cafe & Gelato',
        cuisine: 'Cafe, Pastries & Artisanal Gelato',
        contact: '92 Pedlar Street, Galle Fort',
        notes: 'Long-standing stop along the main pedestrian street of the fort.',
        verified: false,
      },
    ],
    specialConsiderations: [
      'Midday inside the fort can be warm; plan rampart walks for before 9:30 AM or after 4:30 PM.',
    ],
    relatedTourIds: [
      'southern-shores-in-luxury',
      'galle-fort-and-beach-days',
      'culture-and-coast',
      'sky-sea-and-river',
      'ceylon-grand-circuit',
    ],
    tags: [
      'galle',
      'galle fort',
      'unesco',
      'dutch fort',
      'south coast',
      'lighthouse',
      'boutique stays',
    ],
    seoTitle: 'Galle Travel Guide | UNESCO Galle Fort, Rampart Walks & South Coast Stays',
    seoDescription:
      'Explore UNESCO-listed Galle Fort on Sri Lanka’s south coast: rampart walking routes, historic churches, boutique dining, and tailor-made coastal escapes.',
    staggerVariant: 'mid-up',
    featuredOnHome: true,
    order: 6,
  },
  {
    id: 'mirissa',
    slug: 'mirissa',
    entryNumber: 19,
    name: 'Mirissa',
    region: 'coast',
    regionLabel: 'Southern Coast · Matara District',
    categories: ['beaches-coast', 'wildlife-nature', 'adventure'],
    season: 'Best Nov – Apr',
    tagline: 'Crescent palm bay, Coconut Tree Hill & seasonal blue whale excursions',
    description:
      'Curving around a golden-sand bay between Weligama and Matara, Mirissa is one of southern Sri Lanka’s signature beach towns—celebrated for Coconut Tree Hill, Parrot Rock, Secret Beach cove, and seasonal offshore whale watching.',
    overview:
      'Because the continental shelf drops into deep ocean canyons close to the southern tip of Sri Lanka (Dondra Point), the waters off Mirissa are visited by blue whales, fin whales, sperm whales, and spinner dolphins during the calm northeast monsoon season from November to April. Onshore, Mirissa combines palm-fringed headlands, beginner-to-intermediate reef breaks, and beachfront seafood dining.',
    highlights: [
      'Seasonal offshore whale & dolphin watching (November to April)',
      'Coconut Tree Hill headland & Parrot Rock tidal viewpoint',
      'Secret Beach sheltered cove & nearby Weligama surf bay',
    ],
    thingsToSee: [
      'Coconut Tree Hill — Red-earth coastal headland crowned with coconut palms overlooking the Indian Ocean swells',
      'Parrot Rock — Small rocky islet at the eastern end of Mirissa Beach accessible across a shallow sandbar at low tide',
      'Secret Beach — Tucked-away palm cove west of the main bay with natural rock pools',
      'Mirissa Fishery Harbour — Departure point for regulated morning marine excursions',
    ],
    thingsToDo: [
      'Join a morning whale and dolphin watching boat excursion (November–April) with an operator that follows marine mammal distance guidelines',
      'Walk up to Coconut Tree Hill at sunrise for quiet coastal views',
      'Take beginner surf lessons at neighbouring Weligama Bay (10 minutes west)',
    ],
    seasonalActivities: [
      'November to April offers calm seas, clear water, and the official southern whale-watching season',
      'May to October brings rough southwest monsoon swells; boat trips and open-ocean swimming are not recommended during this period',
    ],
    diningOptions: [
      {
        name: 'Zephyr Restaurant & Bar',
        cuisine: 'Seafood & Coastal Dining',
        contact: 'Mirissa Beach',
        notes: 'Beachfront palm-shaded setting along the main crescent bay.',
        verified: false,
      },
      {
        name: 'Shady Lane Mirissa',
        cuisine: 'Smoothie Bowls, Coffee & Brunch',
        contact: 'Bandaramulla, Mirissa',
        notes: 'Relaxed garden cafe popular after morning surf or beach walks.',
        verified: false,
      },
    ],
    specialConsiderations: [
      'Choose whale-watching vessels that strictly obey speed and approach distances and never chase or encircle marine mammals.',
      'Individuals prone to motion sickness should take precautions before boarding offshore morning boats.',
    ],
    relatedTourIds: [
      'waves-and-rapids',
      'southern-shores-in-luxury',
      'leopards-elephants-whales',
    ],
    tags: [
      'mirissa',
      'whale watching',
      'blue whales',
      'coconut tree hill',
      'south coast',
      'beach',
      'surfing',
    ],
    seoTitle: 'Mirissa Travel Guide | Blue Whale Season, Coconut Tree Hill & Beaches',
    seoDescription:
      'Plan your stay in Mirissa on Sri Lanka’s south coast: ethical whale watching (Nov–Apr), Coconut Tree Hill, Secret Beach, and coastal tours.',
    featuredOnHome: false,
    order: 28,
  },
  {
    id: 'unawatuna',
    slug: 'unawatuna',
    entryNumber: 20,
    name: 'Unawatuna',
    region: 'coast',
    regionLabel: 'Southern Coast · Galle District',
    categories: ['beaches-coast'],
    season: 'Best Nov – Apr',
    tagline: 'Reef-sheltered horseshoe bay, Jungle Beach & Dalawella lagoon just east of Galle',
    description:
      'Just fifteen minutes east of Galle Fort, Unawatuna curves around a reef-protected horseshoe bay flanked by the forested headland of Rumassala, secluded Jungle Beach, and the natural reef lagoon of Dalawella.',
    overview:
      'Protected by an offshore reef that softens incoming swells during the November–April season, Unawatuna and neighbouring Dalawella (Mihiripenna) offer some of the most accessible swimming and family-friendly coastal stretches near Galle. Above the bay on Rumassala Hill—linked in folklore to the Ramayana epic—stands the white Japanese Peace Pagoda overlooking Galle Harbour.',
    highlights: [
      'Horseshoe-shaped Unawatuna Bay & calm Dalawella reef lagoon',
      'Rumassala Hill Japanese Peace Pagoda & secluded Jungle Beach cove',
      'Easy 15-minute access to UNESCO Galle Fort',
    ],
    thingsToSee: [
      'Unawatuna Main Bay — Curved golden-sand beach bordered by palms and coastal cafes',
      'Jungle Beach (Rumassala) — Sheltered cove reached by a short forest footpath below the Peace Pagoda',
      'Japanese Peace Pagoda — White stupa on Rumassala headland with sunset views back toward Galle Fort across the bay',
      'Dalawella & Mihiripenna Reef Lagoon — Natural rock-reef pool just east of Unawatuna where sea turtles frequently feed in shallow water',
    ],
    thingsToDo: [
      'Swim and snorkel in the calm reef-protected waters of Jungle Beach and Dalawella from November to April',
      'Walk up Rumassala Hill to the Japanese Peace Pagoda for sunset',
      'Visit nearby Yatagala Raja Maha Vihara, an ancient rock-cave temple set amid quiet paddy fields inland from Unawatuna',
    ],
    seasonalActivities: [
      'November to April provides the calmest water for swimming and snorkelling',
    ],
    diningOptions: [
      {
        name: 'Kingfisher Restaurant',
        cuisine: 'Fresh Seafood & Sri Lankan Coastal Dishes',
        contact: 'Yaddehimulla Road, Unawatuna Beach',
        notes: 'Long-established beachfront dining at the western end of the bay.',
        verified: false,
      },
      {
        name: 'SkinnyTom’s Deli',
        cuisine: 'All-Day Breakfast, Coffee & Bakery',
        contact: 'Matara Road, Unawatuna / Dalawella',
        notes: 'Relaxed cafe setting along the coastal strip.',
        verified: false,
      },
    ],
    specialConsiderations: [
      'When observing wild sea turtles in the shallow reef at Dalawella/Wijaya, never touch, feed, or block their path to the surface.',
    ],
    relatedTourIds: [
      'galle-fort-and-beach-days',
      'southern-shores-in-luxury',
      'culture-and-coast',
    ],
    tags: [
      'unawatuna',
      'jungle beach',
      'dalawella',
      'peace pagoda',
      'galle',
      'south coast',
      'beach',
    ],
    seoTitle: 'Unawatuna Travel Guide | Jungle Beach, Dalawella Lagoon & South Coast',
    seoDescription:
      'Discover Unawatuna near Galle Fort: horseshoe bay beaches, Jungle Beach, Rumassala Peace Pagoda, Dalawella reef lagoon, and coastal escapes.',
    featuredOnHome: false,
    order: 29,
  },
  {
    id: 'tangalle',
    slug: 'tangalle',
    entryNumber: 21,
    name: 'Tangalle',
    region: 'coast',
    regionLabel: 'Deep South Coast · Hambantota District',
    categories: ['beaches-coast', 'wildlife-nature', 'culture-heritage'],
    season: 'Best Nov – Apr',
    tagline: 'Wild palm-fringed coves, Mulkirigala Rock Temple & Rekawa turtle conservation',
    description:
      'Where the southern coastline opens into long, uncrowded sweeps of golden sand and quiet rocky coves between Matara and Yala, Tangalle is Sri Lanka’s premier destination for secluded luxury beach retreats and coastal nature.',
    overview:
      'Unlike the livelier resort strips further west, Tangalle is defined by tranquil bays—Silent Beach (Amanwella), Goyambokka, Mawella, and Medaketiya—alongside calm mangroves at Kalametiya Bird Sanctuary and the dramatic five-tiered cave shrines of Mulkirigala Raja Maha Vihara inland.',
    highlights: [
      'Secluded palm coves at Goyambokka, Silent Beach & Mawella Bay',
      'Mulkirigala Rock Temple — Ancient five-level cliff monastery inland',
      'Kalametiya Lagoon birdwatching & Rekawa ethical turtle watch',
    ],
    thingsToSee: [
      'Goyambokka, Silent Beach & Mawella — Quiet, postcard-like coves framed by coconut groves and granite headlands',
      'Mulkirigala Raja Maha Vihara — 3rd-century BC rock monastery rising 205 meters above surrounding forest with seven painted cave temples',
      'Kalametiya Bird Sanctuary — Coastal lagoon and mangrove wetland explored by non-motorized paddle catamaran',
      'Hummanaya Blowhole (Near Kudawella) — Natural coastal rock fissure where ocean swells shoot spray high into the air during high-swell periods',
    ],
    thingsToDo: [
      'Unwind at a secluded beachfront boutique hotel or villa after a highland and safari circuit',
      'Climb Mulkirigala Rock Temple in the early morning',
      'Take a dawn or late-afternoon paddle boat birdwatching excursion on Tangalle or Kalametiya Lagoon',
    ],
    seasonalActivities: [
      'November to April brings the calmest conditions to sheltered bays such as Mawella and Goyambokka',
      'Even in dry months, open-ocean stretches around Medaketiya and Rekawa have strong rip currents—swim only in sheltered coves where local lifeguards or hotels confirm safe conditions',
    ],
    specialConsiderations: [
      'If visiting Rekawa Beach for night sea-turtle nesting observation, only join regulated conservation-led watches that prohibit flash photography and white lights.',
    ],
    relatedTourIds: [
      'southern-shores-in-luxury',
      'ceylon-grand-circuit',
      'culture-and-coast',
    ],
    tags: [
      'tangalle',
      'goyambokka',
      'mawella',
      'mulkirigala',
      'kalametiya',
      'south coast',
      'luxury beach',
    ],
    seoTitle: 'Tangalle Travel Guide | Secluded South Coast Bays & Mulkirigala Temple',
    seoDescription:
      'Explore Tangalle on Sri Lanka’s deep south coast: Goyambokka and Mawella bays, Mulkirigala Rock Temple, Kalametiya Bird Sanctuary, and luxury stays.',
    featuredOnHome: false,
    order: 30,
  },
  {
    id: 'bentota',
    slug: 'bentota',
    entryNumber: 22,
    name: 'Bentota',
    region: 'coast',
    regionLabel: 'Southwest Coast · Galle & Kalutara Border',
    categories: ['beaches-coast', 'adventure', 'culture-heritage'],
    season: 'Best Nov – Apr',
    tagline: 'Broad golden sandspit, Bentota Ganga river safaris & Geoffrey Bawa architecture',
    description:
      'Framed between the Indian Ocean and the calm waters of the Bentota Ganga river estuary an hour south of Colombo, Bentota combines wide golden beaches, lagoon watersports, mangrove boat safaris, and the iconic architectural country estates of Geoffrey and Bevis Bawa.',
    overview:
      'Bentota’s long sandspit separates the rolling ocean surf on the west from a sheltered river lagoon on the east—making it a classic resort destination for families, couples, and watersports enthusiasts. Just inland lie two masterpieces of Sri Lankan tropical modernism and landscape design: Geoffrey Bawa’s country estate Lunuganga on the banks of Dedduwa Lake, and his brother Bevis Bawa’s sculptural hillside garden Brief.',
    highlights: [
      'Geoffrey Bawa’s Lunuganga Estate & Bevis Bawa’s Brief Garden',
      'Bentota River & Madu Ganga mangrove boat safaris',
      'Broad golden beaches, river watersports & seasonal paramotoring',
    ],
    thingsToSee: [
      'Lunuganga Estate — Renowned architect Geoffrey Bawa’s lakeside garden estate blending Italianate vistas with tropical Sri Lankan foliage',
      'Brief Garden — Intimate, art-filled tropical garden created by landscape artist Bevis Bawa',
      'Bentota Beach & Estuary Sandspit — Wide sweep of golden sand where the Bentota Ganga meets the Indian Ocean',
      'Madu Ganga Wetland (Nearby Balapitiya) — Island-dotted mangrove estuary with cinnamon-peeling islands and an island Buddhist monastery',
      'Kande Viharaya (Nearby Aluthgama) — Historic hilltop temple famous for its towering seated Buddha and Bodhi tree',
    ],
    thingsToDo: [
      'Take a guided garden walk at Lunuganga Estate (and enjoy lunch on the veranda by prior reservation)',
      'Cruise the Bentota River or Madu Ganga mangroves by private boat to spot kingfishers, water monitors, and cinnamon peelers',
      'Experience tandem paramotoring or lagoon watersports in calm weather windows (Nov–Apr)',
    ],
    seasonalActivities: [
      'November to April offers calm seas and sunny southwest coast weather',
      'River boat safaris and the Bawa gardens can be visited year-round',
    ],
    specialConsiderations: [
      'Garden tours at Lunuganga operate at scheduled times and require advance booking.',
    ],
    relatedTourIds: [
      'sky-sea-and-river',
      'little-explorers',
      'hills-and-beaches-for-friends',
      'family-island-discovery',
    ],
    tags: [
      'bentota',
      'lunuganga',
      'geoffrey bawa',
      'brief garden',
      'river safari',
      'watersports',
      'beach',
    ],
    seoTitle: 'Bentota Travel Guide | Lunuganga Estate, River Safaris & Golden Beaches',
    seoDescription:
      'Plan your visit to Bentota on Sri Lanka’s southwest coast: Geoffrey Bawa’s Lunuganga, Brief Garden, Bentota river safaris, watersports, and beach resorts.',
    featuredOnHome: false,
    order: 31,
  },
  {
    id: 'kalpitiya',
    slug: 'kalpitiya',
    entryNumber: 23,
    name: 'Kalpitiya',
    region: 'coast',
    regionLabel: 'Northwest Peninsula · Puttalam District',
    categories: ['beaches-coast', 'adventure', 'wildlife-nature'],
    season: 'Dolphins & Diving Nov – Apr · Kite Surfing May – Oct & Dec – Mar',
    tagline: 'Flat-water kite surfing lagoons, Bar Reef marine sanctuary & spinner dolphins',
    description:
      'Stretching along a narrow sand peninsula between Puttalam Lagoon and the Indian Ocean on Sri Lanka’s northwest coast, Kalpitiya is an unspoiled hub for kite surfing, offshore spinner dolphin pods, Bar Reef snorkelling, and Dutch colonial heritage.',
    overview:
      'Unlike the built-up southern beach resorts, Kalpitiya has a raw, wind-brushed coastal character of salt pans, fishing boats, sandbars, and coconut groves. Reliable thermal winds make its shallow lagoons one of Asia’s premier kite-surfing destinations, while the calm winter months from November to April open up offshore boat excursions to observe large pods of spinner dolphins and snorkel over the shallow coral gardens of Bar Reef Marine Sanctuary.',
    highlights: [
      'Flat-water kite surfing on Kalpitiya Lagoon & Donkey Point',
      'Large pods of wild spinner dolphins offshore (November to April)',
      'Bar Reef Marine Sanctuary snorkelling & 17th-century Kalpitiya Dutch Fort',
    ],
    thingsToSee: [
      'Kalpitiya Lagoon & Vella Island Sandbar — Shallow, wind-swept lagoons ideal for beginner and advanced kite surfers',
      'Bar Reef Marine Sanctuary — Offshore reef system visited by boat during the calm November–April window',
      'Kalpitiya Dutch Fort (1667–1676) — Coral-and-limestone VOC fort built to control cinnamon and areca-nut trade on Puttalam Lagoon',
      'St. Anne’s National Shrine, Talawila — Revered Catholic beachfront pilgrimage church on the peninsula',
    ],
    thingsToDo: [
      'Take multi-day kite-surfing lessons with IKO-certified instructors on the flat-water lagoon',
      'Join a sunrise boat trip (Nov–Apr) to watch spinner dolphins offshore',
      'Pair a coastal stay in Kalpitiya with a wildlife safari in nearby Wilpattu National Park (approx. 1 hour drive to the park gate)',
    ],
    seasonalActivities: [
      'May to October (Southwest monsoon wind season) brings the strongest, most consistent winds for kite surfing, while December to March offers a secondary winter wind season',
      'November to April brings calm ocean conditions required for dolphin watching, whale watching, and Bar Reef snorkelling',
    ],
    specialConsiderations: [
      'Ocean boat trips for dolphins and Bar Reef are strictly seasonal (November–April) due to rough seas during the May–October wind season.',
    ],
    relatedTourIds: ['wind-and-reef', 'wilpattu-wilderness'],
    tags: [
      'kalpitiya',
      'kite surfing',
      'dolphins',
      'bar reef',
      'snorkelling',
      'diving',
      'northwest coast',
    ],
    seoTitle: 'Kalpitiya Travel Guide | Kite Surfing, Spinner Dolphins & Bar Reef',
    seoDescription:
      'Discover Kalpitiya on Sri Lanka’s northwest peninsula: kite surfing seasons, November–April dolphin watching, Bar Reef snorkelling, and Wilpattu combos.',
    featuredOnHome: false,
    order: 32,
  },
  {
    id: 'trincomalee',
    slug: 'trincomalee',
    entryNumber: 24,
    name: 'Trincomalee',
    region: 'coast',
    regionLabel: 'Northeast Coast · Trincomalee District',
    categories: ['beaches-coast', 'culture-heritage', 'wildlife-nature'],
    season: 'Best Apr – Oct (East Coast dry season)',
    tagline: 'Deep natural harbour, cliff-top Koneswaram Temple & Fort Frederick',
    description:
      'Wrapped around one of the world’s finest deep-water natural harbours on Sri Lanka’s northeast coast, Trincomalee blends the cliff-top Hindu shrine of Koneswaram, 17th-century Fort Frederick, hot springs, and calm summer beaches.',
    overview:
      'When the southwest coast experiences its mid-year monsoon, Trincomalee and the east coast bask in sunshine and calm turquoise seas from April to October. Rising high on Swami Rock inside Fort Frederick where spotted deer roam freely under banyan trees, the sacred Koneswaram Kovil looks straight down into the Indian Ocean—making it both a major Hindu pilgrimage site and a vantage point for offshore marine life.',
    highlights: [
      'Thirukoneswaram Kovil on Swami Rock & Lover’s Leap cliff viewpoint',
      'Fort Frederick historic ramparts & roaming spotted deer',
      'Kanniya Seven Hot Water Springs & Velgam Vehera ancient forest ruins',
    ],
    thingsToSee: [
      'Koneswaram Temple (Thirukoneswaram) — Revered Shiva temple perched atop the sheer cliff of Swami Rock overlooking the Bay of Bengal',
      'Fort Frederick — Fortification built by the Portuguese in 1624 and rebuilt by the Dutch in 1665 on the rocky promontory',
      'Kanniya Hot Water Springs — Seven ancient square brick wells fed by natural geothermal springs of varying temperatures just inland from town',
      'Gokanna Viharaya & Maritime Museum — Historic shrines and naval history exhibits overlooking Dutch Bay',
      'Velgam Vehera (Natanar Kovil) — Rare ancient Buddhist monastery with Tamil inscriptions showing shared religious heritage north of Trincomalee',
    ],
    thingsToDo: [
      'Walk through Fort Frederick to Koneswaram Temple in the early morning or late afternoon',
      'Relax on nearby Dutch Bay, Uppuveli, or Nilaveli beaches during the April–October season',
      'Take a seasonal morning whale and dolphin watching boat excursion (typically March–August)',
    ],
    seasonalActivities: [
      'April to October is the prime east-coast season with calm, clear seas and dry sunny days',
      'November to February brings the northeast monsoon rains',
    ],
    festivals: [
      'Koneswaram Ther (Chariot) Festival (March/April) & Mahashivaratri — Major Hindu festivals celebrated atop Swami Rock',
    ],
    specialConsiderations: [
      'Cover shoulders and knees and remove footwear before entering the Koneswaram Temple precinct on Swami Rock.',
    ],
    relatedTourIds: ['ceylon-grand-circuit', 'australian-adventure-combo'],
    tags: [
      'trincomalee',
      'koneswaram',
      'fort frederick',
      'swami rock',
      'east coast',
      'beaches',
      'whale watching',
    ],
    seoTitle: 'Trincomalee Travel Guide | Koneswaram Temple, Fort Frederick & East Coast',
    seoDescription:
      'Explore Trincomalee on Sri Lanka’s northeast coast: cliff-top Koneswaram Temple, Fort Frederick, Kanniya hot springs, and April–October beach stays.',
    featuredOnHome: false,
    order: 33,
  },
  {
    id: 'nilaveli',
    slug: 'nilaveli',
    entryNumber: 25,
    name: 'Nilaveli',
    region: 'coast',
    regionLabel: 'Northeast Coast · North of Trincomalee',
    categories: ['beaches-coast', 'wildlife-nature'],
    season: 'Best Apr – Oct',
    tagline: 'Wide white-sand east-coast beach & gateway to Pigeon Island National Park',
    description:
      'Located about sixteen kilometers north of Trincomalee town, Nilaveli is a broad, tranquil stretch of pale sand and shallow turquoise water that serves as the primary boat departure point for Pigeon Island Marine National Park.',
    overview:
      'Known in Tamil as the "Open Moon-Shine Land," Nilaveli offers a quieter, more spacious beachfront atmosphere than Uppuveli further south. During the east-coast dry season from April to October, the sea is gentle and clear, ideal for early morning swimming and short boat crossings to Pigeon Island—one of Sri Lanka’s two marine national parks.',
    highlights: [
      'Long, uncrowded white-sand beach with gentle summer swells (Apr–Oct)',
      'Boat excursions to Pigeon Island Marine National Park for reef snorkelling',
      'Periyakulam Lagoon birdwatching & serene sunrise ocean horizons',
    ],
    thingsToSee: [
      'Nilaveli Beach — Expansive coastal stretch bordered by casuarina trees and palmyra palms',
      'Pigeon Island National Park — Offshore island sanctuary comprising Large Pigeon Island and Small Pigeon Island, named after the wild rock pigeons that nest in its cliffs',
      'Red Rocks & Periyakulam Lagoon — Coastal rock formations and inland birdwatching lagoon',
    ],
    thingsToDo: [
      'Swim in the calm morning waters along Nilaveli Beach between April and October',
      'Take an early morning boat to Pigeon Island National Park to snorkel alongside blacktip reef sharks and sea turtles',
      'Enjoy a multi-day east-coast beach rest after touring the Cultural Triangle (Sigiriya/Polonnaruwa/Anuradhapura)',
    ],
    seasonalActivities: [
      'April to October is the ideal season for swimming and Pigeon Island boat crossings',
      'Avoid weekends and public holidays when visiting Pigeon Island if you prefer quieter snorkelling conditions, and always enter at early morning',
    ],
    specialConsiderations: [
      'When snorkelling at Pigeon Island, wear reef-safe sunscreen, never stand on or touch coral, and maintain a respectful distance from blacktip reef sharks and turtles.',
    ],
    relatedTourIds: ['culture-and-coast', 'family-island-discovery'],
    tags: [
      'nilaveli',
      'pigeon island',
      'snorkelling',
      'east coast',
      'trincomalee',
      'beach',
    ],
    seoTitle: 'Nilaveli Travel Guide | White-Sand Beach & Pigeon Island Snorkelling',
    seoDescription:
      'Plan a beach stay in Nilaveli near Trincomalee: April–October swimming season, responsible snorkelling at Pigeon Island National Park, and coastal tours.',
    featuredOnHome: false,
    order: 34,
  },
  {
    id: 'uppuveli',
    slug: 'uppuveli',
    entryNumber: 26,
    name: 'Uppuveli',
    region: 'coast',
    regionLabel: 'Northeast Coast · Trincomalee',
    categories: ['beaches-coast', 'adventure'],
    season: 'Best Apr – Oct',
    tagline: 'Relaxed palm-lined bay, beachfront cafes & diving hub just north of Trincomalee',
    description:
      'Just six kilometers north of Trincomalee town center, Uppuveli combines a long, gently shelving golden beach with a welcoming strip of barefoot seafood cafes, dive centers, and boutique coastal stays.',
    overview:
      'While Nilaveli to the north is quieter and more spread out, Uppuveli offers a sociable, walkable coastal village atmosphere along Alles Garden and Fernando’s strip. During the April–October east-coast season, calm waters make Uppuveli a popular base for PADI scuba diving, snorkelling, paddleboarding, and evening beach dining.',
    highlights: [
      'Calm, gently sloping swimming beach during the April–October season',
      'Walkable beachfront cafes, dive schools & relaxed village lanes',
      'Close proximity to Trincomalee’s Fort Frederick & Koneswaram Temple',
    ],
    thingsToSee: [
      'Uppuveli Beach & Alles Garden — Wide golden shoreline where colourful local fishing boats pull up beside beach lounges',
      'Trincomalee Commonwealth War Cemetery — Landscaped, peaceful historical cemetery located along the road between Trincomalee and Nilaveli',
    ],
    thingsToDo: [
      'Go scuba diving or snorkelling at offshore rocky reefs with a PADI dive center (Apr–Oct)',
      'Watch colourful fishing nets (mahadel) pulled ashore by local fishermen in the morning',
      'Explore Koneswaram Temple and Fort Frederick just 15 minutes south',
    ],
    seasonalActivities: [
      'April to October brings flat, clear waters and sunny east-coast beach days',
    ],
    diningOptions: [
      {
        name: 'Fernando’s Bar (Beach Club)',
        cuisine: 'Beachfront Grill, Wood-Fired Pizza & Refreshments',
        contact: 'Alles Garden, Uppuveli, Trincomalee',
        notes: 'Relaxed palm-shaded beach setting right on the sand.',
        verified: false,
      },
      {
        name: 'Rice ’n’ Curry Restaurant',
        cuisine: 'Traditional Sri Lankan Seafood & Vegetable Curries',
        contact: 'Nilaveli Road, Uppuveli',
        notes: 'Popular local kitchen serving generous multi-dish rice and curry.',
        verified: false,
      },
    ],
    specialConsiderations: [
      'Most dive centers and seasonal beach bars operate at full capacity between April and October and scale back during the November–February northeast monsoon.',
    ],
    relatedTourIds: ['culture-and-coast', 'australian-adventure-combo'],
    tags: [
      'uppuveli',
      'trincomalee',
      'east coast',
      'diving',
      'snorkelling',
      'beach',
    ],
    seoTitle: 'Uppuveli Travel Guide | Trincomalee Beaches, Diving & Coastal Stays',
    seoDescription:
      'Discover Uppuveli Beach in Trincomalee: April–October swimming and scuba diving season, beachfront dining, and east-coast Sri Lanka itineraries.',
    featuredOnHome: false,
    order: 35,
  },
  {
    id: 'pasikuda',
    slug: 'pasikuda',
    entryNumber: 27,
    name: 'Pasikuda',
    region: 'coast',
    regionLabel: 'East Coast · Batticaloa District',
    categories: ['beaches-coast'],
    season: 'Best Apr – Oct',
    tagline: 'Shallow coral-protected bay with crystal-clear, waist-deep turquoise water',
    description:
      'Curving around a reef-protected horseshoe bay north of Batticaloa, Pasikuda (and neighbouring Kalkudah) is famous for having one of the longest, shallowest, and calmest stretches of swimming water in Sri Lanka during the east-coast summer season.',
    overview:
      'Because an outer reef system breaks the ocean swell far offshore, visitors at Pasikuda Bay can walk out a hundred meters or more in calm, waist-deep turquoise water between April and October. Lined with upscale beachfront resorts, Pasikuda is an exceptional choice for families with young children and travellers seeking pure coastal relaxation after touring Polonnaruwa (roughly 1.5 hours inland) and Sigiriya.',
    highlights: [
      'Shallow, reef-protected turquoise bay ideal for safe swimming (Apr–Oct)',
      'Quiet, unspoiled neighbouring Kalkudah Beach just around the headland',
      'Luxury beachfront resorts within 90 minutes of Polonnaruwa',
    ],
    thingsToSee: [
      'Pasikuda Bay — Calm crescent bay with warm, shallow water and gentle white sand',
      'Kalkudah Beach — Adjacent two-kilometer golden beach with an uncrowded, natural coastline',
      'Coconut Cultural Park — Restored coconut plantation walk showcasing coastal agriculture after the 1978 cyclone',
    ],
    thingsToDo: [
      'Swim, paddleboard, and kayak in the calm waters of Pasikuda Bay from April to October',
      'Take a morning boat trip to offshore reefs or the WWII wreck of HMS Hermes (for advanced certified divers off Batticaloa/Pasikuda)',
      'Pair a 3- to 4-night beach stay in Pasikuda with Polonnaruwa and Minneriya in the Cultural Triangle',
    ],
    seasonalActivities: [
      'April to October is the prime dry, calm-water season on the east coast',
      'November to February brings the northeast monsoon winds and rain',
    ],
    specialConsiderations: [
      'Avoid stepping on shallow coral patches in the outer bay.',
    ],
    relatedTourIds: ['culture-and-coast', 'family-island-discovery'],
    tags: [
      'pasikuda',
      'passikudah',
      'kalkudah',
      'east coast',
      'shallow bay',
      'family beach',
      'luxury stays',
    ],
    seoTitle: 'Pasikuda Travel Guide | Shallow Turquoise Bay, Kalkudah & East Coast Resorts',
    seoDescription:
      'Plan a relaxing beach stay in Pasikuda on Sri Lanka’s east coast: calm shallow swimming (Apr–Oct), Kalkudah Beach, family resorts, and Polonnaruwa pairings.',
    featuredOnHome: false,
    order: 36,
  },
  {
    id: 'arugam-bay',
    slug: 'arugam-bay',
    entryNumber: 41,
    name: 'Arugam Bay',
    region: 'coast',
    regionLabel: 'Southeast Coast · Ampara District',
    categories: ['beaches-coast', 'adventure', 'wildlife-nature'],
    season: 'Prime Surf & Safari Season May – Oct',
    tagline: 'World-renowned right-hand point breaks, Pottuvil Lagoon & Kumana wildlife',
    description:
      'Set on Sri Lanka’s southeastern coast where dry-zone lagoons and forest reserves meet long sand points, Arugam Bay is an internationally recognized surfing destination famous for its long right-hand point breaks from May to October.',
    overview:
      'What makes Arugam Bay unique is the combination of world-class seasonal surf and immediate proximity to wild nature. While surfers ride the long peeling waves of Main Point, Whiskey Point, Peanut Farm, and Baby Point, nature travellers glide by paddle boat through the mangroves of Pottuvil Lagoon, climb ancient Kudumbigala Monastery, and take uncrowded 4x4 safaris into neighbouring Kumana (Yala East) National Park.',
    highlights: [
      'Long right-hand surf breaks at Main Point, Baby Point, Whiskey Point & Peanut Farm',
      'Kumana (Yala East) National Park safaris for leopards, elephants & waterbirds',
      'Pottuvil Lagoon mangrove boat safaris & Muhudu Maha Viharaya coastal ruins',
    ],
    thingsToSee: [
      'Main Point & Baby Point — Iconic headland surf breaks at the southern end of Arugam Bay',
      'Whiskey Point, Pottuvil Point & Peanut Farm — Scenic surf bays framed by granite boulders and lagoons north and south of town',
      'Kumana National Park (Yala East) — Renowned wetland and dry-forest sanctuary just south of Arugam Bay, famous for the Kumana Villu bird nesting season and leopards',
      'Muhudu Maha Viharaya (Pottuvil) — Ancient Buddhist temple ruins set in coastal sand dunes linked to the legend of Princess Viharamahadevi',
      'Kudumbigala Monastery — Historic forest hermitage and hilltop stupa with 360-degree views across Kumana and the coast',
    ],
    thingsToDo: [
      'Surf beginner waves at Baby Point or long point breaks at Main Point, Whiskey Point, and Peanut Farm (May–Oct)',
      'Take a quiet early-morning or sunset mangrove boat safari on Pottuvil Lagoon or Urani Lagoon to watch elephants and birdlife',
      'Embark on a private morning safari into Kumana National Park',
    ],
    seasonalActivities: [
      'May to October is the prime surf and dry-weather season on the southeast coast',
      'April to July is the peak nesting season for thousands of waterbirds at Kumana Villu',
    ],
    diningOptions: [
      {
        name: 'Hideaway Resort Restaurant & Bar',
        cuisine: 'Contemporary Sri Lankan & International',
        contact: 'Panama Road, Arugam Bay',
        notes: 'Leafy garden restaurant known for fresh seafood and relaxed ambience.',
        verified: false,
      },
      {
        name: 'Tandoori Hut',
        cuisine: 'Grilled Seafood, Rotis & Curries',
        contact: 'Main Street, Arugam Bay',
        notes: 'Casual evening spot for freshly grilled catch of the day.',
        verified: false,
      },
    ],
    specialConsiderations: [
      'Wild elephants regularly cross roads around Panama, Pottuvil, and Peanut Farm at dusk and dawn—never walk or ride scooters on bush tracks after dark.',
    ],
    relatedTourIds: [
      'two-coasts-surf-circuit',
      'australian-adventure-combo',
    ],
    tags: [
      'arugam bay',
      'surfing',
      'kumana',
      'whiskey point',
      'peanut farm',
      'pottuvil lagoon',
      'east coast',
      'adventure',
    ],
    seoTitle: 'Arugam Bay Travel Guide | Surf Point Breaks, Kumana Safaris & Lagoon Tours',
    seoDescription:
      'Plan your trip to Arugam Bay, Sri Lanka: May–October surf season at Main Point and Whiskey Point, Kumana National Park safaris, and Pottuvil Lagoon boats.',
    featuredOnHome: false,
    order: 37,
  },
  {
    id: 'hikkaduwa',
    slug: 'hikkaduwa',
    entryNumber: 42,
    name: 'Hikkaduwa',
    region: 'coast',
    regionLabel: 'Southwest Coast · Galle District',
    categories: ['beaches-coast', 'adventure'],
    season: 'Best Nov – Apr',
    tagline: 'Protected fringing coral sanctuary, surf breaks & southwest coastal heritage',
    description:
      'Located along the southwest coast roughly twenty kilometers north of Galle, Hikkaduwa is one of Sri Lanka’s longest-established beach towns—combining the Hikkaduwa Coral Sanctuary, reliable November–April surf waves at Narigama, and inland lagoon excursions.',
    overview:
      'Designated a marine nature reserve in 1979 and elevated to a national park, Hikkaduwa’s shallow fringing reef shelters tropical reef fish and visiting green turtles, while the wide sandy stretch south toward Narigama Beach offers consistent beach and reef breaks for surfers during the dry winter months.',
    highlights: [
      'Hikkaduwa Marine National Park fringing coral reef snorkelling (Nov–Apr)',
      'Consistent surf breaks along Narigama Beach & Benny’s reef',
      'Rathgama & Hikkaduwa Lagoon kayaking and nearby Tsunami Photo Museum',
    ],
    thingsToSee: [
      'Hikkaduwa Marine National Park — Fringing coral reef parallel to the northern shore, best snorkelled in calm morning conditions',
      'Narigama Beach — Wide, palm-lined southern stretch of Hikkaduwa known for surfing, sunsets, and beachfront dining',
      'Seenigama Muhudu Viharaya — Small historic temple set on a rocky islet just offshore north of Hikkaduwa',
      'Community Tsunami Museum (Telwatta) — Moving, educational community memorial documenting the 2004 Indian Ocean tsunami',
    ],
    thingsToDo: [
      'Snorkel over the outer reef or go scuba diving on offshore shipwrecks (such as the SS Conch) between November and April',
      'Surf beach and reef breaks along Narigama',
      'Kayak through the quiet mangroves of Hikkaduwa or Dodanduwa Lagoon',
    ],
    seasonalActivities: [
      'November to April brings clear water for snorkelling/diving and clean offshore winds for surfing',
      'May to October brings strong southwest monsoon swells and turbid water',
    ],
    specialConsiderations: [
      'Never touch, feed, or crowd wild sea turtles that swim into the shallows at Hikkaduwa, and never stand on coral heads.',
    ],
    relatedTourIds: ['southern-shores-in-luxury', 'galle-fort-and-beach-days'],
    tags: [
      'hikkaduwa',
      'narigama',
      'coral reef',
      'snorkelling',
      'surfing',
      'diving',
      'southwest coast',
    ],
    seoTitle: 'Hikkaduwa Travel Guide | Marine Sanctuary, Narigama Surf & Southwest Coast',
    seoDescription:
      'Explore Hikkaduwa on Sri Lanka’s southwest coast: November–April snorkelling and surfing season, Narigama Beach, Dodanduwa lagoon, and responsible turtle tips.',
    featuredOnHome: false,
    order: 38,
  },
  {
    id: 'mount-lavinia',
    slug: 'mount-lavinia',
    entryNumber: 43,
    name: 'Mount Lavinia',
    region: 'colombo',
    regionLabel: 'Western Coast · Southern Suburb of Colombo',
    categories: ['beaches-coast', 'cities-local', 'culture-heritage'],
    season: 'Year-round · Calmest seas Nov – Apr',
    tagline: 'Historic 1806 Governor’s cliffside residence & Colombo’s Golden Mile sunset beach',
    description:
      'Just south of central Colombo, Mount Lavinia is famous for its sweeping "Golden Mile" shoreline and the whitewashed colonial Mount Lavinia Hotel—built in 1806 on a rocky promontory as the residence of British Governor Sir Thomas Maitland.',
    overview:
      'Steeped in the nineteenth-century romance between Governor Maitland and the local mestizo dancer Lovina Aponsuwa (after whom the headland is named), Mount Lavinia offers a nostalgic coastal breather within easy reach of Colombo and our home base in Battaramulla. In the late afternoon, locals and visitors stroll the beach below the cliffside terrace as the sun sets into the Indian Ocean.',
    highlights: [
      'Historic 1806 Mount Lavinia Hotel cliffside terrace & colonial heritage',
      'Golden Mile beach sunset walks & beachfront seafood restaurants',
      'Close proximity to Bellanwila Raja Maha Vihara & Attidiya Bird Sanctuary',
    ],
    thingsToSee: [
      'Mount Lavinia Promontory & Governor’s Mansion — Historic 1806 residence overlooking the bay and coastal railway line',
      'Golden Mile Beach — Long sandy shoreline stretching north toward Dehiwala and Wellawatte',
      'Bellanwila Raja Maha Vihara (Nearby Inland) — Revered Buddhist temple famous for its ancient Bodhi tree and expressive modern murals by artist Somabandu Vidyapathi',
    ],
    thingsToDo: [
      'Enjoy afternoon tea or sunset refreshments on the cliffside terrace of Mount Lavinia Hotel',
      'Dine on fresh crab, prawns, and grilled fish at a toes-in-the-sand restaurant along the beach',
      'Visit nearby Bellanwila Temple during an evening illumination',
    ],
    seasonalActivities: [
      'Visited year-round for dining and sunsets; ocean swells are calmest between December and March',
    ],
    specialConsiderations: [
      'The coastal railway line runs directly along the back of the beach; always look both ways and stay clear of the tracks when crossing to the sand.',
    ],
    relatedTourIds: ['india-to-island-express'],
    tags: [
      'mount lavinia',
      'colombo beach',
      'colonial heritage',
      'bellanwila',
      'sunset',
      'seafood',
    ],
    seoTitle: 'Mount Lavinia Travel Guide | Colonial Heritage Terrace & Colombo Sunset Beach',
    seoDescription:
      'Visit Mount Lavinia just south of Colombo: the historic 1806 Governor’s Mansion terrace, Golden Mile beach dining, and Bellanwila Temple.',
    featuredOnHome: false,
    order: 39,
  },
  {
    id: 'beruwala-aluthgama',
    slug: 'beruwala-aluthgama',
    entryNumber: 44,
    name: 'Beruwala & Aluthgama',
    region: 'coast',
    regionLabel: 'Southwest Coast · Kalutara District',
    categories: ['beaches-coast', 'culture-heritage'],
    season: 'Best Nov – Apr',
    tagline: 'Moragalla golden beach, Barberyn Lighthouse Island & historic Ketchimale Mosque',
    description:
      'Situated immediately north of the Bentota River estuary where Arab maritime traders first made landfall over a millennium ago, Beruwala and Aluthgama blend the wide golden sands of Moragalla Beach with Barberyn Island Lighthouse, Ketchimale Mosque, and Kande Viharaya.',
    overview:
      'Separated from Bentota only by the bridge over the Bentota Ganga at Aluthgama, the Beruwala coastline curves from the calm, reef-sheltered waters of Moragalla north to the rocky headland of Ketchimale—site of one of Sri Lanka’s oldest historic mosques—and offshore Barberyn (Welmaduwa) Island, crowned by its 1889 white lighthouse.',
    highlights: [
      'Moragalla & Beruwala Golden Mile beaches with Ayurvedic resort retreats',
      'Offshore Barberyn (Welmaduwa) Island Lighthouse boat excursions',
      'Historic Ketchimale Mosque & Kande Viharaya hilltop Buddhist temple',
    ],
    thingsToSee: [
      'Barberyn Island Lighthouse (1889) — 34-meter white stone lighthouse on a palm-shaded island ten minutes offshore by boat',
      'Ketchimale Mosque — Historic whitewashed mosque perched on a wave-washed headland overlooking Beruwala fishing harbour',
      'Kande Viharaya (Aluthgama) — Revered 18th-century Buddhist temple featuring an ancient Bodhi tree, relic chamber, and monumental seated Buddha',
      'Moragalla Beach — Calm, wide stretch of sand extending south to the Bentota River mouth',
    ],
    thingsToDo: [
      'Take a morning boat trip across to Barberyn Island to view the 19th-century lighthouse',
      'Combine Moragalla Beach relaxation or an Ayurvedic wellness stay with a Bentota River mangrove safari',
      'Visit Kande Viharaya and nearby Geoffrey Bawa’s Brief Garden',
    ],
    seasonalActivities: [
      'November to April offers calm seas for swimming and boat crossings to Barberyn Island',
    ],
    specialConsiderations: [
      'Dress modestly (covering shoulders, knees, and head where required) when visiting Ketchimale Mosque and Kande Viharaya.',
    ],
    relatedTourIds: [
      'sky-sea-and-river',
      'little-explorers',
      'hills-and-beaches-for-friends',
    ],
    tags: [
      'beruwala',
      'aluthgama',
      'moragalla',
      'barberyn lighthouse',
      'kande viharaya',
      'ketchimale',
      'ayurveda',
      'beach',
    ],
    seoTitle: 'Beruwala & Aluthgama Guide | Moragalla Beach, Barberyn Lighthouse & Temples',
    seoDescription:
      'Explore Beruwala and Aluthgama on Sri Lanka’s southwest coast: Moragalla Beach, Barberyn Island Lighthouse, Kande Viharaya, and Bentota estuary boat trips.',
    featuredOnHome: false,
    order: 40,
  },
  {
    id: 'kalutara',
    slug: 'kalutara',
    entryNumber: 47,
    name: 'Kalutara',
    region: 'coast',
    regionLabel: 'Southwest Coast · Kalutara District',
    categories: ['beaches-coast', 'culture-heritage'],
    season: 'Year-round · Best Coast Season Nov – Apr',
    tagline: 'Sacred Kalutara Bodhiya, hollow white Chaitya stupa & Richmond Castle',
    description:
      'Where the broad Kalu Ganga (Black River) meets the Indian Ocean forty kilometers south of Colombo, Kalutara is a historic spice-port town known for the hollow Kalutara Chaitya stupa, the sacred Kalutara Bodhiya, and the Edwardian manor of Richmond Castle.',
    overview:
      'Impossible to miss when crossing the Kalu Ganga bridge, the gleaming white Kalutara Chaitya is one of the very few hollow Buddhist stupas in the world, containing a painted inner dome and 74 murals depicting the life of the Buddha. Alongside its palm-lined sandspit and basket-weaving handicrafts, Kalutara offers cultural visits to Richmond Castle and the ancient prehistoric caves of Fa-Hien Lena (Pahiyangala) inland.',
    highlights: [
      'Kalutara Bodhiya & rare hollow Kalutara Chaitya stupa beside Kalu Ganga',
      'Richmond Castle — Early 20th-century hilltop planter’s mansion',
      'Calido sandspit estuary & inland excursion to Pahiyangala (Fa-Hien) Cave',
    ],
    thingsToSee: [
      'Kalutara Chaitya & Sacred Bodhiya — Hollow white stupa designed by engineering pioneer A.N.S. Kulasinghe, paired with one of the thirty-two sacred saplings of the Jaya Sri Maha Bodhi',
      'Richmond Castle — 1910 hilltop mansion blending British Edwardian, Indian Rajput, and local carpentry details amid a 42-acre fruit and rubber estate',
      'Kalu Ganga Estuary — Picturesque river mouth where traditional outrigger canoes and basket weavers operate',
      'Fa-Hien Cave (Pahiyangala, Inland near Bulathsinhala) — Massive natural rock shelter yielding some of South Asia’s oldest prehistoric human fossils',
    ],
    thingsToDo: [
      'Step inside the hollow dome of Kalutara Chaitya and pay respects at the Kalutara Bodhiya',
      'Tour the teak carvings and verandas of Richmond Castle',
      'Relax at a beachfront resort in Kalutara or Wadduwa as a convenient first or final stop within an hour of Colombo',
    ],
    seasonalActivities: [
      'Cultural landmarks are open year-round; sea conditions along Kalutara and Wadduwa are calmest from November to April',
    ],
    specialConsiderations: [
      'Shoulders and knees must be covered and footwear removed when entering the Kalutara Bodhiya and inside the hollow stupa.',
    ],
    relatedTourIds: ['little-explorers', 'family-island-discovery'],
    tags: [
      'kalutara',
      'kalutara bodhiya',
      'richmond castle',
      'kalu ganga',
      'southwest coast',
      'beach',
    ],
    seoTitle: 'Kalutara Travel Guide | Kalutara Bodhiya, Hollow Stupa & Richmond Castle',
    seoDescription:
      'Discover Kalutara on Sri Lanka’s southwest coast: the hollow Kalutara Chaitya stupa, sacred Bodhi tree, Richmond Castle, and beach resorts near Colombo.',
    featuredOnHome: false,
    order: 41,
  },

  // ===========================================================================
  // CITIES, ISLANDS AND OTHER EXPERIENCES (8)
  // ===========================================================================
  {
    id: 'colombo-battaramulla',
    slug: 'colombo',
    entryNumber: 17,
    name: 'Colombo',
    region: 'colombo',
    regionLabel: 'Western Province · Ocean Capital & Battaramulla Home Base',
    categories: ['cities-local', 'culture-heritage'],
    season: 'Year-round · Ideal at the start or end of your journey',
    tagline: 'Oceanfront capital, Pettah markets, Geoffrey Bawa heritage & Thalangama Wetland',
    description:
      'Where Indian Ocean sunsets over Galle Face Green meet historic Fort architecture, Pettah’s spice bazaars, Gangaramaya Temple, and the tranquil urban birdlife of Thalangama Wetland in Battaramulla—Colombo rewards unhurried exploration.',
    overview:
      'Often treated merely as a transit stop, Sri Lanka’s commercial and cultural capital offers a rich tapestry of centuries-old maritime history and contemporary island life. Based at No. 596/1, Thalangama South, Battaramulla, Bimondo Travels operates curated half-day and full-day experiences spanning early-morning birdwalks around Thalangama Tank, the 15th-century royal capital of Sri Jayawardenepura Kotte, sacred Kelaniya Raja Maha Vihara, Geoffrey Bawa’s Number 11 townhouse, the National Museum, and evening street-food trails.',
    highlights: [
      'Gangaramaya Temple, Seema Malaka on Beira Lake & Independence Square',
      'Colombo National Museum, Geoffrey Bawa’s Number 11 & Pettah bazaars',
      'Thalangama Wetland birdwalks, Kotte heritage & Galle Face Green sunsets',
    ],
    thingsToSee: [
      'Gangaramaya Temple & Seema Malaka — Eclectic Buddhist temple complex and Geoffrey Bawa-designed floating meditation pavilion on Beira Lake',
      'Colombo National Museum & Independence Memorial Hall — 1877 Italianate museum housing royal regalia of the Kandyan kings, beside leafy Cinnamon Gardens',
      'Colombo Fort & Pettah Bazaar — Historic Dutch Hospital, Red Mosque (Jami Ul-Alfar), and bustling streets of spices, textiles, and produce',
      'Galle Face Green — Oceanfront promenade where Colombo families gather at sunset for kite flying andisso wadei (prawn cakes)',
      'Thalangama Environmental Protection Area & Kotte (Battaramulla) — Urban wetland sanctuary for resident and migratory birds right beside Sri Lanka’s administrative capital',
      'Kelaniya Raja Maha Vihara — Revered ancient temple on the Kelani River famous for Solias Mendis murals',
    ],
    thingsToDo: [
      'Join our signature morning Thalangama Wetland Birdwalk or Kotte Heritage Walk from Battaramulla',
      'Explore Colombo City Highlights including the National Museum, Gangaramaya, Seema Malaka, and Independence Square',
      'Take an evening Colombo Food Trail sampling hoppers, kottu, lamprais, and fresh seafood',
      'Book an advance architectural tour of Geoffrey Bawa’s residence at Number 11 (33rd Lane, Bagatale Road)',
    ],
    hikingTrails: [
      'Thalangama Lake & Paddy Bund Footpaths — Level morning birdwatching and village walk around Thalangama Tank in Battaramulla',
      'Colombo Fort & Pettah Heritage Walk — Guided urban architectural and market walk',
    ],
    seasonalActivities: [
      'Year-round city and cultural destination; early mornings (6:00–9:00 AM) and late afternoons (from 4:00 PM) are best for outdoor walking tours',
    ],
    festivals: [
      'Navam Perahera (February Full Moon) — Grand evening elephant, drummer, and dancer procession hosted by Gangaramaya Temple around Beira Lake',
      'Vesak Poya (May) — Spectacular illuminated pandals (thorana) and lantern zones around Beira Lake and Bauddhaloka Mawatha',
      'Duruthu Perahera at Kelaniya Temple (January) — Historic pageant at Kelaniya Raja Maha Vihara',
    ],
    diningOptions: [
      {
        name: 'Ministry of Crab',
        cuisine: 'Sri Lankan Lagoon Crab & Seafood',
        contact: 'Old Dutch Hospital, Colombo 01',
        notes: 'Celebrated crab kitchen set inside the restored 17th-century Dutch Hospital; advance reservations recommended.',
        verified: false,
      },
      {
        name: 'Upali’s by Nawaloka',
        cuisine: 'Authentic Sri Lankan Rice & Curry & Hoppers',
        contact: '65 C.W.W. Kannangara Mawatha, Colombo 07',
        notes: 'Overlooking Viharamahadevi Park; classic regional Sri Lankan dishes.',
        verified: false,
      },
      {
        name: 'Gallery Cafe (Paradise Road)',
        cuisine: 'Contemporary Sri Lankan & International',
        contact: '2 Alfred House Road, Colombo 03',
        notes: 'Housed in the former offices of architect Geoffrey Bawa.',
        verified: false,
      },
    ],
    specialConsiderations: [
      'Tours of Geoffrey Bawa’s Number 11 residence require advance timed reservations.',
      'Dress modestly when visiting Gangaramaya, Kelaniya Temple, or the Red Mosque in Pettah.',
    ],
    relatedTourIds: [
      'india-to-island-express',
      'ceylon-grand-circuit',
      'family-island-discovery',
    ],
    tags: [
      'colombo',
      'battaramulla',
      'thalangama',
      'gangaramaya',
      'pettah',
      'galle face green',
      'kotte',
      'kelaniya',
      'food trail',
      'city tour',
    ],
    seoTitle: 'Colombo & Battaramulla Travel Guide | City Highlights, Food Trails & Wetlands',
    seoDescription:
      'Explore Colombo and Battaramulla with Bimondo Travels: Gangaramaya Temple, Pettah, Galle Face Green, Thalangama Wetland birdwalks, and day experiences.',
    staggerVariant: 'compact-mid',
    featuredOnHome: true,
    order: 8,
  },
  {
    id: 'mannar-island',
    slug: 'mannar-island',
    entryNumber: 34,
    name: 'Mannar Island',
    region: 'coast',
    regionLabel: 'Northwest Coast · Mannar District',
    categories: ['cities-local', 'wildlife-nature', 'culture-heritage'],
    season: 'Migratory Bird Season Nov – Mar · Dry weather May – Sep',
    tagline: 'Ancient baobab trees, Adam’s Bridge sandbars & winter flamingo flocks',
    description:
      'Connected to the northwestern mainland by a causeway across shallow tidal flats, Mannar Island is an atmospheric, wind-swept frontier of giant African baobab trees, 16th-century fort ramparts, wild donkeys, and the sandbars of Adam’s Bridge (Rama’s Bridge).',
    overview:
      'Positioned along the Central Asian Flyway at the narrowest point of the Palk Strait facing India, Mannar’s lagoons and mudflats become a haven for tens of thousands of migratory waterbirds—including greater flamingos, Eurasian wigeons, and terns—between November and March. On the island itself, centuries-old baobab trees planted by Arab sea traders stand alongside the Dutch-rebuilt Mannar Fort, Thiruketheeswaram Kovil on the mainland approach, and the white sands of Talaimannar Pier.',
    highlights: [
      'Winter migratory birdwatching & Greater Flamingos along the Mannar causeway (Nov–Mar)',
      '700-year-old Pallimunai Baobab Tree & 16th-century Mannar Fort',
      'Talaimannar Pier, lighthouse & the sandshoals of Adam’s Bridge',
    ],
    thingsToSee: [
      'Pallimunai Giant Baobab Tree — One of around forty ancient baobab trees on Mannar, measuring over 19 meters in circumference',
      'Adam’s Bridge (Rama Setu) Sandbars & Talaimannar — Chain of limestone shoals and sandspits stretching from the western tip of Mannar toward Dhanushkodi in India',
      'Mannar Fort (1560 / 1658) — Square stone fort guarding the channel at the entrance to the island',
      'Vankalai Sanctuary & Causeway Mudflats — Ramsar wetland site attracting flamingos, ducks, gulls, and shorebirds in winter',
      'Thiruketheeswaram Kovil & Giant’s Tank — Ancient Paadal Petra Sthalam Shiva temple and historic irrigation reservoir on the mainland near Mannar',
    ],
    thingsToDo: [
      'Observe migratory flamingos and waders along the Vankalai and Mannar causeway wetlands at dawn (November–March)',
      'Visit the ancient Pallimunai Baobab tree, Mannar Fort, and Talaimannar Lighthouse',
      'Include Mannar on a northwestern route linking Anuradhapura/Wilpattu with Jaffna',
    ],
    seasonalActivities: [
      'November to March is the essential season for migratory birds and flamingos',
      'May to September is dry and sunny with strong Palk Strait breezes',
    ],
    specialConsiderations: [
      'Mannar has a dry, sun-exposed coastal climate; bring sun protection, a hat, and binoculars for birdwatching.',
    ],
    relatedTourIds: ['wilpattu-wilderness', 'ancient-kingdoms'],
    tags: [
      'mannar',
      'mannar island',
      'flamingos',
      'baobab tree',
      'adams bridge',
      'talaimannar',
      'birdwatching',
      'north sri lanka',
    ],
    seoTitle: 'Mannar Island Travel Guide | Flamingos, Baobab Trees & Adam’s Bridge',
    seoDescription:
      'Discover Mannar Island in northwestern Sri Lanka: November–March flamingo migration, ancient baobab trees, Mannar Fort, Talaimannar, and northern routes.',
    featuredOnHome: false,
    order: 42,
  },
  {
    id: 'batticaloa',
    slug: 'batticaloa',
    entryNumber: 35,
    name: 'Batticaloa',
    region: 'coast',
    regionLabel: 'East Coast · Batticaloa District',
    categories: ['cities-local', 'beaches-coast', 'culture-heritage'],
    season: 'Best Apr – Oct',
    tagline: 'Lagoon city of the Singing Fish, 1682 Dutch Fort & Kallady Bridge',
    description:
      'Set on a network of islands and peninsulas surrounded by an expansive coastal lagoon on Sri Lanka’s east coast, Batticaloa is a serene cultural town known for its 17th-century Dutch Fort, Kallady Bridge, and peaceful beaches.',
    overview:
      'Just thirty minutes south of Pasikuda Bay, Batticaloa—"Land of the Singing Fish"—is defined by water on every side. Its four-bastioned stone Dutch Fort (built by the Portuguese in 1628 and rebuilt by the Dutch in 1682) overlooks the palm-fringed Batticaloa Lagoon, while the historic Kallady Bridge leads toward the quiet shoreline of Kallady Beach and the tall Batticaloa Lighthouse at Palameenmadu.',
    highlights: [
      '17th-century Batticaloa Dutch Fort overlooking the lagoon',
      'Kallady Bridge, Gandhi Park waterfront & Batticaloa Lighthouse',
      'Quiet Kallady Beach & easy pairing with Pasikuda Bay',
    ],
    thingsToSee: [
      'Batticaloa Fort — Well-preserved four-bastion coral and stone fort standing directly beside the lagoon channel',
      'Kallady Bridge (Lady Manning Bridge) — Historic iron bridge famous in local lore for the faint musical sounds ("singing fish") heard in the lagoon waters beneath on quiet full-moon nights',
      'Batticaloa Lighthouse & Palameenmadu Estuary — 28-meter lighthouse built in 1913 where the lagoon meets the Indian Ocean',
      'St. Mary’s Cathedral & Mamangam Kovil — Historic religious landmarks reflecting Batticaloa’s rich eastern heritage',
    ],
    thingsToDo: [
      'Walk the ramparts of Batticaloa Fort and stroll the lagoon promenade in the late afternoon',
      'Climb or view the Batticaloa Lighthouse and watch lagoon fishermen casting nets at the estuary mouth',
      'Visit Batticaloa on a cultural afternoon excursion while staying at nearby Pasikuda or Kalkudah',
    ],
    seasonalActivities: [
      'April to October offers sunny, dry weather and calm east-coast seas',
    ],
    specialConsiderations: [
      'Part of Batticaloa Fort houses local district administrative offices; explore the ramparts respectfully during visiting hours.',
    ],
    relatedTourIds: ['culture-and-coast'],
    tags: [
      'batticaloa',
      'kallady',
      'dutch fort',
      'singing fish',
      'east coast',
      'pasikuda',
      'lagoon',
    ],
    seoTitle: 'Batticaloa Travel Guide | Dutch Fort, Lagoon Heritage & Kallady Beach',
    seoDescription:
      'Explore Batticaloa on Sri Lanka’s east coast: the 1682 Dutch Fort, Batticaloa Lagoon, Kallady Bridge, lighthouse views, and Pasikuda excursions.',
    featuredOnHome: false,
    order: 43,
  },
  {
    id: 'jaffna',
    slug: 'jaffna',
    entryNumber: 36,
    name: 'Jaffna',
    region: 'culture',
    regionLabel: 'Northern Peninsula · Jaffna District',
    categories: ['culture-heritage', 'cities-local', 'beaches-coast'],
    season: 'Year-round · Drier months Jan – Sep',
    tagline: 'Nallur Kandaswamy Kovil, Jaffna Fort, northern islands & Tamil culinary heritage',
    description:
      'At the northern crown of Sri Lanka, the Jaffna Peninsula offers a distinct cultural landscape of palmyra groves, towering Hindu kovils, the star-shaped Dutch Jaffna Fort, offshore islands reached by causeway and ferry, and celebrated Jaffna cuisine.',
    overview:
      'Connected to the southern mainland via Elephant Pass and the iconic <i>Yal Devi</i> railway, Jaffna has a centuries-old Tamil cultural, literary, and maritime identity. Visitors witness the resonant temple bells and rituals of Nallur Kandaswamy Kovil, walk the vast 55-acre ramparts of Jaffna Fort beside the lagoon, admire the neoclassical Jaffna Public Library, soak in the sacred coastal springs of Keerimalai, and take morning boats out to Nainativu (Nagadeepa) and Delft Island.',
    highlights: [
      'Nallur Kandaswamy Kovil, Jaffna Public Library & 1680 Dutch Star Fort',
      'Nainativu (Nagadeepa) Buddhist Vihara & Nagapooshani Amman Kovil island ferry',
      'Casuarina Beach on Karainagar, Keerimalai Springs & Jaffna crab curry',
    ],
    thingsToSee: [
      'Nallur Kandaswamy Kovil — Golden-striped Hindu temple with soaring gopuram towers and deeply moving daily puja ceremonies',
      'Jaffna Fort — Expansive pentagon-shaped Dutch fortress rebuilt in 1680 overlooking Jaffna Lagoon',
      'Jaffna Public Library — Iconic white domed landmark of scholarship and architecture beside the fort',
      'Nainativu Island (Nagadeepa) — Offshore island reached by causeway to Kurikadduwan and a short boat ride, home to both the sacred Nagadeepa Purana Viharaya and the Hindu Nagapooshani Amman Kovil',
      'Keerimalai Sacred Water Springs & Kankesanthurai (KKS) — Natural freshwater mineral baths right beside the northern sea and nearby Kadurugoda (Kandarodai) miniature stupas',
      'Casuarina Beach & Point Pedro — Shallow white-sand beach on Karainagar Island and the northernmost point of Sri Lanka at Point Pedro',
    ],
    thingsToDo: [
      'Attend the morning or evening puja at Nallur Kandaswamy Kovil',
      'Take a morning excursion across the Palk Strait causeways to Nainativu (Nagadeepa) or Delft Island',
      'Sample signature Jaffna crab curry, odiyal kool (seafood soup), and Rio Ice Cream near Nallur',
    ],
    seasonalActivities: [
      'January to September is dry and sunny across the northern peninsula; October to December brings the northeast monsoon rains',
    ],
    festivals: [
      'Nallur Festival (August) — 25-day grand Hindu festival at Nallur Kandaswamy Kovil featuring daily chariot (Ther) and water-cutting ceremonies',
      'Thai Pongal (Mid-January) — Traditional Tamil harvest festival celebrated across every home and temple in Jaffna',
    ],
    diningOptions: [
      {
        name: 'Mangos Indian Veg',
        cuisine: 'Jaffna & South Indian Vegetarian (Dosas & Thalis)',
        contact: '213/1 Temple Road, Nallur, Jaffna',
        notes: 'Popular vegetarian kitchen near Nallur Kovil.',
        verified: false,
      },
      {
        name: 'Cosy Restaurant / Green Grass',
        cuisine: 'Traditional Jaffna Crab Curry & Northern Seafood',
        contact: 'Hospital Road, Jaffna',
        notes: 'Known for aromatic roasted-spice Jaffna crab curry.',
        verified: false,
      },
      {
        name: 'Rio Ice Cream',
        cuisine: 'Sundae Parlor & Fruit Ice Creams',
        contact: 'Point Pedro Road, Nallur, Jaffna',
        notes: 'Beloved local landmark right beside Nallur Kandaswamy Kovil.',
        verified: false,
      },
    ],
    specialConsiderations: [
      'At Nallur Kandaswamy Kovil, men are traditionally required to remove shirts/tops before entering the inner temple courtyard, and everyone must dress modestly and remove footwear.',
    ],
    relatedTourIds: ['ancient-kingdoms', 'ceylon-grand-circuit'],
    tags: [
      'jaffna',
      'nallur kovil',
      'jaffna fort',
      'nagadeepa',
      'nainativu',
      'casuarina beach',
      'keerimalai',
      'tamil culture',
    ],
    seoTitle: 'Jaffna Travel Guide | Nallur Kovil, Jaffna Fort, Islands & Northern Cuisine',
    seoDescription:
      'Plan a cultural journey to Jaffna in northern Sri Lanka: Nallur Kandaswamy Kovil, Jaffna Fort, Nagadeepa Island, Keerimalai Springs, and Jaffna cuisine.',
    featuredOnHome: false,
    order: 44,
  },
  {
    id: 'kitulgala-horton-plains',
    slug: 'kitulgala',
    entryNumber: 38,
    name: 'Kitulgala',
    region: 'hills',
    regionLabel: 'Sabaragamuwa Wet Zone · Kelani River Valley',
    categories: ['adventure', 'wildlife-nature', 'hill-country-hiking'],
    season: 'Year-round · Best Jan – Apr & Jul – Oct',
    tagline: 'Kelani River white-water rafting, canyoning, Belilena Cave & wet-zone birding',
    description:
      'Set in a lush, forested gorge along the Kelani River on the scenic mountain road between Colombo/Negombo and Nuwara Eliya/Hatton, Kitulgala is Sri Lanka’s white-water rafting and rainforest adventure capital.',
    overview:
      'Immortalized as the filming location for the 1957 Academy Award-winning classic <i>The Bridge on the River Kwai</i>, Kitulgala sits in the wettest zone of the island where emerald hills drop steeply into the Kelani Ganga. Alongside Grade II–III white-water rafting and natural rock-slide canyoning in tributary streams, the Makandawa Forest Reserve across the river is one of Sri Lanka’s best sites for spotting rare wet-zone endemic birds, while prehistoric Belilena Cave nearby yielded 30,000-year-old Balangoda Man skeletal remains.',
    highlights: [
      'Grade II–III white-water rafting on the scenic Kelani River',
      'Natural rock-slide canyoning & waterfall abseiling with safety-vetted operators',
      'Makandawa Rainforest birdwatching & prehistoric Belilena Cave',
    ],
    thingsToSee: [
      'Kelani River Gorge — Emerald river valley framed by rainforest hills and rubber estates',
      'Makandawa Forest Reserve — Lowland wet-zone forest reached by suspension footbridge across the Kelani River, home to the Serendib scops owl, Sri Lanka frogmouth, and chestnut-backed owlet',
      'Belilena Prehistoric Cave — Large natural cavern high on a hillside near Kitulgala where Mesolithic "Balangoda Man" fossils and microlith tools were excavated',
      'Aberdeen Falls & Laxapana Falls (Nearby Ginigathena/Maskeliya) — Dramatic highland waterfalls a short drive up the valley',
    ],
    thingsToDo: [
      'Experience guided white-water rafting on the Kelani River with life jackets, helmets, and safety kayakers',
      'Try stream canyoning and natural water slides in clear rainforest tributaries',
      'Take an early-morning birdwatching walk in Makandawa Forest Reserve',
    ],
    hikingTrails: [
      'Makandawa Rainforest Trail — Shaded forest walk across the Kelani River suspension bridge for endemic birds and butterflies',
      'Belilena Cave Walk — Uphill path through rubber plantations to the prehistoric rock shelter',
    ],
    seasonalActivities: [
      'January to April and July to October offer the most reliable river levels for white-water rafting and canyoning',
      'Water levels on the Kelani River are regulated by upstream hydro dams as well as rainfall',
    ],
    specialConsiderations: [
      'Only raft or canyon with licensed operators who provide proper helmets, buoyancy aids, and safety briefings, and who cancel trips if heavy upstream rains raise river levels dangerously.',
    ],
    relatedTourIds: ['waves-and-rapids', 'sky-sea-and-river'],
    tags: [
      'kitulgala',
      'white water rafting',
      'kelani river',
      'canyoning',
      'makandawa',
      'belilena',
      'adventure',
      'birdwatching',
    ],
    seoTitle: 'Kitulgala Travel Guide | Kelani River Rafting, Canyoning & Rainforest Birding',
    seoDescription:
      'Plan your adventure in Kitulgala, Sri Lanka: Kelani River white-water rafting, canyoning, Makandawa rainforest birdwatching, and private adventure tours.',
    staggerVariant: 'tall-deep',
    featuredOnHome: true,
    order: 5,
  },
  {
    id: 'negombo',
    slug: 'negombo',
    entryNumber: 39,
    name: 'Negombo',
    region: 'colombo',
    regionLabel: 'Western Coast · Near Bandaranaike International Airport (CMB)',
    categories: ['cities-local', 'beaches-coast', 'culture-heritage'],
    season: 'Year-round · Calmest seas Dec – Apr',
    tagline: 'Historic Dutch Canal, Negombo Lagoon, Lellama fish market & coastal stays near CMB',
    description:
      'Located just twenty minutes from Bandaranaike International Airport (CMB), Negombo is a historic coastal and lagoon town where traditional outrigger sails (oruwa), a 17th-century Dutch canal network, and pastel Catholic churches welcome travellers on arrival or before departure.',
    overview:
      'Long prized by Portuguese, Dutch, and British traders for the wild cinnamon growing around its hinterland, Negombo is far more than an airport stopover. To the south stretches the vast brackish Negombo Lagoon and Muthurajawela Marsh—a rich mangrove ecosystem for boat safaris—while along the coast stand the 1672 Dutch Fort gate, St. Mary’s Church with its painted ceiling, and the bustling morning Lellama fish market at Munnakkara bridge.',
    highlights: [
      '20 minutes from Colombo International Airport (CMB) — ideal arrival/departure base',
      'Negombo Lagoon & Muthurajawela Marsh mangrove boat excursions',
      'Hamilton Dutch Canal, Lellama morning fish market & St. Mary’s Church',
    ],
    thingsToSee: [
      'Negombo Lagoon & Muthurajawela Wetland — Expansive coastal lagoon and marsh system supporting mangroves, kingfishers, herons, water monitors, and traditional prawn fishermen',
      'Hamilton Canal (Dutch Canal) — 14.5 km historic waterway linking Puttalam to Colombo through the heart of Negombo',
      'Lellama Fish Market & Dry-Fish Beach — Early-morning fish auction at the lagoon mouth and coconut-mat fish drying yards along the outer beach',
      'St. Mary’s Church & Negombo Dutch Fort Remains — Neoclassical cathedral with ceiling frescoes by Buddhist painter N.S. Godamanne, and the 1672 stone fort gateway beside the lagoon',
    ],
    thingsToDo: [
      'Book our signature Negombo Lagoon Day experience before an evening departure flight or on your first morning in Sri Lanka',
      'Take a quiet morning boat ride through the Muthurajawela canal and Negombo Lagoon',
      'Visit the Lellama fish market around 6:30–8:00 AM as night fishing boats land their catch',
    ],
    seasonalActivities: [
      'Lagoon boat tours and cultural sights operate year-round; ocean swells along Negombo Beach are calmest from December to April',
    ],
    diningOptions: [
      {
        name: 'Lords Restaurant Complex',
        cuisine: 'Fresh Seafood, Sri Lankan & International',
        contact: '75B Poruthota Road, Ettukala, Negombo',
        notes: 'Art-filled garden restaurant along the Poruthota beach strip.',
        verified: false,
      },
      {
        name: 'King Coconut Restaurant',
        cuisine: 'Coastal Seafood & Lagoon Prawns',
        contact: 'Poruthota Road, Negombo Beach',
        notes: 'Beachfront dining overlooking the Indian Ocean.',
        verified: false,
      },
    ],
    specialConsiderations: [
      'Because Negombo is much closer to Bandaranaike International Airport (approx. 20 minutes) than central Colombo, it is the most relaxing choice after a late-night arrival or before an early-morning flight.',
    ],
    relatedTourIds: ['ceylon-grand-circuit', 'family-island-discovery'],
    tags: [
      'negombo',
      'negombo lagoon',
      'muthurajawela',
      'dutch canal',
      'fish market',
      'airport stay',
      'west coast',
    ],
    seoTitle: 'Negombo Travel Guide | Lagoon Boat Safaris, Dutch Canal & Airport Stays',
    seoDescription:
      'Discover Negombo near Colombo Airport: Negombo Lagoon and Muthurajawela boat rides, Hamilton Dutch Canal, Lellama fish market, and day experiences.',
    featuredOnHome: false,
    order: 45,
  },
  {
    id: 'pinnawala',
    slug: 'pinnawala',
    entryNumber: 40,
    name: 'Pinnawala',
    region: 'culture',
    regionLabel: 'Sabaragamuwa Province · Kegalle District (Colombo–Kandy Route)',
    categories: ['wildlife-nature', 'cities-local'],
    season: 'Year-round',
    tagline: 'Maha Oya river elephant bathing views & stopover along the Colombo–Kandy route',
    description:
      'Located near Rambukkana in the Kegalle District just off the main highway and railway between Colombo and Kandy, Pinnawala is known for the Maha Oya riverbanks where captive herd elephants bathe daily.',
    overview:
      'Established in 1975 by the Department of Wildlife Conservation and later managed by the Department of National Zoological Gardens, the Pinnawala facility cares for a large herd of captive elephants that walk down to the shallow rocky rapids of the Maha Oya river twice daily. For travellers seeking wild or hands-off rewilding experiences, we also advise comparing Pinnawala with the ethical Udawalawe Elephant Transit Home (ETH) or national park safaris in Udawalawe and Minneriya.',
    highlights: [
      'Watching the elephant herd bathe in the Maha Oya river from riverside terraces',
      'Conveniently located between Colombo/Negombo and Kandy near Rambukkana',
      'Nearby paper-making workshops producing recycled elephant-dung stationery',
    ],
    thingsToSee: [
      'Maha Oya River Bathing Stretch — Shallow rocky riverbed where the herd gathers in the late morning and early afternoon',
      'Eco Paper Workshops — Local community workshops demonstrating how fibrous elephant dung is cleaned and pressed into handmade paper and notebooks',
    ],
    thingsToDo: [
      'Observe the elephant herd bathing in the Maha Oya river from a respectful distance on the riverbank veranda (typically around 10:00 AM–12:00 PM and 2:00 PM–4:00 PM)',
      'Learn about handmade recycled paper craft at a local Rambukkana workshop',
    ],
    seasonalActivities: [
      'Open year-round along the Colombo–Kandy corridor',
    ],
    specialConsiderations: [
      'Responsible Wildlife Note: Bimondo Travels does not endorse elephant riding or chaining practices. For travellers who prefer strictly wild or rewilding-focused elephant encounters, we recommend visiting the Udawalawe Elephant Transit Home or taking a national park safari in Udawalawe, Minneriya, or Kaudulla.',
    ],
    relatedTourIds: ['little-explorers', 'family-island-discovery'],
    tags: [
      'pinnawala',
      'maha oya',
      'elephants',
      'kandy route',
      'rambukkana',
    ],
    seoTitle: 'Pinnawala Visitor Guide | Maha Oya River Views & Ethical Wildlife Advice',
    seoDescription:
      'Information on visiting Pinnawala between Colombo and Kandy: Maha Oya river viewing times, handmade paper workshops, and ethical wild elephant alternatives.',
    featuredOnHome: false,
    order: 46,
  },
  {
    id: 'delft-island',
    slug: 'delft-island',
    entryNumber: 45,
    name: 'Delft Island',
    region: 'coast',
    regionLabel: 'Palk Strait · Jaffna Islands',
    categories: ['cities-local', 'culture-heritage', 'wildlife-nature'],
    season: 'Best Jan – Sep',
    tagline: 'Coral-stone walls, wild ponies, giant baobab tree & Dutch island ruins off Jaffna',
    description:
      'Reached by a one-hour morning boat crossing from Kurikadduwan jetty off the Jaffna peninsula, Delft Island (Neduntheevu) is a flat, coral-limestone island where wild ponies graze among dry-stone coral walls, a hollow giant baobab tree, and Portuguese/Dutch fort ruins.',
    overview:
      'Named "Delft" by Dutch VOC governor Rijckloff van Goens after the Dutch city (and known in Tamil as Neduntheevu), the island was used during the Portuguese, Dutch, and British eras for breeding horses. Descendants of those horses still roam wild across the open plains at the southern end of the island, while villagers build household fences from stacked fossilized brain coral.',
    highlights: [
      'Wild Delft ponies roaming open coastal plains & shallow lagoons',
      'Coral-stone Dutch Fort ruins, Pigeon House (dovecote) & Queen’s Tower',
      'Hollow Giant Baobab Tree & stacked brain-coral village walls',
    ],
    thingsToSee: [
      'Delft Dutch Fort & Old Hospital Ruins — Atmospheric coral-limestone ruins near the northern landing jetty',
      'Dutch Pigeon House (Dovecote) — Intact coral-stone tower with dozens of nesting niches built to house carrier pigeons used for messages across the Palk Strait',
      'Giant Hollow Baobab Tree — Ancient African baobab with a natural hollow trunk large enough for several people to stand inside',
      'Wild Ponies Plains & Queen’s Tower — Open southern grasslands where protected feral ponies graze near the old navigation tower',
      'Growing Stone & Giant’s Footprint — Local coral-limestone curiosities along the island circuit',
    ],
    thingsToDo: [
      'Take the morning passenger boat or a private charter boat from Kurikadduwan Jetty (approx. 1 hour each way)',
      'Explore the island circuit by local open-backed three-wheeler or jeep with a Jaffna guide',
    ],
    seasonalActivities: [
      'January to September offers calmer Palk Strait crossings and dry weather',
      'October to December brings rough northeast monsoon winds that can disrupt ferry schedules',
    ],
    specialConsiderations: [
      'Ferry departures from Kurikadduwan Jetty leave early in the morning (typically 8:00–9:00 AM) and return after midday—arrive at the jetty at least 30 minutes early and carry water, snacks, and sun protection.',
    ],
    relatedTourIds: ['ancient-kingdoms', 'ceylon-grand-circuit'],
    tags: [
      'delft island',
      'neduntheevu',
      'jaffna islands',
      'wild ponies',
      'coral walls',
      'baobab',
      'dutch fort',
    ],
    seoTitle: 'Delft Island (Neduntheevu) Guide | Wild Ponies, Coral Ruins & Jaffna Ferry',
    seoDescription:
      'Plan a day trip to Delft Island (Neduntheevu) from Jaffna: Kurikadduwan ferry advice, wild ponies, coral-stone Dutch ruins, and the giant baobab tree.',
    featuredOnHome: false,
    order: 47,
  },
];

/**
 * Builds the complete 47-destination catalog with empty image fields so that
 * no external, stock, or AI-generated images are ever injected.
 */
export const SRI_LANKA_47_DESTINATIONS: CmsDestination[] =
  RAW_47_DESTINATIONS.map((item) => ({
    id: item.id,
    slug: item.slug,
    entryNumber: item.entryNumber,
    name: item.name,
    region: item.region,
    regionLabel: item.regionLabel,
    categories: item.categories,
    season: item.season,
    tagline: item.tagline,
    description: item.description,
    overview: item.overview,
    highlights: item.highlights,
    thingsToSee: item.thingsToSee,
    thingsToDo: item.thingsToDo,
    hikingTrails: item.hikingTrails || [],
    seasonalActivities: item.seasonalActivities,
    festivals: item.festivals || [],
    diningOptions: item.diningOptions || [],
    specialConsiderations: item.specialConsiderations,
    relatedTourIds: item.relatedTourIds,
    tags: item.tags,
    seoTitle: item.seoTitle,
    seoDescription: item.seoDescription,
    image: '',
    imageRef: {
      url: '',
      key: null,
      alt: item.name,
    },
    staggerVariant: item.staggerVariant || 'mid-up',
    featuredOnHome: item.featuredOnHome === true,
    showDiningSection: true,
    visible: true,
    order: item.order,
    deletedAt: null,
    deletedBy: null,
  }));

/**
 * Normalizes a destination name or slug for safe, case-insensitive deduplication.
 */
export function normalizeDestinationKey(value: string | undefined | null): string {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Resolves the canonical URL slug for any CmsDestination.
 */
export function resolveDestinationSlug(dest: Pick<CmsDestination, 'id' | 'slug' | 'name'>): string {
  if (dest.slug && dest.slug.trim()) {
    return normalizeDestinationKey(dest.slug);
  }
  const byId = SRI_LANKA_47_DESTINATIONS.find((d) => d.id === dest.id);
  if (byId?.slug) return byId.slug;

  const normalizedId = normalizeDestinationKey(dest.id);
  const bySlug = SRI_LANKA_47_DESTINATIONS.find((d) => d.slug === normalizedId);
  if (bySlug?.slug) return bySlug.slug;

  return normalizedId || normalizeDestinationKey(dest.name) || 'destination';
}

/**
 * Finds a destination from a list (or fallback catalog) by slug or ID.
 */
export function findDestinationBySlugOrId(
  destinations: CmsDestination[],
  slugOrId: string
): CmsDestination | null {
  const target = normalizeDestinationKey(slugOrId);
  if (!target) return null;

  for (const dest of destinations) {
    if (dest.deletedAt) continue;
    const candidateSlug = resolveDestinationSlug(dest);
    const candidateId = normalizeDestinationKey(dest.id);
    if (candidateSlug === target || candidateId === target) {
      return dest;
    }
  }

  for (const dest of SRI_LANKA_47_DESTINATIONS) {
    const candidateSlug = resolveDestinationSlug(dest);
    const candidateId = normalizeDestinationKey(dest.id);
    if (candidateSlug === target || candidateId === target) {
      return dest;
    }
  }

  return null;
}
