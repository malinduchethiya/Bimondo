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

export function useSiteCms() {
  const [cms, setCms] = useState<SiteCmsData>(() => getDefaultCmsData());
  const [loading, setLoading] = useState<boolean>(true);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);

  const fetchServerFallback = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/cms', { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      return (data?.cms as SiteCmsData) || null;
    } catch {
      return null;
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const snap = await getDoc(doc(db, 'site_cms', 'main'));
      if (snap.exists()) {
        const d = snap.data();
        const fallback = await fetchServerFallback();
        setCms((prev) => ({
          ...prev,
          updatedAt:
            typeof d.updatedAt?.toDate === 'function'
              ? d.updatedAt.toDate().toISOString()
              : prev.updatedAt,
          general: d.general || prev.general,
          tours: Array.isArray(d.tours) ? d.tours : prev.tours,
          stays: Array.isArray(d.stays) ? d.stays : prev.stays,
          destinations: Array.isArray(d.destinations)
            ? d.destinations
            : prev.destinations,
          gallery: Array.isArray(d.gallery) ? d.gallery : prev.gallery,
          reviews: Array.isArray(d.reviews) ? d.reviews : prev.reviews,
          faqs: Array.isArray(d.faqs) ? d.faqs : prev.faqs,
          enquiries: fallback?.enquiries || prev.enquiries,
        }));
        setLoading(false);
        return;
      }
    } catch {
      // Fallback to server API if Firestore doc not yet initialized
    }

    const fallback = await fetchServerFallback();
    if (fallback) {
      setCms(fallback);
    }
    setLoading(false);
  }, [fetchServerFallback]);

  useEffect(() => {
    validateFirestoreConnection();
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      setAuthReady(true);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    let active = true;

    // Subscribe to public /site_cms/main document in Firestore (which holds R2 CDN URLs + metadata, never raw images)
    const cmsRef = doc(db, 'site_cms', 'main');
    const unsubSnapshot = onSnapshot(
      cmsRef,
      async (snap) => {
        if (!active) return;
        if (snap.exists()) {
          const d = snap.data();
          const fallback = await fetchServerFallback();
          if (!active) return;
          setCms((prev) => ({
            ...prev,
            updatedAt:
              typeof d.updatedAt?.toDate === 'function'
                ? d.updatedAt.toDate().toISOString()
                : prev.updatedAt,
            general: d.general || prev.general,
            tours: Array.isArray(d.tours) ? d.tours : prev.tours,
            stays: Array.isArray(d.stays) ? d.stays : prev.stays,
            destinations: Array.isArray(d.destinations)
              ? d.destinations
              : prev.destinations,
            gallery: Array.isArray(d.gallery) ? d.gallery : prev.gallery,
            reviews: Array.isArray(d.reviews) ? d.reviews : prev.reviews,
            faqs: Array.isArray(d.faqs) ? d.faqs : prev.faqs,
            enquiries: fallback?.enquiries || prev.enquiries,
          }));
          setLoading(false);
        } else {
          const fallback = await fetchServerFallback();
          if (active && fallback) {
            setCms(fallback);
          }
          if (active) setLoading(false);
        }
      },
      (error) => {
        // If permission error on site_cms/main, report via handleFirestoreError
        if (
          error instanceof Error &&
          error.message.includes('Missing or insufficient permissions')
        ) {
          handleFirestoreError(error, OperationType.GET, 'site_cms/main');
        }
        if (active) setLoading(false);
      }
    );

    const onCustomUpdate = () => {
      refresh();
    };
    window.addEventListener('bimondo:cms-updated', onCustomUpdate);

    return () => {
      active = false;
      unsubSnapshot();
      window.removeEventListener('bimondo:cms-updated', onCustomUpdate);
    };
  }, [fetchServerFallback, refresh]);

  /**
   * Saves CMS metadata & Cloudflare R2 CDN links to both Firebase Firestore
   * and the server API. Strictly rejects any inline/base64 image data.
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

      // 2. If signed in to Firebase as admin, persist metadata & R2 CDN links to Firestore /site_cms/main
      if (auth.currentUser) {
        const cmsDocRef = doc(db, 'site_cms', 'main');
        const firestorePayload = {
          id: 'main',
          updatedBy: auth.currentUser.uid,
          updatedAt: serverTimestamp(),
          general: nextData.general,
          tours: nextData.tours.slice(0, 50),
          stays: nextData.stays.slice(0, 50),
          destinations: nextData.destinations.slice(0, 50),
          gallery: nextData.gallery.slice(0, 100),
          reviews: nextData.reviews.slice(0, 100),
          faqs: nextData.faqs.slice(0, 100),
        };

        try {
          const existingSnap = await getDoc(cmsDocRef);
          if (existingSnap.exists()) {
            await updateDoc(cmsDocRef, {
              updatedBy: auth.currentUser.uid,
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
      }

      setCms(apiData.cms);
      window.dispatchEvent(new CustomEvent('bimondo:cms-updated'));
      return apiData.cms;
    },
    []
  );

  /**
   * Registers or updates a Cloudflare R2 bucket object's CDN link in Firebase Firestore (/r2_media/{id}).
   * Only the R2 CDN URL and metadata are stored in Firestore—never the image binary.
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
      if (!auth.currentUser) return;

      const mediaRef = doc(db, 'r2_media', item.id);
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
            uploadedBy: auth.currentUser.uid,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(mediaRef, {
            id: item.id,
            objectKey: item.objectKey.slice(0, 300),
            cdnUrl: item.cdnUrl.slice(0, 500),
            folder: item.folder,
            fileName: item.fileName.slice(0, 200),
            contentType: item.contentType.slice(0, 100),
            sizeBytes: Math.round(item.sizeBytes),
            uploadedBy: auth.currentUser.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.WRITE,
          `r2_media/${item.id}`
        );
      }
    },
    []
  );

  /**
   * Removes an R2 media catalog entry from Firebase Firestore (/r2_media/{id})
   * after the image object is deleted from the Cloudflare R2 bucket.
   */
  const removeR2MediaFromFirebase = useCallback(async (mediaId: string) => {
    if (!auth.currentUser || !mediaId) return;
    try {
      await deleteDoc(doc(db, 'r2_media', mediaId));
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.DELETE,
        `r2_media/${mediaId}`
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
      const enquiryId = data?.enquiry?.id || `enq_${Date.now()}`;

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
    cms,
    loading,
    authReady,
    firebaseUser,
    refresh,
    setCms,
    saveCmsToFirebase,
    registerR2MediaInFirebase,
    removeR2MediaFromFirebase,
    submitCustomerEnquiryToFirebase,
  };
}
