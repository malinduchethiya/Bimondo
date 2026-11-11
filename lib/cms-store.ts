import fs from 'fs';
import path from 'path';
import {
  CmsCustomerEnquiry,
  getDefaultCmsData,
  SiteCmsData,
} from '@/lib/cms-defaults';

export * from '@/lib/cms-defaults';

const CMS_FILE_PATH = path.join(process.cwd(), '.aistudio-site-cms.json');

let memoryCmsCache: SiteCmsData | null = null;

export function readSiteCmsData(): SiteCmsData {
  const defaults = getDefaultCmsData();
  try {
    if (fs.existsSync(CMS_FILE_PATH)) {
      const raw = fs.readFileSync(CMS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<SiteCmsData>;
      const merged: SiteCmsData = {
        updatedAt: parsed.updatedAt || defaults.updatedAt,
        general: { ...defaults.general, ...(parsed.general || {}) },
        tours: Array.isArray(parsed.tours) ? parsed.tours : defaults.tours,
        stays: Array.isArray(parsed.stays) ? parsed.stays : defaults.stays,
        destinations: Array.isArray(parsed.destinations)
          ? parsed.destinations
          : defaults.destinations,
        gallery: Array.isArray(parsed.gallery)
          ? parsed.gallery
          : defaults.gallery,
        reviews: Array.isArray(parsed.reviews)
          ? parsed.reviews
          : defaults.reviews,
        faqs: Array.isArray(parsed.faqs) ? parsed.faqs : defaults.faqs,
        enquiries: Array.isArray(parsed.enquiries)
          ? parsed.enquiries
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

export function writeSiteCmsData(patch: Partial<SiteCmsData>): SiteCmsData {
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
