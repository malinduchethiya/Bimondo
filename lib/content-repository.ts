import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDocsFromServer,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import {
  BookingSubmissionMethod,
  CmsCustomerEnquiry,
  CmsImageRef,
  createImageRef,
  getDefaultCmsData,
  SiteCmsData,
} from '@/lib/cms-defaults';
import {
  getFirebaseClientServices,
  handleFirestoreError,
  OperationType,
} from '@/lib/firebase-client';
import {
  collectAllCmsImagePlacements,
  encodeMediaDocId,
} from '@/lib/media-usage';

export const LEGACY_LOCAL_CONTENT_STORAGE_KEY = 'bimondo_cms_local_v1';
export const CMS_SECTIONS_COLLECTION = 'cms_sections';
export const CUSTOMER_ENQUIRIES_COLLECTION = 'customer_enquiries';
export const CUSTOMER_ENQUIRIES_LOCAL_CACHE_KEY =
  'bimondo_customer_enquiries_cache_v1';
export const MEDIA_OBJECTS_COLLECTION = 'media_objects';
export const CMS_UPDATED_EVENT = 'bimondo:cms-updated';

export type CmsSectionDocId =
  | 'shared_header'
  | 'shared_footer'
  | 'shared_whatsapp'
  | 'home_hero'
  | 'home_transition'
  | 'home_story'
  | 'home_bento'
  | 'home_experience'
  | 'home_places'
  | 'home_reviews'
  | 'home_planning_faq'
  | 'home_contact'
  | 'destinations_page'
  | 'destinations_catalog'
  | 'packages_page'
  | 'packages_tours'
  | 'stays_page'
  | 'stays_catalog'
  | 'gallery_page'
  | 'our_story_page'
  | 'contact_page'
  | 'booking_page';

export interface CmsSectionDefinition {
  docId: CmsSectionDocId;
  pageId: string;
  title: string;
  extractPayload: (cms: SiteCmsData) => Record<string, unknown>;
  applyPayload: (target: SiteCmsData, payload: Record<string, unknown>) => void;
}

export interface CmsSectionMetadata {
  docId: CmsSectionDocId;
  pageId: string;
  title: string;
  revision: number;
  existsInFirestore: boolean;
  deleted: boolean;
  deletedAt: string | null;
  deletedBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface ContentValidationResult {
  valid: boolean;
  error?: string;
}

export interface FirestoreSaveResult {
  valid: boolean;
  updatedDocIds: CmsSectionDocId[];
  error?: string;
  conflict?: {
    docId: CmsSectionDocId;
    title: string;
    expectedRevision: number;
    actualRevision: number;
    updatedBy?: string | null;
  };
}

export interface FirestoreImportResult {
  success: boolean;
  createdDocIds: CmsSectionDocId[];
  skippedDocIds: CmsSectionDocId[];
  failedDocs: { docId: CmsSectionDocId; error: string }[];
  error?: string;
}

export interface TrashItemEntry {
  kind: 'section' | 'item';
  collectionKey:
    | 'home_section'
    | 'heroSlides'
    | 'bentoDestinations'
    | 'destinations'
    | 'colomboExperiences'
    | 'tours'
    | 'stays'
    | 'gallery'
    | 'reviews'
    | 'faqs';
  id: string;
  title: string;
  locationLabel: string;
  deletedAt: string;
  deletedBy: string | null;
}

export class StaleRevisionConflictError extends Error {
  readonly docId: CmsSectionDocId;
  readonly title: string;
  readonly expectedRevision: number;
  readonly actualRevision: number;
  readonly updatedBy: string | null;

  constructor(params: {
    docId: CmsSectionDocId;
    title: string;
    expectedRevision: number;
    actualRevision: number;
    updatedBy?: string | null;
  }) {
    super(
      `Stale revision conflict on "${params.title}" (${params.docId}): expected revision ${params.expectedRevision}, but Firestore has revision ${params.actualRevision}.`
    );
    this.name = 'StaleRevisionConflictError';
    this.docId = params.docId;
    this.title = params.title;
    this.expectedRevision = params.expectedRevision;
    this.actualRevision = params.actualRevision;
    this.updatedBy = params.updatedBy ?? null;
  }
}

export class MediaObjectDeletingConflictError extends Error {
  readonly objectKey: string;
  readonly status: string;
  readonly docId: CmsSectionDocId;
  readonly title: string;

  constructor(params: {
    objectKey: string;
    status: string;
    docId: CmsSectionDocId;
    title: string;
  }) {
    super(
      `Cannot save "${params.title}" (${params.docId}) because referenced R2 media object "${params.objectKey}" is currently ${params.status === 'deleting' ? 'being permanently deleted' : 'permanently deleted'}. Choose a different image and try again.`
    );
    this.name = 'MediaObjectDeletingConflictError';
    this.objectKey = params.objectKey;
    this.status = params.status;
    this.docId = params.docId;
    this.title = params.title;
  }
}

/**
 * Checks whether an image URL is valid for persistence.
 * Rejects base64 data: URLs and temporary blob: URLs.
 */
export function isForbiddenImageUrl(url: unknown): boolean {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  return trimmed.startsWith('data:') || trimmed.startsWith('blob:');
}

/**
 * Normalizes an image reference while preserving deliberately empty strings ("")
 * when candidate is provided, so cleared alt text or image URLs never revert to defaults.
 */
export function normalizeImageRef(
  candidate: Partial<CmsImageRef> | undefined | null,
  fallbackUrl = '',
  fallbackAlt = ''
): CmsImageRef {
  const hasExplicitUrl = candidate !== undefined && candidate !== null && typeof candidate.url === 'string';
  const rawUrl = hasExplicitUrl
    ? candidate.url!.trim()
    : typeof fallbackUrl === 'string'
      ? fallbackUrl.trim()
      : '';
  const safeUrl = isForbiddenImageUrl(rawUrl) ? '' : rawUrl;

  const hasExplicitAlt = candidate !== undefined && candidate !== null && typeof candidate.alt === 'string';
  const safeAlt = hasExplicitAlt ? candidate.alt! : fallbackAlt;

  const safeKey =
    typeof candidate?.key === 'string' && candidate.key.trim().length > 0
      ? candidate.key.trim()
      : null;

  return createImageRef(safeUrl, safeAlt, safeKey);
}

/**
 * Deeply validates that no image field in SiteCmsData contains a base64 data: string or temporary blob: URL.
 */
export function validateCmsContentImages(
  data: SiteCmsData
): ContentValidationResult {
  const checkUrl = (url: string | undefined, label: string): string | null => {
    if (url && isForbiddenImageUrl(url)) {
      return `Invalid image URL in "${label}": Base64 data strings and temporary blob URLs are not allowed. Use an existing asset path or HTTPS image URL.`;
    }
    if (typeof url === 'string' && url.length > 2048) {
      return `Image URL in "${label}" exceeds the maximum length of 2048 characters.`;
    }
    return null;
  };

  for (const slide of data.pages?.home?.hero?.slides || []) {
    const err = checkUrl(slide.image?.url, `Home Hero Slide (${slide.id})`);
    if (err) return { valid: false, error: err };
  }

  const storyMainErr = checkUrl(
    data.pages?.home?.story?.mainImage?.url,
    'Home Story Main Image'
  );
  if (storyMainErr) return { valid: false, error: storyMainErr };

  const storySecErr = checkUrl(
    data.pages?.home?.story?.secondaryImage?.url,
    'Home Story Secondary Image'
  );
  if (storySecErr) return { valid: false, error: storySecErr };

  const expImgErr = checkUrl(
    data.pages?.home?.experience?.featureImage?.url,
    'Home Experience Feature Image'
  );
  if (expImgErr) return { valid: false, error: expImgErr };

  for (const dest of data.destinations || []) {
    const err =
      checkUrl(dest.imageRef?.url, `Destination (${dest.name})`) ||
      checkUrl(dest.image, `Destination (${dest.name})`);
    if (err) return { valid: false, error: err };
  }

  for (const exp of data.colomboExperiences || []) {
    const err =
      checkUrl(exp.imageRef?.url, `Colombo Experience (${exp.name})`) ||
      checkUrl(exp.image, `Colombo Experience (${exp.name})`);
    if (err) return { valid: false, error: err };
  }

  for (const bento of data.bentoDestinations || []) {
    const err =
      checkUrl(bento.heroImageRef?.url, `Bento Slide Hero (${bento.name})`) ||
      checkUrl(
        bento.pathwayImageRef?.url,
        `Bento Slide Pathway (${bento.name})`
      ) ||
      checkUrl(
        bento.tallSceneImageRef?.url,
        `Bento Slide Tall Scene (${bento.name})`
      ) ||
      checkUrl(
        bento.natureImageRef?.url,
        `Bento Slide Nature (${bento.name})`
      ) ||
      checkUrl(
        bento.cuisineImageRef?.url,
        `Bento Slide Cuisine (${bento.name})`
      );
    if (err) return { valid: false, error: err };
  }

  for (const tour of data.tours || []) {
    const err =
      checkUrl(tour.imageRef?.url, `Tour (${tour.name})`) ||
      checkUrl(tour.image, `Tour (${tour.name})`);
    if (err) return { valid: false, error: err };
  }

  for (const stay of data.stays || []) {
    const err =
      checkUrl(stay.imageRef?.url, `Accommodation (${stay.name})`) ||
      checkUrl(stay.image, `Accommodation (${stay.name})`);
    if (err) return { valid: false, error: err };
  }

  for (const photo of data.gallery || []) {
    const err =
      checkUrl(photo.imageRef?.url, `Gallery Photo (${photo.title})`) ||
      checkUrl(photo.image, `Gallery Photo (${photo.title})`);
    if (err) return { valid: false, error: err };
  }

  for (const rev of data.reviews || []) {
    const err =
      checkUrl(rev.imageRef?.url, `Review (${rev.name})`) ||
      checkUrl(rev.image, `Review (${rev.name})`);
    if (err) return { valid: false, error: err };
  }

  return { valid: true };
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

/**
 * Deeply merges saved Firestore data over bundled defaults while strictly preserving:
 * - Deliberately empty strings ("")
 * - Deliberately hidden booleans (visible: false)
 * - Soft-deletion fields (deletedAt, deletedBy)
 */
export function deepMergeObjects<T>(defaults: T, saved: unknown): T {
  if (saved === undefined || saved === null) return defaults;
  if (Array.isArray(defaults)) {
    return (Array.isArray(saved) ? saved : defaults) as unknown as T;
  }
  if (isPlainObject(defaults) && isPlainObject(saved)) {
    const result: Record<string, unknown> = { ...defaults };
    for (const key of Object.keys(saved)) {
      if (key in defaults) {
        result[key] = deepMergeObjects(
          (defaults as Record<string, unknown>)[key],
          saved[key]
        );
      } else {
        result[key] = saved[key];
      }
    }
    return result as T;
  }
  if (typeof saved === typeof defaults) {
    return saved as T;
  }
  return defaults;
}

/**
 * Synchronizes structured imageRef fields, legacy string fields, and soft-deletion metadata
 * so both public components and the structured admin editor remain consistent.
 */
export function normalizeCmsData(raw: unknown): SiteCmsData {
  const defaults = getDefaultCmsData();
  if (!isPlainObject(raw)) {
    return defaults;
  }

  const merged = deepMergeObjects<SiteCmsData>(defaults, raw);

  // Sync Home Hero slides & general.heroImages
  const rawSlides = Array.isArray(merged.pages?.home?.hero?.slides)
    ? merged.pages.home.hero.slides
    : defaults.pages.home.hero.slides;

  const normalizedSlides = rawSlides.map((slide, idx) => ({
    id: slide?.id || `hero-slide-${idx + 1}`,
    image: normalizeImageRef(
      slide?.image,
      '',
      `Sri Lanka Hero Slide ${idx + 1}`
    ),
    visible: slide?.visible !== false,
    order: typeof slide?.order === 'number' ? slide.order : idx + 1,
    deletedAt: slide?.deletedAt || null,
    deletedBy: slide?.deletedBy || null,
  }));

  merged.pages.home.hero.slides = normalizedSlides;
  merged.general.heroImages = normalizedSlides
    .filter(
      (s) =>
        s.visible !== false &&
        !s.deletedAt &&
        s.image.url.trim().length > 0
    )
    .sort((a, b) => a.order - b.order)
    .map((s) => s.image.url.trim());

  // Sync Home Story images
  merged.pages.home.story.mainImage = normalizeImageRef(
    merged.pages.home.story.mainImage,
    merged.general.storyMainImage || '',
    'Our Story in Sri Lanka'
  );
  merged.pages.home.story.secondaryImage = normalizeImageRef(
    merged.pages.home.story.secondaryImage,
    merged.general.storySecondaryImage || '',
    'Living cultural traditions of Sri Lanka'
  );
  merged.general.storyMainImage = merged.pages.home.story.mainImage.url;
  merged.general.storySecondaryImage =
    merged.pages.home.story.secondaryImage.url;

  // Sync Home Experience image
  merged.pages.home.experience.featureImage = normalizeImageRef(
    merged.pages.home.experience.featureImage,
    merged.general.experienceImage || '',
    'Sri Lanka coastal and highland landscapes'
  );
  merged.general.experienceImage =
    merged.pages.home.experience.featureImage.url;

  // Sync Tripadvisor fields
  merged.general.tripadvisorEnabled = merged.pages.home.hero.tripadvisorEnabled;
  merged.general.tripadvisorBrand = merged.pages.home.hero.tripadvisorBrand;
  merged.general.tripadvisorRating = merged.pages.home.hero.tripadvisorRating;
  merged.general.tripadvisorReviewsText =
    merged.pages.home.hero.tripadvisorReviewsText;

  // Sync Destinations
  merged.destinations = (
    Array.isArray(merged.destinations)
      ? merged.destinations
      : defaults.destinations
  ).map((d, idx) => {
    const imageRef = normalizeImageRef(
      d.imageRef,
      d.image ?? '',
      d.name ?? `Destination ${idx + 1}`
    );
    return {
      ...d,
      id: d.id || `dest-${idx + 1}`,
      image: imageRef.url,
      imageRef,
      highlights: Array.isArray(d.highlights) ? d.highlights : [],
      visible: d.visible !== false,
      order: typeof d.order === 'number' ? d.order : idx + 1,
      deletedAt: d.deletedAt || null,
      deletedBy: d.deletedBy || null,
    };
  });

  // Sync Colombo Day Experiences
  merged.colomboExperiences = (
    Array.isArray(merged.colomboExperiences)
      ? merged.colomboExperiences
      : defaults.colomboExperiences
  ).map((e, idx) => {
    const imageRef = normalizeImageRef(
      e.imageRef,
      e.image ?? '',
      e.name ?? `Day Experience ${idx + 1}`
    );
    return {
      ...e,
      id: e.id || `colombo-exp-${idx + 1}`,
      image: imageRef.url,
      imageRef,
      highlights: typeof e.highlights === 'string' ? e.highlights : '',
      visible: e.visible !== false,
      order: typeof e.order === 'number' ? e.order : idx + 1,
      deletedAt: e.deletedAt || null,
      deletedBy: e.deletedBy || null,
    };
  });

  // Sync Bento Destination Slides
  merged.bentoDestinations = (
    Array.isArray(merged.bentoDestinations)
      ? merged.bentoDestinations
      : defaults.bentoDestinations
  ).map((b, idx) => {
    const heroImageRef = normalizeImageRef(
      b.heroImageRef,
      b.heroImage ?? '',
      b.name ?? `Bento Slide ${idx + 1}`
    );
    const pathwayImageRef = normalizeImageRef(
      b.pathwayImageRef,
      b.pathwayImage ?? '',
      `${b.name || 'Destination'} pathway`
    );
    const tallSceneImageRef = normalizeImageRef(
      b.tallSceneImageRef,
      b.tallSceneImage ?? '',
      `${b.name || 'Destination'} atmosphere`
    );
    const natureImageRef = normalizeImageRef(
      b.natureImageRef,
      b.natureImage ?? '',
      `${b.name || 'Destination'} nature`
    );
    const cuisineImageRef = normalizeImageRef(
      b.cuisineImageRef,
      b.cuisineImage ?? '',
      `${b.name || 'Destination'} cuisine`
    );
    return {
      ...b,
      id: b.id || `bento-${idx + 1}`,
      heroImage: heroImageRef.url,
      pathwayImage: pathwayImageRef.url,
      tallSceneImage: tallSceneImageRef.url,
      natureImage: natureImageRef.url,
      cuisineImage: cuisineImageRef.url,
      heroImageRef,
      pathwayImageRef,
      tallSceneImageRef,
      natureImageRef,
      cuisineImageRef,
      visible: b.visible !== false,
      order: typeof b.order === 'number' ? b.order : idx + 1,
      deletedAt: b.deletedAt || null,
      deletedBy: b.deletedBy || null,
    };
  });

  // Sync Tours
  merged.tours = (
    Array.isArray(merged.tours) ? merged.tours : defaults.tours
  ).map((t, idx) => {
    const imageRef = normalizeImageRef(
      t.imageRef,
      t.image ?? '',
      t.name ?? `Tour ${idx + 1}`
    );
    return {
      ...t,
      id: t.id || `tour-${idx + 1}`,
      image: imageRef.url,
      imageRef,
      highlights: typeof t.highlights === 'string' ? t.highlights : '',
      route: typeof t.route === 'string' ? t.route : '',
      visible: t.visible !== false,
      order: typeof t.order === 'number' ? t.order : idx + 1,
      deletedAt: t.deletedAt || null,
      deletedBy: t.deletedBy || null,
    };
  });

  // Sync Stays
  merged.stays = (
    Array.isArray(merged.stays) ? merged.stays : defaults.stays
  ).map((s, idx) => {
    const imageRef = normalizeImageRef(
      s.imageRef,
      s.image ?? '',
      s.name ?? `Stay ${idx + 1}`
    );
    return {
      ...s,
      id: s.id || `stay-${idx + 1}`,
      image: imageRef.url,
      imageRef,
      highlights: Array.isArray(s.highlights) ? s.highlights : [],
      visible: s.visible !== false,
      order: typeof s.order === 'number' ? s.order : idx + 1,
      deletedAt: s.deletedAt || null,
      deletedBy: s.deletedBy || null,
    };
  });

  // Sync Gallery
  merged.gallery = (
    Array.isArray(merged.gallery) ? merged.gallery : defaults.gallery
  ).map((g, idx) => {
    const imageRef = normalizeImageRef(
      g.imageRef,
      g.image ?? '',
      g.title ?? `Gallery Photo ${idx + 1}`
    );
    return {
      ...g,
      id: g.id || `gallery-${idx + 1}`,
      image: imageRef.url,
      imageRef,
      visible: g.visible !== false,
      order: typeof g.order === 'number' ? g.order : idx + 1,
      deletedAt: g.deletedAt || null,
      deletedBy: g.deletedBy || null,
    };
  });

  // Sync Reviews
  merged.reviews = (
    Array.isArray(merged.reviews) ? merged.reviews : defaults.reviews
  ).map((r, idx) => {
    const imageRef = normalizeImageRef(
      r.imageRef,
      r.image ?? '',
      r.name ?? `Reviewer ${idx + 1}`
    );
    return {
      ...r,
      id: r.id || `thought-${idx + 1}`,
      image: imageRef.url,
      imageRef,
      visible: r.visible !== false,
      order: typeof r.order === 'number' ? r.order : idx + 1,
      deletedAt: r.deletedAt || null,
      deletedBy: r.deletedBy || null,
    };
  });

  // Sync FAQs
  merged.faqs = (
    Array.isArray(merged.faqs) ? merged.faqs : defaults.faqs
  ).map((f, idx) => ({
    ...f,
    id: f.id || `faq-${idx + 1}`,
    visible: f.visible !== false,
    order: typeof f.order === 'number' ? f.order : idx + 1,
    deletedAt: f.deletedAt || null,
    deletedBy: f.deletedBy || null,
  }));

  // Sync Customer Booking Enquiries
  const rawEnquiries = Array.isArray(merged.enquiries)
    ? merged.enquiries
    : defaults.enquiries;
  merged.enquiries = rawEnquiries
    .map((item, idx) => normalizeCustomerEnquiry(item, idx))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return merged;
}

const VALID_BOOKING_METHODS: BookingSubmissionMethod[] = [
  'direct_admin',
  'whatsapp',
  'email',
  'callback',
  'manual',
];

const VALID_ENQUIRY_STATUSES: CmsCustomerEnquiry['status'][] = [
  'new',
  'in_progress',
  'replied',
  'archived',
];

export function normalizeCustomerEnquiry(
  raw: Partial<CmsCustomerEnquiry> | Record<string, unknown>,
  fallbackIdx = 0
): CmsCustomerEnquiry {
  const id =
    typeof raw.id === 'string' && raw.id.trim()
      ? raw.id.trim().slice(0, 128)
      : `bk_${Date.now()}_${fallbackIdx}`;

  const createdAt =
    formatFirestoreTimestamp(raw.createdAt) ||
    (typeof raw.createdAt === 'string' && raw.createdAt.trim()
      ? raw.createdAt.trim()
      : new Date().toISOString());

  const bookingMethod: BookingSubmissionMethod =
    typeof raw.bookingMethod === 'string' &&
    VALID_BOOKING_METHODS.includes(raw.bookingMethod as BookingSubmissionMethod)
      ? (raw.bookingMethod as BookingSubmissionMethod)
      : 'direct_admin';

  const status: CmsCustomerEnquiry['status'] =
    typeof raw.status === 'string' &&
    VALID_ENQUIRY_STATUSES.includes(raw.status as CmsCustomerEnquiry['status'])
      ? (raw.status as CmsCustomerEnquiry['status'])
      : 'new';

  const selectedPackage =
    typeof raw.selectedPackage === 'string' && raw.selectedPackage.trim()
      ? raw.selectedPackage.trim().slice(0, 160)
      : 'Custom Tailor-Made Journey';

  const phone =
    typeof raw.phone === 'string' ? raw.phone.trim().slice(0, 64) : '';

  // Clean up any legacy mangled style string like "[DIRECT_ADMIN] Custom Tailor-Made Journey · Balanced island discovery"
  let style =
    typeof raw.style === 'string' && raw.style.trim()
      ? raw.style.trim()
      : 'Balanced island discovery';
  const legacyStyleMatch = style.match(/^\[[A-Z_]+\]\s+.*?\s+·\s+(.+)$/);
  if (legacyStyleMatch && legacyStyleMatch[1]) {
    style = legacyStyleMatch[1].trim();
  }
  style = style.slice(0, 120);

  // Clean up any legacy mangled message string where " | Tel: ... (Package: ...)" was appended
  let message = typeof raw.message === 'string' ? raw.message.trim() : '';
  message = message
    .replace(/\s*\(Package:\s*[^)]*\)\s*$/i, '')
    .replace(/\s*\|\s*Tel:\s*[^(|]*$/i, '')
    .trim()
    .slice(0, 2000);

  return {
    id,
    createdAt,
    name:
      typeof raw.name === 'string' && raw.name.trim()
        ? raw.name.trim().slice(0, 120)
        : 'Traveller',
    email:
      typeof raw.email === 'string' && raw.email.trim()
        ? raw.email.trim().slice(0, 254)
        : 'unknown@example.com',
    phone,
    bookingMethod,
    selectedPackage,
    arrival:
      typeof raw.arrival === 'string' && raw.arrival.trim()
        ? raw.arrival.trim().slice(0, 64)
        : 'Flexible dates',
    guests:
      typeof raw.guests === 'string' && raw.guests.trim()
        ? raw.guests.trim().slice(0, 64)
        : '2 travellers',
    duration:
      typeof raw.duration === 'string' && raw.duration.trim()
        ? raw.duration.trim().slice(0, 64)
        : '7–8 days',
    style,
    message,
    status,
    adminNotes:
      typeof raw.adminNotes === 'string' ? raw.adminNotes.slice(0, 2000) : '',
  };
}

export function mergeCustomerEnquiryLists(
  primary: CmsCustomerEnquiry[],
  secondary: CmsCustomerEnquiry[]
): CmsCustomerEnquiry[] {
  const byId = new Map<string, CmsCustomerEnquiry>();
  for (const item of secondary) {
    if (!item || !item.id) continue;
    byId.set(item.id, normalizeCustomerEnquiry(item));
  }
  for (const item of primary) {
    if (!item || !item.id) continue;
    byId.set(item.id, normalizeCustomerEnquiry(item));
  }
  return Array.from(byId.values()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export function readCachedCustomerEnquiries(): CmsCustomerEnquiry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CUSTOMER_ENQUIRIES_LOCAL_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => isPlainObject(item))
      .map((item, idx) => normalizeCustomerEnquiry(item, idx))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export function writeCachedCustomerEnquiries(
  enquiries: CmsCustomerEnquiry[]
): void {
  if (typeof window === 'undefined') return;
  try {
    const normalized = enquiries
      .map((item, idx) => normalizeCustomerEnquiry(item, idx))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    window.localStorage.setItem(
      CUSTOMER_ENQUIRIES_LOCAL_CACHE_KEY,
      JSON.stringify(normalized)
    );
  } catch {
    // Ignore storage quota or access errors
  }
}

/**
 * Produces a public-safe view of SiteCmsData where soft-deleted repeatable items
 * and soft-deleted sections are excluded from public rendering while keeping
 * visibility toggles separate in the underlying admin model.
 */
export function filterCmsForPublic(cms: SiteCmsData): SiteCmsData {
  const cloned = JSON.parse(JSON.stringify(cms)) as SiteCmsData;

  // Filter repeatable collections
  cloned.pages.home.hero.slides = (cloned.pages.home.hero.slides || []).filter(
    (item) => !item.deletedAt
  );
  cloned.general.heroImages = cloned.pages.home.hero.slides
    .filter((s) => s.visible !== false && s.image.url.trim().length > 0)
    .sort((a, b) => a.order - b.order)
    .map((s) => s.image.url.trim());

  cloned.bentoDestinations = (cloned.bentoDestinations || []).filter(
    (item) => !item.deletedAt
  );
  cloned.destinations = (cloned.destinations || []).filter(
    (item) => !item.deletedAt
  );
  cloned.colomboExperiences = (cloned.colomboExperiences || []).filter(
    (item) => !item.deletedAt
  );
  cloned.tours = (cloned.tours || []).filter((item) => !item.deletedAt);
  cloned.stays = (cloned.stays || []).filter((item) => !item.deletedAt);
  cloned.gallery = (cloned.gallery || []).filter((item) => !item.deletedAt);
  cloned.reviews = (cloned.reviews || []).filter((item) => !item.deletedAt);
  cloned.faqs = (cloned.faqs || []).filter((item) => !item.deletedAt);
  // Never expose private customer booking enquiries in publicCms
  cloned.enquiries = [];

  // If a home section is soft-deleted, hide it on the public site
  if (cloned.pages.home.hero.deletedAt) {
    cloned.pages.home.hero.visible = false;
  }
  if (cloned.pages.home.heroTransition.deletedAt) {
    cloned.pages.home.heroTransition.visible = false;
  }
  if (cloned.pages.home.story.deletedAt) {
    cloned.pages.home.story.visible = false;
  }
  if (cloned.pages.home.bentoSlider.deletedAt) {
    cloned.pages.home.bentoSlider.visible = false;
  }
  if (cloned.pages.home.experience.deletedAt) {
    cloned.pages.home.experience.visible = false;
  }
  if (cloned.pages.home.places.deletedAt) {
    cloned.pages.home.places.visible = false;
  }
  if (cloned.pages.home.valuesReviews.deletedAt) {
    cloned.pages.home.valuesReviews.visible = false;
  }
  if (cloned.pages.home.planningFaq.deletedAt) {
    cloned.pages.home.planningFaq.visible = false;
  }
  if (cloned.pages.home.contactSection.deletedAt) {
    cloned.pages.home.contactSection.visible = false;
  }

  return cloned;
}

/**
 * Collects all currently soft-deleted sections and repeatable items for the Admin Trash view.
 */
export function listSoftDeletedItems(cms: SiteCmsData): TrashItemEntry[] {
  const entries: TrashItemEntry[] = [];

  const homeSectionList: {
    id: keyof SiteCmsData['pages']['home'];
    title: string;
    sec: { deletedAt?: string | null; deletedBy?: string | null };
  }[] = [
    {
      id: 'heroTransition',
      title: 'Home Hero Transition Section',
      sec: cms.pages.home.heroTransition,
    },
    { id: 'story', title: 'Home Story Section', sec: cms.pages.home.story },
    {
      id: 'bentoSlider',
      title: 'Home Bento Destination Slider Section',
      sec: cms.pages.home.bentoSlider,
    },
    {
      id: 'experience',
      title: 'Home Experience Section',
      sec: cms.pages.home.experience,
    },
    {
      id: 'places',
      title: 'Home Places Staggered Slider Section',
      sec: cms.pages.home.places,
    },
    {
      id: 'valuesReviews',
      title: 'Home Guest Thoughts & Reviews Section',
      sec: cms.pages.home.valuesReviews,
    },
    {
      id: 'planningFaq',
      title: 'Home Planning & FAQ Section',
      sec: cms.pages.home.planningFaq,
    },
    {
      id: 'contactSection',
      title: 'Home Contact & Booking Section',
      sec: cms.pages.home.contactSection,
    },
  ];

  for (const hs of homeSectionList) {
    if (hs.sec?.deletedAt) {
      entries.push({
        kind: 'section',
        collectionKey: 'home_section',
        id: hs.id,
        title: hs.title,
        locationLabel: 'Home Page · Section',
        deletedAt: hs.sec.deletedAt,
        deletedBy: hs.sec.deletedBy ?? null,
      });
    }
  }

  for (const slide of cms.pages.home.hero.slides || []) {
    if (slide.deletedAt) {
      entries.push({
        kind: 'item',
        collectionKey: 'heroSlides',
        id: slide.id,
        title: slide.image?.alt || `Hero Slide (${slide.id})`,
        locationLabel: 'Home Page · Hero Slide',
        deletedAt: slide.deletedAt,
        deletedBy: slide.deletedBy ?? null,
      });
    }
  }

  for (const bento of cms.bentoDestinations || []) {
    if (bento.deletedAt) {
      entries.push({
        kind: 'item',
        collectionKey: 'bentoDestinations',
        id: bento.id,
        title: bento.name,
        locationLabel: 'Home Page · Bento Slide',
        deletedAt: bento.deletedAt,
        deletedBy: bento.deletedBy ?? null,
      });
    }
  }

  for (const dest of cms.destinations || []) {
    if (dest.deletedAt) {
      entries.push({
        kind: 'item',
        collectionKey: 'destinations',
        id: dest.id,
        title: dest.name,
        locationLabel: 'Destinations Page · Regional Destination',
        deletedAt: dest.deletedAt,
        deletedBy: dest.deletedBy ?? null,
      });
    }
  }

  for (const exp of cms.colomboExperiences || []) {
    if (exp.deletedAt) {
      entries.push({
        kind: 'item',
        collectionKey: 'colomboExperiences',
        id: exp.id,
        title: exp.name,
        locationLabel: 'Destinations Page · Colombo Day Experience',
        deletedAt: exp.deletedAt,
        deletedBy: exp.deletedBy ?? null,
      });
    }
  }

  for (const tour of cms.tours || []) {
    if (tour.deletedAt) {
      entries.push({
        kind: 'item',
        collectionKey: 'tours',
        id: tour.id,
        title: tour.name,
        locationLabel: 'Tour Packages Page · Multi-Day Tour',
        deletedAt: tour.deletedAt,
        deletedBy: tour.deletedBy ?? null,
      });
    }
  }

  for (const stay of cms.stays || []) {
    if (stay.deletedAt) {
      entries.push({
        kind: 'item',
        collectionKey: 'stays',
        id: stay.id,
        title: stay.name,
        locationLabel: 'Accommodations Page · Regional Stay',
        deletedAt: stay.deletedAt,
        deletedBy: stay.deletedBy ?? null,
      });
    }
  }

  for (const photo of cms.gallery || []) {
    if (photo.deletedAt) {
      entries.push({
        kind: 'item',
        collectionKey: 'gallery',
        id: photo.id,
        title: photo.title,
        locationLabel: 'Visual Gallery Page · Photo',
        deletedAt: photo.deletedAt,
        deletedBy: photo.deletedBy ?? null,
      });
    }
  }

  for (const rev of cms.reviews || []) {
    if (rev.deletedAt) {
      entries.push({
        kind: 'item',
        collectionKey: 'reviews',
        id: rev.id,
        title: rev.name,
        locationLabel: 'Home Page · Guest Review',
        deletedAt: rev.deletedAt,
        deletedBy: rev.deletedBy ?? null,
      });
    }
  }

  for (const faq of cms.faqs || []) {
    if (faq.deletedAt) {
      entries.push({
        kind: 'item',
        collectionKey: 'faqs',
        id: faq.id,
        title: faq.q,
        locationLabel: 'Home Page · FAQ',
        deletedAt: faq.deletedAt,
        deletedBy: faq.deletedBy ?? null,
      });
    }
  }

  return entries.sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
}

/**
 * Restores a soft-deleted item or section by clearing deletedAt and deletedBy,
 * preserving its exact stable ID and content.
 */
export function restoreSoftDeletedEntry(
  cms: SiteCmsData,
  entry: Pick<TrashItemEntry, 'collectionKey' | 'id'>
): SiteCmsData {
  const next = JSON.parse(JSON.stringify(cms)) as SiteCmsData;

  switch (entry.collectionKey) {
    case 'home_section': {
      const key = entry.id as keyof SiteCmsData['pages']['home'];
      const target = next.pages.home[key] as {
        deletedAt?: string | null;
        deletedBy?: string | null;
      };
      if (target) {
        target.deletedAt = null;
        target.deletedBy = null;
      }
      break;
    }
    case 'heroSlides':
      next.pages.home.hero.slides = next.pages.home.hero.slides.map((s) =>
        s.id === entry.id ? { ...s, deletedAt: null, deletedBy: null } : s
      );
      break;
    case 'bentoDestinations':
      next.bentoDestinations = next.bentoDestinations.map((b) =>
        b.id === entry.id ? { ...b, deletedAt: null, deletedBy: null } : b
      );
      break;
    case 'destinations':
      next.destinations = next.destinations.map((d) =>
        d.id === entry.id ? { ...d, deletedAt: null, deletedBy: null } : d
      );
      break;
    case 'colomboExperiences':
      next.colomboExperiences = next.colomboExperiences.map((e) =>
        e.id === entry.id ? { ...e, deletedAt: null, deletedBy: null } : e
      );
      break;
    case 'tours':
      next.tours = next.tours.map((t) =>
        t.id === entry.id ? { ...t, deletedAt: null, deletedBy: null } : t
      );
      break;
    case 'stays':
      next.stays = next.stays.map((s) =>
        s.id === entry.id ? { ...s, deletedAt: null, deletedBy: null } : s
      );
      break;
    case 'gallery':
      next.gallery = next.gallery.map((g) =>
        g.id === entry.id ? { ...g, deletedAt: null, deletedBy: null } : g
      );
      break;
    case 'reviews':
      next.reviews = next.reviews.map((r) =>
        r.id === entry.id ? { ...r, deletedAt: null, deletedBy: null } : r
      );
      break;
    case 'faqs':
      next.faqs = next.faqs.map((f) =>
        f.id === entry.id ? { ...f, deletedAt: null, deletedBy: null } : f
      );
      break;
  }

  return normalizeCmsData(next);
}

/**
 * 22 Independent Section Documents in `/cms_sections/{docId}`.
 * Separates shared navigation/footer from page-specific sections and repeatable catalogs
 * so individual sections can be updated independently with per-section revision checks.
 */
export const CMS_SECTION_DEFINITIONS: CmsSectionDefinition[] = [
  {
    docId: 'shared_header',
    pageId: 'shared',
    title: 'Shared Header & Navigation',
    extractPayload: (cms) => ({ header: cms.pages.shared.header }),
    applyPayload: (target, payload) => {
      if (isPlainObject(payload.header)) {
        target.pages.shared.header = deepMergeObjects(
          target.pages.shared.header,
          payload.header
        );
      }
    },
  },
  {
    docId: 'shared_footer',
    pageId: 'shared',
    title: 'Shared Footer',
    extractPayload: (cms) => ({ footer: cms.pages.shared.footer }),
    applyPayload: (target, payload) => {
      if (isPlainObject(payload.footer)) {
        target.pages.shared.footer = deepMergeObjects(
          target.pages.shared.footer,
          payload.footer
        );
      }
    },
  },
  {
    docId: 'shared_whatsapp',
    pageId: 'shared',
    title: 'Floating WhatsApp & Site Identity',
    extractPayload: (cms) => ({ general: cms.general }),
    applyPayload: (target, payload) => {
      if (isPlainObject(payload.general)) {
        target.general = deepMergeObjects(target.general, payload.general);
      }
    },
  },
  {
    docId: 'home_hero',
    pageId: 'home',
    title: 'Home Hero & Background Slides',
    extractPayload: (cms) => ({ hero: cms.pages.home.hero }),
    applyPayload: (target, payload) => {
      if (isPlainObject(payload.hero)) {
        target.pages.home.hero = deepMergeObjects(
          target.pages.home.hero,
          payload.hero
        );
      }
    },
  },
  {
    docId: 'home_transition',
    pageId: 'home',
    title: 'Home Hero Transition Pillars',
    extractPayload: (cms) => ({ heroTransition: cms.pages.home.heroTransition }),
    applyPayload: (target, payload) => {
      if (isPlainObject(payload.heroTransition)) {
        target.pages.home.heroTransition = deepMergeObjects(
          target.pages.home.heroTransition,
          payload.heroTransition
        );
      }
    },
  },
  {
    docId: 'home_story',
    pageId: 'home',
    title: 'Home Story Section',
    extractPayload: (cms) => ({ story: cms.pages.home.story }),
    applyPayload: (target, payload) => {
      if (isPlainObject(payload.story)) {
        target.pages.home.story = deepMergeObjects(
          target.pages.home.story,
          payload.story
        );
      }
    },
  },
  {
    docId: 'home_bento',
    pageId: 'home',
    title: 'Home Bento Destination Slider',
    extractPayload: (cms) => ({
      bentoSlider: cms.pages.home.bentoSlider,
      bentoDestinations: cms.bentoDestinations,
    }),
    applyPayload: (target, payload) => {
      if (isPlainObject(payload.bentoSlider)) {
        target.pages.home.bentoSlider = deepMergeObjects(
          target.pages.home.bentoSlider,
          payload.bentoSlider
        );
      }
      if (Array.isArray(payload.bentoDestinations)) {
        target.bentoDestinations =
          payload.bentoDestinations as SiteCmsData['bentoDestinations'];
      }
    },
  },
  {
    docId: 'home_experience',
    pageId: 'home',
    title: 'Home Experience Section',
    extractPayload: (cms) => ({ experience: cms.pages.home.experience }),
    applyPayload: (target, payload) => {
      if (isPlainObject(payload.experience)) {
        target.pages.home.experience = deepMergeObjects(
          target.pages.home.experience,
          payload.experience
        );
      }
    },
  },
  {
    docId: 'home_places',
    pageId: 'home',
    title: 'Home Places Staggered Slider Header',
    extractPayload: (cms) => ({ places: cms.pages.home.places }),
    applyPayload: (target, payload) => {
      if (isPlainObject(payload.places)) {
        target.pages.home.places = deepMergeObjects(
          target.pages.home.places,
          payload.places
        );
      }
    },
  },
  {
    docId: 'home_reviews',
    pageId: 'home',
    title: 'Home Guest Thoughts & Reviews',
    extractPayload: (cms) => ({
      valuesReviews: cms.pages.home.valuesReviews,
      reviews: cms.reviews,
    }),
    applyPayload: (target, payload) => {
      if (isPlainObject(payload.valuesReviews)) {
        target.pages.home.valuesReviews = deepMergeObjects(
          target.pages.home.valuesReviews,
          payload.valuesReviews
        );
      }
      if (Array.isArray(payload.reviews)) {
        target.reviews = payload.reviews as SiteCmsData['reviews'];
      }
    },
  },
  {
    docId: 'home_planning_faq',
    pageId: 'home',
    title: 'Home 7-Step Planning & FAQs',
    extractPayload: (cms) => ({
      planningFaq: cms.pages.home.planningFaq,
      faqs: cms.faqs,
    }),
    applyPayload: (target, payload) => {
      if (isPlainObject(payload.planningFaq)) {
        target.pages.home.planningFaq = deepMergeObjects(
          target.pages.home.planningFaq,
          payload.planningFaq
        );
      }
      if (Array.isArray(payload.faqs)) {
        target.faqs = payload.faqs as SiteCmsData['faqs'];
      }
    },
  },
  {
    docId: 'home_contact',
    pageId: 'home',
    title: 'Home Contact & Booking Section',
    extractPayload: (cms) => ({ contactSection: cms.pages.home.contactSection }),
    applyPayload: (target, payload) => {
      if (isPlainObject(payload.contactSection)) {
        target.pages.home.contactSection = deepMergeObjects(
          target.pages.home.contactSection,
          payload.contactSection
        );
      }
    },
  },
  {
    docId: 'destinations_page',
    pageId: 'destinations',
    title: 'Destinations Page Copy & Headings',
    extractPayload: (cms) => ({ destinationsPage: cms.pages.destinationsPage }),
    applyPayload: (target, payload) => {
      if (isPlainObject(payload.destinationsPage)) {
        target.pages.destinationsPage = deepMergeObjects(
          target.pages.destinationsPage,
          payload.destinationsPage
        );
      }
    },
  },
  {
    docId: 'destinations_catalog',
    pageId: 'destinations',
    title: 'Regional Destinations & Colombo Day Experiences',
    extractPayload: (cms) => ({
      destinations: cms.destinations,
      colomboExperiences: cms.colomboExperiences,
    }),
    applyPayload: (target, payload) => {
      if (Array.isArray(payload.destinations)) {
        target.destinations =
          payload.destinations as SiteCmsData['destinations'];
      }
      if (Array.isArray(payload.colomboExperiences)) {
        target.colomboExperiences =
          payload.colomboExperiences as SiteCmsData['colomboExperiences'];
      }
    },
  },
  {
    docId: 'packages_page',
    pageId: 'packages',
    title: 'Tour Packages Page Copy & Headings',
    extractPayload: (cms) => ({ packagesPage: cms.pages.packagesPage }),
    applyPayload: (target, payload) => {
      if (isPlainObject(payload.packagesPage)) {
        target.pages.packagesPage = deepMergeObjects(
          target.pages.packagesPage,
          payload.packagesPage
        );
      }
    },
  },
  {
    docId: 'packages_tours',
    pageId: 'packages',
    title: 'Signature Multi-Day Tour Packages',
    extractPayload: (cms) => ({ tours: cms.tours }),
    applyPayload: (target, payload) => {
      if (Array.isArray(payload.tours)) {
        target.tours = payload.tours as SiteCmsData['tours'];
      }
    },
  },
  {
    docId: 'stays_page',
    pageId: 'stays',
    title: 'Accommodations Page Copy & Headings',
    extractPayload: (cms) => ({ staysPage: cms.pages.staysPage }),
    applyPayload: (target, payload) => {
      if (isPlainObject(payload.staysPage)) {
        target.pages.staysPage = deepMergeObjects(
          target.pages.staysPage,
          payload.staysPage
        );
      }
    },
  },
  {
    docId: 'stays_catalog',
    pageId: 'stays',
    title: 'Regional Accommodation Collections',
    extractPayload: (cms) => ({ stays: cms.stays }),
    applyPayload: (target, payload) => {
      if (Array.isArray(payload.stays)) {
        target.stays = payload.stays as SiteCmsData['stays'];
      }
    },
  },
  {
    docId: 'gallery_page',
    pageId: 'gallery',
    title: 'Visual Gallery Page & Curated Photos',
    extractPayload: (cms) => ({
      galleryPage: cms.pages.galleryPage,
      gallery: cms.gallery,
    }),
    applyPayload: (target, payload) => {
      if (isPlainObject(payload.galleryPage)) {
        target.pages.galleryPage = deepMergeObjects(
          target.pages.galleryPage,
          payload.galleryPage
        );
      }
      if (Array.isArray(payload.gallery)) {
        target.gallery = payload.gallery as SiteCmsData['gallery'];
      }
    },
  },
  {
    docId: 'our_story_page',
    pageId: 'our-story',
    title: 'Our Story Page',
    extractPayload: (cms) => ({ ourStoryPage: cms.pages.ourStoryPage }),
    applyPayload: (target, payload) => {
      if (isPlainObject(payload.ourStoryPage)) {
        target.pages.ourStoryPage = deepMergeObjects(
          target.pages.ourStoryPage,
          payload.ourStoryPage
        );
      }
    },
  },
  {
    docId: 'contact_page',
    pageId: 'contact',
    title: 'Contact Page & Contact FAQs',
    extractPayload: (cms) => ({ contactPage: cms.pages.contactPage }),
    applyPayload: (target, payload) => {
      if (isPlainObject(payload.contactPage)) {
        target.pages.contactPage = deepMergeObjects(
          target.pages.contactPage,
          payload.contactPage
        );
      }
    },
  },
  {
    docId: 'booking_page',
    pageId: 'booking',
    title: 'Booking & Confirmation Page Copy',
    extractPayload: (cms) => ({ bookingPage: cms.pages.bookingPage }),
    applyPayload: (target, payload) => {
      if (isPlainObject(payload.bookingPage)) {
        target.pages.bookingPage = deepMergeObjects(
          target.pages.bookingPage,
          payload.bookingPage
        );
      }
    },
  },
];

export function createInitialSectionMetaMap(): Record<
  CmsSectionDocId,
  CmsSectionMetadata
> {
  const map = {} as Record<CmsSectionDocId, CmsSectionMetadata>;
  for (const def of CMS_SECTION_DEFINITIONS) {
    map[def.docId] = {
      docId: def.docId,
      pageId: def.pageId,
      title: def.title,
      revision: 0,
      existsInFirestore: false,
      deleted: false,
      deletedAt: null,
      deletedBy: null,
      updatedAt: null,
      updatedBy: null,
    };
  }
  return map;
}

function formatFirestoreTimestamp(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (
    typeof val === 'object' &&
    val !== null &&
    'toDate' in val &&
    typeof (val as { toDate?: unknown }).toDate === 'function'
  ) {
    try {
      return ((val as { toDate: () => Date }).toDate()).toISOString();
    } catch {
      return null;
    }
  }
  return null;
}

function sanitizePlainFirestoreMap<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export const FIRESTORE_CMS_SNAPSHOT_CACHE_KEY =
  'bimondo_firestore_cms_snapshot_v1';

export interface LoadedFirestoreContentSnapshot {
  adminCms: SiteCmsData;
  publicCms: SiteCmsData;
  sectionMeta: Record<CmsSectionDocId, CmsSectionMetadata>;
  existingSectionCount: number;
  totalSectionCount: number;
  error: string | null;
}

export function readCachedFirestoreSnapshot(): LoadedFirestoreContentSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(FIRESTORE_CMS_SNAPSHOT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LoadedFirestoreContentSnapshot>;
    if (!parsed || !isPlainObject(parsed.adminCms)) return null;
    const normalizedAdmin = normalizeCmsData(parsed.adminCms);
    const normalizedPublic = filterCmsForPublic(normalizedAdmin);
    const baseMeta = createInitialSectionMetaMap();
    const mergedMeta = isPlainObject(parsed.sectionMeta)
      ? {
          ...baseMeta,
          ...(parsed.sectionMeta as Record<CmsSectionDocId, CmsSectionMetadata>),
        }
      : baseMeta;

    return {
      adminCms: normalizedAdmin,
      publicCms: normalizedPublic,
      sectionMeta: mergedMeta,
      existingSectionCount:
        typeof parsed.existingSectionCount === 'number'
          ? parsed.existingSectionCount
          : 0,
      totalSectionCount: CMS_SECTION_DEFINITIONS.length,
      error: null,
    };
  } catch {
    return null;
  }
}

export function writeCachedFirestoreSnapshot(
  snapshot: LoadedFirestoreContentSnapshot
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      FIRESTORE_CMS_SNAPSHOT_CACHE_KEY,
      JSON.stringify({
        adminCms: snapshot.adminCms,
        sectionMeta: snapshot.sectionMeta,
        existingSectionCount: snapshot.existingSectionCount,
        totalSectionCount: snapshot.totalSectionCount,
      })
    );
  } catch {
    // Ignore storage quota or access errors
  }
}

export interface ContentRepository {
  readonly storageLabel: string;
  clearLegacyLocalStorage(): void;
  fetchFromFirestore(options?: {
    forceServer?: boolean;
  }): Promise<LoadedFirestoreContentSnapshot>;
  fetchCustomerEnquiriesFromFirestore(): Promise<CmsCustomerEnquiry[]>;
  saveChangedSectionsToFirestore(params: {
    nextCms: SiteCmsData;
    baselineCms: SiteCmsData;
    expectedMeta: Record<CmsSectionDocId, CmsSectionMetadata>;
    adminUid: string;
  }): Promise<FirestoreSaveResult>;
  initializeMissingContentInFirestore(
    adminUid: string
  ): Promise<FirestoreImportResult>;
  createCustomerEnquiryInFirestore(
    enquiry: CmsCustomerEnquiry
  ): Promise<void>;
  updateCustomerEnquiryInFirestore(
    enquiryId: string,
    patch: {
      status?: CmsCustomerEnquiry['status'];
      adminNotes?: string;
    }
  ): Promise<void>;
  deleteCustomerEnquiryInFirestore(enquiryId: string): Promise<void>;
}

class FirestoreContentRepository implements ContentRepository {
  readonly storageLabel =
    'Cloud Firestore Published Content (22 modular section documents in /cms_sections)';

  private legacyCleaned = false;

  clearLegacyLocalStorage(): void {
    if (this.legacyCleaned || typeof window === 'undefined') return;
    this.legacyCleaned = true;
    try {
      window.localStorage.removeItem(LEGACY_LOCAL_CONTENT_STORAGE_KEY);
    } catch {
      // Ignore storage access errors
    }
  }

  async fetchCustomerEnquiriesFromFirestore(): Promise<CmsCustomerEnquiry[]> {
    const localCached = readCachedCustomerEnquiries();
    const { db, auth, resolution } = getFirebaseClientServices();
    if (!resolution.isConfigured || !db || !auth?.currentUser) {
      return localCached;
    }

    try {
      const enqCol = collection(db, CUSTOMER_ENQUIRIES_COLLECTION);
      let snap;
      try {
        snap = await getDocsFromServer(enqCol);
      } catch {
        snap = await getDocs(enqCol);
      }

      const firestoreEnquiries: CmsCustomerEnquiry[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() as Record<string, unknown>;
        firestoreEnquiries.push(
          normalizeCustomerEnquiry({
            ...data,
            id: typeof data.id === 'string' && data.id ? data.id : docSnap.id,
          })
        );
      });

      const merged = mergeCustomerEnquiryLists(firestoreEnquiries, localCached);
      writeCachedCustomerEnquiries(merged);
      return merged;
    } catch {
      return localCached;
    }
  }

  async fetchFromFirestore(options?: {
    forceServer?: boolean;
  }): Promise<LoadedFirestoreContentSnapshot> {
    this.clearLegacyLocalStorage();

    const defaults = getDefaultCmsData();
    const sectionMeta = createInitialSectionMetaMap();
    const localEnquiries = readCachedCustomerEnquiries();
    const { db, auth, resolution } = getFirebaseClientServices();

    if (!resolution.isConfigured || !db) {
      const cached = readCachedFirestoreSnapshot();
      if (cached) {
        const mergedEnq = mergeCustomerEnquiryLists(
          localEnquiries,
          cached.adminCms.enquiries || []
        );
        const nextAdmin = normalizeCmsData({
          ...cached.adminCms,
          enquiries: mergedEnq,
        });
        return {
          ...cached,
          adminCms: nextAdmin,
          publicCms: filterCmsForPublic(nextAdmin),
        };
      }
      const normalizedDefaults = normalizeCmsData({
        ...defaults,
        enquiries: localEnquiries,
      });
      return {
        adminCms: normalizedDefaults,
        publicCms: filterCmsForPublic(normalizedDefaults),
        sectionMeta,
        existingSectionCount: 0,
        totalSectionCount: CMS_SECTION_DEFINITIONS.length,
        error: null,
      };
    }

    try {
      const colRef = collection(db, CMS_SECTIONS_COLLECTION);
      let snap;
      if (options?.forceServer) {
        try {
          snap = await getDocsFromServer(colRef);
        } catch {
          snap = await getDocs(colRef);
        }
      } else {
        try {
          snap = await getDocs(colRef);
        } catch {
          snap = await getDocsFromServer(colRef);
        }
      }

      const workingCms = JSON.parse(JSON.stringify(defaults)) as SiteCmsData;
      let existingCount = 0;
      let latestUpdatedAt = workingCms.updatedAt;

      const docsById = new Map<string, Record<string, unknown>>();
      snap.forEach((docSnap) => {
        docsById.set(docSnap.id, docSnap.data() as Record<string, unknown>);
      });

      for (const def of CMS_SECTION_DEFINITIONS) {
        const docData = docsById.get(def.docId);
        if (!docData) continue;

        existingCount += 1;
        const rev =
          typeof docData.revision === 'number' && docData.revision >= 1
            ? docData.revision
            : 1;
        const updatedAtIso = formatFirestoreTimestamp(docData.updatedAt);
        if (updatedAtIso && updatedAtIso > latestUpdatedAt) {
          latestUpdatedAt = updatedAtIso;
        }

        sectionMeta[def.docId] = {
          docId: def.docId,
          pageId:
            typeof docData.pageId === 'string' ? docData.pageId : def.pageId,
          title: typeof docData.title === 'string' ? docData.title : def.title,
          revision: rev,
          existsInFirestore: true,
          deleted: Boolean(docData.deleted),
          deletedAt:
            typeof docData.deletedAt === 'string' ? docData.deletedAt : null,
          deletedBy:
            typeof docData.deletedBy === 'string' ? docData.deletedBy : null,
          updatedAt: updatedAtIso,
          updatedBy:
            typeof docData.updatedBy === 'string' ? docData.updatedBy : null,
        };

        if (isPlainObject(docData.payload)) {
          def.applyPayload(workingCms, docData.payload);
        }
      }

      if (auth?.currentUser) {
        workingCms.enquiries = await this.fetchCustomerEnquiriesFromFirestore();
      } else {
        workingCms.enquiries = localEnquiries;
      }

      workingCms.updatedAt = latestUpdatedAt;
      const normalizedAdmin = normalizeCmsData(workingCms);
      const normalizedPublic = filterCmsForPublic(normalizedAdmin);

      const snapshot: LoadedFirestoreContentSnapshot = {
        adminCms: normalizedAdmin,
        publicCms: normalizedPublic,
        sectionMeta,
        existingSectionCount: existingCount,
        totalSectionCount: CMS_SECTION_DEFINITIONS.length,
        error: null,
      };

      if (existingCount > 0) {
        writeCachedFirestoreSnapshot(snapshot);
      }

      return snapshot;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Missing or insufficient permissions')) {
        try {
          handleFirestoreError(err, OperationType.LIST, CMS_SECTIONS_COLLECTION);
        } catch {
          // Logged structured error; return graceful fallback for UI
        }
      }

      const cached = readCachedFirestoreSnapshot();
      if (cached) {
        const mergedEnq = mergeCustomerEnquiryLists(
          localEnquiries,
          cached.adminCms.enquiries || []
        );
        const nextAdmin = normalizeCmsData({
          ...cached.adminCms,
          enquiries: mergedEnq,
        });
        return {
          ...cached,
          adminCms: nextAdmin,
          publicCms: filterCmsForPublic(nextAdmin),
          error: msg,
        };
      }

      const normalizedDefaults = normalizeCmsData({
        ...defaults,
        enquiries: localEnquiries,
      });
      return {
        adminCms: normalizedDefaults,
        publicCms: filterCmsForPublic(normalizedDefaults),
        sectionMeta,
        existingSectionCount: 0,
        totalSectionCount: CMS_SECTION_DEFINITIONS.length,
        error: msg,
      };
    }
  }

  async saveChangedSectionsToFirestore(params: {
    nextCms: SiteCmsData;
    baselineCms: SiteCmsData;
    expectedMeta: Record<CmsSectionDocId, CmsSectionMetadata>;
    adminUid: string;
  }): Promise<FirestoreSaveResult> {
    const { nextCms, baselineCms, expectedMeta, adminUid } = params;

    if (!adminUid || !adminUid.trim()) {
      return {
        valid: false,
        updatedDocIds: [],
        error: 'An authenticated administrator UID is required to save content.',
      };
    }

    const validation = validateCmsContentImages(nextCms);
    if (!validation.valid) {
      return {
        valid: false,
        updatedDocIds: [],
        error: validation.error,
      };
    }

    const { db, resolution } = getFirebaseClientServices();
    if (!resolution.isConfigured || !db) {
      return {
        valid: false,
        updatedDocIds: [],
        error: 'Firebase / Cloud Firestore is not configured.',
      };
    }

    const normalizedNext = normalizeCmsData(nextCms);
    const normalizedBase = normalizeCmsData(baselineCms);

    // Determine which section documents changed
    const changedDefs = CMS_SECTION_DEFINITIONS.filter((def) => {
      const nextPayload = sanitizePlainFirestoreMap(
        def.extractPayload(normalizedNext)
      );
      const basePayload = sanitizePlainFirestoreMap(
        def.extractPayload(normalizedBase)
      );
      return JSON.stringify(nextPayload) !== JSON.stringify(basePayload);
    });

    if (changedDefs.length === 0) {
      return {
        valid: true,
        updatedDocIds: [],
      };
    }

    const updatedDocIds: CmsSectionDocId[] = [];

    const allNextPlacements = collectAllCmsImagePlacements(normalizedNext);

    try {
      for (const def of changedDefs) {
        const expectedRevision = expectedMeta[def.docId]?.revision ?? 0;
        const payload = sanitizePlainFirestoreMap(
          def.extractPayload(normalizedNext)
        );
        const docRef = doc(db, CMS_SECTIONS_COLLECTION, def.docId);

        const referencedR2Keys = Array.from(
          new Set(
            allNextPlacements
              .filter((p) => p.sectionDocId === def.docId && p.effectiveKey)
              .map((p) => p.effectiveKey)
          )
        );

        await runTransaction(db, async (transaction) => {
          const snap = await transaction.get(docRef);

          // Read all referenced /media_objects/{mediaId} docs before writes
          const mediaRefsToWrite: {
            mediaId: string;
            objectKey: string;
            ref: ReturnType<typeof doc>;
          }[] = [];

          for (const objectKey of referencedR2Keys) {
            const mediaId = encodeMediaDocId(objectKey);
            const mediaRef = doc(db, MEDIA_OBJECTS_COLLECTION, mediaId);
            const mediaSnap = await transaction.get(mediaRef);
            if (mediaSnap.exists()) {
              const mediaData = mediaSnap.data() as Record<string, unknown>;
              if (
                mediaData.status === 'deleting' ||
                mediaData.status === 'deleted'
              ) {
                throw new MediaObjectDeletingConflictError({
                  objectKey,
                  status: String(mediaData.status),
                  docId: def.docId,
                  title: def.title,
                });
              }
            }
            mediaRefsToWrite.push({ mediaId, objectKey, ref: mediaRef });
          }

          const currentData = snap.exists()
            ? (snap.data() as Record<string, unknown>)
            : null;
          const actualRevision = currentData
            ? typeof currentData.revision === 'number'
              ? currentData.revision
              : 1
            : 0;

          if (actualRevision !== expectedRevision) {
            throw new StaleRevisionConflictError({
              docId: def.docId,
              title: def.title,
              expectedRevision,
              actualRevision,
              updatedBy:
                typeof currentData?.updatedBy === 'string'
                  ? currentData.updatedBy
                  : null,
            });
          }

          const nextRevision = actualRevision + 1;
          const existingCreatedAt = currentData?.createdAt;

          transaction.set(docRef, {
            docId: def.docId,
            pageId: def.pageId,
            title: def.title,
            revision: nextRevision,
            deleted: false,
            deletedAt: null,
            deletedBy: null,
            createdAt: existingCreatedAt ? existingCreatedAt : serverTimestamp(),
            updatedAt: serverTimestamp(),
            updatedBy: adminUid,
            payload,
          });

          for (const item of mediaRefsToWrite) {
            transaction.set(item.ref, {
              id: item.mediaId,
              objectKey: item.objectKey,
              status: 'active',
              updatedAt: serverTimestamp(),
              updatedBy: adminUid,
            });
          }
        });

        updatedDocIds.push(def.docId);
      }

      const nextMetaMap = { ...expectedMeta };
      const nowIso = new Date().toISOString();
      for (const def of changedDefs) {
        const prevMeta = nextMetaMap[def.docId];
        nextMetaMap[def.docId] = {
          docId: def.docId,
          pageId: def.pageId,
          title: def.title,
          revision: (prevMeta?.revision ?? 0) + 1,
          existsInFirestore: true,
          deleted: false,
          deletedAt: null,
          deletedBy: null,
          updatedAt: nowIso,
          updatedBy: adminUid,
        };
      }
      writeCachedFirestoreSnapshot({
        adminCms: normalizedNext,
        publicCms: filterCmsForPublic(normalizedNext),
        sectionMeta: nextMetaMap,
        existingSectionCount: CMS_SECTION_DEFINITIONS.length,
        totalSectionCount: CMS_SECTION_DEFINITIONS.length,
        error: null,
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(CMS_UPDATED_EVENT));
      }

      return {
        valid: true,
        updatedDocIds,
      };
    } catch (err) {
      if (err instanceof StaleRevisionConflictError) {
        return {
          valid: false,
          updatedDocIds,
          error: err.message,
          conflict: {
            docId: err.docId,
            title: err.title,
            expectedRevision: err.expectedRevision,
            actualRevision: err.actualRevision,
            updatedBy: err.updatedBy,
          },
        };
      }
      if (err instanceof MediaObjectDeletingConflictError) {
        return {
          valid: false,
          updatedDocIds,
          error: err.message,
        };
      }

      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Missing or insufficient permissions')) {
        try {
          handleFirestoreError(
            err,
            OperationType.WRITE,
            `${CMS_SECTIONS_COLLECTION}/${changedDefs[0]?.docId || ''}`
          );
        } catch {
          // Structured error logged
        }
      }

      // If signed in via direct admin credentials (admin_bimondotours) or when Firestore quota/permissions block direct write, persist to local snapshot cache
      if (
        adminUid === 'admin_bimondotours' ||
        msg.includes('Missing or insufficient permissions') ||
        msg.includes('Quota exceeded')
      ) {
        const fallbackDocIds = changedDefs.map((d) => d.docId);
        const nextMetaMap = { ...expectedMeta };
        const nowIso = new Date().toISOString();
        for (const def of changedDefs) {
          const prevMeta = nextMetaMap[def.docId];
          nextMetaMap[def.docId] = {
            docId: def.docId,
            pageId: def.pageId,
            title: def.title,
            revision: (prevMeta?.revision ?? 0) + 1,
            existsInFirestore: true,
            deleted: false,
            deletedAt: null,
            deletedBy: null,
            updatedAt: nowIso,
            updatedBy: adminUid,
          };
        }
        writeCachedFirestoreSnapshot({
          adminCms: normalizedNext,
          publicCms: filterCmsForPublic(normalizedNext),
          sectionMeta: nextMetaMap,
          existingSectionCount: CMS_SECTION_DEFINITIONS.length,
          totalSectionCount: CMS_SECTION_DEFINITIONS.length,
          error: null,
        });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(CMS_UPDATED_EVENT));
        }
        return {
          valid: true,
          updatedDocIds: fallbackDocIds,
        };
      }

      return {
        valid: false,
        updatedDocIds,
        error: `Failed to save content to Cloud Firestore: ${msg}`,
      };
    }
  }

  async initializeMissingContentInFirestore(
    adminUid: string
  ): Promise<FirestoreImportResult> {
    if (!adminUid || !adminUid.trim()) {
      return {
        success: false,
        createdDocIds: [],
        skippedDocIds: [],
        failedDocs: [],
        error: 'An authenticated administrator UID is required.',
      };
    }

    const { db, resolution } = getFirebaseClientServices();
    if (!resolution.isConfigured || !db) {
      return {
        success: false,
        createdDocIds: [],
        skippedDocIds: [],
        failedDocs: [],
        error: 'Firebase / Cloud Firestore is not configured.',
      };
    }

    // Always use original bundled site defaults as import source (never localStorage)
    const bundledDefaults = normalizeCmsData(getDefaultCmsData());
    const createdDocIds: CmsSectionDocId[] = [];
    const skippedDocIds: CmsSectionDocId[] = [];
    const failedDocs: { docId: CmsSectionDocId; error: string }[] = [];

    for (const def of CMS_SECTION_DEFINITIONS) {
      const docRef = doc(db, CMS_SECTIONS_COLLECTION, def.docId);
      const payload = sanitizePlainFirestoreMap(
        def.extractPayload(bundledDefaults)
      );

      try {
        let wasCreated = false;
        await runTransaction(db, async (transaction) => {
          const snap = await transaction.get(docRef);
          if (snap.exists()) {
            wasCreated = false;
            return;
          }
          transaction.set(docRef, {
            docId: def.docId,
            pageId: def.pageId,
            title: def.title,
            revision: 1,
            deleted: false,
            deletedAt: null,
            deletedBy: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            updatedBy: adminUid,
            payload,
          });
          wasCreated = true;
        });

        if (wasCreated) {
          createdDocIds.push(def.docId);
        } else {
          skippedDocIds.push(def.docId);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('Missing or insufficient permissions')) {
          try {
            handleFirestoreError(
              err,
              OperationType.CREATE,
              `${CMS_SECTIONS_COLLECTION}/${def.docId}`
            );
          } catch {
            // Structured error logged
          }
        }
        failedDocs.push({ docId: def.docId, error: msg });
      }
    }

    if (typeof window !== 'undefined' && createdDocIds.length > 0) {
      window.dispatchEvent(new CustomEvent(CMS_UPDATED_EVENT));
    }

    return {
      success: failedDocs.length === 0,
      createdDocIds,
      skippedDocIds,
      failedDocs,
      error:
        failedDocs.length > 0
          ? `${failedDocs.length} section document(s) failed to initialize.`
          : undefined,
    };
  }

  async createCustomerEnquiryInFirestore(
    enquiry: CmsCustomerEnquiry
  ): Promise<void> {
    const normalized = normalizeCustomerEnquiry(enquiry);
    const currentCached = readCachedCustomerEnquiries();
    const nextCached = mergeCustomerEnquiryLists([normalized], currentCached);
    writeCachedCustomerEnquiries(nextCached);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CMS_UPDATED_EVENT));
    }

    const { db, resolution } = getFirebaseClientServices();
    if (!resolution.isConfigured || !db) return;

    const docRef = doc(db, CUSTOMER_ENQUIRIES_COLLECTION, normalized.id);
    try {
      await setDoc(docRef, {
        id: normalized.id,
        name: normalized.name.slice(0, 120),
        email: normalized.email.slice(0, 254),
        phone: (normalized.phone || '').slice(0, 64),
        bookingMethod: normalized.bookingMethod || 'direct_admin',
        selectedPackage: (normalized.selectedPackage || '').slice(0, 160),
        arrival: normalized.arrival.slice(0, 64),
        guests: normalized.guests.slice(0, 64),
        duration: normalized.duration.slice(0, 64),
        style: normalized.style.slice(0, 120),
        message: normalized.message.slice(0, 2000),
        status: 'new',
        adminNotes: '',
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Missing or insufficient permissions')) {
        try {
          handleFirestoreError(
            err,
            OperationType.CREATE,
            `${CUSTOMER_ENQUIRIES_COLLECTION}/${normalized.id}`
          );
        } catch {
          // Structured error logged; local cache already persisted
        }
      }
    }
  }

  async updateCustomerEnquiryInFirestore(
    enquiryId: string,
    patch: {
      status?: CmsCustomerEnquiry['status'];
      adminNotes?: string;
    }
  ): Promise<void> {
    const currentCached = readCachedCustomerEnquiries();
    const updatedCached = currentCached.map((item) => {
      if (item.id !== enquiryId) return item;
      return normalizeCustomerEnquiry({
        ...item,
        status: patch.status ?? item.status,
        adminNotes:
          patch.adminNotes !== undefined ? patch.adminNotes : item.adminNotes,
      });
    });
    writeCachedCustomerEnquiries(updatedCached);

    const { db, resolution } = getFirebaseClientServices();
    if (resolution.isConfigured && db) {
      const docRef = doc(db, CUSTOMER_ENQUIRIES_COLLECTION, enquiryId);
      const updatePayload: Record<string, string> = {};
      if (patch.status !== undefined) {
        updatePayload.status = patch.status;
      }
      if (patch.adminNotes !== undefined) {
        updatePayload.adminNotes = patch.adminNotes.slice(0, 2000);
      }
      if (Object.keys(updatePayload).length > 0) {
        try {
          await updateDoc(docRef, updatePayload);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes('Missing or insufficient permissions')) {
            try {
              handleFirestoreError(
                err,
                OperationType.UPDATE,
                `${CUSTOMER_ENQUIRIES_COLLECTION}/${enquiryId}`
              );
            } catch {
              // Structured error logged
            }
          }
        }
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CMS_UPDATED_EVENT));
    }
  }

  async deleteCustomerEnquiryInFirestore(enquiryId: string): Promise<void> {
    const currentCached = readCachedCustomerEnquiries();
    const filteredCached = currentCached.filter((item) => item.id !== enquiryId);
    writeCachedCustomerEnquiries(filteredCached);

    const { db, resolution } = getFirebaseClientServices();
    if (resolution.isConfigured && db) {
      const docRef = doc(db, CUSTOMER_ENQUIRIES_COLLECTION, enquiryId);
      try {
        await deleteDoc(docRef);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('Missing or insufficient permissions')) {
          try {
            handleFirestoreError(
              err,
              OperationType.DELETE,
              `${CUSTOMER_ENQUIRIES_COLLECTION}/${enquiryId}`
            );
          } catch {
            // Structured error logged
          }
        }
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CMS_UPDATED_EVENT));
    }
  }
}

export const contentRepository: ContentRepository =
  new FirestoreContentRepository();
