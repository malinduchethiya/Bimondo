'use client';

import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export interface StoredR2ClientConfig {
  accountId: string;
  bucketName: string;
  publicCdnUrl: string;
  accessKeyId: string;
  secretAccessKey: string;
}

const R2_FIRESTORE_DOC_ID = 'r2_system_config';

let memoryR2ClientConfig: StoredR2ClientConfig = {
  accountId: '',
  bucketName: 'bimondo',
  publicCdnUrl: 'https://cdn.bimondotours.com',
  accessKeyId: '',
  secretAccessKey: '',
};

let firestoreHydrationStarted = false;

export function parseR2EndpointInput(raw?: string): {
  accountId: string;
  inferredBucket: string;
} {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return { accountId: '', inferredBucket: '' };

  const match = trimmed.match(
    /^https?:\/\/([a-z0-9]+)(?:\.[a-z0-9-]+)?\.r2\.cloudflarestorage\.com(?:\/([^/?#]+))?/i
  );
  if (match) {
    return {
      accountId: match[1] || '',
      inferredBucket: match[2] || '',
    };
  }

  if (!trimmed.includes('.') && /^[a-z0-9]{20,40}$/i.test(trimmed)) {
    return { accountId: trimmed, inferredBucket: '' };
  }

  return { accountId: trimmed, inferredBucket: '' };
}

export function normalizeR2PublicDomain(raw?: string): string {
  const trimmed = String(raw || '')
    .trim()
    .replace(/\/+$/, '');
  if (!trimmed) return '';
  const withProto = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  if (/\.r2\.cloudflarestorage\.com(\/|$)/i.test(withProto)) {
    return '';
  }
  return withProto;
}

export function getStoredR2Config(): StoredR2ClientConfig {
  return memoryR2ClientConfig;
}

export function saveStoredR2Config(
  patch: Partial<StoredR2ClientConfig>
): StoredR2ClientConfig {
  const current = getStoredR2Config();

  let rawAccount =
    patch.accountId !== undefined
      ? String(patch.accountId).trim()
      : current.accountId;
  let rawBucket =
    patch.bucketName !== undefined && String(patch.bucketName).trim()
      ? String(patch.bucketName).trim()
      : current.bucketName || 'bimondo';

  if (
    patch.publicCdnUrl &&
    /\.r2\.cloudflarestorage\.com/i.test(patch.publicCdnUrl)
  ) {
    const parsedFromCdn = parseR2EndpointInput(patch.publicCdnUrl);
    if (!rawAccount && parsedFromCdn.accountId) {
      rawAccount = patch.publicCdnUrl.trim();
    }
    if (parsedFromCdn.inferredBucket) {
      rawBucket = parsedFromCdn.inferredBucket;
    }
  }
  if (rawAccount && /\.r2\.cloudflarestorage\.com/i.test(rawAccount)) {
    const parsedFromAcc = parseR2EndpointInput(rawAccount);
    if (parsedFromAcc.inferredBucket && !patch.bucketName) {
      rawBucket = parsedFromAcc.inferredBucket;
    }
  }

  const next: StoredR2ClientConfig = {
    accountId: rawAccount,
    bucketName: rawBucket || 'bimondo',
    publicCdnUrl:
      patch.publicCdnUrl !== undefined
        ? normalizeR2PublicDomain(patch.publicCdnUrl)
        : current.publicCdnUrl,
    accessKeyId:
      patch.accessKeyId !== undefined && String(patch.accessKeyId).trim()
        ? String(patch.accessKeyId).trim()
        : current.accessKeyId,
    secretAccessKey:
      patch.secretAccessKey !== undefined &&
      String(patch.secretAccessKey).trim()
        ? String(patch.secretAccessKey).trim()
        : current.secretAccessKey,
  };

  memoryR2ClientConfig = next;
  return next;
}

export function getR2RequestHeaders(
  overrides?: Partial<StoredR2ClientConfig>
): Record<string, string> {
  const cfg = getStoredR2Config();
  const accountId = overrides?.accountId?.trim() || cfg.accountId;
  const bucketName = overrides?.bucketName?.trim() || cfg.bucketName;
  const publicCdnUrl =
    overrides?.publicCdnUrl !== undefined
      ? normalizeR2PublicDomain(overrides.publicCdnUrl) || cfg.publicCdnUrl
      : cfg.publicCdnUrl;
  const accessKeyId = overrides?.accessKeyId?.trim() || cfg.accessKeyId;
  const secretAccessKey =
    overrides?.secretAccessKey?.trim() || cfg.secretAccessKey;

  const headers: Record<string, string> = {};
  if (accountId) headers['x-r2-account-id'] = accountId;
  if (bucketName) headers['x-r2-bucket-name'] = bucketName;
  if (publicCdnUrl) headers['x-r2-public-cdn-url'] = publicCdnUrl;
  if (accessKeyId) headers['x-r2-access-key-id'] = accessKeyId;
  if (secretAccessKey) headers['x-r2-secret-access-key'] = secretAccessKey;
  return headers;
}

export async function saveR2ConfigToFirestore(
  patch: Partial<StoredR2ClientConfig>
): Promise<StoredR2ClientConfig> {
  const merged = saveStoredR2Config(patch);
  try {
    const actorUid =
      auth.currentUser?.email === 'merlinfiverr0@gmail.com'
        ? auth.currentUser.uid
        : 'bimondo-cms-admin';
    await setDoc(doc(db, 'faqs', R2_FIRESTORE_DOC_ID), {
      id: R2_FIRESTORE_DOC_ID,
      updatedBy: actorUid,
      updatedAt: serverTimestamp(),
      payload: {
        accountId: merged.accountId.slice(0, 200),
        bucketName: (merged.bucketName || 'bimondo').slice(0, 120),
        publicCdnUrl: merged.publicCdnUrl.slice(0, 300),
        accessKeyId: merged.accessKeyId.slice(0, 200),
        secretAccessKey: merged.secretAccessKey.slice(0, 200),
      },
    });
  } catch {
    // Server also persists via REST commit
  }
  return merged;
}

export async function loadR2ConfigFromFirestore(): Promise<StoredR2ClientConfig> {
  try {
    const snap = await getDoc(doc(db, 'faqs', R2_FIRESTORE_DOC_ID));
    if (snap.exists()) {
      const data = snap.data();
      const payload = (data?.payload || {}) as Partial<StoredR2ClientConfig>;
      if (
        payload.accountId ||
        payload.publicCdnUrl ||
        payload.accessKeyId ||
        payload.bucketName
      ) {
        return saveStoredR2Config(payload);
      }
    }
  } catch {
    // Ignore if offline or doc doesn't exist yet
  }
  return getStoredR2Config();
}

export function ensureClientR2ConfigHydrated(): void {
  if (firestoreHydrationStarted || typeof window === 'undefined') return;
  firestoreHydrationStarted = true;
  loadR2ConfigFromFirestore().catch(() => {});
}

export function extractObjectKeyFromUrl(rawUrl?: string): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  try {
    const parsed = new URL(trimmed);
    if (
      parsed.hostname.endsWith('.r2.dev') ||
      parsed.hostname.endsWith('.r2.cloudflarestorage.com') ||
      parsed.hostname.includes('bimondotours.com')
    ) {
      const cleanPath = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
      return cleanPath || null;
    }
  } catch {
    // Ignore non-URL strings
  }
  return null;
}

/**
 * Strips any legacy mock URLs or non-R2 placeholder paths so only valid R2 / CDN URLs are used.
 */
export function resolveCmsImageUrl(
  rawUrl?: string,
  _cmsPublicCdnUrl?: string
): string {
  if (!rawUrl) return '';
  const trimmed = String(rawUrl).trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('/images/') ||
    trimmed.includes('unsplash.com') ||
    trimmed.includes('picsum.photos') ||
    trimmed.includes('1794721761698-images-19-.jpg')
  ) {
    return '';
  }
  return trimmed;
}
