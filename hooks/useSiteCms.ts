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

async function persistFullCmsToFirestore(data: SiteCmsData): Promise<void> {
  assertNoInlineImagesInFirestore(data);
  const actorUid = auth.currentUser?.uid || 'bimondo-cms-admin';
  const cmsDocRef = doc(db, 'site_cms', 'main');

  const firestorePayload = {
    id: 'main',
    updatedBy: actorUid,
    updatedAt: serverTimestamp(),
    general: data.general,
    tours: data.tours.slice(0, 50),
    stays: data.stays.slice(0, 50),
    destinations: data.destinations.slice(0, 50),
    gallery: data.gallery.slice(0, 100),
    reviews: data.reviews.slice(0, 100),
    faqs: data.faqs.slice(0, 100),
  };

  try {
    const existingSnap = await getDoc(cmsDocRef);
    if (existingSnap.exists()) {
      await updateDoc(cmsDocRef, {
        updatedBy: actorUid,
        updatedAt: serverTimestamp(),
        general: firestorePayload.general,
        tours: firestorePayload.tours,
        stays: firestorePayload.stays,
        destinations: firestorePayload.destinations,
        gallery: firestorePayload.gallery,
        reviews: firestorePayload.reviews,
        faqs: firestorePayload.faqs,
      });
    } else {
      await setDoc(cmsDocRef, firestorePayload);
    }
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
      const fallback = await fetchServerFallbackOnce();
      sharedCmsState = {
        ...sharedCmsState,
        updatedAt:
          typeof d.updatedAt?.toDate === 'function'
            ? d.updatedAt.toDate().toISOString()
            : sharedCmsState.updatedAt,
        general: {
          ...sharedCmsState.general,
          ...(d.general || {}),
        },
        tours: Array.isArray(d.tours) ? d.tours : sharedCmsState.tours,
        stays: Array.isArray(d.stays) ? d.stays : sharedCmsState.stays,
        destinations: Array.isArray(d.destinations)
          ? d.destinations
          : sharedCmsState.destinations,
        gallery: Array.isArray(d.gallery) ? d.gallery : sharedCmsState.gallery,
        reviews: Array.isArray(d.reviews) ? d.reviews : sharedCmsState.reviews,
        faqs: Array.isArray(d.faqs) ? d.faqs : sharedCmsState.faqs,
        enquiries: fallback?.enquiries || sharedCmsState.enquiries,
      };
      sharedLoadingState = false;
      notifyListeners();
      return;
    }
  } catch {
    // Fallback to server API if Firestore doc not yet initialized
  }

  const fallback = await fetchServerFallbackOnce();
  if (fallback) {
    sharedCmsState = fallback;
  }
  sharedLoadingState = false;
  notifyListeners();
}

function initSharedCmsStore() {
  if (storeInitialized || typeof window === 'undefined') return;
  storeInitialized = true;

  validateFirestoreConnection();

  onAuthStateChanged(auth, (u) => {
    sharedFirebaseUser = u;
    sharedAuthReady = true;
    notifyListeners();
  });

  fetchServerFallbackOnce().then((fallback) => {
    if (fallback) {
      sharedCmsState = {
        ...sharedCmsState,
        ...fallback,
      };
      sharedLoadingState = false;
      notifyListeners();
    }
  });

  const cmsRef = doc(db, 'site_cms', 'main');
  onSnapshot(
    cmsRef,
    (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        sharedCmsState = {
          ...sharedCmsState,
          updatedAt:
            typeof d.updatedAt?.toDate === 'function'
              ? d.updatedAt.toDate().toISOString()
              : sharedCmsState.updatedAt,
          general: {
            ...sharedCmsState.general,
            ...(d.general || {}),
          },
          tours: Array.isArray(d.tours) ? d.tours : sharedCmsState.tours,
          stays: Array.isArray(d.stays) ? d.stays : sharedCmsState.stays,
          destinations: Array.isArray(d.destinations)
            ? d.destinations
            : sharedCmsState.destinations,
          gallery: Array.isArray(d.gallery)
            ? d.gallery
            : sharedCmsState.gallery,
          reviews: Array.isArray(d.reviews)
            ? d.reviews
            : sharedCmsState.reviews,
          faqs: Array.isArray(d.faqs) ? d.faqs : sharedCmsState.faqs,
        };
        sharedLoadingState = false;
        notifyListeners();
      } else {
        // Automatically seed initial CMS collections into Firestore if empty
        persistFullCmsToFirestore(sharedCmsState).catch(() => {
          // Ignore seed race condition
        });
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
   * Saves CMS metadata & Cloudflare R2 CDN links to both Firebase Firestore
   * (/site_cms/main + individual collections) and the server API.
   */
  const saveCmsToFirebase = useCallback(
    async (nextData: SiteCmsData): Promise<SiteCmsData> => {
      assertNoInlineImagesInFirestore(nextData);

      // 1. Sync to server store for API routes & enquiries
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cms: nextData }),
      });
      const apiData = await res.json();
      if (!res.ok) {
        throw new Error(apiData.error || 'Failed to update CMS store.');
      }

      // 2. Always persist to Firestore (/site_cms/main + tours, stays, destinations, gallery, reviews, faqs)
      await persistFullCmsToFirestore(apiData.cms);

      sharedCmsState = apiData.cms;
      notifyListeners();
      window.dispatchEvent(new CustomEvent('bimondo:cms-updated'));
      return apiData.cms;
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
      const actorUid = auth.currentUser?.uid || 'bimondo-cms-admin';
      const cleanId = sanitizeDocId(item.id, 'r2_media');
      const mediaRef = doc(db, 'r2_media', cleanId);

      try {
        const snap = await getDoc(mediaRef);
        if (snap.exists()) {
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
   * Submits a public customer enquiry to Firestore (/enquiries/{id}) and the server store.
   */
  const submitCustomerEnquiryToFirebase = useCallback(
    async (
      enquiryInput: Omit<
        CmsCustomerEnquiry,
        'id' | 'createdAt' | 'status' | 'adminNotes'
      >
    ) => {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_enquiry',
          enquiry: enquiryInput,
        }),
      });
      const data = await res.json();
      const enquiryId = sanitizeDocId(
        data?.enquiry?.id || `enq_${Date.now()}`,
        'enq'
      );

      try {
        await setDoc(doc(collection(db, 'enquiries'), enquiryId), {
          id: enquiryId,
          name: (enquiryInput.name || 'Traveller').slice(0, 120),
          email: (enquiryInput.email || 'unknown@example.com').slice(0, 254),
          arrival: (enquiryInput.arrival || 'Flexible').slice(0, 64),
          guests: (enquiryInput.guests || '2 travellers').slice(0, 64),
          duration: (enquiryInput.duration || '7–10 days').slice(0, 64),
          style: (enquiryInput.style || 'A little of everything').slice(0, 100),
          message: (enquiryInput.message || '').slice(0, 2000),
          status: 'new',
          adminNotes: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch {
        // Server API already recorded enquiry if Firestore rules reject unverified fields
      }
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
