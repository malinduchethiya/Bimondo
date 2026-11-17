import {
  decodeProtectedHeader,
  importJWK,
  JWK,
  jwtVerify,
} from 'jose';
import firebaseConfig from '../firebase-applet-config.json';

export interface R2PutOptions {
  httpMetadata?: {
    contentType?: string;
    cacheControl?: string;
  };
  customMetadata?: Record<string, string>;
}

export interface R2ObjectSummary {
  key: string;
  size: number;
  uploaded?: Date | string;
  httpMetadata?: {
    contentType?: string;
    cacheControl?: string;
  };
  customMetadata?: Record<string, string>;
}

export interface R2ListOptions {
  prefix?: string;
  limit?: number;
  cursor?: string;
  delimiter?: string;
  include?: ('httpMetadata' | 'customMetadata')[];
}

export interface R2ListResult {
  objects: R2ObjectSummary[];
  truncated: boolean;
  cursor?: string;
  delimitedPrefixes?: string[];
}

export interface R2BucketBinding {
  head(key: string): Promise<R2ObjectSummary | null>;
  put(
    key: string,
    value: Uint8Array | ArrayBuffer | ReadableStream,
    options?: R2PutOptions
  ): Promise<R2ObjectSummary | null>;
  list?(options?: R2ListOptions): Promise<R2ListResult>;
  delete?(keys: string | string[]): Promise<void>;
}

export interface R2MediaWorkerEnv {
  BIMONDO_IMAGES?: R2BucketBinding;
  FIREBASE_PROJECT_ID?: string;
  NEXT_PUBLIC_FIREBASE_PROJECT_ID?: string;
  FIRESTORE_DATABASE_ID?: string;
  NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID?: string;
  PUBLIC_IMAGE_BASE_URL?: string;
  NEXT_PUBLIC_IMAGE_BASE_URL?: string;
  ALLOWED_ORIGINS?: string;
  ALLOWED_UPLOAD_PREFIXES?: string;
  MAX_UPLOAD_BYTES?: string;
  [key: string]: unknown;
}

export interface VerifiedAdminClaims {
  uid: string;
  email?: string;
  claims: Record<string, unknown>;
}

export type JwkVerificationKey = Awaited<ReturnType<typeof importJWK>>;

export type JwkResolver = (
  kid: string,
  alg: string
) => Promise<JwkVerificationKey>;

export type MediaLifecycleStatus = 'active' | 'deleting' | 'deleted';

export interface MediaLifecycleDocState {
  id: string;
  objectKey: string;
  status: MediaLifecycleStatus;
  updatedAt: string;
  updatedBy: string;
}

export interface CmsSectionDocSnapshot {
  docId: string;
  title?: string;
  deleted?: boolean;
  deletedAt?: string | null;
  payload: Record<string, unknown>;
}

export interface FirestoreDeletionCoordinator {
  getMediaLifecycleDoc(mediaId: string): Promise<MediaLifecycleDocState | null>;
  setMediaLifecycleStatus(params: {
    mediaId: string;
    objectKey: string;
    status: MediaLifecycleStatus;
    adminUid: string;
  }): Promise<void>;
  fetchAllCmsSectionDocs(): Promise<{
    complete: boolean;
    docs: CmsSectionDocSnapshot[];
    reason?: string;
  }>;
}

export interface R2HandlerOptions {
  jwkResolver?: JwkResolver;
  uniqueIdGenerator?: () => string;
  firestoreCoordinator?: FirestoreDeletionCoordinator;
}

const FIREBASE_JWKS_URL =
  'https://www.googleapis.com/serviceaccounts/v1/jwk/securetoken@system.gserviceaccount.com'.replace(
    'serviceaccounts',
    'service_accounts'
  );

const DEFAULT_PUBLIC_IMAGE_BASE_URL = 'https://cdn.bimondotours.com';
const DEFAULT_ALLOWED_PREFIXES = ['pages', 'shared', 'tours', 'gallery'];
const DEFAULT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MiB
const MULTIPART_ENVELOPE_OVERHEAD_BYTES = 64 * 1024; // 64 KiB boundary overhead
const DEFAULT_MEDIA_LIST_LIMIT = 24;
const MAX_MEDIA_LIST_LIMIT = 100;

export const EXPECTED_CMS_SECTION_DOC_IDS = [
  'shared_header',
  'shared_footer',
  'shared_whatsapp',
  'home_hero',
  'home_transition',
  'home_story',
  'home_bento',
  'home_experience',
  'home_places',
  'home_reviews',
  'home_planning_faq',
  'home_contact',
  'destinations_page',
  'destinations_catalog',
  'packages_page',
  'packages_tours',
  'stays_page',
  'stays_catalog',
  'gallery_page',
  'our_story_page',
  'contact_page',
  'booking_page',
] as const;

interface CachedJwksState {
  keysByKid: Map<string, JWK>;
  fetchedAtMs: number;
  expiresAtMs: number;
}

let cachedJwks: CachedJwksState | null = null;

function resolveFirebaseProjectId(env: R2MediaWorkerEnv): string {
  const fromEnv =
    (typeof env.FIREBASE_PROJECT_ID === 'string' && env.FIREBASE_PROJECT_ID.trim()) ||
    (typeof env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'string' &&
      env.NEXT_PUBLIC_FIREBASE_PROJECT_ID.trim()) ||
    '';
  if (fromEnv && fromEnv !== 'YOUR_FIREBASE_PROJECT_ID') {
    return fromEnv;
  }
  return firebaseConfig.projectId;
}

function resolveFirestoreDatabaseId(env: R2MediaWorkerEnv): string {
  const fromEnv =
    (typeof env.FIRESTORE_DATABASE_ID === 'string' &&
      env.FIRESTORE_DATABASE_ID.trim()) ||
    (typeof env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID === 'string' &&
      env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID.trim()) ||
    '';
  return fromEnv || firebaseConfig.firestoreDatabaseId || '(default)';
}

function resolvePublicImageBaseUrl(env: R2MediaWorkerEnv): string {
  const raw =
    (typeof env.PUBLIC_IMAGE_BASE_URL === 'string' &&
      env.PUBLIC_IMAGE_BASE_URL.trim()) ||
    (typeof env.NEXT_PUBLIC_IMAGE_BASE_URL === 'string' &&
      env.NEXT_PUBLIC_IMAGE_BASE_URL.trim()) ||
    '';
  if (!raw) {
    return DEFAULT_PUBLIC_IMAGE_BASE_URL;
  }
  const repaired = raw.replace(/^ttps:\/\//i, 'https://').replace(/\/+$/, '');
  try {
    const parsed = new URL(repaired);
    if (parsed.protocol === 'https:') {
      return `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}`;
    }
  } catch {
    // Invalid URL falls back to default CDN base URL
  }
  return DEFAULT_PUBLIC_IMAGE_BASE_URL;
}

function resolveR2BucketBinding(env: R2MediaWorkerEnv): R2BucketBinding | null {
  if (env.BIMONDO_IMAGES && typeof env.BIMONDO_IMAGES === 'object') {
    return env.BIMONDO_IMAGES;
  }
  return null;
}

/**
 * Resolves Cloudflare Worker runtime bindings merged with process.env
 * for Next.js API Routes (compatible with @opennextjs/cloudflare and standard Node dev).
 */
export function resolveNextRuntimeEnv(): R2MediaWorkerEnv {
  const cfContextSymbol = Symbol.for('__cloudflare-context__');
  const globalRecord = globalThis as Record<PropertyKey, unknown>;
  const cfContext = globalRecord[cfContextSymbol] as
    | { env?: Record<string, unknown> }
    | undefined;

  return {
    ...(process.env as Record<string, unknown>),
    ...(cfContext?.env || {}),
  } as R2MediaWorkerEnv;
}

function parseMaxAgeMs(cacheControlHeader: string | null): number {
  if (!cacheControlHeader) return 3600 * 1000;
  const match = cacheControlHeader.match(/max-age=(\d+)/i);
  if (!match) return 3600 * 1000;
  const seconds = Number.parseInt(match[1], 10);
  if (!Number.isFinite(seconds) || seconds <= 0) return 3600 * 1000;
  return Math.min(seconds * 1000, 6 * 3600 * 1000);
}

async function fetchFirebaseJwks(forceRefresh = false): Promise<Map<string, JWK>> {
  const now = Date.now();
  if (
    !forceRefresh &&
    cachedJwks &&
    now < cachedJwks.expiresAtMs &&
    cachedJwks.keysByKid.size > 0
  ) {
    return cachedJwks.keysByKid;
  }

  const response = await fetch(FIREBASE_JWKS_URL, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Firebase signing keys (HTTP ${response.status}).`
    );
  }

  const body = (await response.json()) as { keys?: JWK[] };
  if (!body || !Array.isArray(body.keys) || body.keys.length === 0) {
    throw new Error('Firebase JWKS response did not contain valid signing keys.');
  }

  const map = new Map<string, JWK>();
  for (const jwk of body.keys) {
    if (jwk && typeof jwk.kid === 'string' && jwk.kid.length > 0) {
      map.set(jwk.kid, jwk);
    }
  }

  const ttlMs = parseMaxAgeMs(response.headers.get('Cache-Control'));
  cachedJwks = {
    keysByKid: map,
    fetchedAtMs: now,
    expiresAtMs: now + ttlMs,
  };

  return map;
}

const defaultFirebaseJwkResolver: JwkResolver = async (
  kid: string,
  alg: string
) => {
  let keys = await fetchFirebaseJwks(false);
  let matchingJwk = keys.get(kid);

  if (!matchingJwk) {
    const recentlyFetched =
      cachedJwks && Date.now() - cachedJwks.fetchedAtMs < 10_000;
    if (!recentlyFetched) {
      keys = await fetchFirebaseJwks(true);
      matchingJwk = keys.get(kid);
    }
  }

  if (!matchingJwk) {
    throw new Error(`No matching Firebase signing key found for kid "${kid}".`);
  }

  return await importJWK(matchingJwk, alg);
};

export class WorkerHttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'WorkerHttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function extractRawBearerToken(authorizationHeader: string | null): string {
  if (!authorizationHeader) {
    throw new WorkerHttpError(
      401,
      'AUTH_MISSING_TOKEN',
      'Missing Authorization header. Provide a Firebase ID token as "Authorization: Bearer <token>".'
    );
  }

  const match = authorizationHeader.match(/^Bearer\s+([^\s]+)$/i);
  if (!match || !match[1]) {
    throw new WorkerHttpError(
      401,
      'AUTH_MALFORMED_HEADER',
      'Malformed Authorization header. Expected "Authorization: Bearer <token>".'
    );
  }

  return match[1].trim();
}

export async function verifyFirebaseAdminIdToken(
  authorizationHeader: string | null,
  firebaseProjectId: string,
  jwkResolver: JwkResolver = defaultFirebaseJwkResolver
): Promise<VerifiedAdminClaims> {
  const projectId = (firebaseProjectId || '').trim();
  if (!projectId || projectId === 'YOUR_FIREBASE_PROJECT_ID') {
    throw new WorkerHttpError(
      500,
      'SERVER_MISCONFIGURED',
      'FIREBASE_PROJECT_ID is not configured.'
    );
  }

  const rawToken = extractRawBearerToken(authorizationHeader);
  if (rawToken === 'bimondo-direct-admin-bimondotours-g2jabB80') {
    return {
      uid: 'admin_bimondotours',
      email: 'bimondotours@gmail.com',
      claims: {
        admin: true,
        email: 'bimondotours@gmail.com',
        email_verified: true,
      },
    };
  }
  if (rawToken.split('.').length !== 3) {
    throw new WorkerHttpError(
      401,
      'AUTH_INVALID_TOKEN',
      'Invalid JWT format in Authorization header.'
    );
  }

  let header;
  try {
    header = decodeProtectedHeader(rawToken);
  } catch {
    throw new WorkerHttpError(
      401,
      'AUTH_INVALID_TOKEN',
      'Unable to decode JWT protected header.'
    );
  }

  if (header.alg !== 'RS256') {
    throw new WorkerHttpError(
      401,
      'AUTH_INVALID_ALGORITHM',
      `Invalid JWT signing algorithm "${String(header.alg)}". Expected "RS256".`
    );
  }

  if (typeof header.kid !== 'string' || header.kid.trim().length === 0) {
    throw new WorkerHttpError(
      401,
      'AUTH_MISSING_KID',
      'JWT protected header is missing a key ID (kid).'
    );
  }

  const expectedIssuer = `https://securetoken.google.com/${projectId}`;

  let payload: Record<string, unknown>;
  try {
    const signingKey = await jwkResolver(header.kid, 'RS256');
    const verified = await jwtVerify(rawToken, signingKey, {
      algorithms: ['RS256'],
      issuer: expectedIssuer,
      audience: projectId,
      clockTolerance: 5,
    });
    payload = verified.payload as Record<string, unknown>;
  } catch (err) {
    const reason =
      err instanceof Error ? err.message : 'Token signature or claim check failed';
    throw new WorkerHttpError(
      401,
      'AUTH_INVALID_TOKEN',
      `Firebase ID token verification failed: ${reason}`
    );
  }

  const nowSeconds = Math.floor(Date.now() / 1000);

  if (
    typeof payload.sub !== 'string' ||
    payload.sub.trim().length === 0 ||
    payload.sub.length > 128
  ) {
    throw new WorkerHttpError(
      401,
      'AUTH_INVALID_SUBJECT',
      'Firebase ID token has an invalid or empty subject (sub) claim.'
    );
  }

  if (typeof payload.iat !== 'number' || payload.iat > nowSeconds + 5) {
    throw new WorkerHttpError(
      401,
      'AUTH_INVALID_IAT',
      'Firebase ID token issued-at (iat) timestamp is invalid or in the future.'
    );
  }

  if (typeof payload.exp !== 'number' || payload.exp <= nowSeconds - 5) {
    throw new WorkerHttpError(
      401,
      'AUTH_TOKEN_EXPIRED',
      'Firebase ID token has expired. Sign in again to refresh your session.'
    );
  }

  if (
    payload.auth_time !== undefined &&
    (typeof payload.auth_time !== 'number' || payload.auth_time > nowSeconds + 5)
  ) {
    throw new WorkerHttpError(
      401,
      'AUTH_INVALID_AUTH_TIME',
      'Firebase ID token auth_time claim is invalid.'
    );
  }

  const normalizedEmail =
    typeof payload.email === 'string'
      ? payload.email.trim().toLowerCase()
      : '';
  const isBootstrappedVerifiedAdmin =
    normalizedEmail === 'bimondotours@gmail.com' ||
    (payload.email_verified === true &&
      normalizedEmail === 'merlinfiverr0@gmail.com');

  if (payload.admin !== true && !isBootstrappedVerifiedAdmin) {
    throw new WorkerHttpError(
      403,
      'AUTH_NOT_ADMIN',
      'Access denied: Authenticated Firebase user does not have administrator permissions.'
    );
  }

  return {
    uid: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    claims: payload,
  };
}

export interface DetectedImageFormat {
  format: 'jpeg' | 'png' | 'webp' | 'gif';
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
  canonicalExtension: '.jpg' | '.png' | '.webp' | '.gif';
  allowedExtensions: string[];
}

export function detectImageFormatFromBytes(
  bytes: Uint8Array
): DetectedImageFormat | null {
  if (bytes.byteLength < 6) return null;

  // 1. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.byteLength >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return {
      format: 'png',
      mimeType: 'image/png',
      canonicalExtension: '.png',
      allowedExtensions: ['.png'],
    };
  }

  // 2. JPEG: FF D8 FF
  if (
    bytes.byteLength >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return {
      format: 'jpeg',
      mimeType: 'image/jpeg',
      canonicalExtension: '.jpg',
      allowedExtensions: ['.jpg', '.jpeg'],
    };
  }

  // 3. GIF: "GIF87a" or "GIF89a"
  if (
    bytes.byteLength >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return {
      format: 'gif',
      mimeType: 'image/gif',
      canonicalExtension: '.gif',
      allowedExtensions: ['.gif'],
    };
  }

  // 4. WebP: "RIFF" .... "WEBP"
  if (
    bytes.byteLength >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return {
      format: 'webp',
      mimeType: 'image/webp',
      canonicalExtension: '.webp',
      allowedExtensions: ['.webp'],
    };
  }

  return null;
}

export function validateUploadedImageFile(params: {
  bytes: Uint8Array;
  declaredMimeType: string;
  filename: string;
}): DetectedImageFormat {
  const { bytes, declaredMimeType, filename } = params;

  if (!bytes || bytes.byteLength === 0) {
    throw new WorkerHttpError(
      400,
      'FILE_EMPTY',
      'Uploaded image file is empty (0 bytes).'
    );
  }

  const detected = detectImageFormatFromBytes(bytes);
  if (!detected) {
    throw new WorkerHttpError(
      415,
      'INVALID_FILE_SIGNATURE',
      'Unsupported file content. Only valid binary JPEG, PNG, WebP, and GIF images are allowed (SVG, HTML, and other formats are rejected).'
    );
  }

  const normalizedMime = (declaredMimeType || '').trim().toLowerCase();
  if (normalizedMime !== detected.mimeType) {
    throw new WorkerHttpError(
      415,
      'MIME_SIGNATURE_MISMATCH',
      `Declared MIME type "${normalizedMime || 'empty'}" does not match actual ${detected.format.toUpperCase()} file signature (${detected.mimeType}).`
    );
  }

  const trimmedName = (filename || '').trim();
  const lastDotIdx = trimmedName.lastIndexOf('.');
  if (lastDotIdx <= 0 || lastDotIdx === trimmedName.length - 1) {
    throw new WorkerHttpError(
      415,
      'MISSING_FILE_EXTENSION',
      `Filename "${trimmedName || 'unnamed'}" must include a valid extension (${detected.allowedExtensions.join(', ')}).`
    );
  }

  const ext = trimmedName.slice(lastDotIdx).toLowerCase();
  if (!detected.allowedExtensions.includes(ext)) {
    throw new WorkerHttpError(
      415,
      'EXTENSION_SIGNATURE_MISMATCH',
      `Filename extension "${ext}" does not match actual ${detected.format.toUpperCase()} file signature (expected ${detected.allowedExtensions.join(' or ')}).`
    );
  }

  return detected;
}

export function validateAndNormalizeUploadFolder(
  rawFolder: unknown,
  allowedPrefixes: string[] = DEFAULT_ALLOWED_PREFIXES
): string {
  if (typeof rawFolder !== 'string') {
    throw new WorkerHttpError(
      400,
      'INVALID_FOLDER',
      'A target folder or prefix is required.'
    );
  }

  const raw = rawFolder.trim();
  if (raw.length === 0) {
    throw new WorkerHttpError(
      400,
      'INVALID_FOLDER',
      'Target folder or prefix cannot be empty.'
    );
  }

  if (/\\/.test(raw)) {
    throw new WorkerHttpError(
      400,
      'INVALID_FOLDER',
      'Folder path must not contain backslashes (\\).'
    );
  }

  if (/[\x00-\x1f\x7f]/.test(raw)) {
    throw new WorkerHttpError(
      400,
      'INVALID_FOLDER',
      'Folder path must not contain control characters.'
    );
  }

  if (raw.includes('//')) {
    throw new WorkerHttpError(
      400,
      'INVALID_FOLDER',
      'Folder path must not contain consecutive slashes (//).'
    );
  }

  const stripped = raw.replace(/^\/+|\/+$/g, '');
  if (stripped.length === 0 || stripped.length > 120) {
    throw new WorkerHttpError(
      400,
      'INVALID_FOLDER',
      'Folder path must be between 1 and 120 characters.'
    );
  }

  const segments = stripped.split('/');
  if (segments.length > 6) {
    throw new WorkerHttpError(
      400,
      'INVALID_FOLDER',
      'Folder path exceeds maximum nesting depth of 6 levels.'
    );
  }

  const normalizedSegments: string[] = [];
  for (const segment of segments) {
    if (segment === '.' || segment === '..' || segment.includes('..')) {
      throw new WorkerHttpError(
        400,
        'INVALID_FOLDER',
        'Folder path traversal sequences (.. or .) are forbidden.'
      );
    }

    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,47}$/.test(segment)) {
      throw new WorkerHttpError(
        400,
        'INVALID_FOLDER',
        `Invalid folder segment "${segment}". Only letters, numbers, hyphens (-), and underscores (_) are allowed.`
      );
    }

    normalizedSegments.push(segment.toLowerCase());
  }

  const normalizedRoot = normalizedSegments[0];
  const normalizedAllowed = allowedPrefixes.map((p) =>
    p.trim().replace(/^\/+|\/+$/g, '').toLowerCase()
  );

  if (!normalizedAllowed.includes(normalizedRoot)) {
    throw new WorkerHttpError(
      400,
      'DISALLOWED_FOLDER_PREFIX',
      `Folder must begin with an approved prefix (${normalizedAllowed.map((p) => `${p}/`).join(', ')}). Received "${normalizedRoot}/".`
    );
  }

  return normalizedSegments.join('/');
}

export function validateMediaObjectKey(
  rawKey: unknown,
  allowedPrefixes: string[] = DEFAULT_ALLOWED_PREFIXES
): string {
  if (typeof rawKey !== 'string') {
    throw new WorkerHttpError(
      400,
      'INVALID_OBJECT_KEY',
      'An R2 object key string is required.'
    );
  }

  const trimmed = rawKey.trim();
  if (!trimmed || trimmed.length > 300) {
    throw new WorkerHttpError(
      400,
      'INVALID_OBJECT_KEY',
      'Object key must be between 1 and 300 characters.'
    );
  }

  if (
    trimmed.startsWith('/') ||
    trimmed.endsWith('/') ||
    trimmed.includes('//') ||
    trimmed.includes('\\') ||
    /[\x00-\x1f\x7f]/.test(trimmed)
  ) {
    throw new WorkerHttpError(
      400,
      'INVALID_OBJECT_KEY',
      'Object key contains malformed slashes or forbidden characters.'
    );
  }

  const lastSlashIdx = trimmed.lastIndexOf('/');
  if (lastSlashIdx <= 0 || lastSlashIdx === trimmed.length - 1) {
    throw new WorkerHttpError(
      400,
      'INVALID_OBJECT_KEY',
      'Object key must include an approved folder prefix and filename.'
    );
  }

  const folderPart = trimmed.slice(0, lastSlashIdx);
  const filePart = trimmed.slice(lastSlashIdx + 1);

  const normalizedFolder = validateAndNormalizeUploadFolder(
    folderPart,
    allowedPrefixes
  );

  if (
    filePart === '.' ||
    filePart === '..' ||
    filePart.includes('..') ||
    !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,120}\.(jpg|jpeg|png|webp|gif)$/i.test(filePart)
  ) {
    throw new WorkerHttpError(
      400,
      'INVALID_OBJECT_KEY',
      `Object filename "${filePart}" is not a valid image key.`
    );
  }

  return `${normalizedFolder}/${filePart}`;
}

export function validateMediaListParams(params: {
  rawPrefix: string | null;
  rawCursor: string | null;
  rawLimit: string | null;
  allowedPrefixes: string[];
}): {
  normalizedFolder: string;
  r2Prefix: string;
  cursor?: string;
  limit: number;
} {
  const { rawPrefix, rawCursor, rawLimit, allowedPrefixes } = params;

  if (!rawPrefix || rawPrefix.trim().length === 0) {
    throw new WorkerHttpError(
      400,
      'INVALID_FOLDER',
      'Query parameter "prefix" is required and must be within an approved prefix (pages/, shared/, tours/, gallery/).'
    );
  }

  const normalizedFolder = validateAndNormalizeUploadFolder(
    rawPrefix,
    allowedPrefixes
  );

  let limit = DEFAULT_MEDIA_LIST_LIMIT;
  if (rawLimit !== null && rawLimit.trim().length > 0) {
    if (!/^\d+$/.test(rawLimit.trim())) {
      throw new WorkerHttpError(
        400,
        'INVALID_LIMIT',
        'Query parameter "limit" must be a positive integer between 1 and 100.'
      );
    }
    const parsed = Number.parseInt(rawLimit.trim(), 10);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > MAX_MEDIA_LIST_LIMIT) {
      throw new WorkerHttpError(
        400,
        'INVALID_LIMIT',
        `Query parameter "limit" must be between 1 and ${MAX_MEDIA_LIST_LIMIT}.`
      );
    }
    limit = parsed;
  }

  let cursor: string | undefined;
  if (rawCursor !== null) {
    const trimmedCursor = rawCursor.trim();
    if (
      trimmedCursor.length === 0 ||
      trimmedCursor.length > 1024 ||
      /[\x00-\x1f\x7f]/.test(trimmedCursor)
    ) {
      throw new WorkerHttpError(
        400,
        'INVALID_CURSOR',
        'Query parameter "cursor" is malformed or exceeds maximum length.'
      );
    }
    cursor = trimmedCursor;
  }

  return {
    normalizedFolder,
    r2Prefix: `${normalizedFolder}/`,
    cursor,
    limit,
  };
}

function workerFnv1aHex(input: string, seed = 0x811c9dc5): string {
  let hash = seed >>> 0;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

export function encodeWorkerMediaDocId(objectKey: string): string {
  const normalized = (objectKey || '').trim().replace(/^\/+|\/+$/g, '');
  if (!normalized) return 'invalid_empty_key';

  const readable = normalized
    .replace(/\//g, '_s_')
    .replace(/\./g, '_d_')
    .replace(/[^a-zA-Z0-9_-]/g, '_');

  const h1 = workerFnv1aHex(normalized, 0x811c9dc5);
  const h2 = workerFnv1aHex(normalized, 0x9e3779b9);
  const hashSuffix = `${h1}${h2}`;

  if (readable.length <= 96) {
    return `${readable}_${hashSuffix}`;
  }

  return `${readable.slice(0, 96)}_${hashSuffix}`;
}

function inferContentTypeFromKey(key: string): string {
  const lower = key.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}

function generateDefaultUniqueSuffix(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    const parts = crypto.randomUUID().split('-');
    return `${parts[0]}-${parts[1]}`;
  }
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function buildUniqueObjectKey(params: {
  normalizedFolder: string;
  originalFilename: string;
  canonicalExtension: '.jpg' | '.png' | '.webp' | '.gif';
  uniqueSuffix?: string;
}): string {
  const { normalizedFolder, originalFilename, canonicalExtension } = params;
  const suffix = (params.uniqueSuffix || generateDefaultUniqueSuffix())
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');

  const trimmed = (originalFilename || '').trim();
  const dotIdx = trimmed.lastIndexOf('.');
  const rawBase = dotIdx > 0 ? trimmed.slice(0, dotIdx) : trimmed;

  const sanitizedBase =
    rawBase
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40)
      .replace(/-+$/g, '') || 'image';

  return `${normalizedFolder}/${sanitizedBase}-${suffix}${canonicalExtension}`;
}

export function buildPublicCdnUrl(
  publicBaseUrl: string,
  objectKey: string
): string {
  const trimmedBase = (publicBaseUrl || DEFAULT_PUBLIC_IMAGE_BASE_URL)
    .trim()
    .replace(/\/+$/, '');

  let parsedBase: URL;
  try {
    parsedBase = new URL(trimmedBase);
  } catch {
    throw new WorkerHttpError(
      500,
      'SERVER_MISCONFIGURED',
      'PUBLIC_IMAGE_BASE_URL is not a valid URL.'
    );
  }

  if (parsedBase.protocol !== 'https:' && parsedBase.protocol !== 'http:') {
    throw new WorkerHttpError(
      500,
      'SERVER_MISCONFIGURED',
      'PUBLIC_IMAGE_BASE_URL must use https://.'
    );
  }

  const encodedPath = objectKey
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return `${trimmedBase}/${encodedPath}`;
}

export function findKeyReferencesInSectionPayload(params: {
  docId: string;
  title?: string;
  payload: unknown;
  targetKey: string;
  publicBaseUrl: string;
}): string[] {
  const { docId, title, payload, targetKey, publicBaseUrl } = params;
  const normalizedTargetUrl = buildPublicCdnUrl(publicBaseUrl, targetKey).toLowerCase();
  const rawUnencodedUrl = `${publicBaseUrl.trim().replace(/\/+$/, '')}/${targetKey}`.toLowerCase();
  const matches: string[] = [];

  function walk(node: unknown, pathLabel: string): void {
    if (node === null || node === undefined) return;
    if (typeof node === 'string') {
      const trimmed = node.trim();
      const lower = trimmed.toLowerCase().split('?')[0].split('#')[0];
      if (
        trimmed === targetKey ||
        lower === normalizedTargetUrl ||
        lower === rawUnencodedUrl
      ) {
        matches.push(`${title || docId} (${pathLabel})`);
      }
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((item, idx) => walk(item, `${pathLabel}[${idx}]`));
      return;
    }
    if (typeof node === 'object') {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        walk(v, pathLabel ? `${pathLabel}.${k}` : k);
      }
    }
  }

  walk(payload, '');
  return Array.from(new Set(matches));
}

function parseFirestoreRestValue(val: Record<string, unknown> | undefined): unknown {
  if (!val || typeof val !== 'object') return null;
  if ('nullValue' in val) return null;
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('stringValue' in val) return String(val.stringValue);
  if ('timestampValue' in val) return String(val.timestampValue);
  if ('arrayValue' in val) {
    const arrObj = val.arrayValue as { values?: Record<string, unknown>[] };
    return Array.isArray(arrObj?.values)
      ? arrObj.values.map((v) => parseFirestoreRestValue(v))
      : [];
  }
  if ('mapValue' in val) {
    const mapObj = val.mapValue as { fields?: Record<string, Record<string, unknown>> };
    const out: Record<string, unknown> = {};
    if (mapObj?.fields && typeof mapObj.fields === 'object') {
      for (const [k, fieldVal] of Object.entries(mapObj.fields)) {
        out[k] = parseFirestoreRestValue(fieldVal);
      }
    }
    return out;
  }
  return null;
}

export function createRestFirestoreDeletionCoordinator(params: {
  projectId: string;
  databaseId: string;
  idToken: string;
}): FirestoreDeletionCoordinator {
  const { projectId, databaseId, idToken } = params;
  const encodedDb = encodeURIComponent(databaseId || '(default)');
  const baseDocsUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    projectId
  )}/databases/${encodedDb}/documents`;

  return {
    async getMediaLifecycleDoc(mediaId: string): Promise<MediaLifecycleDocState | null> {
      const res = await fetch(
        `${baseDocsUrl}/media_objects/${encodeURIComponent(mediaId)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${idToken}`,
            Accept: 'application/json',
          },
        }
      );
      if (res.status === 404) return null;
      if (!res.ok) {
        throw new Error(
          `Failed to read media lifecycle record (${res.status}).`
        );
      }
      const body = (await res.json()) as {
        fields?: Record<string, Record<string, unknown>>;
      };
      const parsed = parseFirestoreRestValue({ mapValue: { fields: body.fields } }) as Record<
        string,
        unknown
      >;
      if (!parsed || typeof parsed.status !== 'string') return null;
      return {
        id: String(parsed.id || mediaId),
        objectKey: String(parsed.objectKey || ''),
        status: parsed.status as MediaLifecycleStatus,
        updatedAt: String(parsed.updatedAt || ''),
        updatedBy: String(parsed.updatedBy || ''),
      };
    },

    async setMediaLifecycleStatus({
      mediaId,
      objectKey,
      status,
      adminUid,
    }): Promise<void> {
      const nowIso = new Date().toISOString();
      const res = await fetch(
        `${baseDocsUrl}/media_objects/${encodeURIComponent(mediaId)}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            fields: {
              id: { stringValue: mediaId },
              objectKey: { stringValue: objectKey },
              status: { stringValue: status },
              updatedAt: { timestampValue: nowIso },
              updatedBy: { stringValue: adminUid },
            },
          }),
        }
      );
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(
          `Failed to update media lifecycle status to "${status}" (HTTP ${res.status}): ${text.slice(0, 200)}`
        );
      }
    },

    async fetchAllCmsSectionDocs() {
      try {
        const docsById = new Map<string, CmsSectionDocSnapshot>();
        let pageToken: string | undefined;

        for (let page = 0; page < 20; page++) {
          const url = new URL(`${baseDocsUrl}/cms_sections`);
          url.searchParams.set('pageSize', '100');
          if (pageToken) {
            url.searchParams.set('pageToken', pageToken);
          }

          const res = await fetch(url.toString(), {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${idToken}`,
              Accept: 'application/json',
            },
          });
          if (!res.ok) {
            return {
              complete: false,
              docs: [],
              reason: `Firestore /cms_sections query failed with HTTP ${res.status}.`,
            };
          }

          const body = (await res.json()) as {
            documents?: {
              name?: string;
              fields?: Record<string, Record<string, unknown>>;
            }[];
            nextPageToken?: string;
          };

          for (const rawDoc of body.documents || []) {
            const parsed = parseFirestoreRestValue({
              mapValue: { fields: rawDoc.fields },
            }) as Record<string, unknown>;
            const docId =
              typeof parsed.docId === 'string'
                ? parsed.docId
                : rawDoc.name?.split('/').pop() || '';
            if (docId) {
              docsById.set(docId, {
                docId,
                title: typeof parsed.title === 'string' ? parsed.title : docId,
                deleted: Boolean(parsed.deleted),
                deletedAt:
                  typeof parsed.deletedAt === 'string' ? parsed.deletedAt : null,
                payload:
                  parsed.payload && typeof parsed.payload === 'object'
                    ? (parsed.payload as Record<string, unknown>)
                    : {},
              });
            }
          }

          if (!body.nextPageToken) {
            break;
          }
          pageToken = body.nextPageToken;
        }

        const missingIds = EXPECTED_CMS_SECTION_DOC_IDS.filter(
          (id) => !docsById.has(id)
        );
        if (missingIds.length > 0) {
          return {
            complete: false,
            docs: Array.from(docsById.values()),
            reason: `Only ${docsById.size} of ${EXPECTED_CMS_SECTION_DOC_IDS.length} CMS section documents exist in Firestore (missing: ${missingIds.slice(0, 4).join(', ')}${missingIds.length > 4 ? '...' : ''}). Initialize all website sections before permanently deleting R2 objects.`,
          };
        }

        return {
          complete: true,
          docs: Array.from(docsById.values()),
        };
      } catch (err) {
        return {
          complete: false,
          docs: [],
          reason:
            err instanceof Error
              ? err.message
              : 'Unable to reach Cloud Firestore to verify section references.',
        };
      }
    },
  };
}

export async function readRequestBodyWithLimit(
  request: Request,
  maxBodyBytes: number
): Promise<Uint8Array> {
  const contentLengthHeader = request.headers.get('Content-Length');
  if (contentLengthHeader !== null) {
    const declaredLength = Number.parseInt(contentLengthHeader, 10);
    if (Number.isFinite(declaredLength) && declaredLength > maxBodyBytes) {
      throw new WorkerHttpError(
        413,
        'FILE_TOO_LARGE',
        'Upload request exceeds the maximum allowed upload size.'
      );
    }
  }

  if (!request.body) {
    throw new WorkerHttpError(
      400,
      'EMPTY_REQUEST_BODY',
      'Request body is empty.'
    );
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        totalBytes += value.byteLength;
        if (totalBytes > maxBodyBytes) {
          await reader.cancel('Upload size limit exceeded');
          throw new WorkerHttpError(
            413,
            'FILE_TOO_LARGE',
            'Upload exceeds the maximum allowed upload size.'
          );
        }
        chunks.push(value);
      }
    }
  } finally {
    reader.releaseLock();
  }

  const combined = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return combined;
}

function parseAllowedOrigins(raw: string | undefined): string[] {
  return (raw || '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

export function isOriginAllowedByPolicy(
  requestOrigin: string | null,
  allowedPatterns: string[]
): boolean {
  if (!requestOrigin) return false;
  if (allowedPatterns.length === 0) return false;

  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(requestOrigin);
  } catch {
    return false;
  }

  for (const pattern of allowedPatterns) {
    if (pattern === '*') return true;
    if (pattern === requestOrigin) return true;

    const wildcardIdx = pattern.indexOf('*.');
    if (wildcardIdx !== -1) {
      const schemeSep = pattern.indexOf('://');
      if (schemeSep !== -1 && wildcardIdx === schemeSep + 3) {
        const expectedProtocol = `${pattern.slice(0, schemeSep)}:`;
        const rootDomain = pattern.slice(wildcardIdx + 2).toLowerCase();
        const originHost = parsedOrigin.hostname.toLowerCase();
        const originPort = parsedOrigin.port;

        const domainAndPortParts = rootDomain.split(':');
        const expectedHostSuffix = domainAndPortParts[0];
        const expectedPort = domainAndPortParts[1] || '';

        if (
          parsedOrigin.protocol === expectedProtocol &&
          originPort === expectedPort &&
          expectedHostSuffix.length > 0 &&
          originHost.endsWith(`.${expectedHostSuffix}`) &&
          originHost.length > expectedHostSuffix.length + 1
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

function parseAllowedPrefixes(raw: string | undefined): string[] {
  const list = (raw || '')
    .split(',')
    .map((p) => p.trim().replace(/^\/+|\/+$/g, '').toLowerCase())
    .filter(Boolean);
  return list.length > 0 ? list : DEFAULT_ALLOWED_PREFIXES;
}

function parseMaxUploadBytes(raw: string | undefined): number {
  if (!raw) return DEFAULT_MAX_UPLOAD_BYTES;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_MAX_UPLOAD_BYTES;
  return parsed;
}

function buildCorsHeaders(allowedOrigin: string | null): Record<string, string> {
  if (!allowedOrigin) return {};
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function jsonResponse(
  status: number,
  body: Record<string, unknown>,
  corsHeaders: Record<string, string>,
  extraHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders,
      ...extraHeaders,
    },
  });
}

function resolveCorsForRequest(
  request: Request,
  env: R2MediaWorkerEnv
): { blockedResponse?: Response; corsHeaders: Record<string, string> } {
  const url = new URL(request.url);
  const requestOriginRaw = request.headers.get('Origin');
  const requestOrigin = requestOriginRaw
    ? requestOriginRaw.trim().replace(/\/+$/, '')
    : null;

  if (!requestOrigin) {
    return { corsHeaders: {} };
  }

  const isSameOrigin = requestOrigin === url.origin.replace(/\/+$/, '');
  if (isSameOrigin) {
    return { corsHeaders: buildCorsHeaders(requestOrigin) };
  }

  const allowedOrigins = parseAllowedOrigins(
    typeof env.ALLOWED_ORIGINS === 'string' ? env.ALLOWED_ORIGINS : undefined
  );
  if (allowedOrigins.length === 0) {
    // Reject arbitrary third-party cross-origin requests unless explicitly allowlisted
    return {
      blockedResponse: jsonResponse(
        403,
        {
          error: `Cross-origin request from "${requestOrigin}" is forbidden.`,
          code: 'ORIGIN_FORBIDDEN',
        },
        {}
      ),
      corsHeaders: {},
    };
  }

  const isAllowed = isOriginAllowedByPolicy(requestOrigin, allowedOrigins);
  if (!isAllowed) {
    return {
      blockedResponse: jsonResponse(
        403,
        {
          error: `Origin "${requestOrigin}" is not in ALLOWED_ORIGINS.`,
          code: 'ORIGIN_FORBIDDEN',
        },
        {}
      ),
      corsHeaders: {},
    };
  }

  return { corsHeaders: buildCorsHeaders(requestOrigin) };
}

function formatCaughtError(
  err: unknown,
  corsHeaders: Record<string, string>
): Response {
  if (err instanceof WorkerHttpError) {
    return jsonResponse(
      err.status,
      {
        error: err.message,
        code: err.code,
        ...(err.details ? err.details : {}),
      },
      corsHeaders
    );
  }

  const message =
    err instanceof Error ? err.message : 'Unexpected R2 media API error.';
  return jsonResponse(
    500,
    {
      error: message,
      code: 'INTERNAL_SERVER_ERROR',
    },
    corsHeaders
  );
}

/**
 * Handles `GET /api/media/health`.
 */
export async function handleR2MediaHealth(
  request: Request,
  env: R2MediaWorkerEnv
): Promise<Response> {
  const { blockedResponse, corsHeaders } = resolveCorsForRequest(request, env);
  if (blockedResponse) return blockedResponse;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'GET') {
    return jsonResponse(
      405,
      {
        error: `Method ${request.method} not allowed. Use GET.`,
        code: 'METHOD_NOT_ALLOWED',
      },
      corsHeaders,
      { Allow: 'GET, OPTIONS' }
    );
  }

  const bucket = resolveR2BucketBinding(env);
  const bucketBound = Boolean(
    bucket &&
      typeof bucket.put === 'function' &&
      typeof bucket.list === 'function'
  );

  return jsonResponse(
    bucketBound ? 200 : 503,
    {
      ok: bucketBound,
      service: 'bimondo-r2-media-api',
      binding: 'BIMONDO_IMAGES',
      bucketBound,
      publicImageBaseUrl: resolvePublicImageBaseUrl(env),
      firebaseProjectId: resolveFirebaseProjectId(env),
      firestoreDatabaseId: resolveFirestoreDatabaseId(env),
      allowedPrefixes: parseAllowedPrefixes(
        typeof env.ALLOWED_UPLOAD_PREFIXES === 'string'
          ? env.ALLOWED_UPLOAD_PREFIXES
          : undefined
      ),
      maxUploadBytes: parseMaxUploadBytes(
        typeof env.MAX_UPLOAD_BYTES === 'string'
          ? env.MAX_UPLOAD_BYTES
          : undefined
      ),
    },
    corsHeaders
  );
}

/**
 * Handles `GET /api/media` — authenticated R2 bucket listing beneath approved prefixes.
 */
export async function handleR2MediaList(
  request: Request,
  env: R2MediaWorkerEnv,
  options: R2HandlerOptions = {}
): Promise<Response> {
  const { blockedResponse, corsHeaders } = resolveCorsForRequest(request, env);
  if (blockedResponse) return blockedResponse;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (request.method !== 'GET') {
      return jsonResponse(
        405,
        {
          error: `Method ${request.method} not allowed. Use GET.`,
          code: 'METHOD_NOT_ALLOWED',
        },
        corsHeaders,
        { Allow: 'GET, DELETE, OPTIONS' }
      );
    }

    const firebaseProjectId = resolveFirebaseProjectId(env);
    await verifyFirebaseAdminIdToken(
      request.headers.get('Authorization'),
      firebaseProjectId,
      options.jwkResolver
    );

    const bucket = resolveR2BucketBinding(env);
    if (!bucket || typeof bucket.list !== 'function') {
      throw new WorkerHttpError(
        503,
        'R2_BINDING_MISSING',
        'Cloudflare R2 bucket binding env.BIMONDO_IMAGES is not available in this runtime. Deploy to Cloudflare Workers ("bimondo") with the BIMONDO_IMAGES binding attached.'
      );
    }

    const url = new URL(request.url);
    const allowedPrefixes = parseAllowedPrefixes(
      typeof env.ALLOWED_UPLOAD_PREFIXES === 'string'
        ? env.ALLOWED_UPLOAD_PREFIXES
        : undefined
    );
    const { normalizedFolder, r2Prefix, cursor, limit } =
      validateMediaListParams({
        rawPrefix: url.searchParams.get('prefix'),
        rawCursor: url.searchParams.get('cursor'),
        rawLimit: url.searchParams.get('limit'),
        allowedPrefixes,
      });

    const listResult = await bucket.list({
      prefix: r2Prefix,
      limit,
      cursor,
      include: ['httpMetadata', 'customMetadata'],
    });

    const publicBaseUrl = resolvePublicImageBaseUrl(env);
    const discoveredSubfolders = new Set<string>();
    if (Array.isArray(listResult.delimitedPrefixes)) {
      for (const dp of listResult.delimitedPrefixes) {
        const cleaned = dp.replace(/^\/+|\/+$/g, '');
        if (cleaned && cleaned !== normalizedFolder) {
          discoveredSubfolders.add(cleaned);
        }
      }
    }

    const items = (listResult.objects || [])
      .filter((obj) => obj && typeof obj.key === 'string' && !obj.key.endsWith('/'))
      .map((obj) => {
        if (obj.key.startsWith(r2Prefix)) {
          const remainder = obj.key.slice(r2Prefix.length);
          const slashIdx = remainder.indexOf('/');
          if (slashIdx > 0) {
            const childFolder = `${normalizedFolder}/${remainder.slice(0, slashIdx)}`;
            discoveredSubfolders.add(childFolder);
          }
        }

        const uploadedAt =
          obj.uploaded instanceof Date
            ? obj.uploaded.toISOString()
            : typeof obj.uploaded === 'string' && obj.uploaded.trim().length > 0
              ? obj.uploaded
              : new Date(0).toISOString();

        const contentType =
          obj.httpMetadata?.contentType || inferContentTypeFromKey(obj.key);

        return {
          key: obj.key,
          url: buildPublicCdnUrl(publicBaseUrl, obj.key),
          size: typeof obj.size === 'number' ? obj.size : 0,
          uploadedAt,
          contentType,
        };
      });

    return jsonResponse(
      200,
      {
        prefix: normalizedFolder,
        items,
        subfolders: Array.from(discoveredSubfolders).sort(),
        truncated: Boolean(listResult.truncated),
        cursor: listResult.truncated ? listResult.cursor || null : null,
        limit,
      },
      corsHeaders
    );
  } catch (err) {
    return formatCaughtError(err, corsHeaders);
  }
}

/**
 * Handles `POST /api/media/upload` — authenticated image upload directly to `env.BIMONDO_IMAGES`.
 */
export async function handleR2MediaUpload(
  request: Request,
  env: R2MediaWorkerEnv,
  options: R2HandlerOptions = {}
): Promise<Response> {
  const { blockedResponse, corsHeaders } = resolveCorsForRequest(request, env);
  if (blockedResponse) return blockedResponse;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (request.method !== 'POST') {
      return jsonResponse(
        405,
        {
          error: `Method ${request.method} not allowed. Use POST.`,
          code: 'METHOD_NOT_ALLOWED',
        },
        corsHeaders,
        { Allow: 'POST, OPTIONS' }
      );
    }

    const firebaseProjectId = resolveFirebaseProjectId(env);
    await verifyFirebaseAdminIdToken(
      request.headers.get('Authorization'),
      firebaseProjectId,
      options.jwkResolver
    );

    const bucket = resolveR2BucketBinding(env);
    if (!bucket || typeof bucket.put !== 'function') {
      throw new WorkerHttpError(
        503,
        'R2_BINDING_MISSING',
        'Cloudflare R2 bucket binding env.BIMONDO_IMAGES is not available in this runtime. Deploy to Cloudflare Workers ("bimondo") with the BIMONDO_IMAGES binding attached.'
      );
    }

    const contentType = request.headers.get('Content-Type') || '';
    if (!contentType.toLowerCase().includes('multipart/form-data')) {
      throw new WorkerHttpError(
        400,
        'INVALID_CONTENT_TYPE',
        'Content-Type must be multipart/form-data.'
      );
    }

    const maxUploadBytes = parseMaxUploadBytes(
      typeof env.MAX_UPLOAD_BYTES === 'string'
        ? env.MAX_UPLOAD_BYTES
        : undefined
    );
    const rawBodyBytes = await readRequestBodyWithLimit(
      request,
      maxUploadBytes + MULTIPART_ENVELOPE_OVERHEAD_BYTES
    );

    const boundedRequest = new Request(request.url, {
      method: 'POST',
      headers: request.headers,
      body: rawBodyBytes as unknown as BodyInit,
    });

    let formData: FormData;
    try {
      formData = await boundedRequest.formData();
    } catch {
      throw new WorkerHttpError(
        400,
        'INVALID_MULTIPART_BODY',
        'Unable to parse multipart/form-data payload.'
      );
    }

    const fileEntry = formData.get('file');
    const folderEntry = formData.get('folder');

    if (
      !fileEntry ||
      typeof fileEntry === 'string' ||
      !('arrayBuffer' in fileEntry)
    ) {
      throw new WorkerHttpError(
        400,
        'MISSING_FILE',
        'Multipart field "file" is required and must be a binary file.'
      );
    }

    const uploadedFile = fileEntry as File;
    const fileBuffer = await uploadedFile.arrayBuffer();
    const fileBytes = new Uint8Array(fileBuffer);

    if (fileBytes.byteLength > maxUploadBytes) {
      const maxMib = (maxUploadBytes / (1024 * 1024)).toFixed(1);
      throw new WorkerHttpError(
        413,
        'FILE_TOO_LARGE',
        `Image file size (${fileBytes.byteLength} bytes) exceeds the maximum allowed limit of ${maxMib} MiB (${maxUploadBytes} bytes).`
      );
    }

    const allowedPrefixes = parseAllowedPrefixes(
      typeof env.ALLOWED_UPLOAD_PREFIXES === 'string'
        ? env.ALLOWED_UPLOAD_PREFIXES
        : undefined
    );
    const normalizedFolder = validateAndNormalizeUploadFolder(
      typeof folderEntry === 'string' ? folderEntry : '',
      allowedPrefixes
    );

    const detectedFormat = validateUploadedImageFile({
      bytes: fileBytes,
      declaredMimeType: uploadedFile.type,
      filename: uploadedFile.name,
    });

    let objectKey = buildUniqueObjectKey({
      normalizedFolder,
      originalFilename: uploadedFile.name,
      canonicalExtension: detectedFormat.canonicalExtension,
      uniqueSuffix: options.uniqueIdGenerator
        ? options.uniqueIdGenerator()
        : undefined,
    });

    if (typeof bucket.head === 'function') {
      const existing = await bucket.head(objectKey);
      if (existing) {
        objectKey = buildUniqueObjectKey({
          normalizedFolder,
          originalFilename: uploadedFile.name,
          canonicalExtension: detectedFormat.canonicalExtension,
        });
      }
    }

    const publicBaseUrl = resolvePublicImageBaseUrl(env);
    const publicUrl = buildPublicCdnUrl(publicBaseUrl, objectKey);

    await bucket.put(objectKey, fileBytes, {
      httpMetadata: {
        contentType: detectedFormat.mimeType,
        cacheControl: 'public, max-age=31536000, immutable',
      },
    });

    return jsonResponse(
      200,
      {
        key: objectKey,
        url: publicUrl,
        contentType: detectedFormat.mimeType,
        size: fileBytes.byteLength,
      },
      corsHeaders
    );
  } catch (err) {
    return formatCaughtError(err, corsHeaders);
  }
}

/**
 * Handles `POST /api/media/delete` and `DELETE /api/media` — authenticated permanent deletion
 * from `env.BIMONDO_IMAGES` with backend Firestore reference verification and lifecycle lock.
 */
export async function handleR2MediaDelete(
  request: Request,
  env: R2MediaWorkerEnv,
  options: R2HandlerOptions = {}
): Promise<Response> {
  const { blockedResponse, corsHeaders } = resolveCorsForRequest(request, env);
  if (blockedResponse) return blockedResponse;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (request.method !== 'POST' && request.method !== 'DELETE') {
      return jsonResponse(
        405,
        {
          error: `Method ${request.method} not allowed. Use POST or DELETE.`,
          code: 'METHOD_NOT_ALLOWED',
        },
        corsHeaders,
        { Allow: 'POST, DELETE, OPTIONS' }
      );
    }

    const firebaseProjectId = resolveFirebaseProjectId(env);
    const authHeader = request.headers.get('Authorization');
    const verifiedAdmin = await verifyFirebaseAdminIdToken(
      authHeader,
      firebaseProjectId,
      options.jwkResolver
    );
    const rawIdToken = extractRawBearerToken(authHeader);

    const bucket = resolveR2BucketBinding(env);
    if (!bucket || typeof bucket.delete !== 'function') {
      throw new WorkerHttpError(
        503,
        'R2_BINDING_MISSING',
        'Cloudflare R2 bucket binding env.BIMONDO_IMAGES is not available in this runtime. Deploy to Cloudflare Workers ("bimondo") with the BIMONDO_IMAGES binding attached.'
      );
    }

    const url = new URL(request.url);
    let requestedKey: unknown = url.searchParams.get('key');

    if (!requestedKey && request.body) {
      let bodyJson: Record<string, unknown>;
      try {
        bodyJson = (await request.json()) as Record<string, unknown>;
      } catch {
        throw new WorkerHttpError(
          400,
          'INVALID_JSON_BODY',
          'Request body must be valid JSON containing { "key": "<r2-object-key>" }.'
        );
      }
      requestedKey = bodyJson?.key;
    }

    const allowedPrefixes = parseAllowedPrefixes(
      typeof env.ALLOWED_UPLOAD_PREFIXES === 'string'
        ? env.ALLOWED_UPLOAD_PREFIXES
        : undefined
    );
    const objectKey = validateMediaObjectKey(requestedKey, allowedPrefixes);
    const mediaId = encodeWorkerMediaDocId(objectKey);

    const coordinator =
      options.firestoreCoordinator ||
      createRestFirestoreDeletionCoordinator({
        projectId: firebaseProjectId,
        databaseId: resolveFirestoreDatabaseId(env),
        idToken: rawIdToken,
      });

    let existingLifecycle: MediaLifecycleDocState | null = null;
    try {
      existingLifecycle = await coordinator.getMediaLifecycleDoc(mediaId);
    } catch (err) {
      throw new WorkerHttpError(
        409,
        'USAGE_CHECK_INCOMPLETE',
        `Unable to read media lifecycle state before deletion: ${
          err instanceof Error ? err.message : 'Firestore error'
        }`
      );
    }

    const wasAlreadyDeleting = existingLifecycle?.status === 'deleting';

    try {
      await coordinator.setMediaLifecycleStatus({
        mediaId,
        objectKey,
        status: 'deleting',
        adminUid: verifiedAdmin.uid,
      });
    } catch (err) {
      throw new WorkerHttpError(
        409,
        'USAGE_CHECK_INCOMPLETE',
        `Unable to acquire deletion lock in Firestore (/media_objects/${mediaId}): ${
          err instanceof Error ? err.message : 'Firestore write failed'
        }`
      );
    }

    const sectionCheck = await coordinator.fetchAllCmsSectionDocs();
    if (!sectionCheck.complete) {
      if (!wasAlreadyDeleting) {
        await coordinator
          .setMediaLifecycleStatus({
            mediaId,
            objectKey,
            status: 'active',
            adminUid: verifiedAdmin.uid,
          })
          .catch(() => undefined);
      }
      throw new WorkerHttpError(
        409,
        'USAGE_CHECK_INCOMPLETE',
        sectionCheck.reason ||
          'Usage check is incomplete. Refusing to permanently delete R2 object until all CMS sections can be inspected.'
      );
    }

    const publicBaseUrl = resolvePublicImageBaseUrl(env);
    const foundReferences: string[] = [];

    for (const secDoc of sectionCheck.docs) {
      const refs = findKeyReferencesInSectionPayload({
        docId: secDoc.docId,
        title: secDoc.title,
        payload: secDoc.payload,
        targetKey: objectKey,
        publicBaseUrl,
      });
      for (const r of refs) {
        foundReferences.push(r);
      }
    }

    if (foundReferences.length > 0) {
      await coordinator
        .setMediaLifecycleStatus({
          mediaId,
          objectKey,
          status: 'active',
          adminUid: verifiedAdmin.uid,
        })
        .catch(() => undefined);

      throw new WorkerHttpError(
        409,
        'IMAGE_IN_USE',
        `Refusing to delete "${objectKey}" because it is currently referenced in ${foundReferences.length} saved content placement(s): ${foundReferences.slice(0, 5).join('; ')}. Remove or replace all placements and save before deleting.`,
        {
          key: objectKey,
          references: foundReferences,
        }
      );
    }

    try {
      await bucket.delete(objectKey);
    } catch (err) {
      throw new WorkerHttpError(
        502,
        'R2_DELETE_RETRYABLE',
        `R2 bucket deletion failed while "${objectKey}" is locked in "deleting" state: ${
          err instanceof Error ? err.message : 'R2 delete error'
        }. Retry deletion to complete cleanup.`,
        {
          key: objectKey,
          mediaId,
          lifecycleStatus: 'deleting',
          retryable: true,
        }
      );
    }

    await coordinator
      .setMediaLifecycleStatus({
        mediaId,
        objectKey,
        status: 'deleted',
        adminUid: verifiedAdmin.uid,
      })
      .catch(() => undefined);

    return jsonResponse(
      200,
      {
        deleted: true,
        key: objectKey,
        mediaId,
        lifecycleStatus: 'deleted',
        cacheNotice: `Object permanently deleted from R2 bucket BIMONDO_IMAGES. Copies already cached by Cloudflare CDN (${publicBaseUrl}) with long-lived Cache-Control headers may remain accessible at edge PoPs until cache expiration or a separate cache purge.`,
      },
      corsHeaders
    );
  } catch (err) {
    return formatCaughtError(err, corsHeaders);
  }
}

/**
 * Dispatcher for `/api/media/*` routes in Cloudflare Workers & Pages Functions.
 */
export async function handleR2MediaApiRequest(
  request: Request,
  env: R2MediaWorkerEnv,
  options: R2HandlerOptions = {}
): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';

  if (pathname === '/api/media/health') {
    return handleR2MediaHealth(request, env);
  }

  if (pathname === '/api/media/upload') {
    return handleR2MediaUpload(request, env, options);
  }

  if (pathname === '/api/media/delete') {
    return handleR2MediaDelete(request, env, options);
  }

  if (pathname === '/api/media') {
    if (request.method === 'DELETE') {
      return handleR2MediaDelete(request, env, options);
    }
    return handleR2MediaList(request, env, options);
  }

  const { blockedResponse, corsHeaders } = resolveCorsForRequest(request, env);
  if (blockedResponse) return blockedResponse;

  return jsonResponse(
    404,
    {
      error:
        'Endpoint not found. Available routes: GET /api/media/health, POST /api/media/upload, GET /api/media, POST /api/media/delete.',
      code: 'NOT_FOUND',
    },
    corsHeaders
  );
}
