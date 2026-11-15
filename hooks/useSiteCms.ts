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
  resolveCmsImageUrl,
  saveStoredR2Config,
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

function scrubCmsDataMockUrls(data: SiteCmsData): SiteCmsData {
  const cleanUrl = (u?: string) => resolveCmsImageUrl(u, data.general?.r2PublicCdnUrl);

  return {
    ...data,
    general: {
      ...data.general,
      heroImages: Array.isArray(data.general?.heroImages)
        ? data.general.heroImages.map(cleanUrl).filter(Boolean)
        : [],
      storyMainImage: cleanUrl(data.general?.storyMainImage),
      storySecondaryImage: cleanUrl(data.general?.storySecondaryImage),
      experienceImage: cleanUrl(data.general?.experienceImage),
    },
    tours: Array.isArray(data.tours)
      ? data.tours.map((t) => ({ ...t, image: cleanUrl(t.image) }))
      : [],
    stays: Array.isArray(data.stays)
      ? data.stays.map((s) => ({ ...s, image: cleanUrl(s.image) }))
      : [],
    destinations: Array.isArray(data.destinations)
      ? data.destinations.map((d) => ({ ...d, image: cleanUrl(d.image) }))
      : [],
    gallery: Array.isArray(data.gallery)
      ? data.gallery
          .map((g) => ({ ...g, image: cleanUrl(g.image) }))
          .filter((g) => Boolean(g.image))
      : [],
    reviews: Array.isArray(data.reviews)
      ? data.reviews.map((r) => ({ ...r, image: cleanUrl(r.image) }))
      : [],
  };
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
    tours: Array.isArray(d.tours)
      ? (d.tours as SiteCmsData['tours'])
      : sharedCmsState.tours,
    stays: Array.isArray(d.stays)
      ? (d.stays as SiteCmsData['stays'])
      : sharedCmsState.stays,
    destinations: Array.isArray(d.destinations)
      ? (d.destinations as SiteCmsData['destinations'])
      : sharedCmsState.destinations,
    gallery: Array.isArray(d.gallery)
      ? (d.gallery as SiteCmsData['gallery'])
      : sharedCmsState.gallery,
    reviews: Array.isArray(d.reviews)
      ? (d.reviews as SiteCmsData['reviews'])
      : sharedCmsState.reviews,
    faqs: Array.isArray(d.faqs)
      ? (d.faqs as SiteCmsData['faqs'])
      : sharedCmsState.faqs,
  };

  sharedCmsState = scrubCmsDataMockUrls(rawMerged);
}

async function persistFullCmsToFirestore(data: SiteCmsData): Promise<void> {
  const cleanData = scrubCmsDataMockUrls(data);
  assertNoInlineImagesInFirestore(cleanData);
  const actorUid =
    auth.currentUser?.email === 'merlinfiverr0@gmail.com'
      ? auth.currentUser.uid
      : 'bimondo-cms-admin';
  const cmsDocRef = doc(db, 'site_cms', 'main');

  const storedR2 = getStoredR2Config();
  const generalWithR2: SiteCmsData['general'] = {
    ...cleanData.general,
    ...(storedR2.accountId ? { r2AccountId: storedR2.accountId } : {}),
    ...(storedR2.bucketName ? { r2BucketName: storedR2.bucketName } : {}),
    ...(storedR2.publicCdnUrl ? { r2PublicCdnUrl: storedR2.publicCdnUrl } : {}),
  };

  const firestorePayload = {
    id: 'main',
    updatedBy: actorUid,
    updatedAt: serverTimestamp(),
    general: generalWithR2,
    tours: cleanData.tours.slice(0, 50),
    stays: cleanData.stays.slice(0, 50),
    destinations: cleanData.destinations.slice(0, 50),
    gallery: cleanData.gallery.slice(0, 100),
    reviews: cleanData.reviews.slice(0, 100),
    faqs: cleanData.faqs.slice(0, 100),
  };

  try {
    await setDoc(cmsDocRef, firestorePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'site_cms/main');
  }

  try {
    const batch = writeBatch(db);
    cleanData.tours.slice(0, 50).forEach((item, idx) => {
      const id = sanitizeDocId(item.id, `tour_${idx}`);
      batch.set(doc(db, 'tours', id), {
        id,
        updatedBy: actorUid,
        updatedAt: serverTimestamp(),
        payload: item,
      });
    });
    cleanData.stays.slice(0, 50).forEach((item, idx) => {
      const id = sanitizeDocId(item.id, `stay_${idx}`);
      batch.set(doc(db, 'stays', id), {
        id,
        updatedBy: actorUid,
        updatedAt: serverTimestamp(),
        payload: item,
      });
    });
    cleanData.destinations.slice(0, 50).forEach((item, idx) => {
      const id = sanitizeDocId(item.id, `dest_${idx}`);
      batch.set(doc(db, 'destinations', id), {
        id,
        updatedBy: actorUid,
        updatedAt: serverTimestamp(),
        payload: item,
      });
    });
    cleanData.gallery.slice(0, 100).forEach((item, idx) => {
      const id = sanitizeDocId(item.id, `photo_${idx}`);
      batch.set(doc(db, 'gallery', id), {
        id,
        updatedBy: actorUid,
        updatedAt: serverTimestamp(),
        payload: item,
      });
    });
    cleanData.reviews.slice(0, 100).forEach((item, idx) => {
      const id = sanitizeDocId(item.id, `rev_${idx}`);
      batch.set(doc(db, 'reviews', id), {
        id,
        updatedBy: actorUid,
        updatedAt: serverTimestamp(),
        payload: item,
      });
    });
    cleanData.faqs.slice(0, 100).forEach((item, idx) => {
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
    }
  } catch {
    // Ignore transient network errors
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
          persistFullCmsToFirestore(sharedCmsState).catch(() => {});
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

  const saveCmsToFirebase = useCallback(
    async (nextData: SiteCmsData): Promise<SiteCmsData> => {
      const scrubbed = scrubCmsDataMockUrls(nextData);
      assertNoInlineImagesInFirestore(scrubbed);

      const storedR2 = getStoredR2Config();
      const effectiveR2Domain =
        scrubbed.general.r2PublicCdnUrl || storedR2.publicCdnUrl;

      const preparedData: SiteCmsData = {
        ...scrubbed,
        updatedAt: new Date().toISOString(),
        general: {
          ...scrubbed.general,
          ...(storedR2.accountId ? { r2AccountId: storedR2.accountId } : {}),
          ...(storedR2.bucketName ? { r2BucketName: storedR2.bucketName } : {}),
          ...(effectiveR2Domain ? { r2PublicCdnUrl: effectiveR2Domain } : {}),
        },
      };

      await persistFullCmsToFirestore(preparedData);

      sharedCmsState = preparedData;
      notifyListeners();
      window.dispatchEvent(new CustomEvent('bimondo:cms-updated'));
      return preparedData;
    },
    []
  );

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

  const submitCustomerEnquiryToFirebase = useCallback(
    async (
      enquiryInput: Omit<
        CmsCustomerEnquiry,
        'id' | 'createdAt' | 'status' | 'adminNotes'
      >
    ): Promise<CmsCustomerEnquiry | null> => {
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

      try {
        await setDoc(doc(collection(db, 'enquiries'), enquiryId), {
          id: newEnquiry.id,
          name: newEnquiry.name,
          email: newEnquiry.email,
          arrival: newEnquiry.arrival,
          guests: newEnquiry.guests,
          duration: newEnquiry.duration,
          style: newEnquiry.style,
          message: newEnquiry.message,
          status: 'new',
          adminNotes: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.WRITE,
          `enquiries/${enquiryId}`
        );
      }

      sharedCmsState = {
        ...sharedCmsState,
        enquiries: [newEnquiry, ...sharedCmsState.enquiries],
      };
      notifyListeners();
      window.dispatchEvent(new CustomEvent('bimondo:cms-updated'));
      return newEnquiry;
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
