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

function normalizePublicCdnUrl(raw: string): string {
  const trimmed = (raw || '').trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  const withProto = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  // Note: *.r2.cloudflarestorage.com is the private S3 API endpoint and rejects browser <img> GET requests.
  // If a user pasted their S3 endpoint into Public CDN URL, ignore it so we use our streaming proxy URL instead.
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

export function buildServedCdnUrl(
  objectKey: string,
  config: R2ServerConfig,
  requestOrigin?: string
): string {
  const cleanKey = objectKey.replace(/^\/+/, '');
  if (config.publicCdnUrl) {
    return `${config.publicCdnUrl}/${cleanKey}`;
  }
  const origin = resolveAppOrigin(requestOrigin);
  return `${origin}/api/admin/r2/file/${cleanKey}`;
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
  if (!finalBucket && rawPublicCdnUrl) {
    const parsedFromCdn = parseAccountAndBucketFromInput(rawPublicCdnUrl, '');
    if (parsedFromCdn.inferredBucket) {
      finalBucket = parsedFromCdn.inferredBucket;
    }
  }

  return {
    accountId,
    accessKeyId: rawAccessKeyId.trim(),
    secretAccessKey: rawSecretAccessKey.trim(),
    bucketName: finalBucket || 'bimondo-media',
    publicCdnUrl: normalizePublicCdnUrl(rawPublicCdnUrl),
    endpointUrl,
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
  const effectiveCdnUrl =
    cfg.publicCdnUrl || `${resolveAppOrigin(requestOrigin)}/api/admin/r2/file`;

  return {
    // Always operational: uses live Cloudflare R2 S3 when credentials are provided,
    // or managed local R2 bucket storage when S3 credentials are not yet entered.
    configured: true,
    s3Connected,
    storageMode: s3Connected ? 'cloudflare-s3' : 'managed-local-r2',
    accountId: cfg.accountId,
    bucketName: cfg.bucketName || 'bimondo-media',
    publicCdnUrl: effectiveCdnUrl,
    hasCredentials,
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
  const status = getPublicR2ConfigStatus(requestOrigin);
  const s3 = createR2S3ClientIfConfigured();

  if (!s3) {
    const localItems = await listFilesInR2Bucket(undefined, requestOrigin);
    return {
      ok: true,
      mode: 'managed-local-r2',
      message: `Managed R2 Bucket Mirror is active (${localItems.length} objects ready). Enter Cloudflare R2 S3 credentials anytime to sync directly with a remote Cloudflare S3 bucket.`,
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
    return {
      ok: true,
      mode: 'cloudflare-s3',
      message: `Connected to Cloudflare R2 S3 bucket "${s3.config.bucketName}" (${count} objects in remote bucket).`,
      objectCount: count,
      status,
    };
  } catch (err) {
    // Also try HeadBucketCommand if ListObjectsV2 is restricted
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
        message: `Cloudflare R2 S3 Error: ${msg}. Falling back to Managed R2 Bucket Mirror so uploads continue uninterrupted.`,
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
    return trimmed.slice(cfg.publicCdnUrl.length).replace(/^\/+/, '');
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.startsWith('/api/admin/r2/file/')) {
      return decodeURIComponent(
        parsed.pathname.slice('/api/admin/r2/file/'.length).replace(/^\/+/, '')
      );
    }
    if (
      parsed.hostname.endsWith('.r2.dev') ||
      parsed.hostname.endsWith('.r2.cloudflarestorage.com')
    ) {
      return decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
    }
  } catch {
    return null;
  }

  // Also check if URL matches an entry in local index
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

  // 1. Always write to local R2 bucket cache so preview & local serving are instant
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

  // 2. If Cloudflare R2 S3 credentials are configured, push directly to remote S3 bucket
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
      console.warn(
        'Cloudflare R2 S3 PutObject warning (saved to local R2 mirror):',
        err
      );
    }
  }

  // 3. Handle replacing an existing key
  if (params.replaceExistingKey) {
    const oldKey = extractR2KeyFromCdnUrl(params.replaceExistingKey);
    if (oldKey && oldKey !== objectKey) {
      await deleteFileFromR2Bucket(oldKey).catch(() => {});
    }
  }

  const cdnUrl =
    uploadedToS3 && config.publicCdnUrl
      ? `${config.publicCdnUrl}/${objectKey}`
      : `${resolveAppOrigin(params.requestOrigin)}/api/admin/r2/file/${objectKey}`;

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
    // 1. Rename in remote Cloudflare R2 S3 if configured
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

    // 2. Rename in local R2 bucket mirror if file exists on disk
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
  } else if (renamedInS3 && config.publicCdnUrl) {
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

  return null;
}

export async function listFilesInR2Bucket(
  prefix?: string,
  requestOrigin?: string
): Promise<R2BucketObjectItem[]> {
  const merged = new Map<string, R2BucketObjectItem>();
  const index = readLocalR2Index();
  const origin = resolveAppOrigin(requestOrigin);
  const config = readR2ServerConfig();

  // 1. Load indexed items (local uploads + seeded CMS catalog)
  for (const item of Object.values(index)) {
    if (prefix && !item.objectKey.startsWith(prefix)) continue;
    let resolvedUrl = item.cdnUrl;
    if (item.source === 'local-r2') {
      resolvedUrl = `${origin}/api/admin/r2/file/${item.objectKey}`;
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
            cdnUrl: `${origin}/api/admin/r2/file/${relKey}`,
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
