import fs from 'fs';
import path from 'path';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';

export interface R2ServerConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicCdnUrl: string;
}

export interface PublicR2ConfigStatus {
  configured: boolean;
  accountId: string;
  bucketName: string;
  publicCdnUrl: string;
  hasCredentials: boolean;
}

export interface R2BucketObjectItem {
  id: string;
  objectKey: string;
  cdnUrl: string;
  folder: 'tours' | 'stays' | 'destinations' | 'gallery' | 'general';
  fileName: string;
  sizeBytes: number;
  lastModified: string;
}

const R2_CONFIG_FILE = path.join(process.cwd(), '.aistudio-r2-config.json');

let memoryR2Config: Partial<R2ServerConfig> | null = null;

function normalizeAccountId(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  // If user pasted https://<account_id>.r2.cloudflarestorage.com, extract <account_id>
  const match = trimmed.match(/https?:\/\/([a-z0-9]+)\.r2\.cloudflarestorage\.com/i);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
}

function normalizePublicCdnUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
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

  return {
    accountId: normalizeAccountId(rawAccountId),
    accessKeyId: rawAccessKeyId.trim(),
    secretAccessKey: rawSecretAccessKey.trim(),
    bucketName: rawBucketName.trim(),
    publicCdnUrl: normalizePublicCdnUrl(rawPublicCdnUrl),
  };
}

export function writeR2ServerConfig(
  patch: Partial<R2ServerConfig>
): PublicR2ConfigStatus {
  const current = readR2ServerConfig();
  const next: R2ServerConfig = {
    accountId:
      patch.accountId !== undefined
        ? normalizeAccountId(patch.accountId)
        : current.accountId,
    bucketName:
      patch.bucketName !== undefined
        ? patch.bucketName.trim()
        : current.bucketName,
    publicCdnUrl:
      patch.publicCdnUrl !== undefined
        ? normalizePublicCdnUrl(patch.publicCdnUrl)
        : current.publicCdnUrl,
    accessKeyId:
      patch.accessKeyId && patch.accessKeyId.trim() !== ''
        ? patch.accessKeyId.trim()
        : current.accessKeyId,
    secretAccessKey:
      patch.secretAccessKey && patch.secretAccessKey.trim() !== ''
        ? patch.secretAccessKey.trim()
        : current.secretAccessKey,
  };

  memoryR2Config = next;
  try {
    fs.writeFileSync(R2_CONFIG_FILE, JSON.stringify(next, null, 2), 'utf-8');
  } catch {
    // Keep in memory if filesystem is read-only
  }

  return getPublicR2ConfigStatus();
}

export function getPublicR2ConfigStatus(): PublicR2ConfigStatus {
  const cfg = readR2ServerConfig();
  const hasCredentials = Boolean(cfg.accessKeyId && cfg.secretAccessKey);
  const configured = Boolean(
    cfg.accountId && cfg.bucketName && cfg.publicCdnUrl && hasCredentials
  );
  return {
    configured,
    accountId: cfg.accountId,
    bucketName: cfg.bucketName,
    publicCdnUrl: cfg.publicCdnUrl,
    hasCredentials,
  };
}

function createR2Client(): { client: S3Client; config: R2ServerConfig } {
  const config = readR2ServerConfig();
  if (
    !config.accountId ||
    !config.accessKeyId ||
    !config.secretAccessKey ||
    !config.bucketName ||
    !config.publicCdnUrl
  ) {
    throw new Error(
      'Cloudflare R2 is not configured yet. Please enter your Cloudflare R2 Account ID, Bucket Name, Public CDN URL, Access Key ID, and Secret Access Key in the Admin R2 Storage settings.'
    );
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return { client, config };
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
  return objectKey.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 120) || `r2_${Date.now()}`;
}

export function extractR2KeyFromCdnUrl(
  cdnUrlOrKey: string
): string | null {
  if (!cdnUrlOrKey) return null;
  const trimmed = cdnUrlOrKey.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return trimmed.replace(/^\/+/, '');
  }
  const cfg = readR2ServerConfig();
  if (cfg.publicCdnUrl && trimmed.startsWith(cfg.publicCdnUrl)) {
    return trimmed.slice(cfg.publicCdnUrl.length).replace(/^\/+/, '');
  }
  try {
    const parsed = new URL(trimmed);
    if (
      parsed.hostname.endsWith('.r2.dev') ||
      parsed.hostname.endsWith('.r2.cloudflarestorage.com')
    ) {
      return parsed.pathname.replace(/^\/+/, '');
    }
  } catch {
    return null;
  }
  return null;
}

export async function uploadFileToR2Bucket(params: {
  buffer: Buffer;
  fileName: string;
  contentType: string;
  folder?: 'tours' | 'stays' | 'destinations' | 'gallery' | 'general';
  customKey?: string;
  replaceExistingKey?: string;
}): Promise<{
  id: string;
  objectKey: string;
  cdnUrl: string;
  folder: 'tours' | 'stays' | 'destinations' | 'gallery' | 'general';
  fileName: string;
  contentType: string;
  sizeBytes: number;
}> {
  const { client, config } = createR2Client();
  const folder = params.folder || 'general';
  const safeName = sanitizeR2FileName(params.fileName);

  const objectKey = params.customKey
    ? params.customKey.replace(/^\/+/, '')
    : `${folder}/${Date.now()}-${safeName}`;

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: objectKey,
      Body: params.buffer,
      ContentType: params.contentType || 'image/jpeg',
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  // If replacing an existing object in R2 with a different key, remove the old object from R2
  if (params.replaceExistingKey) {
    const oldKey = extractR2KeyFromCdnUrl(params.replaceExistingKey);
    if (oldKey && oldKey !== objectKey) {
      try {
        await client.send(
          new DeleteObjectCommand({
            Bucket: config.bucketName,
            Key: oldKey,
          })
        );
      } catch {
        // Ignore cleanup failure if old object already absent
      }
    }
  }

  const cdnUrl = `${config.publicCdnUrl}/${objectKey}`;
  return {
    id: toFirestoreMediaDocId(objectKey),
    objectKey,
    cdnUrl,
    folder,
    fileName: safeName,
    contentType: params.contentType || 'image/jpeg',
    sizeBytes: params.buffer.byteLength,
  };
}

export async function deleteFileFromR2Bucket(
  objectKeyOrCdnUrl: string
): Promise<{ deletedKey: string }> {
  const { client, config } = createR2Client();
  const resolvedKey = extractR2KeyFromCdnUrl(objectKeyOrCdnUrl);
  if (!resolvedKey) {
    throw new Error('Could not resolve Cloudflare R2 object key to delete.');
  }

  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: resolvedKey,
    })
  );

  return { deletedKey: resolvedKey };
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
  const { client, config } = createR2Client();
  const oldKey = extractR2KeyFromCdnUrl(params.oldKeyOrUrl);
  if (!oldKey) {
    throw new Error('Invalid source R2 object key.');
  }
  const cleanNewKey = params.newKey.trim().replace(/^\/+/, '');
  if (!cleanNewKey) {
    throw new Error('New R2 object key cannot be empty.');
  }

  if (oldKey !== cleanNewKey) {
    await client.send(
      new CopyObjectCommand({
        Bucket: config.bucketName,
        CopySource: `${config.bucketName}/${encodeURIComponent(oldKey).replace(/%2F/g, '/')}`,
        Key: cleanNewKey,
      })
    );
    await client.send(
      new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: oldKey,
      })
    );
  }

  const cdnUrl = `${config.publicCdnUrl}/${cleanNewKey}`;
  return {
    id: toFirestoreMediaDocId(cleanNewKey),
    oldKey,
    objectKey: cleanNewKey,
    cdnUrl,
  };
}

export async function listFilesInR2Bucket(
  prefix?: string
): Promise<R2BucketObjectItem[]> {
  const status = getPublicR2ConfigStatus();
  if (!status.configured) {
    return [];
  }
  const { client, config } = createR2Client();
  const response = await client.send(
    new ListObjectsV2Command({
      Bucket: config.bucketName,
      Prefix: prefix || undefined,
      MaxKeys: 200,
    })
  );

  const contents = response.Contents || [];
  return contents
    .filter((item) => Boolean(item.Key))
    .map((item) => {
      const objectKey = item.Key as string;
      const parts = objectKey.split('/');
      const firstSegment = parts[0];
      const validFolders = [
        'tours',
        'stays',
        'destinations',
        'gallery',
        'general',
      ] as const;
      const folder = (validFolders as readonly string[]).includes(firstSegment)
        ? (firstSegment as R2BucketObjectItem['folder'])
        : 'general';
      const fileName = parts[parts.length - 1] || objectKey;
      return {
        id: toFirestoreMediaDocId(objectKey),
        objectKey,
        cdnUrl: `${config.publicCdnUrl}/${objectKey}`,
        folder,
        fileName,
        sizeBytes: item.Size ?? 0,
        lastModified: item.LastModified
          ? item.LastModified.toISOString()
          : new Date().toISOString(),
      };
    });
}
