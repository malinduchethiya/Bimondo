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
  FIRESTORE_CMS_SNAPSHOT_CACHE_KEY,
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
let lastFocusRefreshAt = 0;
const preloadedImageUrls = new Set<string>();

function warmCriticalCmsImages(cms: SiteCmsData) {
  if (typeof window === 'undefined') return;

  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  if (nav.connection?.saveData) return;

  const firstHeroSlide = (cms.pages?.home?.hero?.slides || []).find(
    (slide) => slide.visible !== false && !slide.deletedAt && slide.image?.url
  );
  const firstHeroUrl = firstHeroSlide?.image?.url?.trim() || '';

  if (
    !firstHeroUrl ||
    isForbiddenImageUrl(firstHeroUrl) ||
    preloadedImageUrls.has(firstHeroUrl)
  ) {
    return;
  }
  preloadedImageUrls.add(firstHeroUrl);

  try {
    const img = new window.Image();
    img.decoding = 'async';
    if ('fetchPriority' in img) {
      (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority =
        'high';
    }
    img.referrerPolicy = 'no-referrer';
    img.src = firstHeroUrl;
  } catch {
    // Ignore image warm errors
  }
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

function buildMetaSignature(
  meta: Record<CmsSectionDocId, CmsSectionMetadata>,
  existingCount: number,
  updatedAt: string,
  enquiriesCount: number
): string {
  const parts: string[] = [
    String(existingCount),
    updatedAt || '',
    String(enquiriesCount),
  ];
  for (const def of CMS_SECTION_DEFINITIONS) {
    const m = meta[def.docId];
    parts.push(`${m?.revision ?? 0}:${m?.updatedAt ?? ''}`);
  }
  return parts.join('|');
}

let lastSnapshotSignature = initialCached
  ? buildMetaSignature(
      initialCached.sectionMeta,
      initialCached.existingSectionCount,
      initialCached.adminCms.updatedAt,
      initialCached.adminCms.enquiries?.length || 0
    )
  : '';

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
      const nextSig = buildMetaSignature(
        result.sectionMeta,
        result.existingSectionCount,
        result.adminCms.updatedAt,
        result.adminCms.enquiries?.length || 0
      );

      if (
        clientSnapshot.initializedFromServer &&
        !clientSnapshot.loading &&
        nextSig === lastSnapshotSignature &&
        result.error === clientSnapshot.loadError
      ) {
        return clientSnapshot.adminCms;
      }

      lastSnapshotSignature = nextSig;
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
  if (initialCached) {
    window.setTimeout(() => {
      void performFirestoreFetch(false);
    }, 150);
  } else {
    void performFirestoreFetch(false);
  }
}

function ensureWindowEvents() {
  if (windowEventsAttached || typeof window === 'undefined') return;
  windowEventsAttached = true;

  const handleCustomUpdate = () => {
    void performFirestoreFetch(true);
  };

  const handleStorageUpdate = (e: StorageEvent) => {
    if (e.key !== FIRESTORE_CMS_SNAPSHOT_CACHE_KEY) return;
    const latestCached = readCachedFirestoreSnapshot();
    if (latestCached) {
      warmCriticalCmsImages(latestCached.publicCms);
      lastSnapshotSignature = buildMetaSignature(
        latestCached.sectionMeta,
        latestCached.existingSectionCount,
        latestCached.adminCms.updatedAt,
        latestCached.adminCms.enquiries?.length || 0
      );
      clientSnapshot = {
        publicCms: latestCached.publicCms,
        adminCms: latestCached.adminCms,
        sectionMeta: latestCached.sectionMeta,
        existingSectionCount: latestCached.existingSectionCount,
        totalSectionCount: latestCached.totalSectionCount,
        loading: false,
        initializedFromServer: true,
        loadError: null,
      };
      notifyListeners();
    } else {
      void performFirestoreFetch(true);
    }
  };

  const handleFocusOrVisible = () => {
    if (
      typeof document !== 'undefined' &&
      document.visibilityState === 'hidden'
    ) {
      return;
    }
    const now = Date.now();
    if (now - lastFocusRefreshAt < 60000) return;
    lastFocusRefreshAt = now;
    void performFirestoreFetch(true);
  };

  window.addEventListener(CMS_UPDATED_EVENT, handleCustomUpdate);
  window.addEventListener('storage', handleStorageUpdate);
  window.addEventListener('focus', handleFocusOrVisible);
  document.addEventListener('visibilitychange', handleFocusOrVisible);

  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const ch = new BroadcastChannel('bimondo_cms_updates');
      ch.addEventListener('message', () => {
        void performFirestoreFetch(true);
      });
    } catch {
      // Ignore BroadcastChannel errors
    }
  }
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

  const refreshCustomerEnquiries = useCallback(async (): Promise<
    CmsCustomerEnquiry[]
  > => {
    const enquiries =
      await contentRepository.fetchCustomerEnquiriesFromFirestore();
    clientSnapshot = {
      ...clientSnapshot,
      adminCms: {
        ...clientSnapshot.adminCms,
        enquiries,
      },
    };
    notifyListeners();
    return enquiries;
  }, []);

  const submitCustomerEnquiry = useCallback(
    async (
      enquiryInput: Omit<
        CmsCustomerEnquiry,
        'id' | 'createdAt' | 'status' | 'adminNotes'
      >
    ): Promise<CmsCustomerEnquiry> => {
      const enquiryId = sanitizeDocId(`bk_${Date.now()}`, 'bk');

      const newEnquiry: CmsCustomerEnquiry = {
        id: enquiryId,
        name: (enquiryInput.name || 'Traveller').trim().slice(0, 120),
        email: (enquiryInput.email || 'unknown@example.com')
          .trim()
          .slice(0, 254),
        phone: (enquiryInput.phone || '').trim().slice(0, 64),
        bookingMethod: enquiryInput.bookingMethod || 'direct_admin',
        selectedPackage: (
          enquiryInput.selectedPackage || 'Custom Tailor-Made Journey'
        )
          .trim()
          .slice(0, 160),
        arrival: (enquiryInput.arrival || 'Flexible dates').trim().slice(0, 64),
        guests: (enquiryInput.guests || '2 travellers').trim().slice(0, 64),
        duration: (enquiryInput.duration || '7–8 days').trim().slice(0, 64),
        style: (enquiryInput.style || 'Balanced island discovery')
          .trim()
          .slice(0, 120),
        message: (enquiryInput.message || '').trim().slice(0, 2000),
        status: 'new',
        adminNotes: '',
        createdAt: new Date().toISOString(),
      };

      const existing = clientSnapshot.adminCms.enquiries || [];
      clientSnapshot = {
        ...clientSnapshot,
        adminCms: {
          ...clientSnapshot.adminCms,
          enquiries: [
            newEnquiry,
            ...existing.filter((item) => item.id !== newEnquiry.id),
          ],
        },
      };
      notifyListeners();

      await contentRepository.createCustomerEnquiryInFirestore(newEnquiry);
      return newEnquiry;
    },
    []
  );

  const updateCustomerEnquiry = useCallback(
    async (
      enquiryId: string,
      patch: {
        status?: CmsCustomerEnquiry['status'];
        adminNotes?: string;
      }
    ): Promise<void> => {
      const existing = clientSnapshot.adminCms.enquiries || [];
      const nextEnquiries = existing.map((item) =>
        item.id === enquiryId
          ? {
              ...item,
              status: patch.status ?? item.status,
              adminNotes:
                patch.adminNotes !== undefined
                  ? patch.adminNotes
                  : item.adminNotes,
            }
          : item
      );
      clientSnapshot = {
        ...clientSnapshot,
        adminCms: {
          ...clientSnapshot.adminCms,
          enquiries: nextEnquiries,
        },
      };
      notifyListeners();

      await contentRepository.updateCustomerEnquiryInFirestore(enquiryId, patch);
    },
    []
  );

  const deleteCustomerEnquiry = useCallback(
    async (enquiryId: string): Promise<void> => {
      const existing = clientSnapshot.adminCms.enquiries || [];
      clientSnapshot = {
        ...clientSnapshot,
        adminCms: {
          ...clientSnapshot.adminCms,
          enquiries: existing.filter((item) => item.id !== enquiryId),
        },
      };
      notifyListeners();

      await contentRepository.deleteCustomerEnquiryInFirestore(enquiryId);
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
    refreshCustomerEnquiries,
    updateCustomerEnquiry,
    deleteCustomerEnquiry,
  };
}
