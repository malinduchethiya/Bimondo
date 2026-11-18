import type { CmsExperienceMapPin } from '@/lib/cms-defaults';
import { SRI_LANKA_47_DESTINATIONS } from '@/lib/sri-lanka-47-destinations';

interface PinSeed {
  entryNumber: number;
  label: string;
  description: string;
  x: number;
  y: number;
}

const PIN_SEEDS: PinSeed[] = [
  {
    entryNumber: 1,
    label: 'Sigiriya',
    description:
      'An ancient rock fortress famous for its frescoes, royal gardens, and breathtaking panoramic views.',
    x: 48.0,
    y: 48.6,
  },
  {
    entryNumber: 2,
    label: 'Kandy',
    description:
      'Sri Lanka’s cultural capital, home to the sacred Temple of the Tooth Relic, scenic lake, and traditional Kandyan dances.',
    x: 42.8,
    y: 64.8,
  },
  {
    entryNumber: 3,
    label: 'Polonnaruwa',
    description:
      'A UNESCO-listed ancient kingdom featuring magnificent Buddhist temples, royal palaces, and stone sculptures.',
    x: 60.0,
    y: 48.5,
  },
  {
    entryNumber: 4,
    label: 'Anuradhapura',
    description:
      'An ancient sacred city known for its enormous stupas, historic monasteries, and the revered Sri Maha Bodhi tree.',
    x: 32.5,
    y: 39.2,
  },
  {
    entryNumber: 5,
    label: 'Dambulla',
    description:
      'Famous for its UNESCO-listed cave temple complex, containing ancient Buddha statues and colourful religious murals.',
    x: 43.6,
    y: 50.5,
  },
  {
    entryNumber: 6,
    label: 'Yala National Park',
    description:
      'A spectacular wildlife sanctuary renowned for leopards, elephants, sloth bears, and exciting jeep safaris.',
    x: 82.4,
    y: 87.9,
  },
  {
    entryNumber: 7,
    label: 'Udawalawe National Park',
    description:
      'A beautiful wildlife reserve famous for large elephant herds, open grasslands, and the Elephant Transit Home.',
    x: 54.7,
    y: 85.3,
  },
  {
    entryNumber: 8,
    label: 'Minneriya National Park',
    description:
      'Known for the seasonal Elephant Gathering, where large herds congregate around the Minneriya Reservoir.',
    x: 52.0,
    y: 46.1,
  },
  {
    entryNumber: 9,
    label: 'Wilpattu National Park',
    description:
      'Sri Lanka’s largest national park, featuring natural lakes, dense forests, leopards, and peaceful wildlife safaris.',
    x: 15.8,
    y: 35.5,
  },
  {
    entryNumber: 10,
    label: 'Sinharaja Rainforest',
    description:
      'A UNESCO World Heritage rainforest celebrated for its extraordinary biodiversity, endemic birds, and guided jungle treks.',
    x: 33.1,
    y: 87.1,
  },
  {
    entryNumber: 11,
    label: 'Horton Plains & World’s End',
    description:
      'A misty highland national park famous for dramatic cliff views, Baker’s Falls, and scenic hiking trails.',
    x: 50.3,
    y: 76.9,
  },
  {
    entryNumber: 12,
    label: 'Knuckles Mountain Range',
    description:
      'A breathtaking mountain wilderness featuring cloud forests, waterfalls, remote villages, and adventurous trekking routes.',
    x: 49.3,
    y: 60.6,
  },
  {
    entryNumber: 13,
    label: 'Pidurangala Rock',
    description:
      'A scenic rock formation offering spectacular sunrise views of Sigiriya and an adventurous climb through ancient monastery grounds.',
    x: 48.8,
    y: 45.8,
  },
  {
    entryNumber: 14,
    label: 'Ella',
    description:
      'A charming hill-country town famous for Nine Arches Bridge, Little Adam’s Peak, lush tea plantations, and waterfalls.',
    x: 61.3,
    y: 75.5,
  },
  {
    entryNumber: 15,
    label: 'Nuwara Eliya',
    description:
      'Known as “Little England,” this cool mountain town features colonial architecture, tea estates, gardens, and Gregory Lake.',
    x: 49.7,
    y: 73.4,
  },
  {
    entryNumber: 16,
    label: 'Haputale',
    description:
      'A peaceful mountain destination offering misty tea plantations, spectacular viewpoints, and the famous Lipton’s Seat.',
    x: 57.3,
    y: 78.0,
  },
  {
    entryNumber: 17,
    label: 'Colombo',
    description:
      'Sri Lanka’s vibrant commercial capital, combining modern skyscrapers, colonial heritage, colourful markets, and cultural landmarks.',
    x: 8.1,
    y: 74.0,
  },
  {
    entryNumber: 18,
    label: 'Galle',
    description:
      'A historic coastal city celebrated for its UNESCO-listed Dutch Fort, colonial streets, lighthouse, and charming boutique cafés.',
    x: 24.1,
    y: 96.2,
  },
  {
    entryNumber: 19,
    label: 'Mirissa',
    description:
      'A tropical beach paradise famous for whale watching, golden beaches, surfing, and the picturesque Coconut Tree Hill.',
    x: 35.5,
    y: 98.0,
  },
  {
    entryNumber: 20,
    label: 'Unawatuna',
    description:
      'A beautiful coastal village known for its sheltered beach, coral reefs, snorkelling, and nearby Japanese Peace Pagoda.',
    x: 27.2,
    y: 96.4,
  },
  {
    entryNumber: 21,
    label: 'Tangalle',
    description:
      'A tranquil southern coastal destination featuring uncrowded beaches, tropical lagoons, and turtle conservation experiences.',
    x: 50.0,
    y: 96.0,
  },
  {
    entryNumber: 22,
    label: 'Bentota',
    description:
      'A luxurious beach destination popular for water sports, river safaris, romantic resorts, and beautiful tropical gardens.',
    x: 15.0,
    y: 87.3,
  },
  {
    entryNumber: 23,
    label: 'Kalpitiya',
    description:
      'A scenic coastal peninsula renowned for kitesurfing, dolphin watching, coral reefs, and peaceful lagoons.',
    x: 3.6,
    y: 41.3,
  },
  {
    entryNumber: 24,
    label: 'Trincomalee',
    description:
      'A historic eastern coastal city famous for its natural harbour, beautiful beaches, and sacred Koneswaram Temple.',
    x: 69.2,
    y: 33.6,
  },
  {
    entryNumber: 25,
    label: 'Nilaveli',
    description:
      'A peaceful tropical beach destination known for turquoise waters, white sands, and snorkelling excursions to Pigeon Island.',
    x: 67.2,
    y: 28.5,
  },
  {
    entryNumber: 26,
    label: 'Uppuveli',
    description:
      'A relaxed beach village near Trincomalee offering calm coastal scenery, diving opportunities, and seaside relaxation.',
    x: 68.4,
    y: 31.2,
  },
  {
    entryNumber: 27,
    label: 'Pasikuda',
    description:
      'A beautiful eastern beach destination celebrated for its shallow turquoise bay, soft sands, and family-friendly swimming.',
    x: 84.3,
    y: 48.9,
  },
  {
    entryNumber: 28,
    label: 'Kataragama',
    description:
      'A sacred pilgrimage town where Buddhist, Hindu, and other religious traditions meet through temples and colourful festivals.',
    x: 74.1,
    y: 86.9,
  },
  {
    entryNumber: 29,
    label: 'Adam’s Peak (Sri Pada)',
    description:
      'A sacred mountain famous for its pilgrimage staircase, revered summit footprint, and spectacular sunrise views.',
    x: 36.7,
    y: 76.9,
  },
  {
    entryNumber: 30,
    label: 'Ritigala',
    description:
      'An ancient forest monastery hidden within a protected mountain reserve, featuring mysterious stone pathways and archaeological ruins.',
    x: 43.9,
    y: 44.2,
  },
  {
    entryNumber: 31,
    label: 'Buduruwagala',
    description:
      'A remarkable archaeological site featuring enormous ancient Buddhist rock carvings surrounded by peaceful natural scenery.',
    x: 62.7,
    y: 80.1,
  },
  {
    entryNumber: 32,
    label: 'Kanneliya Rainforest',
    description:
      'A biodiversity-rich tropical rainforest offering lush jungle trails, waterfalls, rare plants, and fascinating wildlife.',
    x: 30.2,
    y: 91.0,
  },
  {
    entryNumber: 33,
    label: 'Belihuloya',
    description:
      'A scenic mountain village surrounded by rivers, waterfalls, forests, and picturesque landscapes ideal for outdoor adventures.',
    x: 49.3,
    y: 79.3,
  },
  {
    entryNumber: 34,
    label: 'Mannar Island',
    description:
      'A unique northern island featuring historic forts, baobab trees, coastal landscapes, and important migratory bird habitats.',
    x: 6.5,
    y: 20.0,
  },
  {
    entryNumber: 35,
    label: 'Batticaloa',
    description:
      'A charming eastern coastal city known for its beautiful lagoon, historic Dutch Fort, beaches, and distinctive local culture.',
    x: 90.6,
    y: 54.1,
  },
  {
    entryNumber: 36,
    label: 'Jaffna',
    description:
      'The cultural heart of northern Sri Lanka, famous for Hindu temples, historic forts, island excursions, and authentic Tamil cuisine.',
    x: 15.5,
    y: 4.9,
  },
  {
    entryNumber: 37,
    label: 'Matale',
    description:
      'A picturesque central Sri Lankan town known for spice gardens, ancient temples, mountain scenery, and cultural heritage.',
    x: 42.3,
    y: 60.4,
  },
  {
    entryNumber: 38,
    label: 'Kitulgala',
    description:
      'Sri Lanka’s adventure tourism hotspot, famous for white-water rafting, rainforest trekking, canyoning, and the Kelani River.',
    x: 33.1,
    y: 72.4,
  },
  {
    entryNumber: 39,
    label: 'Negombo',
    description:
      'A lively coastal town near the international airport, known for sandy beaches, fishing traditions, canals, and seafood markets.',
    x: 6.6,
    y: 66.9,
  },
  {
    entryNumber: 40,
    label: 'Pinnawala',
    description:
      'A popular destination known for its elephant orphanage, elephant care experiences, and scenic surroundings along the Maha Oya River.',
    x: 31.7,
    y: 64.6,
  },
  {
    entryNumber: 41,
    label: 'Arugam Bay',
    description:
      'A world-famous surfing destination on Sri Lanka’s eastern coast, featuring excellent waves, relaxed beach culture, and scenic lagoons.',
    x: 96.7,
    y: 76.1,
  },
  {
    entryNumber: 42,
    label: 'Hikkaduwa',
    description:
      'A lively southwestern beach town famous for coral reefs, snorkelling, surfing, sea turtles, and vibrant coastal nightlife.',
    x: 19.1,
    y: 93.7,
  },
  {
    entryNumber: 43,
    label: 'Mount Lavinia',
    description:
      'A historic seaside suburb near Colombo, known for its sandy beach, colonial-era hotel, and beautiful Indian Ocean sunsets.',
    x: 8.2,
    y: 76.4,
  },
  {
    entryNumber: 44,
    label: 'Beruwala & Aluthgama',
    description:
      'Twin coastal destinations offering golden beaches, river lagoons, cultural landmarks, and relaxing boat excursions.',
    x: 13.4,
    y: 84.8,
  },
  {
    entryNumber: 45,
    label: 'Delft Island',
    description:
      'A remote northern island famous for wild ponies, coral-stone walls, Dutch colonial ruins, and unique island landscapes.',
    x: 2.0,
    y: 9.5,
  },
  {
    entryNumber: 46,
    label: 'Meemure',
    description:
      'A remote traditional village in the Knuckles Mountains, surrounded by spectacular peaks, forests, rivers, and untouched natural beauty.',
    x: 52.2,
    y: 61.3,
  },
  {
    entryNumber: 47,
    label: 'Kalutara',
    description:
      'A charming southwestern coastal town known for Kalutara Bodhiya, Richmond Castle, scenic river landscapes, and peaceful beaches.',
    x: 12.6,
    y: 82.4,
  },
];

const catalogByEntry = new Map(
  SRI_LANKA_47_DESTINATIONS.filter((d) => typeof d.entryNumber === 'number').map(
    (d) => [d.entryNumber as number, d]
  )
);

export const SRI_LANKA_47_MAP_PINS: CmsExperienceMapPin[] = PIN_SEEDS.map(
  (seed, idx) => {
    const cat = catalogByEntry.get(seed.entryNumber);
    return {
      id: `pin-dest-${seed.entryNumber}`,
      label: seed.label,
      regionEyebrow: cat?.regionLabel
        ? cat.regionLabel.toUpperCase()
        : 'SRI LANKA · DESTINATION GUIDE',
      heading: seed.label,
      headingItalic: '',
      description: seed.description,
      highlights: (cat?.highlights || []).slice(0, 3).join(' · '),
      ctaLabel: 'EXPLORE DESTINATION ↗',
      ctaHref: cat?.slug ? `/destinations/${cat.slug}` : '/destinations',
      x: seed.x,
      y: seed.y,
      visible: true,
      order: idx,
      deletedAt: null,
      deletedBy: null,
    };
  }
);

/**
 * Ensures the 47 canonical destination pins are present when the CMS mapPins array
 * has not yet been upgraded to the 47-destination pin set (`pin-dest-*`).
 * Once saved in Firestore with `pin-dest-*` IDs, admin edits, visibility toggles,
 * additions, and soft deletions are strictly respected.
 */
export function resolveExperienceMapPinsWith47(
  existingPins: CmsExperienceMapPin[] | undefined
): CmsExperienceMapPin[] {
  if (
    Array.isArray(existingPins) &&
    existingPins.some(
      (p) => typeof p?.id === 'string' && p.id.startsWith('pin-dest-')
    )
  ) {
    return existingPins;
  }
  return SRI_LANKA_47_MAP_PINS.map((pin) => ({ ...pin }));
}
