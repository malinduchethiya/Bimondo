import fs from 'fs';
import path from 'path';
import {
  CmsCustomerEnquiry,
  getDefaultCmsData,
  SiteCmsData,
} from '@/lib/cms-defaults';

export * from '@/lib/cms-defaults';

const CMS_FILE_PATH = path.join(process.cwd(), '.aistudio-site-cms.json');

const LEGACY_PLACEHOLDER_REVIEW_IDS = new Set([
  'rev-1',
  'rev-2',
  'rev-3',
  'rev-4',
]);

let memoryCmsCache: SiteCmsData | null = null;

export function readSiteCmsData(): SiteCmsData {
  const defaults = getDefaultCmsData();
  try {
    if (fs.existsSync(CMS_FILE_PATH)) {
      const raw = fs.readFileSync(CMS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<SiteCmsData>;

      // Ensure all 20 documented company profile tours are present
      let mergedTours = defaults.tours;
      if (Array.isArray(parsed.tours) && parsed.tours.length > 0) {
        const parsedById = new Map(parsed.tours.map((t) => [t.id, t]));
        const defaultIds = new Set(defaults.tours.map((t) => t.id));
        const customTours = parsed.tours.filter((t) => !defaultIds.has(t.id));
        mergedTours = [
          ...defaults.tours.map((defTour) => {
            const existing = parsedById.get(defTour.id);
            return existing
              ? {
                  ...defTour,
                  image: existing.image || defTour.image,
                }
              : defTour;
          }),
          ...customTours,
        ];
      }

      // Filter out legacy fabricated placeholder reviews while preserving any genuine admin-added reviews
      const mergedReviews = Array.isArray(parsed.reviews)
        ? parsed.reviews.filter((r) => !LEGACY_PLACEHOLDER_REVIEW_IDS.has(r.id))
        : defaults.reviews;

      const merged: SiteCmsData = {
        updatedAt: parsed.updatedAt || defaults.updatedAt,
        general: { ...defaults.general, ...(parsed.general || {}) },
        tours: mergedTours,
        stays: defaults.stays,
        destinations: defaults.destinations,
        gallery: Array.isArray(parsed.gallery)
          ? parsed.gallery
          : defaults.gallery,
        reviews: mergedReviews,
        faqs: defaults.faqs,
        enquiries: Array.isArray(parsed.enquiries)
          ? parsed.enquiries.filter(
              (e) => e.id !== 'enq-sample-1' && e.id !== 'enq-sample-2'
            )
          : defaults.enquiries,
      };
      memoryCmsCache = merged;
      return merged;
    }
  } catch {
    // Fallback to memory cache or defaults
  }
  if (memoryCmsCache) return memoryCmsCache;
  memoryCmsCache = defaults;
  return defaults;
}

function assertNoBase64Images(val: unknown, currentPath = 'cms'): void {
  if (typeof val === 'string') {
    if (val.trim().startsWith('data:image/')) {
      throw new Error(
        `Base64 image data rejected at "${currentPath}". All images must be uploaded to the Cloudflare R2 bucket and referenced by their R2 CDN URL.`
      );
    }
    return;
  }
  if (Array.isArray(val)) {
    val.forEach((v, idx) => assertNoBase64Images(v, `${currentPath}[${idx}]`));
    return;
  }
  if (val && typeof val === 'object') {
    Object.entries(val as Record<string, unknown>).forEach(([k, v]) =>
      assertNoBase64Images(v, `${currentPath}.${k}`)
    );
  }
}

export function writeSiteCmsData(patch: Partial<SiteCmsData>): SiteCmsData {
  assertNoBase64Images(patch);
  const current = readSiteCmsData();
  const next: SiteCmsData = {
    updatedAt: new Date().toISOString(),
    general: patch.general
      ? { ...current.general, ...patch.general }
      : current.general,
    tours: Array.isArray(patch.tours) ? patch.tours : current.tours,
    stays: Array.isArray(patch.stays) ? patch.stays : current.stays,
    destinations: Array.isArray(patch.destinations)
      ? patch.destinations
      : current.destinations,
    gallery: Array.isArray(patch.gallery) ? patch.gallery : current.gallery,
    reviews: Array.isArray(patch.reviews) ? patch.reviews : current.reviews,
    faqs: Array.isArray(patch.faqs) ? patch.faqs : current.faqs,
    enquiries: Array.isArray(patch.enquiries)
      ? patch.enquiries
      : current.enquiries,
  };

  memoryCmsCache = next;
  try {
    fs.writeFileSync(CMS_FILE_PATH, JSON.stringify(next, null, 2), 'utf-8');
  } catch {
    // If filesystem is read-only, memoryCmsCache persists for server runtime
  }
  return next;
}

export function appendCustomerEnquiry(
  input: Omit<CmsCustomerEnquiry, 'id' | 'createdAt' | 'status' | 'adminNotes'>
): CmsCustomerEnquiry {
  const current = readSiteCmsData();
  const newItem: CmsCustomerEnquiry = {
    id: `enq-${Date.now()}`,
    createdAt: new Date().toISOString(),
    name: input.name,
    email: input.email,
    arrival: input.arrival || 'Flexible',
    guests: input.guests || '2 travellers',
    duration: input.duration || '7–10 days',
    style: input.style || 'A little of everything',
    message: input.message || '',
    status: 'new',
    adminNotes: '',
  };
  writeSiteCmsData({
    enquiries: [newItem, ...current.enquiries],
  });
  return newItem;
}
