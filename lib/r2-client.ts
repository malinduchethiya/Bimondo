'use client';

import { auth } from '@/lib/firebase';

export type R2FolderName =
  | 'tours'
  | 'stays'
  | 'destinations'
  | 'gallery'
  | 'general';

export type R2StepName =
  | 'auth'
  | 'config'
  | 'validation'
  | 'r2_write'
  | 'r2_list'
  | 'r2_delete'
  | 'cdn_verify'
  | 'firestore_save';

export interface R2UploadedMediaItem {
  id: string;
  objectKey: string;
  cdnUrl: string;
  folder: R2FolderName;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  lastModified?: string;
}

export interface R2AdminStatusSnapshot {
  configured: boolean;
  s3Connected: boolean;
  storageMode: 'cloudflare-binding' | 'cloudflare-s3' | 'unconfigured';
  bindingName: string | null;
  accountId: string;
  bucketName: string;
  publicCdnUrl: string;
  hasCredentials: boolean;
  endpointUrl: string;
  hasPublicDomain: boolean;
  objectCount?: number;
  lastError?: string;
}

export class R2ClientActionError extends Error {
  public readonly step: R2StepName;
  public readonly requestId?: string;
  public readonly statusCode?: number;

  constructor(params: {
    message: string;
    step: R2StepName;
    requestId?: string;
    statusCode?: number;
  }) {
    super(params.message);
    this.name = 'R2ClientActionError';
    this.step = params.step;
    this.requestId = params.requestId;
    this.statusCode = params.statusCode;
  }
}

const MAX_CLIENT_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB

const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
]);

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

/**
 * Obtains a fresh Firebase ID token from the signed-in admin user.
 */
export async function getAdminAuthHeaders(): Promise<Record<string, string>> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new R2ClientActionError({
      message:
        'Admin sign-in required. Click "Admin Google Sign-In" in the top bar first.',
      step: 'auth',
      statusCode: 401,
    });
  }

  try {
    const idToken = await currentUser.getIdToken();
    return {
      Authorization: `Bearer ${idToken}`,
    };
  } catch (err) {
    throw new R2ClientActionError({
      message:
        err instanceof Error
          ? `Failed to retrieve Firebase ID token: ${err.message}`
          : 'Failed to retrieve Firebase ID token.',
      step: 'auth',
      statusCode: 401,
    });
  }
}

/**
 * Safely parses JSON or non-JSON proxy/gateway responses from `/api/admin/r2`.
 */
async function parseAdminApiResponse<T extends Record<string, unknown>>(
  res: Response,
  fallbackStep: R2StepName
): Promise<T & { requestId?: string; step?: R2StepName; error?: string }> {
  const rawText = await res.text().catch(() => '');
  let parsed: Record<string, unknown> | null = null;
  if (rawText) {
    try {
      parsed = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      parsed = null;
    }
  }

  if (!parsed) {
    if (res.status === 413) {
      throw new R2ClientActionError({
        message:
          'Image file is too large for the gateway proxy (HTTP 413). Please upload an image under 15 MB.',
        step: 'validation',
        statusCode: 413,
      });
    }
    throw new R2ClientActionError({
      message: `Server returned non-JSON response (HTTP ${res.status} ${
        res.statusText || ''
      }).`.trim(),
      step: fallbackStep,
      statusCode: res.status,
    });
  }

  if (!res.ok || parsed.ok === false) {
    const step = (parsed.step as R2StepName) || fallbackStep;
    const requestId =
      typeof parsed.requestId === 'string' ? parsed.requestId : undefined;
    const errMsg =
      typeof parsed.error === 'string' && parsed.error
        ? parsed.error
        : `Operation failed at step "${step}" (HTTP ${res.status}).`;

    throw new R2ClientActionError({
      message: errMsg,
      step,
      requestId,
      statusCode: res.status,
    });
  }

  return parsed as T & {
    requestId?: string;
    step?: R2StepName;
    error?: string;
  };
}

/**
 * Lists objects in the authoritative R2 bucket and returns live connection status.
 */
export async function fetchR2AdminBucket(prefix?: string): Promise<{
  requestId?: string;
  status: R2AdminStatusSnapshot;
  items: R2UploadedMediaItem[];
}> {
  const headers = await getAdminAuthHeaders();
  const url = prefix
    ? `/api/admin/r2?prefix=${encodeURIComponent(prefix)}`
    : '/api/admin/r2';

  const res = await fetch(url, {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  const data = await parseAdminApiResponse<{
    status: R2AdminStatusSnapshot;
    items: R2UploadedMediaItem[];
  }>(res, 'r2_list');

  return {
    requestId: data.requestId,
    status: data.status,
    items: Array.isArray(data.items) ? data.items : [],
  };
}

/**
 * Runs an explicit bucket connection test on the server.
 */
export async function testR2AdminConnection(): Promise<{
  requestId?: string;
  status: R2AdminStatusSnapshot;
  items: R2UploadedMediaItem[];
  message: string;
}> {
  const headers = await getAdminAuthHeaders();
  const res = await fetch('/api/admin/r2', {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'test_connection' }),
  });

  const data = await parseAdminApiResponse<{
    status: R2AdminStatusSnapshot;
    items: R2UploadedMediaItem[];
    connectionTest?: { message?: string };
  }>(res, 'r2_list');

  return {
    requestId: data.requestId,
    status: data.status,
    items: Array.isArray(data.items) ? data.items : [],
    message:
      data.connectionTest?.message ||
      `Connected to R2 bucket "${data.status?.bucketName}".`,
  };
}

/**
 * Validates and uploads an image file through `/api/admin/r2` and verifies its CDN URL.
 */
export async function uploadImageViaAdminR2(params: {
  file: File;
  folder: R2FolderName;
}): Promise<{
  requestId?: string;
  item: R2UploadedMediaItem;
}> {
  const { file, folder } = params;
  if (!file) {
    throw new R2ClientActionError({
      message: 'No image file selected.',
      step: 'validation',
      statusCode: 400,
    });
  }

  const mime = (file.type || '').toLowerCase();
  if (mime && !ALLOWED_IMAGE_MIMES.has(mime)) {
    throw new R2ClientActionError({
      message: `Unsupported image type "${file.type}". Please select a JPEG, PNG, WebP, or AVIF image.`,
      step: 'validation',
      statusCode: 400,
    });
  }

  if (file.size <= 0) {
    throw new R2ClientActionError({
      message: 'Selected image file is empty (0 bytes).',
      step: 'validation',
      statusCode: 400,
    });
  }

  if (file.size > MAX_CLIENT_UPLOAD_BYTES) {
    throw new R2ClientActionError({
      message: `Selected image is ${(file.size / (1024 * 1024)).toFixed(
        1
      )} MB, which exceeds the 15 MB limit.`,
      step: 'validation',
      statusCode: 413,
    });
  }

  const headers = await getAdminAuthHeaders();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const res = await fetch('/api/admin/r2', {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await parseAdminApiResponse<{
    item: R2UploadedMediaItem;
  }>(res, 'r2_write');

  if (!data.item?.cdnUrl || !data.item?.objectKey) {
    throw new R2ClientActionError({
      message: 'Upload response did not include a verified R2 CDN URL.',
      step: 'cdn_verify',
      requestId: data.requestId,
      statusCode: 502,
    });
  }

  return {
    requestId: data.requestId,
    item: data.item,
  };
}

/**
 * Deletes an object from R2 after the server verifies no published CMS fields still reference it.
 */
export async function deleteImageViaAdminR2(params: {
  keyOrUrl: string;
  ignoreSlot?: string;
}): Promise<{
  requestId?: string;
  deletedKey: string;
  mediaDocId: string;
}> {
  const headers = await getAdminAuthHeaders();
  const query = new URLSearchParams();
  query.set('key', params.keyOrUrl);
  if (params.ignoreSlot) {
    query.set('ignoreSlot', params.ignoreSlot);
  }

  const res = await fetch(`/api/admin/r2?${query.toString()}`, {
    method: 'DELETE',
    headers,
  });

  const data = await parseAdminApiResponse<{
    deletedKey: string;
    mediaDocId: string;
  }>(res, 'r2_delete');

  return {
    requestId: data.requestId,
    deletedKey: String(data.deletedKey || ''),
    mediaDocId: String(data.mediaDocId || ''),
  };
}

export function extractObjectKeyFromUrl(rawUrl?: string): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  try {
    const parsed = new URL(trimmed);
    if (
      parsed.hostname.endsWith('.r2.dev') ||
      parsed.hostname.endsWith('.r2.cloudflarestorage.com') ||
      parsed.hostname.includes('bimondotours.com') ||
      parsed.hostname.includes('bimondotravels.com')
    ) {
      const cleanPath = parsed.pathname
        .replace(/^\/+/, '')
        .split('/')
        .map((seg) => decodeURIComponent(seg))
        .join('/');
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
