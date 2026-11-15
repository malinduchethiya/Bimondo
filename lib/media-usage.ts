import { CmsImageRef, SiteCmsData } from '@/lib/cms-defaults';
import { CmsSectionDocId } from '@/lib/content-repository';
import {
  ALLOWED_ROOT_UPLOAD_PREFIXES,
  PUBLIC_CDN_BASE_URL,
} from '@/lib/r2-upload-client';

export type PlacementState = 'active' | 'hidden' | 'trashed' | 'draft';

export interface MediaPlacementReference {
  fieldId: string;
  sectionDocId: CmsSectionDocId;
  readableLocation: string;
  state: PlacementState;
  url: string;
  key: string | null;
  effectiveKey: string;
  matchedBy: 'exact_key' | 'cdn_url';
  altText: string;
}

export type MediaUsageStatus = 'in_use' | 'unused' | 'check_incomplete';

export interface MediaUsageReport {
  objectKey: string;
  status: MediaUsageStatus;
  statusLabel:
    | 'In use'
    | 'No saved references found'
    | 'Usage check incomplete';
  canDeletePermanently: boolean;
  incompleteReason: string | null;
  placements: MediaPlacementReference[];
}

function fnv1aHex(input: string, seed = 0x811c9dc5): string {
  let hash = seed >>> 0;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/**
 * Deterministically encodes an R2 object key into a safe Firestore document ID
 * matching `^[a-zA-Z0-9_\-]+$` with length <= 128.
 */
export function encodeMediaDocId(objectKey: string): string {
  const normalized = (objectKey || '').trim().replace(/^\/+|\/+$/g, '');
  if (!normalized) return 'invalid_empty_key';

  const readable = normalized
    .replace(/\//g, '_s_')
    .replace(/\./g, '_d_')
    .replace(/[^a-zA-Z0-9_-]/g, '_');

  const h1 = fnv1aHex(normalized, 0x811c9dc5);
  const h2 = fnv1aHex(normalized, 0x9e3779b9);
  const hashSuffix = `${h1}${h2}`;

  if (readable.length <= 96) {
    return `${readable}_${hashSuffix}`;
  }

  return `${readable.slice(0, 96)}_${hashSuffix}`;
}

/**
 * Extracts and normalizes an R2 object key from a URL ONLY if the URL belongs
 * to the configured public CDN domain (`https://cdn.bimondotours.com`).
 * Returns null for external URLs, relative paths, or invalid prefixes.
 */
export function extractR2KeyFromCdnUrl(
  rawUrl: string | undefined | null,
  publicBaseUrl: string = PUBLIC_CDN_BASE_URL
): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  let parsedUrl: URL;
  let parsedBase: URL;
  try {
    parsedUrl = new URL(trimmed);
    parsedBase = new URL(publicBaseUrl.trim().replace(/\/+$/, ''));
  } catch {
    return null;
  }

  if (
    parsedUrl.protocol.toLowerCase() !== parsedBase.protocol.toLowerCase() ||
    parsedUrl.host.toLowerCase() !== parsedBase.host.toLowerCase()
  ) {
    return null;
  }

  const rawPath = parsedUrl.pathname.replace(/^\/+|\/+$/g, '');
  if (!rawPath) return null;

  const segments = rawPath.split('/');
  const decodedSegments: string[] = [];
  for (const seg of segments) {
    try {
      const dec = decodeURIComponent(seg).trim();
      if (!dec || dec === '.' || dec === '..' || dec.includes('..')) {
        return null;
      }
      decodedSegments.push(dec);
    } catch {
      return null;
    }
  }

  if (decodedSegments.length < 2) return null;
  const rootPrefix = decodedSegments[0].toLowerCase();
  if (
    !ALLOWED_ROOT_UPLOAD_PREFIXES.includes(
      rootPrefix as (typeof ALLOWED_ROOT_UPLOAD_PREFIXES)[number]
    )
  ) {
    return null;
  }

  return decodedSegments.join('/');
}

/**
 * Resolves the effective R2 object key for a CmsImageRef (either from its explicit `key`
 * property or by normalizing a matching `https://cdn.bimondotours.com/...` URL).
 */
export function resolveEffectiveR2Key(
  imageRef: CmsImageRef | undefined | null,
  fallbackUrl = '',
  publicBaseUrl: string = PUBLIC_CDN_BASE_URL
): { effectiveKey: string; matchedBy: 'exact_key' | 'cdn_url' } | null {
  const explicitKey =
    typeof imageRef?.key === 'string' ? imageRef.key.trim() : '';
  if (explicitKey.length > 0) {
    return {
      effectiveKey: explicitKey.replace(/^\/+|\/+$/g, ''),
      matchedBy: 'exact_key',
    };
  }

  const candidateUrl = (imageRef?.url || fallbackUrl || '').trim();
  const extracted = extractR2KeyFromCdnUrl(candidateUrl, publicBaseUrl);
  if (extracted) {
    return {
      effectiveKey: extracted,
      matchedBy: 'cdn_url',
    };
  }

  return null;
}

/**
 * Scans an entire `SiteCmsData` object and returns all placements that reference
 * an R2 image (either by explicit `key` or by normalized CDN URL).
 * Covers active sections, hidden sections/items, and soft-deleted (Trash) items/sections.
 */
export function collectAllCmsImagePlacements(
  cms: SiteCmsData,
  options: {
    publicBaseUrl?: string;
    overrideState?: PlacementState;
  } = {}
): MediaPlacementReference[] {
  const publicBaseUrl = options.publicBaseUrl || PUBLIC_CDN_BASE_URL;
  const placements: MediaPlacementReference[] = [];

  const pushPlacement = (params: {
    fieldId: string;
    sectionDocId: CmsSectionDocId;
    readableLocation: string;
    imageRef: CmsImageRef | undefined | null;
    fallbackUrl?: string;
    fallbackAlt?: string;
    isHidden?: boolean;
    isTrashed?: boolean;
  }) => {
    const resolved = resolveEffectiveR2Key(
      params.imageRef,
      params.fallbackUrl || '',
      publicBaseUrl
    );
    if (!resolved) return;

    let state: PlacementState = 'active';
    if (options.overrideState) {
      state = options.overrideState;
    } else if (params.isTrashed) {
      state = 'trashed';
    } else if (params.isHidden) {
      state = 'hidden';
    }

    placements.push({
      fieldId: params.fieldId,
      sectionDocId: params.sectionDocId,
      readableLocation: params.readableLocation,
      state,
      url: (params.imageRef?.url || params.fallbackUrl || '').trim(),
      key: params.imageRef?.key ?? null,
      effectiveKey: resolved.effectiveKey,
      matchedBy: resolved.matchedBy,
      altText: params.imageRef?.alt || params.fallbackAlt || '',
    });
  };

  // 1. Home -> Hero -> Background Slides
  const heroSectionHidden = cms.pages?.home?.hero?.visible === false;
  const heroSectionTrashed = Boolean(cms.pages?.home?.hero?.deletedAt);
  (cms.pages?.home?.hero?.slides || []).forEach((slide, idx) => {
    pushPlacement({
      fieldId: `hero-slide-img-${slide.id}`,
      sectionDocId: 'home_hero',
      readableLocation: `Home → Hero → Background Slide ${idx + 1}`,
      imageRef: slide.image,
      fallbackAlt: `Sri Lanka Hero Slide ${idx + 1}`,
      isHidden: heroSectionHidden || slide.visible === false,
      isTrashed: heroSectionTrashed || Boolean(slide.deletedAt),
    });
  });

  // 2. Home -> Our Story -> Main & Secondary Images
  const storyHidden = cms.pages?.home?.story?.visible === false;
  const storyTrashed = Boolean(cms.pages?.home?.story?.deletedAt);
  pushPlacement({
    fieldId: 'story-main-img',
    sectionDocId: 'home_story',
    readableLocation: 'Home → Our Story → Primary Portrait Image',
    imageRef: cms.pages?.home?.story?.mainImage,
    fallbackUrl: cms.general?.storyMainImage,
    fallbackAlt: 'Our Story in Sri Lanka',
    isHidden: storyHidden,
    isTrashed: storyTrashed,
  });
  pushPlacement({
    fieldId: 'story-secondary-img',
    sectionDocId: 'home_story',
    readableLocation: 'Home → Our Story → Secondary Inset Image',
    imageRef: cms.pages?.home?.story?.secondaryImage,
    fallbackUrl: cms.general?.storySecondaryImage,
    fallbackAlt: 'Living cultural traditions of Sri Lanka',
    isHidden: storyHidden,
    isTrashed: storyTrashed,
  });

  // 3. Home -> Bento Destination Slider (5 images per slide)
  const bentoSectionHidden = cms.pages?.home?.bentoSlider?.visible === false;
  const bentoSectionTrashed = Boolean(cms.pages?.home?.bentoSlider?.deletedAt);
  (cms.bentoDestinations || []).forEach((slide) => {
    const slideHidden = bentoSectionHidden || slide.visible === false;
    const slideTrashed = bentoSectionTrashed || Boolean(slide.deletedAt);
    const slideTitle = slide.name || slide.id;

    pushPlacement({
      fieldId: `bento-hero-img-${slide.id}`,
      sectionDocId: 'home_bento',
      readableLocation: `Home → Bento Slider (${slideTitle}) → Hero Banner Image`,
      imageRef: slide.heroImageRef,
      fallbackUrl: slide.heroImage,
      fallbackAlt: slideTitle,
      isHidden: slideHidden,
      isTrashed: slideTrashed,
    });
    pushPlacement({
      fieldId: `bento-pathway-img-${slide.id}`,
      sectionDocId: 'home_bento',
      readableLocation: `Home → Bento Slider (${slideTitle}) → Pathway Image`,
      imageRef: slide.pathwayImageRef,
      fallbackUrl: slide.pathwayImage,
      fallbackAlt: `${slideTitle} pathway`,
      isHidden: slideHidden,
      isTrashed: slideTrashed,
    });
    pushPlacement({
      fieldId: `bento-tall-img-${slide.id}`,
      sectionDocId: 'home_bento',
      readableLocation: `Home → Bento Slider (${slideTitle}) → Tall Atmospheric Image`,
      imageRef: slide.tallSceneImageRef,
      fallbackUrl: slide.tallSceneImage,
      fallbackAlt: `${slideTitle} atmosphere`,
      isHidden: slideHidden,
      isTrashed: slideTrashed,
    });
    pushPlacement({
      fieldId: `bento-nature-img-${slide.id}`,
      sectionDocId: 'home_bento',
      readableLocation: `Home → Bento Slider (${slideTitle}) → Nature Image`,
      imageRef: slide.natureImageRef,
      fallbackUrl: slide.natureImage,
      fallbackAlt: `${slideTitle} nature`,
      isHidden: slideHidden,
      isTrashed: slideTrashed,
    });
    pushPlacement({
      fieldId: `bento-cuisine-img-${slide.id}`,
      sectionDocId: 'home_bento',
      readableLocation: `Home → Bento Slider (${slideTitle}) → Cuisine Image`,
      imageRef: slide.cuisineImageRef,
      fallbackUrl: slide.cuisineImage,
      fallbackAlt: `${slideTitle} cuisine`,
      isHidden: slideHidden,
      isTrashed: slideTrashed,
    });
  });

  // 4. Home -> Experience Section -> Feature Image
  const expHidden = cms.pages?.home?.experience?.visible === false;
  const expTrashed = Boolean(cms.pages?.home?.experience?.deletedAt);
  pushPlacement({
    fieldId: 'exp-feature-img',
    sectionDocId: 'home_experience',
    readableLocation: 'Home → Signature Experience → Feature Image',
    imageRef: cms.pages?.home?.experience?.featureImage,
    fallbackUrl: cms.general?.experienceImage,
    fallbackAlt: 'Sri Lanka coastal and highland landscapes',
    isHidden: expHidden,
    isTrashed: expTrashed,
  });

  // 5. Home -> Guest Thoughts & Reviews
  const reviewsSectionHidden =
    cms.pages?.home?.valuesReviews?.visible === false;
  const reviewsSectionTrashed = Boolean(
    cms.pages?.home?.valuesReviews?.deletedAt
  );
  (cms.reviews || []).forEach((rev) => {
    pushPlacement({
      fieldId: `rev-img-${rev.id}`,
      sectionDocId: 'home_reviews',
      readableLocation: `Home → Guest Reviews → ${rev.name || rev.id}`,
      imageRef: rev.imageRef,
      fallbackUrl: rev.image,
      fallbackAlt: rev.name,
      isHidden: reviewsSectionHidden || rev.visible === false,
      isTrashed: reviewsSectionTrashed || Boolean(rev.deletedAt),
    });
  });

  // 6. Destinations -> Regional Destinations
  (cms.destinations || []).forEach((dest) => {
    pushPlacement({
      fieldId: `dest-img-${dest.id}`,
      sectionDocId: 'destinations_catalog',
      readableLocation: `Destinations → Regional Destinations → ${dest.name || dest.id}`,
      imageRef: dest.imageRef,
      fallbackUrl: dest.image,
      fallbackAlt: dest.name,
      isHidden: dest.visible === false,
      isTrashed: Boolean(dest.deletedAt),
    });
  });

  // 7. Destinations -> Colombo Day Experiences
  (cms.colomboExperiences || []).forEach((exp) => {
    pushPlacement({
      fieldId: `col-exp-img-${exp.id}`,
      sectionDocId: 'destinations_catalog',
      readableLocation: `Destinations → Colombo Day Experiences → ${exp.name || exp.id}`,
      imageRef: exp.imageRef,
      fallbackUrl: exp.image,
      fallbackAlt: exp.name,
      isHidden: exp.visible === false,
      isTrashed: Boolean(exp.deletedAt),
    });
  });

  // 8. Packages -> Multi-Day Tours
  (cms.tours || []).forEach((tour) => {
    pushPlacement({
      fieldId: `tour-img-${tour.id}`,
      sectionDocId: 'packages_tours',
      readableLocation: `Packages → Signature Tours → ${tour.name || tour.id}`,
      imageRef: tour.imageRef,
      fallbackUrl: tour.image,
      fallbackAlt: tour.name,
      isHidden: tour.visible === false,
      isTrashed: Boolean(tour.deletedAt),
    });
  });

  // 9. Stays -> Regional Accommodations
  (cms.stays || []).forEach((stay) => {
    pushPlacement({
      fieldId: `stay-img-${stay.id}`,
      sectionDocId: 'stays_catalog',
      readableLocation: `Boutique Stays → Accommodations → ${stay.name || stay.id}`,
      imageRef: stay.imageRef,
      fallbackUrl: stay.image,
      fallbackAlt: stay.name,
      isHidden: stay.visible === false,
      isTrashed: Boolean(stay.deletedAt),
    });
  });

  // 10. Gallery -> Photo Cards
  (cms.gallery || []).forEach((photo) => {
    pushPlacement({
      fieldId: `gal-img-${photo.id}`,
      sectionDocId: 'gallery_page',
      readableLocation: `Gallery → Photo Cards → ${photo.title || photo.id}`,
      imageRef: photo.imageRef,
      fallbackUrl: photo.image,
      fallbackAlt: photo.title,
      isHidden: photo.visible === false,
      isTrashed: Boolean(photo.deletedAt),
    });
  });

  return placements;
}

/**
 * Evaluates where a specific R2 object key is used across saved Firestore content
 * and unsaved draft edits, distinguishing "In use", "No saved references found",
 * and "Usage check incomplete".
 */
export function evaluateMediaObjectUsage(params: {
  objectKey: string;
  savedCms: SiteCmsData;
  draftCms?: SiteCmsData | null;
  loadingFirestore: boolean;
  loadError: string | null;
  existingSectionCount: number;
  totalSectionCount: number;
  publicBaseUrl?: string;
}): MediaUsageReport {
  const normalizedTargetKey = (params.objectKey || '')
    .trim()
    .replace(/^\/+|\/+$/g, '');

  const savedPlacements = collectAllCmsImagePlacements(params.savedCms, {
    publicBaseUrl: params.publicBaseUrl,
  }).filter((p) => p.effectiveKey === normalizedTargetKey);

  const combinedByFieldId = new Map<string, MediaPlacementReference>();
  for (const p of savedPlacements) {
    combinedByFieldId.set(p.fieldId, p);
  }

  if (params.draftCms) {
    const draftPlacements = collectAllCmsImagePlacements(params.draftCms, {
      publicBaseUrl: params.publicBaseUrl,
    }).filter((p) => p.effectiveKey === normalizedTargetKey);

    for (const dp of draftPlacements) {
      if (!combinedByFieldId.has(dp.fieldId)) {
        combinedByFieldId.set(dp.fieldId, {
          ...dp,
          state: 'draft',
        });
      }
    }
  }

  const placements = Array.from(combinedByFieldId.values());

  // Determine whether the usage check across all Firestore sections is complete
  let incompleteReason: string | null = null;
  if (params.loadingFirestore) {
    incompleteReason =
      'Firestore content sections are still loading. Wait for loading to finish before reviewing unused status.';
  } else if (params.loadError) {
    incompleteReason = `Firestore read error: ${params.loadError}. Reference check could not verify all published sections.`;
  } else if (params.existingSectionCount < params.totalSectionCount) {
    incompleteReason = `Only ${params.existingSectionCount} of ${params.totalSectionCount} Firestore section documents are initialized. Click "Initialize Website Content" first so all sections are authoritatively tracked in Firestore.`;
  }

  if (placements.length > 0) {
    return {
      objectKey: normalizedTargetKey,
      status: 'in_use',
      statusLabel: 'In use',
      canDeletePermanently: false,
      incompleteReason,
      placements,
    };
  }

  if (incompleteReason) {
    return {
      objectKey: normalizedTargetKey,
      status: 'check_incomplete',
      statusLabel: 'Usage check incomplete',
      canDeletePermanently: false,
      incompleteReason,
      placements: [],
    };
  }

  return {
    objectKey: normalizedTargetKey,
    status: 'unused',
    statusLabel: 'No saved references found',
    canDeletePermanently: true,
    incompleteReason: null,
    placements: [],
  };
}
