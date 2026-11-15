import crypto from 'crypto';
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
  storageMode: 'cloudflare-s3' | 'unconfigured';
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
  source?: 's3';
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

const VALID_FOLDERS: readonly R2FolderName[] = [
  'tours',
  'stays',
  'destinations',
  'gallery',
  'general',
];

let memoryR2Config: Partial<R2ServerConfig> | null = null;
let lastFirestoreHydrationMs = 0;

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

function getNativeR2BucketBinding(): CloudflareR2BucketBinding | null {
  const cfEnv = getCloudflareRuntimeEnv();
  for (const val of Object.values(cfEnv)) {
    if (
      val &&
      typeof val === 'object' &&
      typeof (val as CloudflareR2BucketBinding).put === 'function' &&
      typeof (val as CloudflareR2BucketBinding).get === 'function' &&
      typeof (val as CloudflareR2BucketBinding).list === 'function'
    ) {
      return val as CloudflareR2BucketBinding;
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

export function parseAccountAndBucketFromInput(
  rawAccountOrEndpoint: string,
  rawBucketName: string
): { accountId: string; endpointUrl: string; inferredBucket: string } {
  const trimmed = (rawAccountOrEndpoint || '').trim();
  let inferredBucket = (rawBucketName || '').trim();
  if (!trimmed) {
    return { accountId: '', endpointUrl: '', inferredBucket };
  }

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
  const withProto = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  if (/\.r2\.cloudflarestorage\.com(\/|$)/i.test(withProto)) {
    return '';
  }
  return withProto;
}

function getR2EndpointHost(config: R2ServerConfig): string {
  const endpoint =
    config.endpointUrl ||
    `https://${config.accountId}.r2.cloudflarestorage.com`;
  try {
    return new URL(endpoint).host;
  } catch {
    return `${config.accountId}.r2.cloudflarestorage.com`;
  }
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest();
}

function sha256Hex(data: Buffer | string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function deriveSigningKey(
  secretAccessKey: string,
  dateStamp: string,
  region = 'auto',
  service = 's3'
): Buffer {
  const kDate = hmacSha256(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  return hmacSha256(kService, 'aws4_request');
}

function encodeRfc3986(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

/**
 * Pure `crypto` + native `fetch` AWS Signature V4 request to Cloudflare R2 S3 API.
 */
async function r2S3SignedFetch(params: {
  config: R2ServerConfig;
  method: 'GET' | 'PUT' | 'DELETE' | 'HEAD';
  objectKey?: string;
  query?: Record<string, string>;
  body?: Buffer;
  contentType?: string;
  extraHeaders?: Record<string, string>;
}): Promise<Response> {
  const { config, method, objectKey, query, body, contentType, extraHeaders } =
    params;
  const host = getR2EndpointHost(config);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const region = 'auto';
  const service = 's3';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;

  const encodedBucket = encodeRfc3986(config.bucketName);
  const encodedKey = objectKey
    ? objectKey
        .replace(/^\/+/, '')
        .split('/')
        .map(encodeRfc3986)
        .join('/')
    : '';
  const canonicalUri = encodedKey
    ? `/${encodedBucket}/${encodedKey}`
    : `/${encodedBucket}`;

  const sortedQueryEntries = Object.entries(query || {}).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  const canonicalQueryString = sortedQueryEntries
    .map(([k, v]) => `${encodeRfc3986(k)}=${encodeRfc3986(v)}`)
    .join('&');

  const payloadHash = body ? sha256Hex(body) : sha256Hex('');

  const headersToSign: Record<string, string> = {
    host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
    ...(extraHeaders || {}),
  };
  if (contentType) {
    headersToSign['content-type'] = contentType;
  }

  const sortedHeaderKeys = Object.keys(headersToSign)
    .map((k) => k.toLowerCase())
    .sort();
  const canonicalHeaders = sortedHeaderKeys
    .map((k) => `${k}:${headersToSign[k].trim()}\n`)
    .join('');
  const signedHeaders = sortedHeaderKeys.join(';');

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const signingKey = deriveSigningKey(
    config.secretAccessKey,
    dateStamp,
    region,
    service
  );
  const signature = crypto
    .createHmac('sha256', signingKey)
    .update(stringToSign, 'utf8')
    .digest('hex');

  const authorization = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const requestHeaders: Record<string, string> = {
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
    Authorization: authorization,
    ...(extraHeaders || {}),
  };
  if (contentType) {
    requestHeaders['Content-Type'] = contentType;
  }

  const url = `https://${host}${canonicalUri}${
    canonicalQueryString ? `?${canonicalQueryString}` : ''
  }`;

  return fetch(url, {
    method,
    headers: requestHeaders,
    body: body ? new Uint8Array(body) : undefined,
    cache: 'no-store',
  });
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function parseS3ListXml(xml: string): Array<{
  Key: string;
  Size: number;
  LastModified: string;
}> {
  const results: Array<{ Key: string; Size: number; LastModified: string }> =
    [];
  const contentBlocks = xml.match(/<Contents>[\s\S]*?<\/Contents>/g) || [];
  for (const block of contentBlocks) {
    const keyMatch = block.match(/<Key>([\s\S]*?)<\/Key>/);
    const sizeMatch = block.match(/<Size>(\d+)<\/Size>/);
    const lastModMatch = block.match(/<LastModified>([\s\S]*?)<\/LastModified>/);
    if (keyMatch?.[1]) {
      results.push({
        Key: decodeXmlEntities(keyMatch[1].trim()),
        Size: sizeMatch?.[1] ? Number(sizeMatch[1]) : 0,
        LastModified: lastModMatch?.[1]
          ? lastModMatch[1].trim()
          : new Date().toISOString(),
      });
    }
  }
  return results;
}

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
    return '';
  }

  const host = getR2EndpointHost(config);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const region = 'auto';
  const service = 's3';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;

  const encodedKey = cleanKey.split('/').map(encodeRfc3986).join('/');
  const canonicalUri = `/${encodeRfc3986(config.bucketName)}/${encodedKey}`;

  const queryParams: [string, string][] = [
    ['X-Amz-Algorithm', 'AWS4-HMAC-SHA256'],
    ['X-Amz-Credential', `${config.accessKeyId}/${credentialScope}`],
    ['X-Amz-Date', amzDate],
    ['X-Amz-Expires', String(Math.min(Math.max(expiresInSeconds, 60), 604800))],
    ['X-Amz-SignedHeaders', 'host'],
  ];

  const canonicalQueryString = queryParams
    .map(([k, v]) => `${encodeRfc3986(k)}=${encodeRfc3986(v)}`)
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

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const signingKey = deriveSigningKey(
    config.secretAccessKey,
    dateStamp,
    region,
    service
  );
  const signature = crypto
    .createHmac('sha256', signingKey)
    .update(stringToSign, 'utf8')
    .digest('hex');

  return `https://${host}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
}

export function buildServedCdnUrl(
  objectKey: string,
  config: R2ServerConfig
): string {
  const cleanKey = objectKey.replace(/^\/+/, '');
  if (config.publicCdnUrl) {
    return `${config.publicCdnUrl}/${cleanKey}`;
  }
  if (config.accountId && config.accessKeyId && config.secretAccessKey) {
    return createPresignedR2ReadUrl(cleanKey, config);
  }
  return '';
}

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

export async function persistR2ConfigToFirestoreServer(
  cfg?: R2ServerConfig
): Promise<void> {
  const active = cfg || readR2ServerConfig();
  if (
    !active.accountId &&
    !active.publicCdnUrl &&
    !active.accessKeyId &&
    !active.secretAccessKey
  ) {
    return;
  }

  try {
    const projectId = firebaseConfig.projectId;
    const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
    const commitUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents:commit`;
    const docName = `projects/${projectId}/databases/${databaseId}/documents/faqs/r2_system_config`;

    await fetch(commitUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        writes: [
          {
            update: {
              name: docName,
              fields: {
                id: { stringValue: 'r2_system_config' },
                updatedBy: { stringValue: 'bimondo-cms-admin' },
                payload: {
                  mapValue: {
                    fields: {
                      accountId: {
                        stringValue: (active.accountId || '').slice(0, 200),
                      },
                      bucketName: {
                        stringValue: (active.bucketName || 'bimondo').slice(
                          0,
                          120
                        ),
                      },
                      publicCdnUrl: {
                        stringValue: (active.publicCdnUrl || '').slice(0, 300),
                      },
                      accessKeyId: {
                        stringValue: (active.accessKeyId || '').slice(0, 200),
                      },
                      secretAccessKey: {
                        stringValue: (active.secretAccessKey || '').slice(
                          0,
                          200
                        ),
                      },
                    },
                  },
                },
              },
            },
            updateTransforms: [
              { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
            ],
          },
        ],
      }),
      cache: 'no-store',
    });
  } catch {
    // Non-fatal if offline
  }
}

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
  const hasS3Creds = Boolean(
    current.accountId && current.accessKeyId && current.secretAccessKey
  );
  if (hasS3Creds && now - lastFirestoreHydrationMs < 5000) {
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
      const payloadFields = docJson?.fields?.payload?.mapValue?.fields || {};
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
      }
    }

    const afterFaq = readR2ServerConfig();
    if (!afterFaq.publicCdnUrl || !afterFaq.accountId) {
      const cmsRes = await fetch(`${baseUrl}/site_cms/main`, {
        cache: 'no-store',
      });
      if (cmsRes.ok) {
        const cmsJson = await cmsRes.json();
        const genFields = cmsJson?.fields?.general?.mapValue?.fields || {};
        const str = (key: string) =>
          String(genFields?.[key]?.stringValue || '').trim();
        const gAccount = str('r2AccountId');
        const gBucket = str('r2BucketName');
        const gCdn = str('r2PublicCdnUrl');
        if (gAccount || gBucket || gCdn) {
          writeR2ServerConfig({
            accountId: gAccount || afterFaq.accountId,
            bucketName: gBucket || afterFaq.bucketName,
            publicCdnUrl: gCdn || afterFaq.publicCdnUrl,
          });
        }
      }
    }
  } catch {
    // Ignore network errors
  }

  return readR2ServerConfig();
}

export function readR2ServerConfig(): R2ServerConfig {
  const mem = memoryR2Config || {};

  const rawAccountId =
    mem.accountId ||
    getEnvString([
      'R2_ACCOUNT_ID',
      'CLOUDFLARE_R2_ACCOUNT_ID',
      'CLOUDFLARE_ACCOUNT_ID',
      'CF_ACCOUNT_ID',
      'NEXT_PUBLIC_R2_ACCOUNT_ID',
      'R2_ENDPOINT',
      'R2_S3_ENDPOINT',
      'S3_ENDPOINT',
      'AWS_ENDPOINT_URL',
      'AWS_ENDPOINT_URL_S3',
    ]);

  const rawAccessKeyId =
    mem.accessKeyId ||
    getEnvString([
      'R2_ACCESS_KEY_ID',
      'CLOUDFLARE_R2_ACCESS_KEY_ID',
      'R2_ACCESS_KEY',
      'S3_ACCESS_KEY_ID',
      'S3_ACCESS_KEY',
      'AWS_ACCESS_KEY_ID',
      'NEXT_PUBLIC_R2_ACCESS_KEY_ID',
    ]);

  const rawSecretAccessKey =
    mem.secretAccessKey ||
    getEnvString([
      'R2_SECRET_ACCESS_KEY',
      'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
      'R2_SECRET_KEY',
      'S3_SECRET_ACCESS_KEY',
      'S3_SECRET_KEY',
      'AWS_SECRET_ACCESS_KEY',
      'NEXT_PUBLIC_R2_SECRET_ACCESS_KEY',
    ]);

  const rawBucketName =
    mem.bucketName ||
    getEnvString([
      'R2_BUCKET_NAME',
      'R2_BUCKET',
      'CLOUDFLARE_R2_BUCKET_NAME',
      'CLOUDFLARE_R2_BUCKET',
      'S3_BUCKET_NAME',
      'S3_BUCKET',
      'AWS_BUCKET_NAME',
      'AWS_S3_BUCKET',
      'NEXT_PUBLIC_R2_BUCKET_NAME',
      'NEXT_PUBLIC_R2_BUCKET',
    ]);

  const rawPublicCdnUrl =
    mem.publicCdnUrl ||
    getEnvString([
      'R2_PUBLIC_CDN_URL',
      'R2_PUBLIC_URL',
      'R2_PUBLIC_DOMAIN',
      'R2_DOMAIN',
      'R2_CDN_URL',
      'R2_CUSTOM_DOMAIN',
      'CLOUDFLARE_R2_PUBLIC_URL',
      'CLOUDFLARE_R2_PUBLIC_DOMAIN',
      'NEXT_PUBLIC_R2_PUBLIC_URL',
      'NEXT_PUBLIC_R2_DOMAIN',
      'NEXT_PUBLIC_R2_CDN_URL',
    ]);

  const { accountId, endpointUrl, inferredBucket } =
    parseAccountAndBucketFromInput(rawAccountId, rawBucketName);

  let finalBucket = inferredBucket;
  let finalAccount = accountId;
  let finalEndpoint = endpointUrl;
  if (rawPublicCdnUrl) {
    const parsedFromCdn = parseAccountAndBucketFromInput(rawPublicCdnUrl, '');
    if (!finalBucket && parsedFromCdn.inferredBucket) {
      finalBucket = parsedFromCdn.inferredBucket;
    }
    if (
      !finalAccount &&
      parsedFromCdn.accountId &&
      /\.r2\.cloudflarestorage\.com/i.test(rawPublicCdnUrl)
    ) {
      finalAccount = parsedFromCdn.accountId;
      finalEndpoint = parsedFromCdn.endpointUrl;
    }
  }

  return {
    accountId: finalAccount,
    accessKeyId: rawAccessKeyId.trim(),
    secretAccessKey: rawSecretAccessKey.trim(),
    bucketName: finalBucket || 'bimondo',
    publicCdnUrl: normalizePublicCdnUrl(rawPublicCdnUrl),
    endpointUrl: finalEndpoint,
  };
}

export function writeR2ServerConfig(
  patch: Partial<R2ServerConfig>
): PublicR2ConfigStatus {
  const current = readR2ServerConfig();

  const nextAccountRaw =
    patch.accountId !== undefined && patch.accountId.trim() !== ''
      ? patch.accountId
      : current.accountId;
  const nextBucketRaw =
    patch.bucketName !== undefined && patch.bucketName.trim() !== ''
      ? patch.bucketName
      : current.bucketName;

  let candidateAccountRaw = nextAccountRaw;
  let candidateBucketRaw = nextBucketRaw;
  if (
    patch.publicCdnUrl &&
    /\.r2\.cloudflarestorage\.com/i.test(patch.publicCdnUrl)
  ) {
    const fromCdn = parseAccountAndBucketFromInput(
      patch.publicCdnUrl,
      candidateBucketRaw
    );
    if (!candidateAccountRaw && fromCdn.accountId) {
      candidateAccountRaw = patch.publicCdnUrl;
    }
    if (fromCdn.inferredBucket) {
      candidateBucketRaw = fromCdn.inferredBucket;
    }
  }

  const { accountId, endpointUrl, inferredBucket } =
    parseAccountAndBucketFromInput(candidateAccountRaw, candidateBucketRaw);

  const next: R2ServerConfig = {
    accountId,
    bucketName: inferredBucket || 'bimondo',
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
  return getPublicR2ConfigStatus();
}

function hasS3CredentialsConfigured(cfg: R2ServerConfig): boolean {
  return Boolean(cfg.accountId && cfg.accessKeyId && cfg.secretAccessKey);
}

export function getPublicR2ConfigStatus(): PublicR2ConfigStatus {
  const cfg = readR2ServerConfig();
  const nativeBinding = getNativeR2BucketBinding();
  const hasCredentials =
    hasS3CredentialsConfigured(cfg) || Boolean(nativeBinding);
  const s3Connected =
    Boolean(cfg.accountId && cfg.bucketName && hasCredentials) ||
    Boolean(nativeBinding);
  const hasPublicDomain = Boolean(cfg.publicCdnUrl);

  return {
    configured: s3Connected,
    s3Connected,
    storageMode: s3Connected ? 'cloudflare-s3' : 'unconfigured',
    accountId: cfg.accountId,
    bucketName: cfg.bucketName || 'bimondo',
    publicCdnUrl: cfg.publicCdnUrl,
    hasCredentials,
    hasPublicDomain,
    endpointUrl:
      cfg.endpointUrl ||
      (cfg.accountId
        ? `https://${cfg.accountId}.r2.cloudflarestorage.com`
        : ''),
  };
}

export async function testR2Connection(): Promise<{
  ok: boolean;
  mode: 'cloudflare-s3' | 'unconfigured';
  message: string;
  objectCount: number;
  status: PublicR2ConfigStatus;
}> {
  await ensureR2ConfigHydratedFromFirestore();
  const status = getPublicR2ConfigStatus();
  const cfg = readR2ServerConfig();
  const nativeBinding = getNativeR2BucketBinding();

  if (nativeBinding) {
    try {
      const listed = await nativeBinding.list({ limit: 100 });
      const count = (listed.objects || []).length;
      return {
        ok: true,
        mode: 'cloudflare-s3',
        message: `Connected to native Cloudflare R2 Bucket binding (${count} objects).`,
        objectCount: count,
        status,
      };
    } catch (err) {
      return {
        ok: false,
        mode: 'cloudflare-s3',
        message:
          err instanceof Error
            ? err.message
            : 'Native Cloudflare R2 binding test failed.',
        objectCount: 0,
        status,
      };
    }
  }

  if (!hasS3CredentialsConfigured(cfg)) {
    return {
      ok: false,
      mode: 'unconfigured',
      message:
        'Enter your Public R2 Domain, Cloudflare Account ID, Bucket Name, Access Key ID, and Secret Access Key.',
      objectCount: 0,
      status,
    };
  }

  try {
    const res = await r2S3SignedFetch({
      config: cfg,
      method: 'GET',
      query: { 'list-type': '2', 'max-keys': '100' },
    });

    if (res.ok) {
      const xml = await res.text();
      const items = parseS3ListXml(xml);
      const domainNote = cfg.publicCdnUrl
        ? `Public R2 Domain: ${cfg.publicCdnUrl}`
        : 'Connected via R2 S3 signed URLs';
      return {
        ok: true,
        mode: 'cloudflare-s3',
        message: `Connected to Cloudflare R2 bucket "${cfg.bucketName}" (${items.length} objects). ${domainNote}.`,
        objectCount: items.length,
        status,
      };
    }

    const errText = await res.text();
    const codeMatch = errText.match(/<Code>([\s\S]*?)<\/Code>/);
    const msgMatch = errText.match(/<Message>([\s\S]*?)<\/Message>/);
    const detail =
      msgMatch?.[1] || codeMatch?.[1] || `HTTP ${res.status} ${res.statusText}`;

    return {
      ok: false,
      mode: 'cloudflare-s3',
      message: `Cloudflare R2 S3 Error (${detail}). Verify Account ID ("${cfg.accountId}"), Bucket Name ("${cfg.bucketName}"), Access Key ID, and Secret Access Key.`,
      objectCount: 0,
      status,
    };
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : 'Could not reach Cloudflare R2 S3 endpoint.';
    return {
      ok: false,
      mode: 'cloudflare-s3',
      message: `Cloudflare R2 S3 Connection Error: ${msg}`,
      objectCount: 0,
      status,
    };
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
    const stripped = trimmed.replace(/^\/+/, '');
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
    if (
      parsed.hostname.endsWith('.r2.dev') ||
      parsed.hostname.includes('bimondotours.com')
    ) {
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

  return null;
}

export async function uploadFileToR2Bucket(params: {
  buffer: Buffer;
  fileName: string;
  contentType: string;
  folder?: R2FolderName;
  customKey?: string;
  replaceExistingKey?: string;
}): Promise<{
  id: string;
  objectKey: string;
  cdnUrl: string;
  folder: R2FolderName;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  storageMode: 'cloudflare-s3';
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
  const nativeBinding = getNativeR2BucketBinding();
  const hasS3 = hasS3CredentialsConfigured(config);
  let uploadedToR2 = false;

  if (nativeBinding) {
    await nativeBinding.put(objectKey, params.buffer, {
      httpMetadata: {
        contentType: params.contentType || 'image/jpeg',
        cacheControl: 'public, max-age=31536000, immutable',
      },
    });
    uploadedToR2 = true;
  }

  if (!uploadedToR2 && hasS3) {
    const putRes = await r2S3SignedFetch({
      config,
      method: 'PUT',
      objectKey,
      body: params.buffer,
      contentType: params.contentType || 'image/jpeg',
      extraHeaders: {
        'cache-control': 'public, max-age=31536000, immutable',
      },
    });

    if (!putRes.ok) {
      const errXml = await putRes.text().catch(() => '');
      const codeMatch = errXml.match(/<Code>([\s\S]*?)<\/Code>/);
      const msgMatch = errXml.match(/<Message>([\s\S]*?)<\/Message>/);
      const detail =
        msgMatch?.[1] ||
        codeMatch?.[1] ||
        `HTTP ${putRes.status} ${putRes.statusText}`;
      throw new Error(
        `Cloudflare R2 upload failed for bucket "${config.bucketName}": ${detail}. Check your Account ID, Bucket Name, Access Key ID, and Secret Access Key.`
      );
    }
    uploadedToR2 = true;
  }

  if (!uploadedToR2) {
    throw new Error(
      'Cloudflare R2 is not connected yet. Enter your Public R2 Domain, Cloudflare Account ID, Bucket Name, Access Key ID, and Secret Access Key first.'
    );
  }

  if (params.replaceExistingKey) {
    const oldKey = extractR2KeyFromCdnUrl(params.replaceExistingKey);
    if (oldKey && oldKey !== objectKey) {
      await deleteFileFromR2Bucket(oldKey).catch(() => {});
    }
  }

  const cdnUrl = config.publicCdnUrl
    ? `${config.publicCdnUrl}/${objectKey}`
    : createPresignedR2ReadUrl(objectKey, config);

  if (!cdnUrl) {
    throw new Error(
      'Uploaded to R2 bucket, but Public R2 Domain is missing. Please set your Public R2 Domain.'
    );
  }

  return {
    id: toFirestoreMediaDocId(objectKey),
    objectKey,
    cdnUrl,
    folder,
    fileName: safeName,
    contentType: params.contentType || 'image/jpeg',
    sizeBytes: params.buffer.byteLength,
    storageMode: 'cloudflare-s3',
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

  const nativeBinding = getNativeR2BucketBinding();
  if (nativeBinding) {
    await nativeBinding.delete(resolvedKey).catch(() => {});
  }

  const cfg = readR2ServerConfig();
  if (hasS3CredentialsConfigured(cfg)) {
    await r2S3SignedFetch({
      config: cfg,
      method: 'DELETE',
      objectKey: resolvedKey,
    }).catch(() => {});
  }

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
  const hasS3 = hasS3CredentialsConfigured(config);
  const nativeBinding = getNativeR2BucketBinding();

  if (oldKey !== cleanNewKey) {
    if (nativeBinding) {
      const obj = await nativeBinding.get(oldKey);
      if (obj) {
        const ab = await obj.arrayBuffer();
        await nativeBinding.put(cleanNewKey, ab, {
          httpMetadata: obj.httpMetadata,
        });
        await nativeBinding.delete(oldKey);
      }
    } else if (hasS3) {
      const copySource = `/${encodeRfc3986(config.bucketName)}/${oldKey
        .split('/')
        .map(encodeRfc3986)
        .join('/')}`;
      const copyRes = await r2S3SignedFetch({
        config,
        method: 'PUT',
        objectKey: cleanNewKey,
        extraHeaders: {
          'x-amz-copy-source': copySource,
        },
      });
      if (copyRes.ok) {
        await r2S3SignedFetch({
          config,
          method: 'DELETE',
          objectKey: oldKey,
        });
      }
    }
  }

  const cdnUrl = buildServedCdnUrl(cleanNewKey, config);

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
  await ensureR2ConfigHydratedFromFirestore();
  const merged = new Map<string, R2BucketObjectItem>();
  const config = readR2ServerConfig();

  const nativeBinding = getNativeR2BucketBinding();
  if (nativeBinding) {
    try {
      const listed = await nativeBinding.list({
        prefix: prefix || undefined,
        limit: 300,
      });
      for (const obj of listed.objects || []) {
        if (!obj.key) continue;
        const objectKey = obj.key;
        const folder = inferFolderFromKey(objectKey);
        const fileName = objectKey.split('/').pop() || objectKey;
        const cdnUrl = buildServedCdnUrl(objectKey, config);
        if (!cdnUrl) continue;
        merged.set(objectKey, {
          id: toFirestoreMediaDocId(objectKey),
          objectKey,
          cdnUrl,
          folder,
          fileName,
          sizeBytes: obj.size ?? 0,
          lastModified: obj.uploaded
            ? obj.uploaded.toISOString()
            : new Date().toISOString(),
          source: 's3',
        });
      }
    } catch {
      // Ignore native binding list error
    }
  }

  if (hasS3CredentialsConfigured(config)) {
    try {
      const query: Record<string, string> = {
        'list-type': '2',
        'max-keys': '300',
      };
      if (prefix) {
        query.prefix = prefix;
      }
      const res = await r2S3SignedFetch({
        config,
        method: 'GET',
        query,
      });
      if (res.ok) {
        const xml = await res.text();
        const contents = parseS3ListXml(xml);
        for (const item of contents) {
          if (!item.Key) continue;
          const objectKey = item.Key;
          const folder = inferFolderFromKey(objectKey);
          const parts = objectKey.split('/');
          const fileName = parts[parts.length - 1] || objectKey;
          const cdnUrl = buildServedCdnUrl(objectKey, config);
          if (!cdnUrl) continue;
          merged.set(objectKey, {
            id: toFirestoreMediaDocId(objectKey),
            objectKey,
            cdnUrl,
            folder,
            fileName,
            sizeBytes: item.Size,
            lastModified: item.LastModified,
            source: 's3',
          });
        }
      }
    } catch (err) {
      console.warn('Cloudflare R2 S3 ListObjectsV2 error:', err);
    }
  }

  return Array.from(merged.values()).sort((a, b) =>
    b.lastModified.localeCompare(a.lastModified)
  );
}
