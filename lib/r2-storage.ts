import crypto from 'crypto';
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

export type R2FolderName =
  | 'tours'
  | 'stays'
  | 'destinations'
  | 'gallery'
  | 'general';

export type R2FailureStep =
  | 'auth'
  | 'config'
  | 'validation'
  | 'r2_write'
  | 'r2_list'
  | 'r2_delete'
  | 'cdn_verify'
  | 'firestore_save';

export class R2OperationError extends Error {
  public readonly step: R2FailureStep;
  public readonly statusCode: number;

  constructor(message: string, step: R2FailureStep, statusCode = 500) {
    super(message);
    this.name = 'R2OperationError';
    this.step = step;
    this.statusCode = statusCode;
  }
}

export interface R2ServerConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicCdnUrl: string;
  endpointUrl: string;
  jurisdiction?: string;
}

export interface PublicR2ConfigStatus {
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

export interface R2BucketObjectItem {
  id: string;
  objectKey: string;
  cdnUrl: string;
  folder: R2FolderName;
  fileName: string;
  contentType?: string;
  sizeBytes: number;
  lastModified: string;
  source?: 'binding' | 's3';
}

interface CloudflareR2BucketBinding {
  put(
    key: string,
    value: ArrayBuffer | Uint8Array | Buffer | string,
    options?: {
      httpMetadata?: { contentType?: string; cacheControl?: string };
    }
  ): Promise<unknown>;
  get(key: string): Promise<{
    arrayBuffer(): Promise<ArrayBuffer>;
    httpMetadata?: { contentType?: string };
    size?: number;
    uploaded?: Date;
  } | null>;
  head?(key: string): Promise<{
    httpMetadata?: { contentType?: string };
    size?: number;
    uploaded?: Date;
  } | null>;
  delete(key: string | string[]): Promise<void>;
  list(options?: { prefix?: string; limit?: number }): Promise<{
    objects?: Array<{
      key: string;
      size?: number;
      uploaded?: Date;
      httpMetadata?: { contentType?: string };
    }>;
  }>;
}

export const VALID_R2_FOLDERS: readonly R2FolderName[] = [
  'tours',
  'stays',
  'destinations',
  'gallery',
  'general',
];

const MAX_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

const DEFAULT_R2_ACCOUNT_ID = 'cb757d11edf7dc64fc682ae735992ba4';
const DEFAULT_R2_BUCKET_NAME = 'bimondo';
const DEFAULT_R2_PUBLIC_CDN_URL = 'https://cdn.bimondotours.com';

const NAMED_R2_BINDING_KEYS = [
  'R2_MEDIA_BUCKET',
  'R2_BUCKET',
  'BIMONDO_BUCKET',
  'BIMONDO',
  'BUCKET',
] as const;

function isR2BucketBindingObject(
  candidate: unknown
): candidate is CloudflareR2BucketBinding {
  return Boolean(
    candidate &&
      typeof candidate === 'object' &&
      typeof (candidate as CloudflareR2BucketBinding).put === 'function' &&
      typeof (candidate as CloudflareR2BucketBinding).get === 'function' &&
      typeof (candidate as CloudflareR2BucketBinding).list === 'function'
  );
}

function getCloudflareRuntimeEnv(): Record<string, unknown> {
  try {
    const sym = Symbol.for('__cloudflare-context__');
    const ctx = (
      globalThis as Record<symbol, { env?: Record<string, unknown> }>
    )[sym];
    if (ctx?.env && typeof ctx.env === 'object') {
      return ctx.env;
    }
  } catch {
    // Not in Cloudflare Workers context
  }
  return {};
}

function getNamedR2BucketBinding(): {
  name: string;
  binding: CloudflareR2BucketBinding;
} | null {
  const cfEnv = getCloudflareRuntimeEnv();
  for (const key of NAMED_R2_BINDING_KEYS) {
    const candidate = cfEnv[key];
    if (isR2BucketBindingObject(candidate)) {
      return {
        name: key,
        binding: candidate,
      };
    }
  }
  for (const [key, candidate] of Object.entries(cfEnv)) {
    if (isR2BucketBindingObject(candidate)) {
      return {
        name: key,
        binding: candidate,
      };
    }
  }
  return null;
}

function getEnvString(keys: string[]): string {
  const cfEnv = getCloudflareRuntimeEnv();
  for (const key of keys) {
    const cfVal = cfEnv[key];
    if (typeof cfVal === 'string' && cfVal.trim()) {
      return cfVal.trim();
    }
    const nodeVal = process.env[key];
    if (typeof nodeVal === 'string' && nodeVal.trim()) {
      return nodeVal.trim();
    }
  }
  return '';
}

export function normalizePublicCdnUrl(raw: string): string {
  const trimmed = (raw || '').trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  const withProto = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  if (/\.r2\.cloudflarestorage\.com(\/|$)/i.test(withProto)) {
    return '';
  }
  return withProto;
}

export function readR2ServerConfig(): R2ServerConfig {
  const rawAccountId =
    getEnvString([
      'R2_ACCOUNT_ID',
      'CLOUDFLARE_R2_ACCOUNT_ID',
      'CLOUDFLARE_ACCOUNT_ID',
    ]) || DEFAULT_R2_ACCOUNT_ID;

  const accountId = rawAccountId
    .replace(/^https?:\/\//i, '')
    .split('/')[0]
    .replace(/\.r2\.cloudflarestorage\.com$/i, '')
    .trim();

  const accessKeyId = getEnvString([
    'R2_ACCESS_KEY_ID',
    'CLOUDFLARE_R2_ACCESS_KEY_ID',
  ]);

  const secretAccessKey = getEnvString([
    'R2_SECRET_ACCESS_KEY',
    'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
  ]);

  const bucketName =
    getEnvString([
      'R2_BUCKET_NAME',
      'R2_BUCKET',
      'CLOUDFLARE_R2_BUCKET_NAME',
    ]) || DEFAULT_R2_BUCKET_NAME;

  const rawPublicCdnUrl =
    getEnvString([
      'R2_PUBLIC_CDN_URL',
      'R2_PUBLIC_URL',
      'R2_CUSTOM_DOMAIN',
      'CLOUDFLARE_R2_PUBLIC_URL',
    ]) || DEFAULT_R2_PUBLIC_CDN_URL;

  const jurisdiction = getEnvString(['R2_JURISDICTION']).toLowerCase();
  const explicitEndpoint = getEnvString(['R2_ENDPOINT', 'R2_S3_ENDPOINT']).replace(
    /\/+$/,
    ''
  );

  const endpointUrl =
    explicitEndpoint ||
    (accountId
      ? jurisdiction
        ? `https://${accountId}.${jurisdiction}.r2.cloudflarestorage.com`
        : `https://${accountId}.r2.cloudflarestorage.com`
      : '');

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicCdnUrl:
      normalizePublicCdnUrl(rawPublicCdnUrl) || DEFAULT_R2_PUBLIC_CDN_URL,
    endpointUrl,
    jurisdiction: jurisdiction || undefined,
  };
}

let cachedS3Client: { key: string; client: S3Client } | null = null;

function getS3ClientForConfig(cfg: R2ServerConfig): S3Client {
  if (
    !cfg.accountId ||
    !cfg.accessKeyId ||
    !cfg.secretAccessKey ||
    !cfg.bucketName ||
    !cfg.endpointUrl
  ) {
    throw new R2OperationError(
      'Server R2 S3 configuration is incomplete. Set R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_PUBLIC_CDN_URL, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY in the deployment environment.',
      'config',
      500
    );
  }

  const cacheKey = `${cfg.endpointUrl}|${cfg.bucketName}|${cfg.accessKeyId}`;
  if (cachedS3Client && cachedS3Client.key === cacheKey) {
    return cachedS3Client.client;
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: cfg.endpointUrl,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });

  cachedS3Client = { key: cacheKey, client };
  return client;
}

function hasS3CredentialsConfigured(cfg: R2ServerConfig): boolean {
  return Boolean(
    cfg.accountId &&
      cfg.bucketName &&
      cfg.accessKeyId &&
      cfg.secretAccessKey &&
      cfg.endpointUrl
  );
}

/**
 * Encodes each segment of an R2 object key exactly once and joins with R2_PUBLIC_CDN_URL.
 */
export function buildServedCdnUrl(
  objectKey: string,
  config?: Pick<R2ServerConfig, 'publicCdnUrl'>
): string {
  const cfg = config || readR2ServerConfig();
  const baseUrl = normalizePublicCdnUrl(cfg.publicCdnUrl);
  if (!baseUrl) return '';

  const cleanKey = objectKey.replace(/^\/+/, '');
  if (!cleanKey) return '';

  const encodedPath = cleanKey
    .split('/')
    .filter(Boolean)
    .map((segment) => {
      try {
        return encodeURIComponent(decodeURIComponent(segment));
      } catch {
        return encodeURIComponent(segment);
      }
    })
    .join('/');

  return `${baseUrl}/${encodedPath}`;
}

/**
 * Returns static configuration snapshot (with s3Connected: false until an actual probe succeeds).
 */
export function getPublicR2ConfigStatus(probeResult?: {
  s3Connected: boolean;
  objectCount?: number;
  lastError?: string;
}): PublicR2ConfigStatus {
  const cfg = readR2ServerConfig();
  const namedBinding = getNamedR2BucketBinding();
  const hasS3 = hasS3CredentialsConfigured(cfg);
  const hasPublicDomain = Boolean(cfg.publicCdnUrl);
  const configured =
    (Boolean(namedBinding) || hasS3) &&
    Boolean(cfg.bucketName || namedBinding) &&
    hasPublicDomain;

  const storageMode: PublicR2ConfigStatus['storageMode'] = namedBinding
    ? 'cloudflare-binding'
    : hasS3
    ? 'cloudflare-s3'
    : 'unconfigured';

  return {
    configured,
    s3Connected: probeResult ? probeResult.s3Connected : false,
    storageMode,
    bindingName: namedBinding?.name || null,
    accountId: cfg.accountId,
    bucketName: cfg.bucketName,
    publicCdnUrl: cfg.publicCdnUrl,
    hasCredentials: Boolean(namedBinding) || hasS3,
    hasPublicDomain,
    endpointUrl: cfg.endpointUrl,
    objectCount: probeResult?.objectCount,
    lastError: probeResult?.lastError,
  };
}

export function sanitizeR2FileName(rawName: string): string {
  const clean = rawName
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return clean || `image-${Date.now()}.jpg`;
}

export function toFirestoreMediaDocId(objectKey: string): string {
  return (
    objectKey.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 120) ||
    `r2_${Date.now()}`
  );
}

export function inferFolderFromKey(objectKey: string): R2FolderName {
  const firstSegment = objectKey.replace(/^\/+/, '').split('/')[0];
  if ((VALID_R2_FOLDERS as readonly string[]).includes(firstSegment)) {
    return firstSegment as R2FolderName;
  }
  return 'general';
}

export function extractR2KeyFromCdnUrl(cdnUrlOrKey: string): string | null {
  if (!cdnUrlOrKey) return null;
  const trimmed = cdnUrlOrKey.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    const stripped = trimmed.replace(/^\/+/, '');
    return stripped || null;
  }

  const cfg = readR2ServerConfig();
  if (cfg.publicCdnUrl && trimmed.startsWith(cfg.publicCdnUrl)) {
    const rawPath = trimmed
      .slice(cfg.publicCdnUrl.length)
      .split('?')[0]
      .replace(/^\/+/, '');
    try {
      return rawPath
        .split('/')
        .map((seg) => decodeURIComponent(seg))
        .join('/');
    } catch {
      return rawPath;
    }
  }

  try {
    const parsed = new URL(trimmed);
    if (
      parsed.hostname.endsWith('.r2.dev') ||
      parsed.hostname.includes('bimondotours.com') ||
      parsed.hostname.includes('bimondotravels.com')
    ) {
      return parsed.pathname
        .replace(/^\/+/, '')
        .split('/')
        .map((seg) => decodeURIComponent(seg))
        .join('/');
    }
    if (parsed.hostname.endsWith('.r2.cloudflarestorage.com')) {
      const pathParts = parsed.pathname.replace(/^\/+/, '').split('/');
      if (pathParts.length > 1 && pathParts[0] === cfg.bucketName) {
        return pathParts
          .slice(1)
          .map((seg) => decodeURIComponent(seg))
          .join('/');
      }
      return pathParts.map((seg) => decodeURIComponent(seg)).join('/');
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Inspects file magic bytes to validate genuine image format and return canonical MIME type.
 */
export function detectValidatedImageContentType(buffer: Buffer): {
  contentType: string;
  extension: string;
} {
  if (!buffer || buffer.byteLength < 12) {
    throw new R2OperationError(
      'Uploaded file is empty or too small to be a valid image.',
      'validation',
      400
    );
  }

  if (buffer.byteLength > MAX_UPLOAD_SIZE_BYTES) {
    throw new R2OperationError(
      `Image exceeds the maximum allowed upload size of 15 MB (received ${(
        buffer.byteLength /
        (1024 * 1024)
      ).toFixed(1)} MB).`,
      'validation',
      413
    );
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { contentType: 'image/jpeg', extension: 'jpg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { contentType: 'image/png', extension: 'png' };
  }

  // WebP: "RIFF" .... "WEBP"
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { contentType: 'image/webp', extension: 'webp' };
  }

  // AVIF: .... "ftyp" ("avif" | "avis" | "mif1")
  if (buffer.subarray(4, 8).toString('ascii') === 'ftyp') {
    const brand = buffer.subarray(8, 12).toString('ascii');
    if (brand === 'avif' || brand === 'avis' || brand === 'mif1') {
      return { contentType: 'image/avif', extension: 'avif' };
    }
  }

  throw new R2OperationError(
    'Unsupported or invalid image file format. Only valid JPEG, PNG, WebP, or AVIF images are accepted.',
    'validation',
    400
  );
}

/**
 * Verifies that a public CDN URL is reachable and serves an image/* Content-Type.
 */
export async function verifyPublicCdnObjectUrl(cdnUrl: string): Promise<void> {
  if (!cdnUrl) {
    throw new R2OperationError(
      'R2_PUBLIC_CDN_URL is not configured on the server.',
      'config',
      500
    );
  }

  let response: Response | null = null;
  try {
    response = await fetch(cdnUrl, {
      method: 'HEAD',
      cache: 'no-store',
    });
    if (response.status === 405 || response.status === 501) {
      response = await fetch(cdnUrl, {
        method: 'GET',
        headers: { Range: 'bytes=0-63' },
        cache: 'no-store',
      });
    }
  } catch (err) {
    throw new R2OperationError(
      `Public CDN verification failed for ${cdnUrl}: ${
        err instanceof Error ? err.message : 'Network error reaching CDN domain'
      }. Verify that the custom domain is Active on bucket "${
        readR2ServerConfig().bucketName
      }".`,
      'cdn_verify',
      502
    );
  }

  if (!response.ok && response.status !== 206) {
    throw new R2OperationError(
      `Public CDN URL ${cdnUrl} returned HTTP ${response.status}. Verify that R2_PUBLIC_CDN_URL points to an active custom domain attached to bucket "${
        readR2ServerConfig().bucketName
      }".`,
      'cdn_verify',
      502
    );
  }

  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  if (!contentType.startsWith('image/')) {
    throw new R2OperationError(
      `Public CDN URL ${cdnUrl} returned unexpected Content-Type "${
        contentType || 'none'
      }" instead of image/*.`,
      'cdn_verify',
      502
    );
  }
}

export async function listFilesInR2Bucket(
  prefix?: string
): Promise<R2BucketObjectItem[]> {
  const cfg = readR2ServerConfig();
  if (!cfg.publicCdnUrl) {
    throw new R2OperationError(
      'R2_PUBLIC_CDN_URL is not configured on the server.',
      'config',
      500
    );
  }

  const namedBinding = getNamedR2BucketBinding();

  // Path 1: Authoritative OpenNext Cloudflare Worker R2 binding (single backend)
  if (namedBinding) {
    try {
      const listed = await namedBinding.binding.list({
        prefix: prefix || undefined,
        limit: 500,
      });
      const items: R2BucketObjectItem[] = [];
      for (const obj of listed.objects || []) {
        if (!obj.key) continue;
        const objectKey = obj.key;
        const folder = inferFolderFromKey(objectKey);
        const fileName = objectKey.split('/').pop() || objectKey;
        const cdnUrl = buildServedCdnUrl(objectKey, cfg);
        if (!cdnUrl) continue;
        items.push({
          id: toFirestoreMediaDocId(objectKey),
          objectKey,
          cdnUrl,
          folder,
          fileName,
          contentType: obj.httpMetadata?.contentType,
          sizeBytes: obj.size ?? 0,
          lastModified: obj.uploaded
            ? obj.uploaded.toISOString()
            : new Date().toISOString(),
          source: 'binding',
        });
      }
      return items.sort((a, b) => b.lastModified.localeCompare(a.lastModified));
    } catch (err) {
      throw new R2OperationError(
        `Cloudflare R2 Worker binding (${namedBinding.name}) list failed: ${
          err instanceof Error ? err.message : 'Unknown binding error'
        }`,
        'r2_list',
        502
      );
    }
  }

  // Path 2: Node.js / AI Studio preview server via @aws-sdk/client-s3
  const s3 = getS3ClientForConfig(cfg);
  try {
    const response = await s3.send(
      new ListObjectsV2Command({
        Bucket: cfg.bucketName,
        Prefix: prefix || undefined,
        MaxKeys: 500,
      })
    );

    const items: R2BucketObjectItem[] = [];
    for (const item of response.Contents || []) {
      if (!item.Key) continue;
      const objectKey = item.Key;
      const folder = inferFolderFromKey(objectKey);
      const fileName = objectKey.split('/').pop() || objectKey;
      const cdnUrl = buildServedCdnUrl(objectKey, cfg);
      if (!cdnUrl) continue;
      items.push({
        id: toFirestoreMediaDocId(objectKey),
        objectKey,
        cdnUrl,
        folder,
        fileName,
        sizeBytes: item.Size ?? 0,
        lastModified: item.LastModified
          ? item.LastModified.toISOString()
          : new Date().toISOString(),
        source: 's3',
      });
    }

    return items.sort((a, b) => b.lastModified.localeCompare(a.lastModified));
  } catch (err) {
    throw new R2OperationError(
      `Cloudflare R2 S3 list failed for bucket "${cfg.bucketName}": ${
        err instanceof Error ? err.message : 'S3 connection error'
      }`,
      'r2_list',
      502
    );
  }
}

export async function testR2Connection(): Promise<{
  ok: boolean;
  mode: PublicR2ConfigStatus['storageMode'];
  message: string;
  objectCount: number;
  status: PublicR2ConfigStatus;
  items: R2BucketObjectItem[];
}> {
  const cfg = readR2ServerConfig();
  try {
    const items = await listFilesInR2Bucket(undefined);
    const status = getPublicR2ConfigStatus({
      s3Connected: true,
      objectCount: items.length,
    });
    return {
      ok: true,
      mode: status.storageMode,
      message: `Connected to R2 bucket "${
        cfg.bucketName || status.bindingName || 'R2'
      }" (${items.length} objects). Public CDN: ${cfg.publicCdnUrl}`,
      objectCount: items.length,
      status,
      items,
    };
  } catch (err) {
    const errMsg =
      err instanceof Error
        ? err.message
        : 'Cloudflare R2 bucket connection test failed.';
    const status = getPublicR2ConfigStatus({
      s3Connected: false,
      lastError: errMsg,
    });
    return {
      ok: false,
      mode: status.storageMode,
      message: errMsg,
      objectCount: 0,
      status,
      items: [],
    };
  }
}

export async function uploadFileToR2Bucket(params: {
  buffer: Buffer;
  fileName: string;
  contentType?: string;
  folder?: string;
}): Promise<{
  id: string;
  objectKey: string;
  cdnUrl: string;
  folder: R2FolderName;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  storageMode: 'cloudflare-binding' | 'cloudflare-s3';
}> {
  const cfg = readR2ServerConfig();
  if (!cfg.publicCdnUrl) {
    throw new R2OperationError(
      'R2_PUBLIC_CDN_URL is not configured on the server.',
      'config',
      500
    );
  }

  const rawFolder = (params.folder || 'general').trim();
  if (!(VALID_R2_FOLDERS as readonly string[]).includes(rawFolder)) {
    throw new R2OperationError(
      `Invalid target R2 folder "${rawFolder}". Allowed folders: ${VALID_R2_FOLDERS.join(
        ', '
      )}.`,
      'validation',
      400
    );
  }
  const folder = rawFolder as R2FolderName;

  const detected = detectValidatedImageContentType(params.buffer);
  const baseSanitized = sanitizeR2FileName(params.fileName).replace(
    /\.[a-z0-9]+$/i,
    ''
  );
  const safeFileName = `${baseSanitized || 'image'}.${detected.extension}`;
  const uniqueSuffix = crypto.randomBytes(3).toString('hex');
  const objectKey = `${folder}/${Date.now()}-${uniqueSuffix}-${safeFileName}`;

  const namedBinding = getNamedR2BucketBinding();
  let storageMode: 'cloudflare-binding' | 'cloudflare-s3' = 'cloudflare-s3';

  if (namedBinding) {
    storageMode = 'cloudflare-binding';
    try {
      await namedBinding.binding.put(objectKey, params.buffer, {
        httpMetadata: {
          contentType: detected.contentType,
          cacheControl: 'public, max-age=31536000, immutable',
        },
      });
      const verifiedObj = namedBinding.binding.head
        ? await namedBinding.binding.head(objectKey)
        : await namedBinding.binding.get(objectKey);
      if (!verifiedObj) {
        throw new Error('Object was not found in R2 binding after put().');
      }
    } catch (err) {
      throw new R2OperationError(
        `R2 Worker binding write failed for "${objectKey}": ${
          err instanceof Error ? err.message : 'Unknown write error'
        }`,
        'r2_write',
        502
      );
    }
  } else {
    const s3 = getS3ClientForConfig(cfg);
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: cfg.bucketName,
          Key: objectKey,
          Body: params.buffer,
          ContentType: detected.contentType,
          CacheControl: 'public, max-age=31536000, immutable',
        })
      );
      const head = await s3.send(
        new HeadObjectCommand({
          Bucket: cfg.bucketName,
          Key: objectKey,
        })
      );
      if (!head || head.ContentLength === undefined) {
        throw new Error('HeadObject check did not confirm object existence.');
      }
    } catch (err) {
      throw new R2OperationError(
        `Cloudflare R2 S3 upload failed for "${objectKey}" in bucket "${
          cfg.bucketName
        }": ${err instanceof Error ? err.message : 'S3 PutObject error'}`,
        'r2_write',
        502
      );
    }
  }

  const cdnUrl = buildServedCdnUrl(objectKey, cfg);
  await verifyPublicCdnObjectUrl(cdnUrl);

  return {
    id: toFirestoreMediaDocId(objectKey),
    objectKey,
    cdnUrl,
    folder,
    fileName: safeFileName,
    contentType: detected.contentType,
    sizeBytes: params.buffer.byteLength,
    storageMode,
  };
}

export async function deleteFileFromR2Bucket(
  objectKeyOrCdnUrl: string
): Promise<{ deletedKey: string }> {
  const resolvedKey =
    extractR2KeyFromCdnUrl(objectKeyOrCdnUrl) ||
    objectKeyOrCdnUrl.replace(/^\/+/, '');
  if (!resolvedKey) {
    throw new R2OperationError(
      'Could not resolve R2 object key to delete.',
      'validation',
      400
    );
  }

  const namedBinding = getNamedR2BucketBinding();
  if (namedBinding) {
    try {
      await namedBinding.binding.delete(resolvedKey);
      return { deletedKey: resolvedKey };
    } catch (err) {
      throw new R2OperationError(
        `Failed to delete "${resolvedKey}" via R2 Worker binding: ${
          err instanceof Error ? err.message : 'Unknown delete error'
        }`,
        'r2_delete',
        502
      );
    }
  }

  const cfg = readR2ServerConfig();
  const s3 = getS3ClientForConfig(cfg);
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: cfg.bucketName,
        Key: resolvedKey,
      })
    );
    return { deletedKey: resolvedKey };
  } catch (err) {
    throw new R2OperationError(
      `Failed to delete "${resolvedKey}" from R2 bucket "${cfg.bucketName}": ${
        err instanceof Error ? err.message : 'S3 DeleteObject error'
      }`,
      'r2_delete',
      502
    );
  }
}

export async function renameFileInR2Bucket(params: {
  oldKeyOrUrl: string;
  newKey: string;
}): Promise<{
  id: string;
  oldKey: string;
  objectKey: string;
  cdnUrl: string;
}> {
  const oldKey =
    extractR2KeyFromCdnUrl(params.oldKeyOrUrl) ||
    params.oldKeyOrUrl.replace(/^\/+/, '');
  if (!oldKey) {
    throw new R2OperationError('Invalid source R2 object key.', 'validation', 400);
  }
  const cleanNewKey = params.newKey.trim().replace(/^\/+/, '');
  if (!cleanNewKey) {
    throw new R2OperationError(
      'New R2 object key cannot be empty.',
      'validation',
      400
    );
  }

  const cfg = readR2ServerConfig();
  const namedBinding = getNamedR2BucketBinding();

  if (oldKey !== cleanNewKey) {
    if (namedBinding) {
      try {
        const obj = await namedBinding.binding.get(oldKey);
        if (!obj) {
          throw new Error(`Source object "${oldKey}" not found in R2.`);
        }
        const ab = await obj.arrayBuffer();
        await namedBinding.binding.put(cleanNewKey, ab, {
          httpMetadata: obj.httpMetadata,
        });
        await namedBinding.binding.delete(oldKey);
      } catch (err) {
        throw new R2OperationError(
          `R2 rename failed: ${
            err instanceof Error ? err.message : 'Binding copy/delete failed'
          }`,
          'r2_write',
          502
        );
      }
    } else {
      const s3 = getS3ClientForConfig(cfg);
      const copySource = `${encodeURIComponent(cfg.bucketName)}/${oldKey
        .split('/')
        .map(encodeURIComponent)
        .join('/')}`;
      try {
        await s3.send(
          new CopyObjectCommand({
            Bucket: cfg.bucketName,
            Key: cleanNewKey,
            CopySource: copySource,
          })
        );
        await s3.send(
          new DeleteObjectCommand({
            Bucket: cfg.bucketName,
            Key: oldKey,
          })
        );
      } catch (err) {
        throw new R2OperationError(
          `R2 S3 rename failed: ${
            err instanceof Error ? err.message : 'CopyObject/DeleteObject failed'
          }`,
          'r2_write',
          502
        );
      }
    }
  }

  const cdnUrl = buildServedCdnUrl(cleanNewKey, cfg);
  await verifyPublicCdnObjectUrl(cdnUrl);

  return {
    id: toFirestoreMediaDocId(cleanNewKey),
    oldKey,
    objectKey: cleanNewKey,
    cdnUrl,
  };
}
