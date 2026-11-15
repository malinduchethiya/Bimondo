import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getDefaultCmsData } from '@/lib/cms-defaults';
import firebaseConfig from '@/firebase-applet-config.json';

export type R2FolderName =
  | 'tours'
  | 'stays'
  | 'destinations'
  | 'gallery'
  | 'general';

export interface R2ServerConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicCdnUrl: string;
  endpointUrl?: string;
}

export interface PublicR2ConfigStatus {
  configured: boolean;
  s3Connected: boolean;
  storageMode: 'cloudflare-s3' | 'managed-local-r2';
  accountId: string;
  bucketName: string;
  publicCdnUrl: string;
  hasCredentials: boolean;
  endpointUrl: string;
  hasPublicDomain: boolean;
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
  source?: 's3' | 'local-r2' | 'cms-catalog';
}

const R2_CONFIG_FILE = path.join(process.cwd(), '.aistudio-r2-config.json');
const LOCAL_R2_BUCKET_DIR = path.join(process.cwd(), '.aistudio-r2-bucket');
const LOCAL_R2_INDEX_FILE = path.join(
  process.cwd(),
  '.aistudio-r2-index.json'
);

const VALID_FOLDERS: readonly R2FolderName[] = [
  'tours',
  'stays',
  'destinations',
  'gallery',
  'general',
];

let memoryR2Config: Partial<R2ServerConfig> | null = null;
let memoryR2Index: Record<string, R2BucketObjectItem> | null = null;
let lastFirestoreHydrationMs = 0;

function ensureLocalBucketDir() {
  try {
    if (!fs.existsSync(LOCAL_R2_BUCKET_DIR)) {
      fs.mkdirSync(LOCAL_R2_BUCKET_DIR, { recursive: true });
    }
  } catch {
    // Ignore if read-only fs
  }
}

function parseAccountAndBucketFromInput(
  rawAccountOrEndpoint: string,
  rawBucketName: string
): { accountId: string; endpointUrl: string; inferredBucket: string } {
  const trimmed = (rawAccountOrEndpoint || '').trim();
  let inferredBucket = (rawBucketName || '').trim();
  if (!trimmed) {
    return { accountId: '', endpointUrl: '', inferredBucket };
  }

  // Handle full S3 endpoint URLs like:
  // https://<account_id>.r2.cloudflarestorage.com/<optional_bucket>
  // https://<account_id>.eu.r2.cloudflarestorage.com/<optional_bucket>
  const match = trimmed.match(
    /^https?:\/\/([a-z0-9]+)(?:\.[a-z0-9-]+)?\.r2\.cloudflarestorage\.com(?:\/([^/?#]+))?/i
  );
  if (match) {
    const accountId = match[1];
    if (!inferredBucket && match[2]) {
      inferredBucket = match[2];
    }
    const hostMatch = trimmed.match(
      /^(https?:\/\/[a-z0-9.-]+\.r2\.cloudflarestorage\.com)/i
    );
    return {
      accountId,
      endpointUrl:
        hostMatch?.[1] || `https://${accountId}.r2.cloudflarestorage.com`,
      inferredBucket,
    };
  }

  const cleanId = trimmed
    .replace(/^https?:\/\//i, '')
    .split('/')[0]
    .replace(/\.r2\.cloudflarestorage\.com$/i, '')
    .trim();

  return {
    accountId: cleanId,
    endpointUrl: cleanId
      ? `https://${cleanId}.r2.cloudflarestorage.com`
      : '',
    inferredBucket,
  };
}

export function normalizePublicCdnUrl(raw: string): string {
  const trimmed = (raw || '').trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  if (trimmed.includes('/api/admin/r2/file')) return '';
  const withProto = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  // Note: *.r2.cloudflarestorage.com without SigV4 query parameters is the private S3 API endpoint.
  // If a user pasted their S3 endpoint into Public CDN URL, ignore it so we use presigned R2 URLs or pub-*.r2.dev.
  if (/\.r2\.cloudflarestorage\.com(\/|$)/i.test(withProto)) {
    return '';
  }
  return withProto;
}

export function resolveAppOrigin(requestOrigin?: string): string {
  if (requestOrigin && /^https?:\/\//i.test(requestOrigin)) {
    return requestOrigin.replace(/\/+$/, '');
  }
  const envUrl =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000';
  return envUrl.replace(/\/+$/, '');
}

/**
 * Generates a direct Cloudflare R2 S3 presigned GET URL (`https://<accountId>.r2.cloudflarestorage.com/<bucket>/<key>?X-Amz-...`)
 * valid for 7 days when a public `pub-xxx.r2.dev` domain is not yet configured.
 */
export function createPresignedR2ReadUrl(
  objectKey: string,
  config: R2ServerConfig,
  expiresInSeconds = 604800
): string {
  const cleanKey = objectKey.replace(/^\/+/, '');
  if (config.publicCdnUrl) {
    return `${config.publicCdnUrl}/${cleanKey}`;
  }
  if (!config.accountId || !config.accessKeyId || !config.secretAccessKey) {
    return `/api/admin/r2/file/${cleanKey}`;
  }

  const endpoint =
    config.endpointUrl ||
    `https://${config.accountId}.r2.cloudflarestorage.com`;
  let host = `${config.accountId}.r2.cloudflarestorage.com`;
  try {
    host = new URL(endpoint).host;
  } catch {
    // Use default host
  }

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const region = 'auto';
  const service = 's3';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;

  const encodedKey = cleanKey
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/');
  const canonicalUri = `/${encodeURIComponent(config.bucketName)}/${encodedKey}`;

  const queryParams: [string, string][] = [
    ['X-Amz-Algorithm', 'AWS4-HMAC-SHA256'],
    ['X-Amz-Credential', `${config.accessKeyId}/${credentialScope}`],
    ['X-Amz-Date', amzDate],
    ['X-Amz-Expires', String(Math.min(Math.max(expiresInSeconds, 60), 604800))],
    ['X-Amz-SignedHeaders', 'host'],
  ];

  const canonicalQueryString = queryParams
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const canonicalHeaders = `host:${host}\n`;
  const signedHeaders = 'host';
  const payloadHash = 'UNSIGNED-PAYLOAD';

  const canonicalRequest = [
    'GET',
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const canonicalRequestHash = crypto
    .createHash('sha256')
    .update(canonicalRequest, 'utf8')
    .digest('hex');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    canonicalRequestHash,
  ].join('\n');

  const hmac = (key: Buffer | string, data: string) =>
    crypto.createHmac('sha256', key).update(data, 'utf8').digest();

  const kDate = hmac(`AWS4${config.secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = crypto
    .createHmac('sha256', kSigning)
    .update(stringToSign, 'utf8')
    .digest('hex');

  return `https://${host}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
}

export function buildServedCdnUrl(
  objectKey: string,
  config: R2ServerConfig,
  requestOrigin?: string
): string {
  const cleanKey = objectKey.replace(/^\/+/, '');
  if (config.publicCdnUrl) {
    return `${config.publicCdnUrl}/${cleanKey}`;
  }
  if (config.accountId && config.accessKeyId && config.secretAccessKey) {
    return createPresignedR2ReadUrl(cleanKey, config);
  }
  const origin = resolveAppOrigin(requestOrigin);
  return `${origin}/api/admin/r2/file/${cleanKey}`;
}

/**
 * Applies R2 configuration headers (`x-r2-*`) sent by the Admin Panel client
 * so stateless Cloud Run instances always have the active R2 credentials.
 */
export function applyIncomingR2Headers(headers: Headers): void {
  const hAccount = headers.get('x-r2-account-id')?.trim() || '';
  const hBucket = headers.get('x-r2-bucket-name')?.trim() || '';
  const hCdn = headers.get('x-r2-public-cdn-url')?.trim() || '';
  const hAccess = headers.get('x-r2-access-key-id')?.trim() || '';
  const hSecret = headers.get('x-r2-secret-access-key')?.trim() || '';

  if (hAccount || hCdn || hAccess || hSecret) {
    const current = readR2ServerConfig();
    writeR2ServerConfig({
      accountId: hAccount || current.accountId,
      bucketName: hBucket || current.bucketName,
      publicCdnUrl: hCdn || current.publicCdnUrl,
      accessKeyId: hAccess || current.accessKeyId,
      secretAccessKey: hSecret || current.secretAccessKey,
    });
  }
}

/**
 * Hydrates R2 configuration from Firestore (`/faqs/r2_system_config` and `/site_cms/main`)
 * if this container instance has not yet loaded R2 credentials from disk.
 */
export async function ensureR2ConfigHydratedFromFirestore(): Promise<R2ServerConfig> {
  const current = readR2ServerConfig();
  if (
    current.accountId &&
    current.accessKeyId &&
    current.secretAccessKey &&
    current.publicCdnUrl
  ) {
    return current;
  }

  const now = Date.now();
  if (now - lastFirestoreHydrationMs < 8000 && memoryR2Config) {
    return current;
  }
  lastFirestoreHydrationMs = now;

  try {
    const projectId = firebaseConfig.projectId;
    const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
    const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;

    const res = await fetch(`${baseUrl}/faqs/r2_system_config`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const docJson = await res.json();
      const payloadFields =
        docJson?.fields?.payload?.mapValue?.fields || {};
      const str = (key: string) =>
        String(payloadFields?.[key]?.stringValue || '').trim();

      const fAccount = str('accountId');
      const fBucket = str('bucketName');
      const fCdn = str('publicCdnUrl');
      const fAccess = str('accessKeyId');
      const fSecret = str('secretAccessKey');

      if (fAccount || fCdn || fAccess || fSecret) {
        writeR2ServerConfig({
          accountId: fAccount || current.accountId,
          bucketName: fBucket || current.bucketName,
          publicCdnUrl: fCdn || current.publicCdnUrl,
          accessKeyId: fAccess || current.accessKeyId,
          secretAccessKey: fSecret || current.secretAccessKey,
        });
        return readR2ServerConfig();
      }
    }

    // Also check /site_cms/main general fields for r2PublicCdnUrl / r2AccountId / r2BucketName
    const cmsRes = await fetch(`${baseUrl}/site_cms/main`, {
      cache: 'no-store',
    });
    if (cmsRes.ok) {
      const cmsJson = await cmsRes.json();
      const genFields =
        cmsJson?.fields?.general?.mapValue?.fields || {};
      const str = (key: string) =>
        String(genFields?.[key]?.stringValue || '').trim();
      const gAccount = str('r2AccountId');
      const gBucket = str('r2BucketName');
      const gCdn = str('r2PublicCdnUrl');
      if (gAccount || gBucket || gCdn) {
        writeR2ServerConfig({
          accountId: gAccount || current.accountId,
          bucketName: gBucket || current.bucketName,
          publicCdnUrl: gCdn || current.publicCdnUrl,
        });
      }
    }
  } catch {
    // Ignore network errors during background hydration
  }

  return readR2ServerConfig();
}

export function readR2ServerConfig(): R2ServerConfig {
  let fileConfig: Partial<R2ServerConfig> = {};
  try {
    if (fs.existsSync(R2_CONFIG_FILE)) {
      const raw = fs.readFileSync(R2_CONFIG_FILE, 'utf-8');
      fileConfig = JSON.parse(raw);
    } else if (memoryR2Config) {
      fileConfig = memoryR2Config;
    }
  } catch {
    if (memoryR2Config) {
      fileConfig = memoryR2Config;
    }
  }

  if (memoryR2Config) {
    fileConfig = {
      ...fileConfig,
      ...memoryR2Config,
    };
  }

  const rawAccountId =
    fileConfig.accountId ||
    process.env.R2_ACCOUNT_ID ||
    process.env.CLOUDFLARE_R2_ACCOUNT_ID ||
    process.env.CLOUDFLARE_ACCOUNT_ID ||
    process.env.R2_ENDPOINT ||
    '';

  const rawAccessKeyId =
    fileConfig.accessKeyId ||
    process.env.R2_ACCESS_KEY_ID ||
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
    process.env.AWS_ACCESS_KEY_ID ||
    '';

  const rawSecretAccessKey =
    fileConfig.secretAccessKey ||
    process.env.R2_SECRET_ACCESS_KEY ||
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
    process.env.AWS_SECRET_ACCESS_KEY ||
    '';

  const rawBucketName =
    fileConfig.bucketName ||
    process.env.R2_BUCKET_NAME ||
    process.env.R2_BUCKET ||
    process.env.CLOUDFLARE_R2_BUCKET_NAME ||
    process.env.CLOUDFLARE_R2_BUCKET ||
    '';

  const rawPublicCdnUrl =
    fileConfig.publicCdnUrl ||
    process.env.R2_PUBLIC_CDN_URL ||
    process.env.R2_PUBLIC_URL ||
    process.env.R2_CDN_URL ||
    process.env.CLOUDFLARE_R2_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_R2_CDN_URL ||
    '';

  const { accountId, endpointUrl, inferredBucket } =
    parseAccountAndBucketFromInput(rawAccountId, rawBucketName);

  // Also check if user pasted S3 URL with bucket in Public CDN URL field
  let finalBucket = inferredBucket;
  let finalAccount = accountId;
  let finalEndpoint = endpointUrl;
  if (rawPublicCdnUrl) {
    const parsedFromCdn = parseAccountAndBucketFromInput(rawPublicCdnUrl, '');
    if (!finalBucket && parsedFromCdn.inferredBucket) {
      finalBucket = parsedFromCdn.inferredBucket;
    }
    if (!finalAccount && parsedFromCdn.accountId && /\.r2\.cloudflarestorage\.com/i.test(rawPublicCdnUrl)) {
      finalAccount = parsedFromCdn.accountId;
      finalEndpoint = parsedFromCdn.endpointUrl;
    }
  }

  return {
    accountId: finalAccount,
    accessKeyId: rawAccessKeyId.trim(),
    secretAccessKey: rawSecretAccessKey.trim(),
    bucketName: finalBucket || 'bimondo-media',
    publicCdnUrl: normalizePublicCdnUrl(rawPublicCdnUrl),
    endpointUrl: finalEndpoint,
  };
}

export function writeR2ServerConfig(
  patch: Partial<R2ServerConfig>
): PublicR2ConfigStatus {
  const current = readR2ServerConfig();

  const nextAccountRaw =
    patch.accountId !== undefined ? patch.accountId : current.accountId;
  const nextBucketRaw =
    patch.bucketName !== undefined ? patch.bucketName : current.bucketName;

  const { accountId, endpointUrl, inferredBucket } =
    parseAccountAndBucketFromInput(nextAccountRaw, nextBucketRaw);

  const next: R2ServerConfig = {
    accountId,
    bucketName: inferredBucket || 'bimondo-media',
    publicCdnUrl:
      patch.publicCdnUrl !== undefined
        ? normalizePublicCdnUrl(patch.publicCdnUrl)
        : current.publicCdnUrl,
    accessKeyId:
      patch.accessKeyId !== undefined && patch.accessKeyId.trim() !== ''
        ? patch.accessKeyId.trim()
        : current.accessKeyId,
    secretAccessKey:
      patch.secretAccessKey !== undefined && patch.secretAccessKey.trim() !== ''
        ? patch.secretAccessKey.trim()
        : current.secretAccessKey,
    endpointUrl,
  };

  memoryR2Config = next;
  try {
    fs.writeFileSync(R2_CONFIG_FILE, JSON.stringify(next, null, 2), 'utf-8');
  } catch {
    // Keep in memory if filesystem is read-only
  }

  return getPublicR2ConfigStatus();
}

export function getPublicR2ConfigStatus(
  requestOrigin?: string
): PublicR2ConfigStatus {
  const cfg = readR2ServerConfig();
  const hasCredentials = Boolean(cfg.accessKeyId && cfg.secretAccessKey);
  const s3Connected = Boolean(
    cfg.accountId && cfg.bucketName && hasCredentials
  );
  const hasPublicDomain = Boolean(cfg.publicCdnUrl);
  const effectiveCdnUrl =
    cfg.publicCdnUrl ||
    (s3Connected
      ? `https://${cfg.accountId}.r2.cloudflarestorage.com/${cfg.bucketName}`
      : `${resolveAppOrigin(requestOrigin)}/api/admin/r2/file`);

  return {
    configured: true,
    s3Connected,
    storageMode: s3Connected ? 'cloudflare-s3' : 'managed-local-r2',
    accountId: cfg.accountId,
    bucketName: cfg.bucketName || 'bimondo-media',
    publicCdnUrl: effectiveCdnUrl,
    hasCredentials,
    hasPublicDomain,
    endpointUrl:
      cfg.endpointUrl ||
      (cfg.accountId
        ? `https://${cfg.accountId}.r2.cloudflarestorage.com`
        : ''),
  };
}

function createR2S3ClientIfConfigured(): {
  client: S3Client;
  config: R2ServerConfig;
} | null {
  const config = readR2ServerConfig();
  if (!config.accountId || !config.accessKeyId || !config.secretAccessKey) {
    return null;
  }

  const client = new S3Client({
    region: 'auto',
    endpoint:
      config.endpointUrl ||
      `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return { client, config };
}

export async function testR2Connection(requestOrigin?: string): Promise<{
  ok: boolean;
  mode: 'cloudflare-s3' | 'managed-local-r2';
  message: string;
  objectCount: number;
  status: PublicR2ConfigStatus;
}> {
  await ensureR2ConfigHydratedFromFirestore();
  const status = getPublicR2ConfigStatus(requestOrigin);
  const s3 = createR2S3ClientIfConfigured();

  if (!s3) {
    const localItems = await listFilesInR2Bucket(undefined, requestOrigin);
    return {
      ok: false,
      mode: 'managed-local-r2',
      message:
        'Cloudflare R2 S3 credentials are not yet entered. Please enter your Cloudflare Account ID, Bucket Name, Public R2.dev Domain, Access Key ID, and Secret Access Key to upload directly to Cloudflare R2.',
      objectCount: localItems.length,
      status,
    };
  }

  try {
    const listRes = await s3.client.send(
      new ListObjectsV2Command({
        Bucket: s3.config.bucketName,
        MaxKeys: 100,
      })
    );
    const count = (listRes.Contents || []).length;
    const domainNote = s3.config.publicCdnUrl
      ? `Public R2 Domain: ${s3.config.publicCdnUrl}`
      : 'Using direct R2 S3 signed URLs (add your https://pub-xxx.r2.dev URL for permanent public links)';
    return {
      ok: true,
      mode: 'cloudflare-s3',
      message: `Connected to Cloudflare R2 bucket "${s3.config.bucketName}" (${count} objects). ${domainNote}.`,
      objectCount: count,
      status,
    };
  } catch (err) {
    try {
      await s3.client.send(
        new HeadBucketCommand({ Bucket: s3.config.bucketName })
      );
      return {
        ok: true,
        mode: 'cloudflare-s3',
        message: `Connected to Cloudflare R2 S3 bucket "${s3.config.bucketName}".`,
        objectCount: 0,
        status,
      };
    } catch {
      const msg =
        err instanceof Error
          ? err.message
          : 'Could not connect to Cloudflare R2 S3 endpoint.';
      return {
        ok: false,
        mode: 'cloudflare-s3',
        message: `Cloudflare R2 S3 Connection Error: ${msg}. Please verify your Account ID, Bucket Name ("${s3.config.bucketName}"), Access Key ID, and Secret Access Key.`,
        objectCount: 0,
        status,
      };
    }
  }
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
  if ((VALID_FOLDERS as readonly string[]).includes(firstSegment)) {
    return firstSegment as R2FolderName;
  }
  return 'general';
}

export function extractR2KeyFromCdnUrl(cdnUrlOrKey: string): string | null {
  if (!cdnUrlOrKey) return null;
  const trimmed = cdnUrlOrKey.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    const stripped = trimmed
      .replace(/^\/api\/admin\/r2\/file\//, '')
      .replace(/^\/+/, '');
    return stripped || null;
  }

  const cfg = readR2ServerConfig();
  if (cfg.publicCdnUrl && trimmed.startsWith(cfg.publicCdnUrl)) {
    return trimmed
      .slice(cfg.publicCdnUrl.length)
      .split('?')[0]
      .replace(/^\/+/, '');
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.startsWith('/api/admin/r2/file/')) {
      return decodeURIComponent(
        parsed.pathname.slice('/api/admin/r2/file/'.length).replace(/^\/+/, '')
      );
    }
    if (parsed.hostname.endsWith('.r2.dev')) {
      return decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
    }
    if (parsed.hostname.endsWith('.r2.cloudflarestorage.com')) {
      const pathParts = parsed.pathname.replace(/^\/+/, '').split('/');
      if (pathParts.length > 1 && pathParts[0] === cfg.bucketName) {
        return decodeURIComponent(pathParts.slice(1).join('/'));
      }
      return decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
    }
  } catch {
    return null;
  }

  const index = readLocalR2Index();
  for (const item of Object.values(index)) {
    if (item.cdnUrl === trimmed) {
      return item.objectKey;
    }
  }
  return null;
}

function readLocalR2Index(): Record<string, R2BucketObjectItem> {
  if (memoryR2Index) return memoryR2Index;
  try {
    if (fs.existsSync(LOCAL_R2_INDEX_FILE)) {
      const raw = fs.readFileSync(LOCAL_R2_INDEX_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        memoryR2Index = parsed;
        return parsed;
      }
    }
  } catch {
    // Ignore parse error
  }
  memoryR2Index = seedInitialR2CatalogFromCms();
  writeLocalR2Index(memoryR2Index);
  return memoryR2Index;
}

function writeLocalR2Index(index: Record<string, R2BucketObjectItem>) {
  memoryR2Index = index;
  try {
    fs.writeFileSync(
      LOCAL_R2_INDEX_FILE,
      JSON.stringify(index, null, 2),
      'utf-8'
    );
  } catch {
    // Ignore read-only fs
  }
}

export function seedInitialR2CatalogFromCms(): Record<
  string,
  R2BucketObjectItem
> {
  const cms = getDefaultCmsData();
  const catalog: Record<string, R2BucketObjectItem> = {};
  const now = new Date().toISOString();

  const registerUrl = (
    url: string | undefined,
    folder: R2FolderName,
    slugHint: string
  ) => {
    if (!url || !url.startsWith('http')) return;
    const cleanSlug = sanitizeR2FileName(slugHint);
    const ext = url.includes('.png') ? 'png' : 'jpg';
    const fileName = cleanSlug.endsWith(`.${ext}`)
      ? cleanSlug
      : `${cleanSlug}.${ext}`;
    const objectKey = `${folder}/${fileName}`;
    if (catalog[objectKey]) return;

    catalog[objectKey] = {
      id: toFirestoreMediaDocId(objectKey),
      objectKey,
      cdnUrl: url,
      folder,
      fileName,
      contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      sizeBytes: 245760,
      lastModified: now,
      source: 'cms-catalog',
    };
  };

  (cms.general.heroImages || []).forEach((url, idx) => {
    registerUrl(url, 'general', `hero-slide-${idx + 1}`);
  });
  cms.tours.forEach((t) => {
    registerUrl(t.image, 'tours', t.id || t.name);
  });
  cms.stays.forEach((s) => {
    registerUrl(s.image, 'stays', s.id || s.name);
  });
  cms.destinations.forEach((d) => {
    registerUrl(d.image, 'destinations', d.id || d.name);
  });
  cms.gallery.forEach((g) => {
    registerUrl(g.image, 'gallery', `${g.id}-${g.title}`);
  });
  cms.reviews.forEach((r) => {
    registerUrl(r.image, 'general', `guest-${r.id}-${r.name}`);
  });

  return catalog;
}

export async function uploadFileToR2Bucket(params: {
  buffer: Buffer;
  fileName: string;
  contentType: string;
  folder?: R2FolderName;
  customKey?: string;
  replaceExistingKey?: string;
  requestOrigin?: string;
}): Promise<{
  id: string;
  objectKey: string;
  cdnUrl: string;
  folder: R2FolderName;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  storageMode: 'cloudflare-s3' | 'managed-local-r2';
}> {
  await ensureR2ConfigHydratedFromFirestore();

  const folder: R2FolderName =
    params.folder && VALID_FOLDERS.includes(params.folder)
      ? params.folder
      : 'general';
  const safeName = sanitizeR2FileName(params.fileName);

  const objectKey = params.customKey
    ? params.customKey.replace(/^\/+/, '')
    : `${folder}/${Date.now()}-${safeName}`;

  const config = readR2ServerConfig();
  const s3 = createR2S3ClientIfConfigured();
  let uploadedToS3 = false;

  // 1. Write to local disk mirror as well for fast local caching
  try {
    ensureLocalBucketDir();
    const targetFilePath = path.join(
      LOCAL_R2_BUCKET_DIR,
      ...objectKey.split('/')
    );
    const parentDir = path.dirname(targetFilePath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(targetFilePath, params.buffer);
  } catch {
    // Ignore if read-only fs
  }

  // 2. Upload directly to Cloudflare R2 S3 bucket when credentials are configured
  if (s3) {
    try {
      await s3.client.send(
        new PutObjectCommand({
          Bucket: s3.config.bucketName,
          Key: objectKey,
          Body: params.buffer,
          ContentType: params.contentType || 'image/jpeg',
          CacheControl: 'public, max-age=31536000, immutable',
        })
      );
      uploadedToS3 = true;
    } catch (err) {
      const errMsg =
        err instanceof Error ? err.message : 'Unknown Cloudflare R2 S3 error';
      throw new Error(
        `Cloudflare R2 S3 upload failed for bucket "${s3.config.bucketName}": ${errMsg}. Please verify your R2 Account ID, Bucket Name, Access Key ID, and Secret Access Key.`
      );
    }
  } else if (config.publicCdnUrl) {
    // If user configured a public R2 domain (e.g. https://pub-xxx.r2.dev) without S3 keys,
    // alert them clearly that S3 Access Key & Secret Key are required to push files into the remote R2 bucket.
    throw new Error(
      `Your Public R2 Domain (${config.publicCdnUrl}) is set, but R2 S3 Access Key ID & Secret Access Key are missing. Please enter your R2 S3 API keys in the R2 settings bar below so files upload directly to your Cloudflare R2 bucket.`
    );
  }

  // 3. Handle replacing an existing key
  if (params.replaceExistingKey) {
    const oldKey = extractR2KeyFromCdnUrl(params.replaceExistingKey);
    if (oldKey && oldKey !== objectKey) {
      await deleteFileFromR2Bucket(oldKey).catch(() => {});
    }
  }

  // 4. Build the direct R2 domain URL (either `https://pub-xxx.r2.dev/<key>` or custom R2 domain,
  // or a direct `https://<accountId>.r2.cloudflarestorage.com/<bucket>/<key>?X-Amz-...` signed URL)
  let cdnUrl: string;
  if (uploadedToS3) {
    cdnUrl = config.publicCdnUrl
      ? `${config.publicCdnUrl}/${objectKey}`
      : createPresignedR2ReadUrl(objectKey, config);
  } else if (config.publicCdnUrl) {
    cdnUrl = `${config.publicCdnUrl}/${objectKey}`;
  } else {
    cdnUrl = `${resolveAppOrigin(params.requestOrigin)}/api/admin/r2/file/${objectKey}`;
  }

  const itemMeta: R2BucketObjectItem = {
    id: toFirestoreMediaDocId(objectKey),
    objectKey,
    cdnUrl,
    folder,
    fileName: safeName,
    contentType: params.contentType || 'image/jpeg',
    sizeBytes: params.buffer.byteLength,
    lastModified: new Date().toISOString(),
    source: uploadedToS3 ? 's3' : 'local-r2',
  };

  const index = readLocalR2Index();
  index[objectKey] = itemMeta;
  writeLocalR2Index(index);

  return {
    id: itemMeta.id,
    objectKey,
    cdnUrl,
    folder,
    fileName: safeName,
    contentType: params.contentType || 'image/jpeg',
    sizeBytes: params.buffer.byteLength,
    storageMode: uploadedToS3 ? 'cloudflare-s3' : 'managed-local-r2',
  };
}

export async function deleteFileFromR2Bucket(
  objectKeyOrCdnUrl: string
): Promise<{ deletedKey: string }> {
  await ensureR2ConfigHydratedFromFirestore();
  const resolvedKey =
    extractR2KeyFromCdnUrl(objectKeyOrCdnUrl) ||
    objectKeyOrCdnUrl.replace(/^\/+/, '');
  if (!resolvedKey) {
    throw new Error('Could not resolve R2 object key to delete.');
  }

  // 1. Delete from remote Cloudflare R2 S3 if configured
  const s3 = createR2S3ClientIfConfigured();
  if (s3) {
    try {
      await s3.client.send(
        new DeleteObjectCommand({
          Bucket: s3.config.bucketName,
          Key: resolvedKey,
        })
      );
    } catch {
      // Ignore if object was only in local mirror or catalog
    }
  }

  // 2. Delete from local R2 bucket mirror
  try {
    const localPath = path.join(LOCAL_R2_BUCKET_DIR, ...resolvedKey.split('/'));
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
  } catch {
    // Ignore fs cleanup error
  }

  // 3. Remove from local R2 index
  const index = readLocalR2Index();
  if (index[resolvedKey]) {
    delete index[resolvedKey];
    writeLocalR2Index(index);
  }

  return { deletedKey: resolvedKey };
}

export async function renameFileInR2Bucket(params: {
  oldKeyOrUrl: string;
  newKey: string;
  requestOrigin?: string;
}): Promise<{
  id: string;
  oldKey: string;
  objectKey: string;
  cdnUrl: string;
}> {
  await ensureR2ConfigHydratedFromFirestore();
  const oldKey =
    extractR2KeyFromCdnUrl(params.oldKeyOrUrl) ||
    params.oldKeyOrUrl.replace(/^\/+/, '');
  if (!oldKey) {
    throw new Error('Invalid source R2 object key.');
  }
  const cleanNewKey = params.newKey.trim().replace(/^\/+/, '');
  if (!cleanNewKey) {
    throw new Error('New R2 object key cannot be empty.');
  }

  const config = readR2ServerConfig();
  const s3 = createR2S3ClientIfConfigured();
  let renamedInS3 = false;

  if (oldKey !== cleanNewKey) {
    if (s3) {
      try {
        await s3.client.send(
          new CopyObjectCommand({
            Bucket: s3.config.bucketName,
            CopySource: `${s3.config.bucketName}/${encodeURIComponent(oldKey).replace(/%2F/g, '/')}`,
            Key: cleanNewKey,
          })
        );
        await s3.client.send(
          new DeleteObjectCommand({
            Bucket: s3.config.bucketName,
            Key: oldKey,
          })
        );
        renamedInS3 = true;
      } catch {
        // Fallback to local mirror rename if object wasn't in remote S3
      }
    }

    try {
      const oldLocalPath = path.join(LOCAL_R2_BUCKET_DIR, ...oldKey.split('/'));
      const newLocalPath = path.join(
        LOCAL_R2_BUCKET_DIR,
        ...cleanNewKey.split('/')
      );
      if (fs.existsSync(oldLocalPath)) {
        const parentDir = path.dirname(newLocalPath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }
        fs.renameSync(oldLocalPath, newLocalPath);
      }
    } catch {
      // Ignore disk error
    }
  }

  const index = readLocalR2Index();
  const existingEntry = index[oldKey];
  const newFolder = inferFolderFromKey(cleanNewKey);
  const newFileName = cleanNewKey.split('/').pop() || cleanNewKey;

  let cdnUrl: string;
  if (
    existingEntry?.source === 'cms-catalog' &&
    existingEntry.cdnUrl.startsWith('https://images.unsplash.com')
  ) {
    cdnUrl = existingEntry.cdnUrl;
  } else if (renamedInS3 || s3) {
    cdnUrl = buildServedCdnUrl(cleanNewKey, config, params.requestOrigin);
  } else if (config.publicCdnUrl) {
    cdnUrl = `${config.publicCdnUrl}/${cleanNewKey}`;
  } else {
    cdnUrl = `${resolveAppOrigin(params.requestOrigin)}/api/admin/r2/file/${cleanNewKey}`;
  }

  if (oldKey !== cleanNewKey) {
    delete index[oldKey];
  }
  index[cleanNewKey] = {
    id: toFirestoreMediaDocId(cleanNewKey),
    objectKey: cleanNewKey,
    cdnUrl,
    folder: newFolder,
    fileName: newFileName,
    contentType: existingEntry?.contentType || 'image/jpeg',
    sizeBytes: existingEntry?.sizeBytes || 0,
    lastModified: new Date().toISOString(),
    source: renamedInS3 ? 's3' : existingEntry?.source || 'local-r2',
  };
  writeLocalR2Index(index);

  return {
    id: toFirestoreMediaDocId(cleanNewKey),
    oldKey,
    objectKey: cleanNewKey,
    cdnUrl,
  };
}

export async function getFileBufferFromR2Bucket(objectKey: string): Promise<{
  buffer: Buffer;
  contentType: string;
} | null> {
  await ensureR2ConfigHydratedFromFirestore();
  const cleanKey = objectKey.replace(/^\/+/, '');

  // 1. Check local R2 bucket disk cache first
  try {
    const localPath = path.join(LOCAL_R2_BUCKET_DIR, ...cleanKey.split('/'));
    if (fs.existsSync(localPath)) {
      const buffer = fs.readFileSync(localPath);
      const ext = path.extname(cleanKey).toLowerCase();
      const contentType =
        ext === '.png'
          ? 'image/png'
          : ext === '.webp'
          ? 'image/webp'
          : ext === '.avif'
          ? 'image/avif'
          : ext === '.gif'
          ? 'image/gif'
          : ext === '.svg'
          ? 'image/svg+xml'
          : 'image/jpeg';
      return { buffer, contentType };
    }
  } catch {
    // Continue to S3
  }

  // 2. Fetch from remote Cloudflare R2 S3 if configured
  const s3 = createR2S3ClientIfConfigured();
  if (s3) {
    try {
      const res = await s3.client.send(
        new GetObjectCommand({
          Bucket: s3.config.bucketName,
          Key: cleanKey,
        })
      );
      if (res.Body) {
        const byteArray = await res.Body.transformToByteArray();
        const buffer = Buffer.from(byteArray);
        return {
          buffer,
          contentType: res.ContentType || 'image/jpeg',
        };
      }
    } catch {
      // Fall through
    }
  }

  // 3. Also check if publicCdnUrl is configured and fetch from there
  const config = readR2ServerConfig();
  if (config.publicCdnUrl) {
    try {
      const remoteRes = await fetch(`${config.publicCdnUrl}/${cleanKey}`);
      if (remoteRes.ok) {
        const arr = await remoteRes.arrayBuffer();
        return {
          buffer: Buffer.from(arr),
          contentType: remoteRes.headers.get('content-type') || 'image/jpeg',
        };
      }
    } catch {
      // Fall through
    }
  }

  return null;
}

export async function listFilesInR2Bucket(
  prefix?: string,
  requestOrigin?: string
): Promise<R2BucketObjectItem[]> {
  await ensureR2ConfigHydratedFromFirestore();
  const merged = new Map<string, R2BucketObjectItem>();
  const index = readLocalR2Index();
  const origin = resolveAppOrigin(requestOrigin);
  const config = readR2ServerConfig();

  // 1. Load indexed items (local uploads + seeded CMS catalog)
  for (const item of Object.values(index)) {
    if (prefix && !item.objectKey.startsWith(prefix)) continue;
    let resolvedUrl = item.cdnUrl;
    if (item.source === 'local-r2') {
      resolvedUrl = config.publicCdnUrl
        ? `${config.publicCdnUrl}/${item.objectKey}`
        : `${origin}/api/admin/r2/file/${item.objectKey}`;
    } else if (item.source === 's3') {
      resolvedUrl = buildServedCdnUrl(item.objectKey, config, requestOrigin);
    }
    merged.set(item.objectKey, {
      ...item,
      cdnUrl: resolvedUrl,
    });
  }

  // 2. Scan local disk directory `.aistudio-r2-bucket` for any unindexed files
  try {
    ensureLocalBucketDir();
    const walkDir = (dir: string, relPrefix = '') => {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const relKey = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          walkDir(path.join(dir, entry.name), relKey);
        } else if (entry.isFile()) {
          if (prefix && !relKey.startsWith(prefix)) continue;
          const stat = fs.statSync(path.join(dir, entry.name));
          const folder = inferFolderFromKey(relKey);
          merged.set(relKey, {
            id: toFirestoreMediaDocId(relKey),
            objectKey: relKey,
            cdnUrl: config.publicCdnUrl
              ? `${config.publicCdnUrl}/${relKey}`
              : `${origin}/api/admin/r2/file/${relKey}`,
            folder,
            fileName: entry.name,
            sizeBytes: stat.size,
            lastModified: stat.mtime.toISOString(),
            source: 'local-r2',
          });
        }
      }
    };
    walkDir(LOCAL_R2_BUCKET_DIR);
  } catch {
    // Ignore disk scan errors
  }

  // 3. Query remote Cloudflare R2 S3 bucket if credentials are configured
  const s3 = createR2S3ClientIfConfigured();
  if (s3) {
    try {
      const response = await s3.client.send(
        new ListObjectsV2Command({
          Bucket: s3.config.bucketName,
          Prefix: prefix || undefined,
          MaxKeys: 300,
        })
      );
      const contents = response.Contents || [];
      for (const item of contents) {
        if (!item.Key) continue;
        const objectKey = item.Key;
        const folder = inferFolderFromKey(objectKey);
        const parts = objectKey.split('/');
        const fileName = parts[parts.length - 1] || objectKey;
        merged.set(objectKey, {
          id: toFirestoreMediaDocId(objectKey),
          objectKey,
          cdnUrl: buildServedCdnUrl(objectKey, s3.config, requestOrigin),
          folder,
          fileName,
          sizeBytes: item.Size ?? 0,
          lastModified: item.LastModified
            ? item.LastModified.toISOString()
            : new Date().toISOString(),
          source: 's3',
        });
      }
    } catch (err) {
      console.warn('Cloudflare R2 S3 ListObjectsV2 fallback to local index:', err);
    }
  }

  return Array.from(merged.values()).sort((a, b) =>
    b.lastModified.localeCompare(a.lastModified)
  );
}
