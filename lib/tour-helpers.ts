import type { CmsDestination, CmsTourItem } from '@/lib/cms-defaults';
import { TOURS, type Tour } from '@/lib/tours';
import {
  SRI_LANKA_47_DESTINATIONS,
  resolveDestinationSlug,
} from '@/lib/sri-lanka-47-destinations';

export function resolveTourSlug(
  tour: Pick<Tour, 'id' | 'name'> & { slug?: string }
): string {
  const raw = (tour.slug || tour.id || tour.name || '').trim().toLowerCase();
  const normalized = raw
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'sri-lanka-tour';
}

export function findTourBySlugOrId<T extends Tour & { slug?: string }>(
  list: T[],
  slugOrId: string
): T | undefined {
  const target = (slugOrId || '').trim().toLowerCase();
  if (!target) return undefined;
  return list.find(
    (t) =>
      resolveTourSlug(t) === target ||
      t.id.toLowerCase() === target
  );
}

/**
 * Curated destination-slug map for each of the 20 signature tours,
 * matching strictly the verified 47-destination catalog in lib/sri-lanka-47-destinations.ts.
 */
const TOUR_DESTINATION_SLUGS_MAP: Record<string, string[]> = {
  'waves-and-rapids': ['weligama', 'kitulgala', 'bentota'],
  'wind-reef-and-rainforest': ['kalpitiya', 'galle', 'sinharaja-rainforest'],
  'island-multi-sport-adventure': ['kitulgala', 'ella', 'arugam-bay', 'mirissa', 'kalpitiya'],
  'east-coast-surf-and-wilderness': ['arugam-bay', 'kumana-national-park', 'pasikudah'],
  'ceylon-grand-circuit': ['sigiriya', 'anuradhapura', 'polonnaruwa', 'kandy', 'ella', 'yala-national-park', 'galle'],
  'ancient-kingdoms': ['anuradhapura', 'polonnaruwa', 'sigiriya', 'dambulla'],
  'sacred-sri-lanka': ['anuradhapura', 'mihintale', 'dambulla', 'kandy', 'adams-peak'],
  'kandy-and-the-hill-capital': ['kandy', 'nuwara-eliya', 'knuckles-mountain-range'],
  'southern-shores-in-luxury': ['galle', 'unawatuna', 'mirissa'],
  'galle-fort-and-beach-days': ['galle', 'unawatuna'],
  'culture-and-coast': ['sigiriya', 'dambulla', 'kandy', 'galle', 'mirissa'],
  'leopards-elephants-whales': ['minneriya-national-park', 'udawalawe-national-park', 'yala-national-park', 'mirissa'],
  'wilpattu-wilderness': ['wilpattu-national-park', 'anuradhapura'],
  'the-pekoe-trail-walk': ['kandy', 'nuwara-eliya', 'haputale', 'ella'],
  'rainforest-and-waterfalls': ['sinharaja-rainforest', 'ella', 'horton-plains-worlds-end'],
  'family-island-discovery': ['sigiriya', 'kandy', 'ella', 'udawalawe-national-park', 'bentota', 'galle'],
  'little-explorers': ['kandy', 'udawalawe-national-park', 'bentota'],
  'india-to-island-express': ['colombo', 'kandy', 'nuwara-eliya'],
  'hills-and-beaches-for-friends': ['kandy', 'nuwara-eliya', 'ella', 'bentota'],
  'australian-adventure-combo': ['sigiriya', 'ella', 'yala-national-park', 'weligama', 'arugam-bay'],
};

export function getRelatedDestinationsForTour(
  tour: Pick<CmsTourItem, 'id' | 'route' | 'description' | 'relatedDestinationSlugs'>,
  allDestinations: CmsDestination[] = SRI_LANKA_47_DESTINATIONS
): CmsDestination[] {
  const visible = allDestinations.filter((d) => d.visible !== false && !d.deletedAt);
  const slugMap = new Map<string, CmsDestination>();
  for (const d of visible) {
    slugMap.set(resolveDestinationSlug(d), d);
  }

  const explicitSlugs =
    Array.isArray(tour.relatedDestinationSlugs) && tour.relatedDestinationSlugs.length > 0
      ? tour.relatedDestinationSlugs
      : TOUR_DESTINATION_SLUGS_MAP[tour.id] || [];

  const matched: CmsDestination[] = [];
  const seen = new Set<string>();

  for (const s of explicitSlugs) {
    const clean = s.trim().toLowerCase();
    const found = slugMap.get(clean);
    if (found && !seen.has(found.id)) {
      seen.add(found.id);
      matched.push(found);
    }
  }

  // Fallback: match destinations referenced by name in route or relatedTourIds
  if (matched.length < 3) {
    const routeLower = `${tour.route} ${tour.description}`.toLowerCase();
    for (const d of visible) {
      if (seen.has(d.id)) continue;
      const byRelation = (d.relatedTourIds || []).includes(tour.id);
      const shortName = d.name.split('&')[0].split('National Park')[0].trim().toLowerCase();
      const byRoute = shortName.length >= 4 && routeLower.includes(shortName);
      if (byRelation || byRoute) {
        seen.add(d.id);
        matched.push(d);
      }
      if (matched.length >= 6) break;
    }
  }

  return matched;
}

export function getStaticTourParams() {
  return TOURS.map((tour) => ({
    slug: resolveTourSlug(tour),
  }));
}
