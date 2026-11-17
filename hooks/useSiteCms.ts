'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import {
  CmsCustomerEnquiry,
  getDefaultCmsData,
  SiteCmsData,
} from '@/lib/cms-defaults';
import {
  CMS_SECTION_DEFINITIONS,
  CMS_UPDATED_EVENT,
  CmsSectionDocId,
  CmsSectionMetadata,
  contentRepository,
  createInitialSectionMetaMap,
  filterCmsForPublic,
  FirestoreImportResult,
  FirestoreSaveResult,
  isForbiddenImageUrl,
  normalizeCmsData,
  readCachedFirestoreSnapshot,
} from '@/lib/content-repository';

interface CmsStoreSnapshot {
  publicCms: SiteCmsData;
  adminCms: SiteCmsData;
  sectionMeta: Record<CmsSectionDocId, CmsSectionMetadata>;
  existingSectionCount: number;
  totalSectionCount: number;
  loading: boolean;
  initializedFromServer: boolean;
  loadError: string | null;
}

const defaultNormalized = normalizeCmsData(getDefaultCmsData());
const defaultPublic = filterCmsForPublic(defaultNormalized);
const initialMeta = createInitialSectionMetaMap();

const serverSnapshot: CmsStoreSnapshot = {
  publicCms: defaultPublic,
  adminCms: defaultNormalized,
  sectionMeta: initialMeta,
  existingSectionCount: 0,
  totalSectionCount: CMS_SECTION_DEFINITIONS.length,
  loading: false,
  initializedFromServer: false,
  loadError: null,
};

const initialCached =
  typeof window !== 'undefined' ? readCachedFirestoreSnapshot() : null;

let clientSnapshot: CmsStoreSnapshot = initialCached
  ? {
      publicCms: initialCached.publicCms,
      adminCms: initialCached.adminCms,
      sectionMeta: initialCached.sectionMeta,
      existingSectionCount: initialCached.existingSectionCount,
      totalSectionCount: initialCached.totalSectionCount,
      loading: false,
      initializedFromServer: true,
      loadError: null,
    }
  : {
      ...serverSnapshot,
      loading: true,
    };

type StoreListener = () => void;
const listeners = new Set<StoreListener>();
let inflightLoadPromise: Promise<SiteCmsData> | null = null;
let hasTriggeredInitialLoad = false;
let windowEventsAttached = false;
const preloadedImageUrls = new Set<string>();

function warmCriticalCmsImages(cms: SiteCmsData) {
  if (typeof window === 'undefined') return;

  const highPriorityUrls: string[] = [];
  const warmUrls: string[] = [];

  for (const slide of cms.pages?.home?.hero?.slides || []) {
    if (slide.visible !== false && !slide.deletedAt && slide.image?.url) {
      highPriorityUrls.push(slide.image.url.trim());
    }
  }

  if (cms.pages?.home?.story?.mainImage?.url) {
    highPriorityUrls.push(cms.pages.home.story.mainImage.url.trim());
  }
  if (cms.pages?.home?.story?.secondaryImage?.url) {
    warmUrls.push(cms.pages.home.story.secondaryImage.url.trim());
  }
  if (cms.pages?.home?.experience?.featureImage?.url) {
    warmUrls.push(cms.pages.home.experience.featureImage.url.trim());
  }

  const firstBento = (cms.bentoDestinations || []).find(
    (b) => b.visible !== false && !b.deletedAt
  );
  if (firstBento) {
    for (const ref of [
      firstBento.heroImageRef,
      firstBento.pathwayImageRef,
      firstBento.tallSceneImageRef,
      firstBento.natureImageRef,
      firstBento.cuisineImageRef,
    ]) {
      if (ref?.url) warmUrls.push(ref.url.trim());
    }
  }

  for (const dest of (cms.destinations || []).slice(0, 4)) {
    const u = (dest.imageRef?.url || dest.image || '').trim();
    if (u) warmUrls.push(u);
  }

  const preloadSingle = (rawUrl: string, highPriority: boolean) => {
    if (
      !rawUrl ||
      isForbiddenImageUrl(rawUrl) ||
      preloadedImageUrls.has(rawUrl)
    ) {
      return;
    }
    preloadedImageUrls.add(rawUrl);

    try {
      const img = new window.Image();
      img.decoding = 'async';
      if (highPriority && 'fetchPriority' in img) {
        (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority =
          'high';
      }
      img.referrerPolicy = 'no-referrer';
      img.src = rawUrl;
    } catch {
      // Ignore image warm errors
    }
  };

  highPriorityUrls.forEach((u) => preloadSingle(u, true));
  warmUrls.forEach((u) => preloadSingle(u, false));
}

if (initialCached) {
  warmCriticalCmsImages(initialCached.publicCms);
}

function getClientSnapshot(): CmsStoreSnapshot {
  return clientSnapshot;
}

function getServerStoreSnapshot(): CmsStoreSnapshot {
  return serverSnapshot;
}

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

async function performFirestoreFetch(forceServer = false): Promise<SiteCmsData> {
  if (inflightLoadPromise && !forceServer) {
    return inflightLoadPromise;
  }

  if (!clientSnapshot.initializedFromServer) {
    clientSnapshot = {
      ...clientSnapshot,
      loading: true,
    };
    notifyListeners();
  }

  inflightLoadPromise = (async () => {
    try {
      const result = await contentRepository.fetchFromFirestore({
        forceServer,
      });
      warmCriticalCmsImages(result.publicCms);
      clientSnapshot = {
        publicCms: result.publicCms,
        adminCms: result.adminCms,
        sectionMeta: result.sectionMeta,
        existingSectionCount: result.existingSectionCount,
        totalSectionCount: result.totalSectionCount,
        loading: false,
        initializedFromServer: true,
        loadError: result.error,
      };
      notifyListeners();
      return result.adminCms;
    } finally {
      inflightLoadPromise = null;
    }
  })();

  return inflightLoadPromise;
}

if (typeof window !== 'undefined' && !hasTriggeredInitialLoad) {
  hasTriggeredInitialLoad = true;
  contentRepository.clearLegacyLocalStorage();
  void performFirestoreFetch(false);
}

function ensureWindowEvents() {
  if (windowEventsAttached || typeof window === 'undefined') return;
  windowEventsAttached = true;

  const handleCustomUpdate = () => {
    void performFirestoreFetch(true);
  };

  window.addEventListener(CMS_UPDATED_EVENT, handleCustomUpdate);
}

function subscribe(listener: StoreListener): () => void {
  ensureWindowEvents();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function sanitizeDocId(rawId: string, fallbackPrefix: string): string {
  const cleaned = String(rawId || '')
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .slice(0, 120);
  return cleaned || `${fallbackPrefix}_${Date.now()}`;
}

export function useSiteCms() {
  const snapshot = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerStoreSnapshot
  );

  useEffect(() => {
    contentRepository.clearLegacyLocalStorage();
    if (!hasTriggeredInitialLoad) {
      hasTriggeredInitialLoad = true;
      void performFirestoreFetch(false);
    }
  }, []);

  const reloadFromRepository = useCallback(async (): Promise<SiteCmsData> => {
    return performFirestoreFetch(true);
  }, []);

  const refresh = useCallback(async () => {
    await performFirestoreFetch(true);
  }, []);

  const saveCmsToFirestore = useCallback(
    async (
      nextData: SiteCmsData,
      adminUid: string
    ): Promise<FirestoreSaveResult> => {
      const current = getClientSnapshot();
      const result = await contentRepository.saveChangedSectionsToFirestore({
        nextCms: nextData,
        baselineCms: current.adminCms,
        expectedMeta: current.sectionMeta,
        adminUid,
      });

      if (result.valid) {
        await performFirestoreFetch(true);
      }
      return result;
    },
    []
  );

  const initializeFirestoreContent = useCallback(
    async (adminUid: string): Promise<FirestoreImportResult> => {
      const result =
        await contentRepository.initializeMissingContentInFirestore(adminUid);
      await performFirestoreFetch(true);
      return result;
    },
    []
  );

  const submitCustomerEnquiry = useCallback(
    async (
      enquiryInput: Omit<
        CmsCustomerEnquiry,
        'id' | 'createdAt' | 'status' | 'adminNotes'
      >
    ): Promise<CmsCustomerEnquiry> => {
      const enquiryId = sanitizeDocId(`bk_${Date.now()}`, 'bk');

      const methodTag = (
        enquiryInput.bookingMethod || 'direct_admin'
      ).toUpperCase();
      const pkgLabel =
        enquiryInput.selectedPackage || 'Custom Tailor-Made Journey';
      const phoneLabel = enquiryInput.phone
        ? ` | Tel: ${enquiryInput.phone}`
        : '';
      const combinedStyle = `[${methodTag}] ${pkgLabel} · ${
        enquiryInput.style || 'Balanced island discovery'
      }`.slice(0, 100);
      const combinedMsg = `${
        enquiryInput.message || ''
      }${phoneLabel} (Package: ${pkgLabel})`
        .trim()
        .slice(0, 2000);

      const newEnquiry: CmsCustomerEnquiry = {
        id: enquiryId,
        name: (enquiryInput.name || 'Traveller').slice(0, 120),
        email: (enquiryInput.email || 'unknown@example.com').slice(0, 254),
        phone: (enquiryInput.phone || '').slice(0, 64),
        bookingMethod: enquiryInput.bookingMethod || 'direct_admin',
        selectedPackage: pkgLabel,
        arrival: (enquiryInput.arrival || 'Flexible').slice(0, 64),
        guests: (enquiryInput.guests || '2 travellers').slice(0, 64),
        duration: (enquiryInput.duration || '7–10 days').slice(0, 64),
        style: combinedStyle,
        message: combinedMsg,
        status: 'new',
        adminNotes: '',
        createdAt: new Date().toISOString(),
      };

      await contentRepository.createCustomerEnquiryInFirestore(newEnquiry);
      return newEnquiry;
    },
    []
  );

  return {
    cms: snapshot.publicCms,
    adminCms: snapshot.adminCms,
    sectionMeta: snapshot.sectionMeta,
    existingSectionCount: snapshot.existingSectionCount,
    totalSectionCount: snapshot.totalSectionCount,
    loading: snapshot.loading,
    initializedFromServer: snapshot.initializedFromServer,
    loadError: snapshot.loadError,
    storageLabel: contentRepository.storageLabel,
    refresh,
    reloadFromRepository,
    saveCmsToFirestore,
    initializeFirestoreContent,
    submitCustomerEnquiry,
  };
}
