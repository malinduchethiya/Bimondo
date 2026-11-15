'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  CmsCustomerEnquiry,
  getDefaultCmsData,
  SiteCmsData,
} from '@/lib/cms-defaults';
import {
  assertNoInlineImagesInFirestore,
  auth,
  db,
  handleFirestoreError,
  OperationType,
  validateFirestoreConnection,
} from '@/lib/firebase';
import {
  ensureClientR2ConfigHydrated,
  getStoredR2Config,
  saveStoredR2Config,
  upgradeCmsUrlsToR2Domain,
} from '@/lib/r2-client';

export interface R2MediaFirestoreRecord {
  id: string;
  objectKey: string;
  cdnUrl: string;
  folder: 'tours' | 'stays' | 'destinations' | 'gallery' | 'general';
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedBy: string;
}

// ============================================================================
// Shared Module-Level Singleton Store
// Ensures all components share one Firestore listener and every Admin save
// writes directly to Firestore (/site_cms/main + individual collections).
// ============================================================================
let sharedCmsState: SiteCmsData = getDefaultCmsData();
let sharedLoadingState = true;
let sharedFirebaseUser: User | null = null;
let sharedAuthReady = false;
let storeInitialized = false;
let firestoreHasLoaded = false;

type StoreListener = () => void;
const listeners = new Set<StoreListener>();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

function sanitizeDocId(rawId: string, fallbackPrefix: string): string {
  const cleaned = String(rawId || '')
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .slice(0, 120);
  return cleaned || `${fallbackPrefix}_${Date.now()}`;
}

async function fetchServerFallbackOnce(): Promise<SiteCmsData | null> {
  try {
    const res = await fetch('/api/admin/cms', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.cms as SiteCmsData) || null;
  } catch {
    return null;
  }
}

function applyFirestoreSnapshotToState(d: Record<string, unknown>) {
  const generalData = (d.general || {}) as SiteCmsData['general'];
  if (
    generalData.r2PublicCdnUrl ||
    generalData.r2AccountId ||
    generalData.r2BucketName
  ) {
    saveStoredR2Config({
      accountId: generalData.r2AccountId || undefined,
      bucketName: generalData.r2BucketName || undefined,
      publicCdnUrl: generalData.r2PublicCdnUrl || undefined,
    });
  }

  const effectiveR2Domain =
    generalData.r2PublicCdnUrl || getStoredR2Config().publicCdnUrl;

  const rawMerged: SiteCmsData = {
    ...sharedCmsState,
    updatedAt:
      typeof (d.updatedAt as { toDate?: () => Date })?.toDate === 'function'
        ? (d.updatedAt as { toDate: () => Date }).toDate().toISOString()
        : sharedCmsState.updatedAt,
    general: {
      ...sharedCmsState.general,
      ...generalData,
    },
    tours:
      Array.isArray(d.tours) && d.tours.length > 0
        ? (d.tours as SiteCmsData['tours'])
        : sharedCmsState.tours,
    stays:
      Array.isArray(d.stays) && d.stays.length > 0
        ? (d.stays as SiteCmsData['stays'])
        : sharedCmsState.stays,
    destinations:
      Array.isArray(d.destinations) && d.destinations.length > 0
        ? (d.destinations as SiteCmsData['destinations'])
        : sharedCmsState.destinations,
    gallery:
      Array.isArray(d.gallery) && d.gallery.length > 0
        ? (d.gallery as SiteCmsData['gallery'])
        : sharedCmsState.gallery,
    reviews:
      Array.isArray(d.reviews) && d.reviews.length > 0
        ? (d.reviews as SiteCmsData['reviews'])
        : sharedCmsState.reviews,
    faqs:
      Array.isArray(d.faqs) && d.faqs.length > 0
        ? (d.faqs as SiteCmsData['faqs'])
        : sharedCmsState.faqs,
  };

  sharedCmsState = effectiveR2Domain
    ? upgradeCmsUrlsToR2Domain(rawMerged, effectiveR2Domain)
    : rawMerged;
  firestoreHasLoaded = true;
}

async function persistFullCmsToFirestore(data: SiteCmsData): Promise<void> {
  assertNoInlineImagesInFirestore(data);
  const actorUid =
    auth.currentUser?.email === 'merlinfiverr0@gmail.com'
      ? auth.currentUser.uid
      : 'bimondo-cms-admin';
  const cmsDocRef = doc(db, 'site_cms', 'main');

  const storedR2 = getStoredR2Config();
  const generalWithR2: SiteCmsData['general'] = {
    ...data.general,
    ...(storedR2.accountId ? { r2AccountId: storedR2.accountId } : {}),
    ...(storedR2.bucketName ? { r2BucketName: storedR2.bucketName } : {}),
    ...(storedR2.publicCdnUrl ? { r2PublicCdnUrl: storedR2.publicCdnUrl } : {}),
  };

  const firestorePayload = {
    id: 'main',
    updatedBy: actorUid,
    updatedAt: serverTimestamp(),
    general: generalWithR2,
    tours: data.tours.slice(0, 50),
    stays: data.stays.slice(0, 50),
    destinations: data.destinations.slice(0, 50),
    gallery: data.gallery.slice(0, 100),
    reviews: data.reviews.slice(0, 100),
    faqs: data.faqs.slice(0, 100),
  };

  try {
    await setDoc(cmsDocRef, firestorePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'site_cms/main');
  }

  // Also sync individual collection documents (tours, stays, destinations, gallery, reviews, faqs)
  try {
    const batch = writeBatch(db);
    data.tours.slice(0, 50).forEach((item, idx) => {
      const id = sanitizeDocId(item.id, `tour_${idx}`);
      batch.set(doc(db, 'tours', id), {
        id,
        updatedBy: actorUid,
        updatedAt: serverTimestamp(),
        payload: item,
      });
    });
    data.stays.slice(0, 50).forEach((item, idx) => {
      const id = sanitizeDocId(item.id, `stay_${idx}`);
      batch.set(doc(db, 'stays', id), {
        id,
        updatedBy: actorUid,
        updatedAt: serverTimestamp(),
        payload: item,
      });
    });
    data.destinations.slice(0, 50).forEach((item, idx) => {
      const id = sanitizeDocId(item.id, `dest_${idx}`);
      batch.set(doc(db, 'destinations', id), {
        id,
        updatedBy: actorUid,
        updatedAt: serverTimestamp(),
        payload: item,
      });
    });
    data.gallery.slice(0, 100).forEach((item, idx) => {
      const id = sanitizeDocId(item.id, `photo_${idx}`);
      batch.set(doc(db, 'gallery', id), {
        id,
        updatedBy: actorUid,
        updatedAt: serverTimestamp(),
        payload: item,
      });
    });
    data.reviews.slice(0, 100).forEach((item, idx) => {
      const id = sanitizeDocId(item.id, `rev_${idx}`);
      batch.set(doc(db, 'reviews', id), {
        id,
        updatedBy: actorUid,
        updatedAt: serverTimestamp(),
        payload: item,
      });
    });
    data.faqs.slice(0, 100).forEach((item, idx) => {
      const id = sanitizeDocId(item.id, `faq_${idx}`);
      batch.set(doc(db, 'faqs', id), {
        id,
        updatedBy: actorUid,
        updatedAt: serverTimestamp(),
        payload: item,
      });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'collections_batch_sync');
  }
}

async function refreshSharedStore() {
  try {
    const snap = await getDoc(doc(db, 'site_cms', 'main'));
    if (snap.exists()) {
      const d = snap.data();
      applyFirestoreSnapshotToState(d);
      const fallback = await fetchServerFallbackOnce();
      if (fallback?.enquiries && fallback.enquiries.length > 0) {
        sharedCmsState = {
          ...sharedCmsState,
          enquiries: fallback.enquiries,
        };
      }
      sharedLoadingState = false;
      notifyListeners();
      return;
    }
  } catch {
    // Fallback to server API if Firestore doc not yet initialized
  }

  if (!firestoreHasLoaded) {
    const fallback = await fetchServerFallbackOnce();
    if (fallback && !firestoreHasLoaded) {
      sharedCmsState = fallback;
    }
  }
  sharedLoadingState = false;
  notifyListeners();
}

function initSharedCmsStore() {
  if (storeInitialized || typeof window === 'undefined') return;
  storeInitialized = true;

  ensureClientR2ConfigHydrated();
  validateFirestoreConnection();

  onAuthStateChanged(auth, (u) => {
    sharedFirebaseUser = u;
    sharedAuthReady = true;
    notifyListeners();
  });

  // Only use server API for enquiries or initial fallback before Firestore responds;
  // NEVER let stateless server defaults overwrite Firestore /site_cms/main data.
  fetchServerFallbackOnce().then((fallback) => {
    if (!fallback) return;
    if (!firestoreHasLoaded) {
      sharedCmsState = {
        ...sharedCmsState,
        ...fallback,
      };
    } else if (
      Array.isArray(fallback.enquiries) &&
      fallback.enquiries.length > 0 &&
      sharedCmsState.enquiries.length === 0
    ) {
      sharedCmsState = {
        ...sharedCmsState,
        enquiries: fallback.enquiries,
      };
    }
    sharedLoadingState = false;
    notifyListeners();
  });

  const cmsRef = doc(db, 'site_cms', 'main');
  onSnapshot(
    cmsRef,
    (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        applyFirestoreSnapshotToState(d);
        sharedLoadingState = false;
        notifyListeners();
      } else {
        if (!snap.metadata.fromCache) {
          persistFullCmsToFirestore(sharedCmsState).catch(() => {
            // Ignore seed race condition
          });
        }
        sharedLoadingState = false;
        notifyListeners();
      }
    },
    (error) => {
      if (
        error instanceof Error &&
        error.message.includes('Missing or insufficient permissions')
      ) {
        handleFirestoreError(error, OperationType.GET, 'site_cms/main');
      }
      sharedLoadingState = false;
      notifyListeners();
    }
  );

  window.addEventListener('bimondo:cms-updated', () => {
    refreshSharedStore();
  });
}

export function useSiteCms() {
  const [, setTick] = useState(0);

  useEffect(() => {
    initSharedCmsStore();
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const setCms = useCallback(
    (updater: SiteCmsData | ((prev: SiteCmsData) => SiteCmsData)) => {
      sharedCmsState =
        typeof updater === 'function' ? updater(sharedCmsState) : updater;
      notifyListeners();
    },
    []
  );

  const refresh = useCallback(async () => {
    await refreshSharedStore();
  }, []);

  /**
   * Saves CMS metadata & Cloudflare R2 CDN links directly to Firebase Firestore
   * (/site_cms/main + individual collections) first, and mirrors to the server API.
   */
  const saveCmsToFirebase = useCallback(
    async (nextData: SiteCmsData): Promise<SiteCmsData> => {
      assertNoInlineImagesInFirestore(nextData);

      const storedR2 = getStoredR2Config();
      const effectiveR2Domain =
        nextData.general.r2PublicCdnUrl || storedR2.publicCdnUrl;

      const preparedData: SiteCmsData = {
        ... (effectiveR2Domain
          ? upgradeCmsUrlsToR2Domain(nextData, effectiveR2Domain)
          : nextData),
        updatedAt: new Date().toISOString(),
        general: {
          ...nextData.general,
          ...(storedR2.accountId ? { r2AccountId: storedR2.accountId } : {}),
          ...(storedR2.bucketName ? { r2BucketName: storedR2.bucketName } : {}),
          ...(effectiveR2Domain ? { r2PublicCdnUrl: effectiveR2Domain } : {}),
        },
      };

      // 1. Authoritative write to Firebase Firestore (/site_cms/main + collections)
      await persistFullCmsToFirestore(preparedData);

      // 2. Mirror to local/server API store (non-destructive)
      try {
        await fetch('/api/admin/cms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cms: preparedData }),
        });
      } catch {
        // Firestore already succeeded
      }

      firestoreHasLoaded = true;
      sharedCmsState = preparedData;
      notifyListeners();
      window.dispatchEvent(new CustomEvent('bimondo:cms-updated'));
      return preparedData;
    },
    []
  );

  /**
   * Registers or updates a Cloudflare R2 bucket object's CDN link in Firebase Firestore (/r2_media/{id}).
   */
  const registerR2MediaInFirebase = useCallback(
    async (item: {
      id: string;
      objectKey: string;
      cdnUrl: string;
      folder: 'tours' | 'stays' | 'destinations' | 'gallery' | 'general';
      fileName: string;
      contentType: string;
      sizeBytes: number;
    }) => {
      assertNoInlineImagesInFirestore(item.cdnUrl, 'r2_media.cdnUrl');
      const actorUid =
    auth.currentUser?.email === 'merlinfiverr0@gmail.com'
      ? auth.currentUser.uid
      : 'bimondo-cms-admin';
      const cleanId = sanitizeDocId(item.id, 'r2_media');
      const mediaRef = doc(db, 'r2_media', cleanId);

      try {
        let existsOnServer = false;
        try {
          const snap = await getDoc(mediaRef);
          existsOnServer = snap.exists();
        } catch {
          existsOnServer = false;
        }
        if (existsOnServer) {
          await updateDoc(mediaRef, {
            objectKey: item.objectKey.slice(0, 300),
            cdnUrl: item.cdnUrl.slice(0, 500),
            folder: item.folder,
            fileName: item.fileName.slice(0, 200),
            contentType: item.contentType.slice(0, 100),
            sizeBytes: Math.round(item.sizeBytes),
            uploadedBy: actorUid,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(mediaRef, {
            id: cleanId,
            objectKey: item.objectKey.slice(0, 300),
            cdnUrl: item.cdnUrl.slice(0, 500),
            folder: item.folder,
            fileName: item.fileName.slice(0, 200),
            contentType: item.contentType.slice(0, 100),
            sizeBytes: Math.round(item.sizeBytes),
            uploadedBy: actorUid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.WRITE,
          `r2_media/${cleanId}`
        );
      }
    },
    []
  );

  /**
   * Removes an R2 media catalog entry from Firebase Firestore (/r2_media/{id}).
   */
  const removeR2MediaFromFirebase = useCallback(async (mediaId: string) => {
    if (!mediaId) return;
    const cleanId = sanitizeDocId(mediaId, 'r2_media');
    try {
      await deleteDoc(doc(db, 'r2_media', cleanId));
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.DELETE,
        `r2_media/${cleanId}`
      );
    }
  }, []);

  /**
   * Submits a public customer booking/enquiry to Firestore (/enquiries/{id}) and the server store,
   * and immediately updates the shared CMS state so the Admin Panel sees it in real time.
   */
  const submitCustomerEnquiryToFirebase = useCallback(
    async (
      enquiryInput: Omit<
        CmsCustomerEnquiry,
        'id' | 'createdAt' | 'status' | 'adminNotes'
      >
    ): Promise<CmsCustomerEnquiry | null> => {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_enquiry',
          enquiry: enquiryInput,
        }),
      });
      const data = await res.json();
      if (data?.cms) {
        sharedCmsState = {
          ...sharedCmsState,
          enquiries: Array.isArray(data.cms.enquiries)
            ? data.cms.enquiries
            : sharedCmsState.enquiries,
        };
        notifyListeners();
        window.dispatchEvent(new CustomEvent('bimondo:cms-updated'));
      }

      const enquiryId = sanitizeDocId(
        data?.enquiry?.id || `bk_${Date.now()}`,
        'bk'
      );

      const methodTag = (enquiryInput.bookingMethod || 'direct_admin').toUpperCase();
      const pkgLabel = enquiryInput.selectedPackage || 'Custom Tailor-Made Journey';
      const phoneLabel = enquiryInput.phone ? ` | Tel: ${enquiryInput.phone}` : '';
      const combinedStyle = `[${methodTag}] ${pkgLabel} · ${
        enquiryInput.style || 'Balanced island discovery'
      }`.slice(0, 100);
      const combinedMsg = `${
        enquiryInput.message || ''
      }${phoneLabel} (Package: ${pkgLabel})`.trim().slice(0, 2000);

      try {
        await setDoc(doc(collection(db, 'enquiries'), enquiryId), {
          id: enquiryId,
          name: (enquiryInput.name || 'Traveller').slice(0, 120),
          email: (enquiryInput.email || 'unknown@example.com').slice(0, 254),
          arrival: (enquiryInput.arrival || 'Flexible').slice(0, 64),
          guests: (enquiryInput.guests || '2 travellers').slice(0, 64),
          duration: (enquiryInput.duration || '7–10 days').slice(0, 64),
          style: combinedStyle,
          message: combinedMsg,
          status: 'new',
          adminNotes: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch {
        // Server API already recorded enquiry
      }

      return (data?.enquiry as CmsCustomerEnquiry) || null;
    },
    []
  );

  return {
    cms: sharedCmsState,
    loading: sharedLoadingState,
    authReady: sharedAuthReady,
    firebaseUser: sharedFirebaseUser,
    refresh,
    setCms,
    saveCmsToFirebase,
    registerR2MediaInFirebase,
    removeR2MediaFromFirebase,
    submitCustomerEnquiryToFirebase,
  };
}
