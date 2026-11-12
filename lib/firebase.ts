'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  doc,
  getDoc,
  getFirestore,
  initializeFirestore,
  setLogLevel,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

function initFirestoreClient(): Firestore {
  try {
    setLogLevel('silent');
  } catch {
    // Ignore log level errors
  }
  try {
    return initializeFirestore(
      app,
      {
        experimentalAutoDetectLongPolling: true,
        ignoreUndefinedProperties: true,
      },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

export const db = initFirestoreClient();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function isOfflineFirestoreError(error: unknown): boolean {
  const msg =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();
  return (
    msg.includes('client is offline') ||
    msg.includes('could not reach cloud firestore backend') ||
    msg.includes('unavailable') ||
    msg.includes('network error')
  );
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  // Do not crash or spam console errors when Firestore is operating in offline cache mode
  if (isOfflineFirestoreError(error)) {
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Guard that strictly prevents any base64 / data:image payload from ever
 * being saved to Firestore. All images must be uploaded to Cloudflare R2
 * and referenced only by their R2 CDN URL.
 */
export function assertNoInlineImagesInFirestore(
  value: unknown,
  path = 'root'
): void {
  if (typeof value === 'string') {
    if (value.trim().startsWith('data:image/')) {
      throw new Error(
        `Inline base64 image detected at "${path}". Saving images in Firestore is disabled — upload the image to Cloudflare R2 so only its R2 CDN link is stored in Firebase.`
      );
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, idx) =>
      assertNoInlineImagesInFirestore(item, `${path}[${idx}]`)
    );
    return;
  }
  if (value && typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([k, v]) =>
      assertNoInlineImagesInFirestore(v, `${path}.${k}`)
    );
  }
}

let connectionTested = false;

export async function validateFirestoreConnection(): Promise<void> {
  if (connectionTested || typeof window === 'undefined') return;
  connectionTested = true;
  try {
    await getDoc(doc(db, 'site_cms', 'main'));
  } catch {
    // Gracefully operate with offline cache + /api/admin/cms server fallback
  }
}
