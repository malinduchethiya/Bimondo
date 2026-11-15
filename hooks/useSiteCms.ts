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
  normalizeCmsData,
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

let clientSnapshot: CmsStoreSnapshot = {
  ...serverSnapshot,
  loading: true,
};

type StoreListener = () => void;
const listeners = new Set<StoreListener>();
let inflightLoadPromise: Promise<SiteCmsData> | null = null;
let hasTriggeredInitialLoad = false;
let windowEventsAttached = false;

function getClientSnapshot(): CmsStoreSnapshot {
  return clientSnapshot;
}

function getServerStoreSnapshot(): CmsStoreSnapshot {
  return serverSnapshot;
}

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

async function performFirestoreFetch(): Promise<SiteCmsData> {
  if (inflightLoadPromise) {
    return inflightLoadPromise;
  }

  clientSnapshot = {
    ...clientSnapshot,
    loading: true,
  };
  notifyListeners();

  inflightLoadPromise = (async () => {
    try {
      const result = await contentRepository.fetchFromFirestore();
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

function ensureWindowEvents() {
  if (windowEventsAttached || typeof window === 'undefined') return;
  windowEventsAttached = true;

  const handleCustomUpdate = () => {
    void performFirestoreFetch();
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
      void performFirestoreFetch();
    }
  }, []);

  const reloadFromRepository = useCallback(async (): Promise<SiteCmsData> => {
    return performFirestoreFetch();
  }, []);

  const refresh = useCallback(async () => {
    await performFirestoreFetch();
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
        await performFirestoreFetch();
      }
      return result;
    },
    []
  );

  const initializeFirestoreContent = useCallback(
    async (adminUid: string): Promise<FirestoreImportResult> => {
      const result =
        await contentRepository.initializeMissingContentInFirestore(adminUid);
      await performFirestoreFetch();
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
