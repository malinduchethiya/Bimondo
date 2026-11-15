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
  isVerifiedAdminUser,
  OperationType,
  validateFirestoreConnection,
} from '@/lib/firebase';
import {
  R2ClientActionError,
  R2UploadedMediaItem,
  resolveCmsImageUrl,
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
let sharedPublishedCmsState: SiteCmsData = getDefaultCmsData();
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

function requireVerifiedAdminUid(): string {
  const user = auth.currentUser;
  if (!user || !isVerifiedAdminUser(user)) {
    throw new R2ClientActionError({
      message:
        'Sign in with your verified Google admin account (merlinfiverr0@gmail.com) before publishing changes to Firestore.',
      step: 'auth',
      statusCode: 401,
    });
  }
  return user.uid;
}

function scrubCmsDataMockUrls(data: SiteCmsData): SiteCmsData {
  const cleanUrl = (u?: string) =>
    resolveCmsImageUrl(u, data.general?.r2PublicCdnUrl);

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
      ? data.gallery.map((g) => ({ ...g, image: cleanUrl(g.image) }))
      : [],
    reviews: Array.isArray(data.reviews)
      ? data.reviews.map((r) => ({ ...r, image: cleanUrl(r.image) }))
      : [],
  };
}

function applyFirestoreSnapshotToState(d: Record<string, unknown>) {
  const generalData = (d.general || {}) as SiteCmsData['general'];

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

  const scrubbed = scrubCmsDataMockUrls(rawMerged);
  sharedCmsState = scrubbed;
  sharedPublishedCmsState = scrubbed;
}

function buildSiteCmsMainPayload(cleanData: SiteCmsData, actorUid: string) {
  const generalClean = { ...cleanData.general };
  delete generalClean.r2AccountId;

  return {
    id: 'main',
    updatedBy: actorUid,
    updatedAt: serverTimestamp(),
    general: generalClean,
    tours: cleanData.tours.slice(0, 50),
    stays: cleanData.stays.slice(0, 50),
    destinations: cleanData.destinations.slice(0, 50),
    gallery: cleanData.gallery.slice(0, 100),
    reviews: cleanData.reviews.slice(0, 100),
    faqs: cleanData.faqs.slice(0, 100),
  };
}

async function persistFullCmsToFirestore(data: SiteCmsData): Promise<void> {
  const actorUid = requireVerifiedAdminUid();
  const cleanData = scrubCmsDataMockUrls(data);
  assertNoInlineImagesInFirestore(cleanData);

  const batch = writeBatch(db);
  const cmsDocRef = doc(db, 'site_cms', 'main');
  batch.set(cmsDocRef, buildSiteCmsMainPayload(cleanData, actorUid));

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
    if (id === 'r2_system_config') return;
    batch.set(doc(db, 'faqs', id), {
      id,
      updatedBy: actorUid,
      updatedAt: serverTimestamp(),
      payload: item,
    });
  });

  try {
    await batch.commit();
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, 'site_cms/main');
    } catch (formattedErr) {
      throw new R2ClientActionError({
        message:
          formattedErr instanceof Error
            ? `Firestore save failed: ${formattedErr.message}`
            : 'Failed to save CMS state to Firestore.',
        step: 'firestore_save',
      });
    }
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
      }
      // Never perform anonymous default-content writes when snap does not exist
      sharedLoadingState = false;
      notifyListeners();
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
      const previousPublished = sharedPublishedCmsState;
      const scrubbed = scrubCmsDataMockUrls(nextData);
      assertNoInlineImagesInFirestore(scrubbed);

      const preparedData: SiteCmsData = {
        ...scrubbed,
        updatedAt: new Date().toISOString(),
      };

      try {
        await persistFullCmsToFirestore(preparedData);
        sharedCmsState = preparedData;
        sharedPublishedCmsState = preparedData;
        notifyListeners();
        window.dispatchEvent(new CustomEvent('bimondo:cms-updated'));
        return preparedData;
      } catch (err) {
        // Keep previous published state intact on failure
        sharedPublishedCmsState = previousPublished;
        notifyListeners();
        throw err;
      }
    },
    []
  );

  /**
   * Registers an uploaded R2 media item in `r2_media/{id}` without mutating `site_cms/main`.
   */
  const registerR2MediaInFirebase = useCallback(
    async (item: R2UploadedMediaItem) => {
      assertNoInlineImagesInFirestore(item.cdnUrl, 'r2_media.cdnUrl');
      const actorUid = requireVerifiedAdminUid();
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
        try {
          handleFirestoreError(
            error,
            OperationType.WRITE,
            `r2_media/${cleanId}`
          );
        } catch (formattedErr) {
          throw new R2ClientActionError({
            message:
              formattedErr instanceof Error
                ? `Failed to register media in Firestore: ${formattedErr.message}`
                : 'Failed to register media in Firestore.',
            step: 'firestore_save',
          });
        }
      }
    },
    []
  );

  /**
   * Atomically assigns an R2 image to a CMS target and commits `site_cms/main`,
   * the target collection document (if applicable), and `r2_media/{id}` in one writeBatch.
   * Preserves unrelated draft edits in `sharedCmsState`, and rolls back the image field
   * to the prior published value if the Firestore commit fails.
   */
  const assignR2ImageToCmsSlot = useCallback(
    async (params: {
      applyToCms: (current: SiteCmsData) => SiteCmsData;
      mediaItem?: R2UploadedMediaItem;
      collectionDoc?: {
        collectionName:
          | 'tours'
          | 'stays'
          | 'destinations'
          | 'gallery'
          | 'reviews';
        docId: string;
        getPayload: (updatedCms: SiteCmsData) => unknown;
      };
    }): Promise<SiteCmsData> => {
      const actorUid = requireVerifiedAdminUid();
      const snapshotBeforeAttempt = sharedCmsState;
      const nextDraft = scrubCmsDataMockUrls(
        params.applyToCms(sharedCmsState)
      );
      assertNoInlineImagesInFirestore(nextDraft);

      const batch = writeBatch(db);
      const cmsDocRef = doc(db, 'site_cms', 'main');
      batch.set(cmsDocRef, buildSiteCmsMainPayload(nextDraft, actorUid));

      if (params.collectionDoc) {
        const cleanColId = sanitizeDocId(
          params.collectionDoc.docId,
          params.collectionDoc.collectionName
        );
        const payload = params.collectionDoc.getPayload(nextDraft);
        if (payload && typeof payload === 'object') {
          batch.set(doc(db, params.collectionDoc.collectionName, cleanColId), {
            id: cleanColId,
            updatedBy: actorUid,
            updatedAt: serverTimestamp(),
            payload,
          });
        }
      }

      if (params.mediaItem) {
        const item = params.mediaItem;
        const cleanMediaId = sanitizeDocId(item.id, 'r2_media');
        const mediaRef = doc(db, 'r2_media', cleanMediaId);
        let existsOnServer = false;
        try {
          const snap = await getDoc(mediaRef);
          existsOnServer = snap.exists();
        } catch {
          existsOnServer = false;
        }
        if (existsOnServer) {
          batch.update(mediaRef, {
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
          batch.set(mediaRef, {
            id: cleanMediaId,
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
      }

      try {
        await batch.commit();
        const committed: SiteCmsData = {
          ...nextDraft,
          updatedAt: new Date().toISOString(),
        };
        sharedCmsState = committed;
        sharedPublishedCmsState = committed;
        notifyListeners();
        window.dispatchEvent(new CustomEvent('bimondo:cms-updated'));
        return committed;
      } catch (error) {
        // Restore prior state on failure so the UI never falsely shows the failed assignment as published
        sharedCmsState = snapshotBeforeAttempt;
        notifyListeners();
        throw new R2ClientActionError({
          message:
            error instanceof Error
              ? `Firestore assignment failed: ${error.message}`
              : 'Failed to save image assignment to Firestore.',
          step: 'firestore_save',
        });
      }
    },
    []
  );

  const removeR2MediaFromFirebase = useCallback(async (mediaId: string) => {
    if (!mediaId) return;
    requireVerifiedAdminUid();
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
    isVerifiedAdmin: isVerifiedAdminUser(sharedFirebaseUser),
    refresh,
    setCms,
    saveCmsToFirebase,
    registerR2MediaInFirebase,
    assignR2ImageToCmsSlot,
    removeR2MediaFromFirebase,
    submitCustomerEnquiryToFirebase,
  };
}
