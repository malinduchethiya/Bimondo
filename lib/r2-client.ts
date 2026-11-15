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

const R2_LOCAL_STORAGE_KEY = 'bimondo_r2_config_v1';
const R2_FIRESTORE_DOC_ID = 'r2_system_config';

let memoryR2ClientConfig: StoredR2ClientConfig = {
  accountId: '',
  bucketName: 'bimondo-media',
  publicCdnUrl: '',
  accessKeyId: '',
  secretAccessKey: '',
};

let firestoreHydrationStarted = false;

export function normalizeR2PublicDomain(raw?: string): string {
  const trimmed = String(raw || '')
    .trim()
    .replace(/\/+$/, '');
  if (!trimmed) return '';
  if (trimmed.includes('/api/admin/r2/file')) return '';
  const withProto = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  if (/\.r2\.cloudflarestorage\.com(\/|$)/i.test(withProto)) {
    return '';
  }
  return withProto;
}

export function getStoredR2Config(): StoredR2ClientConfig {
  if (typeof window === 'undefined') {
    return memoryR2ClientConfig;
  }
  try {
    const raw = window.localStorage.getItem(R2_LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredR2ClientConfig>;
      memoryR2ClientConfig = {
        accountId: String(parsed.accountId || memoryR2ClientConfig.accountId || '').trim(),
        bucketName:
          String(parsed.bucketName || memoryR2ClientConfig.bucketName || 'bimondo-media').trim() ||
          'bimondo-media',
        publicCdnUrl: normalizeR2PublicDomain(
          parsed.publicCdnUrl ?? memoryR2ClientConfig.publicCdnUrl
        ),
        accessKeyId: String(
          parsed.accessKeyId || memoryR2ClientConfig.accessKeyId || ''
        ).trim(),
        secretAccessKey: String(
          parsed.secretAccessKey || memoryR2ClientConfig.secretAccessKey || ''
        ).trim(),
      };
    }
  } catch {
    // Ignore localStorage access errors
  }
  return memoryR2ClientConfig;
}

export function saveStoredR2Config(
  patch: Partial<StoredR2ClientConfig>
): StoredR2ClientConfig {
  const current = getStoredR2Config();
  const next: StoredR2ClientConfig = {
    accountId:
      patch.accountId !== undefined
        ? String(patch.accountId).trim()
        : current.accountId,
    bucketName:
      patch.bucketName !== undefined && String(patch.bucketName).trim()
        ? String(patch.bucketName).trim()
        : current.bucketName || 'bimondo-media',
    publicCdnUrl:
      patch.publicCdnUrl !== undefined
        ? normalizeR2PublicDomain(patch.publicCdnUrl)
        : current.publicCdnUrl,
    accessKeyId:
      patch.accessKeyId !== undefined && String(patch.accessKeyId).trim()
        ? String(patch.accessKeyId).trim()
        : current.accessKeyId,
    secretAccessKey:
      patch.secretAccessKey !== undefined && String(patch.secretAccessKey).trim()
        ? String(patch.secretAccessKey).trim()
        : current.secretAccessKey,
  };

  memoryR2ClientConfig = next;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(R2_LOCAL_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  }
  return next;
}

export function getR2RequestHeaders(): Record<string, string> {
  const cfg = getStoredR2Config();
  const headers: Record<string, string> = {};
  if (cfg.accountId) headers['x-r2-account-id'] = cfg.accountId;
  if (cfg.bucketName) headers['x-r2-bucket-name'] = cfg.bucketName;
  if (cfg.publicCdnUrl) headers['x-r2-public-cdn-url'] = cfg.publicCdnUrl;
  if (cfg.accessKeyId) headers['x-r2-access-key-id'] = cfg.accessKeyId;
  if (cfg.secretAccessKey) headers['x-r2-secret-access-key'] = cfg.secretAccessKey;
  return headers;
}

export async function saveR2ConfigToFirestore(
  patch: Partial<StoredR2ClientConfig>
): Promise<StoredR2ClientConfig> {
  const merged = saveStoredR2Config(patch);
  try {
    const actorUid = auth.currentUser?.uid || 'bimondo-cms-admin';
    await setDoc(doc(db, 'faqs', R2_FIRESTORE_DOC_ID), {
      id: R2_FIRESTORE_DOC_ID,
      updatedBy: actorUid,
      updatedAt: serverTimestamp(),
      payload: {
        accountId: merged.accountId.slice(0, 200),
        bucketName: (merged.bucketName || 'bimondo-media').slice(0, 120),
        publicCdnUrl: merged.publicCdnUrl.slice(0, 300),
        accessKeyId: merged.accessKeyId.slice(0, 200),
        secretAccessKey: merged.secretAccessKey.slice(0, 200),
      },
    });
  } catch {
    // LocalStorage still holds config if offline
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

/**
 * Extracts the R2 objectKey from any `/api/admin/r2/file/<key>` or `.r2.dev/<key>` URL.
 */
export function extractObjectKeyFromUrl(rawUrl?: string): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  const marker = '/api/admin/r2/file/';
  const idx = trimmed.indexOf(marker);
  if (idx !== -1) {
    const after = trimmed
      .slice(idx + marker.length)
      .split('?')[0]
      .replace(/^\/+/, '');
    return after ? decodeURIComponent(after) : null;
  }
  try {
    const parsed = new URL(trimmed);
    if (
      parsed.hostname.endsWith('.r2.dev') ||
      parsed.hostname.endsWith('.r2.cloudflarestorage.com')
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
 * Resolves any CMS image link saved in Firestore so that:
 * 1. Direct R2 domain URLs (`https://pub-xxx.r2.dev/...` or custom CDN domain) are returned directly.
 * 2. Legacy `/api/admin/r2/file/<key>` links are automatically upgraded to `${r2PublicCdnUrl}/${key}`
 *    whenever the R2 Public Domain is configured in CMS or R2 settings.
 * 3. If a link points to `https://www.bimondotours.com/api/admin/r2/file/<key>` and no public R2 domain
 *    is set yet, it normalizes to relative `/api/admin/r2/file/<key>` so it streams from R2 on any host.
 */
export function resolveCmsImageUrl(
  rawUrl?: string,
  cmsPublicCdnUrl?: string
): string {
  if (!rawUrl) return '';
  const trimmed = String(rawUrl).trim();
  if (!trimmed) return '';

  const effectiveCdnBase =
    normalizeR2PublicDomain(cmsPublicCdnUrl) ||
    getStoredR2Config().publicCdnUrl;

  const marker = '/api/admin/r2/file/';
  const markerIdx = trimmed.indexOf(marker);
  if (markerIdx !== -1) {
    const objectKey = trimmed
      .slice(markerIdx + marker.length)
      .split('?')[0]
      .replace(/^\/+/, '');
    if (!objectKey) return trimmed;
    if (effectiveCdnBase) {
      return `${effectiveCdnBase}/${objectKey}`;
    }
    return `/api/admin/r2/file/${objectKey}`;
  }

  return trimmed;
}

/**
 * Upgrades all `/api/admin/r2/file/<key>` links across a SiteCmsData object to direct R2 domain links
 * (`${publicCdnUrl}/${key}`) so Firestore stores the direct R2 domain URL everywhere.
 */
export function upgradeCmsUrlsToR2Domain<T>(
  cmsData: T,
  rawPublicCdnUrl?: string
): T {
  const cleanCdnBase = normalizeR2PublicDomain(rawPublicCdnUrl);
  if (!cleanCdnBase) return cmsData;

  const rewriteValue = (val: unknown): unknown => {
    if (typeof val === 'string') {
      const marker = '/api/admin/r2/file/';
      const idx = val.indexOf(marker);
      if (idx !== -1) {
        const key = val
          .slice(idx + marker.length)
          .split('?')[0]
          .replace(/^\/+/, '');
        if (key) {
          return `${cleanCdnBase}/${key}`;
        }
      }
      return val;
    }
    if (Array.isArray(val)) {
      return val.map(rewriteValue);
    }
    if (val && typeof val === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        out[k] = rewriteValue(v);
      }
      return out;
    }
    return val;
  };

  return rewriteValue(cmsData) as T;
}

export function shouldUseDirectImgTag(url?: string): boolean {
  if (!url) return false;
  return (
    url.startsWith('/api/admin/r2/file/') ||
    url.includes('/api/admin/r2/file/') ||
    url.includes('X-Amz-Signature=') ||
    url.includes('.r2.cloudflarestorage.com')
  );
}
