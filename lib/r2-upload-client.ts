export const PUBLIC_CDN_BASE_URL = 'https://cdn.bimondotours.com';
export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MiB
export const ALLOWED_ROOT_UPLOAD_PREFIXES = [
  'pages',
  'shared',
  'tours',
  'gallery',
] as const;

export interface UploadFolderPreset {
  value: string;
  label: string;
  prefix: (typeof ALLOWED_ROOT_UPLOAD_PREFIXES)[number];
}

export const APPROVED_UPLOAD_FOLDER_PRESETS: UploadFolderPreset[] = [
  {
    value: 'pages/home/hero',
    label: 'pages/home/hero (Home Hero Slides)',
    prefix: 'pages',
  },
  {
    value: 'pages/home/story',
    label: 'pages/home/story (Our Story Images)',
    prefix: 'pages',
  },
  {
    value: 'pages/home/bento',
    label: 'pages/home/bento (Bento Destination Slides)',
    prefix: 'pages',
  },
  {
    value: 'pages/home/experience',
    label: 'pages/home/experience (Signature Experience)',
    prefix: 'pages',
  },
  {
    value: 'pages/home/reviews',
    label: 'pages/home/reviews (Guest Review Portraits)',
    prefix: 'pages',
  },
  {
    value: 'pages/destinations',
    label: 'pages/destinations (Regional Destinations)',
    prefix: 'pages',
  },
  {
    value: 'pages/stays',
    label: 'pages/stays (Regional Accommodations)',
    prefix: 'pages',
  },
  {
    value: 'tours/packages',
    label: 'tours/packages (Signature Multi-Day Tours)',
    prefix: 'tours',
  },
  {
    value: 'tours/colombo',
    label: 'tours/colombo (Colombo Day Experiences)',
    prefix: 'tours',
  },
  {
    value: 'gallery/featured',
    label: 'gallery/featured (Visual Gallery Photos)',
    prefix: 'gallery',
  },
  {
    value: 'shared/branding',
    label: 'shared/branding (Shared Header & Footer Assets)',
    prefix: 'shared',
  },
];

export type R2UploadErrorCategory =
  | 'unconfigured'
  | 'auth'
  | 'forbidden'
  | 'invalid_file'
  | 'size_limit'
  | 'invalid_folder'
  | 'network'
  | 'upload_failed';

export class R2ClientUploadError extends Error {
  readonly category: R2UploadErrorCategory;
  readonly status?: number;
  readonly code?: string;

  constructor(params: {
    category: R2UploadErrorCategory;
    message: string;
    status?: number;
    code?: string;
  }) {
    super(params.message);
    this.name = 'R2ClientUploadError';
    this.category = params.category;
    this.status = params.status;
    this.code = params.code;
  }
}

export interface R2UploadSuccessResponse {
  key: string;
  url: string;
  contentType: string;
  size: number;
}

export interface R2MediaItem {
  key: string;
  url: string;
  size: number;
  uploadedAt: string;
  contentType: string;
}

export interface R2MediaListResponse {
  prefix: string;
  items: R2MediaItem[];
  subfolders: string[];
  truncated: boolean;
  cursor: string | null;
  limit: number;
}

export interface R2MediaDeleteResponse {
  deleted: boolean;
  key: string;
  mediaId: string;
  lifecycleStatus: 'deleted';
  cacheNotice: string;
}

export interface UploadWorkerEndpointResolution {
  isConfigured: boolean;
  baseUrl: string | null;
  uploadEndpointUrl: string | null;
  mediaListEndpointUrl: string | null;
  mediaDeleteEndpointUrl: string | null;
}

/**
 * Resolves the configured Cloudflare R2 Upload Worker base URL from
 * `NEXT_PUBLIC_R2_UPLOAD_WORKER_URL`.
 * Never uses the public CDN domain (`https://cdn.bimondotours.com`) as an upload endpoint.
 */
export function getUploadWorkerEndpointResolution(): UploadWorkerEndpointResolution {
  const raw = (process.env.NEXT_PUBLIC_R2_UPLOAD_WORKER_URL || '').trim();
  if (
    !raw ||
    raw.includes('YOUR_') ||
    raw.includes('<') ||
    raw.replace(/\/+$/, '').toLowerCase() === PUBLIC_CDN_BASE_URL
  ) {
    return {
      isConfigured: false,
      baseUrl: null,
      uploadEndpointUrl: null,
      mediaListEndpointUrl: null,
      mediaDeleteEndpointUrl: null,
    };
  }

  const normalized = raw.replace(/\/+$/, '').replace(/\/upload$/i, '');
  return {
    isConfigured: true,
    baseUrl: normalized,
    uploadEndpointUrl: `${normalized}/upload`,
    mediaListEndpointUrl: `${normalized}/media`,
    mediaDeleteEndpointUrl: `${normalized}/media/delete`,
  };
}

/**
 * Suggests a sensible default approved upload folder for a given admin section ID.
 */
export function getDefaultFolderForSection(sectionId: string): string {
  switch (sectionId) {
    case 'home-hero':
      return 'pages/home/hero';
    case 'home-story':
    case 'story-page-banner':
      return 'pages/home/story';
    case 'home-bento':
      return 'pages/home/bento';
    case 'home-experience':
      return 'pages/home/experience';
    case 'home-reviews':
      return 'pages/home/reviews';
    case 'dest-regions':
    case 'dest-banner-intro':
      return 'pages/destinations';
    case 'dest-colombo-day':
      return 'tours/colombo';
    case 'pkg-tours-list':
    case 'pkg-banner':
      return 'tours/packages';
    case 'stays-collection':
    case 'stays-banner':
      return 'pages/stays';
    case 'gallery-photos':
    case 'gallery-banner':
      return 'gallery/featured';
    case 'global-header':
    case 'global-footer':
      return 'shared/branding';
    default:
      return 'pages/home/hero';
  }
}

/**
 * Client-side folder normalization & validation matching the Worker rules.
 */
export function validateClientUploadFolder(rawFolder: string): {
  valid: boolean;
  normalizedFolder: string;
  error?: string;
} {
  const raw = (rawFolder || '').trim();
  if (!raw) {
    return {
      valid: false,
      normalizedFolder: '',
      error: 'Enter or select a target upload folder.',
    };
  }

  if (/\\/.test(raw)) {
    return {
      valid: false,
      normalizedFolder: '',
      error: 'Folder path must not contain backslashes (\\). Use forward slashes (/).',
    };
  }

  if (/[\x00-\x1f\x7f]/.test(raw)) {
    return {
      valid: false,
      normalizedFolder: '',
      error: 'Folder path must not contain control characters.',
    };
  }

  if (raw.includes('//')) {
    return {
      valid: false,
      normalizedFolder: '',
      error: 'Folder path must not contain consecutive slashes (//).',
    };
  }

  const stripped = raw.replace(/^\/+|\/+$/g, '');
  if (!stripped || stripped.length > 120) {
    return {
      valid: false,
      normalizedFolder: '',
      error: 'Folder path must be between 1 and 120 characters.',
    };
  }

  const segments = stripped.split('/');
  if (segments.length > 6) {
    return {
      valid: false,
      normalizedFolder: '',
      error: 'Folder path cannot exceed 6 nested levels.',
    };
  }

  const normalizedSegments: string[] = [];
  for (const seg of segments) {
    if (seg === '.' || seg === '..' || seg.includes('..')) {
      return {
        valid: false,
        normalizedFolder: '',
        error: 'Path traversal sequences (.. or .) are not allowed.',
      };
    }
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,47}$/.test(seg)) {
      return {
        valid: false,
        normalizedFolder: '',
        error: `Invalid segment "${seg}". Use only letters, numbers, hyphens (-), and underscores (_).`,
      };
    }
    normalizedSegments.push(seg.toLowerCase());
  }

  const rootPrefix = normalizedSegments[0] as (typeof ALLOWED_ROOT_UPLOAD_PREFIXES)[number];
  if (!ALLOWED_ROOT_UPLOAD_PREFIXES.includes(rootPrefix)) {
    return {
      valid: false,
      normalizedFolder: '',
      error: `Folder must start with an approved prefix: pages/, shared/, tours/, or gallery/.`,
    };
  }

  return {
    valid: true,
    normalizedFolder: normalizedSegments.join('/'),
  };
}

/**
 * Inspects the first 12 bytes of a selected browser File to verify its binary signature,
 * declared MIME type, extension, and size before uploading.
 */
export async function validateClientImageFileBeforeUpload(file: File): Promise<void> {
  if (!file || file.size === 0) {
    throw new R2ClientUploadError({
      category: 'invalid_file',
      message: 'Selected file is empty (0 bytes). Choose a valid JPEG, PNG, WebP, or GIF image.',
    });
  }

  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    const sizeMib = (file.size / (1024 * 1024)).toFixed(2);
    throw new R2ClientUploadError({
      category: 'size_limit',
      message: `Selected image is ${sizeMib} MiB, which exceeds the 10.0 MiB maximum upload limit.`,
    });
  }

  const headSlice = file.slice(0, 12);
  const headBytes = new Uint8Array(await headSlice.arrayBuffer());

  let detectedMime: string | null = null;
  let allowedExts: string[] = [];

  if (
    headBytes.byteLength >= 8 &&
    headBytes[0] === 0x89 &&
    headBytes[1] === 0x50 &&
    headBytes[2] === 0x4e &&
    headBytes[3] === 0x47 &&
    headBytes[4] === 0x0d &&
    headBytes[5] === 0x0a &&
    headBytes[6] === 0x1a &&
    headBytes[7] === 0x0a
  ) {
    detectedMime = 'image/png';
    allowedExts = ['.png'];
  } else if (
    headBytes.byteLength >= 3 &&
    headBytes[0] === 0xff &&
    headBytes[1] === 0xd8 &&
    headBytes[2] === 0xff
  ) {
    detectedMime = 'image/jpeg';
    allowedExts = ['.jpg', '.jpeg'];
  } else if (
    headBytes.byteLength >= 6 &&
    headBytes[0] === 0x47 &&
    headBytes[1] === 0x49 &&
    headBytes[2] === 0x46 &&
    headBytes[3] === 0x38 &&
    (headBytes[4] === 0x37 || headBytes[4] === 0x39) &&
    headBytes[5] === 0x61
  ) {
    detectedMime = 'image/gif';
    allowedExts = ['.gif'];
  } else if (
    headBytes.byteLength >= 12 &&
    headBytes[0] === 0x52 &&
    headBytes[1] === 0x49 &&
    headBytes[2] === 0x46 &&
    headBytes[3] === 0x46 &&
    headBytes[8] === 0x57 &&
    headBytes[9] === 0x45 &&
    headBytes[10] === 0x42 &&
    headBytes[11] === 0x50
  ) {
    detectedMime = 'image/webp';
    allowedExts = ['.webp'];
  }

  if (!detectedMime) {
    throw new R2ClientUploadError({
      category: 'invalid_file',
      message:
        'Unsupported file signature. Only authentic JPEG, PNG, WebP, and GIF images are allowed (SVG, HTML, and renamed files are rejected).',
    });
  }

  const declaredMime = (file.type || '').trim().toLowerCase();
  if (declaredMime !== detectedMime) {
    throw new R2ClientUploadError({
      category: 'invalid_file',
      message: `File MIME type (${declaredMime || 'unknown'}) does not match its binary image signature (${detectedMime}).`,
    });
  }

  const dotIdx = file.name.lastIndexOf('.');
  const ext = dotIdx > 0 ? file.name.slice(dotIdx).toLowerCase() : '';
  if (!allowedExts.includes(ext)) {
    throw new R2ClientUploadError({
      category: 'invalid_file',
      message: `Filename extension "${ext || 'none'}" does not match its ${detectedMime} binary signature (expected ${allowedExts.join(' or ')}).`,
    });
  }
}

/**
 * Uploads an image file to the Cloudflare R2 Upload Worker (`POST /upload`)
 * authenticated with the administrator's Firebase ID token.
 */
export async function uploadImageToR2Worker(params: {
  file: File;
  folder: string;
  idToken: string;
}): Promise<R2UploadSuccessResponse> {
  const { file, folder, idToken } = params;

  const endpoint = getUploadWorkerEndpointResolution();
  if (!endpoint.isConfigured || !endpoint.uploadEndpointUrl) {
    throw new R2ClientUploadError({
      category: 'unconfigured',
      message:
        'Upload Worker URL is not configured. Set NEXT_PUBLIC_R2_UPLOAD_WORKER_URL in your environment to your deployed Cloudflare Worker URL (e.g., https://bimondo-r2-upload-worker.<subdomain>.workers.dev).',
    });
  }

  if (!idToken || idToken.trim().length === 0) {
    throw new R2ClientUploadError({
      category: 'auth',
      message:
        'Missing Firebase ID token. Please sign in as an administrator and try again.',
    });
  }

  const folderCheck = validateClientUploadFolder(folder);
  if (!folderCheck.valid) {
    throw new R2ClientUploadError({
      category: 'invalid_folder',
      message: folderCheck.error || 'Invalid target upload folder.',
    });
  }

  await validateClientImageFileBeforeUpload(file);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folderCheck.normalizedFolder);

  let response: Response;
  try {
    response = await fetch(endpoint.uploadEndpointUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
      body: formData,
    });
  } catch (err) {
    throw new R2ClientUploadError({
      category: 'network',
      message: `Network or CORS error reaching Upload Worker at ${endpoint.uploadEndpointUrl}: ${
        err instanceof Error ? err.message : 'Failed to fetch'
      }. Verify the Worker is deployed and ALLOWED_ORIGINS includes ${
        typeof window !== 'undefined' ? window.location.origin : 'this origin'
      }.`,
    });
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    // Non-JSON response body
  }

  if (!response.ok) {
    const serverMessage =
      typeof payload.error === 'string' && payload.error.trim().length > 0
        ? payload.error
        : `Upload failed with HTTP ${response.status}.`;
    const serverCode =
      typeof payload.code === 'string' ? payload.code : undefined;

    if (response.status === 401) {
      throw new R2ClientUploadError({
        category: 'auth',
        status: 401,
        code: serverCode,
        message: `Authentication rejected (401): ${serverMessage}`,
      });
    }

    if (response.status === 403) {
      throw new R2ClientUploadError({
        category: 'forbidden',
        status: 403,
        code: serverCode,
        message: `Access forbidden (403): ${serverMessage}`,
      });
    }

    if (response.status === 413) {
      throw new R2ClientUploadError({
        category: 'size_limit',
        status: 413,
        code: serverCode,
        message: `File size limit exceeded (413): ${serverMessage}`,
      });
    }

    if (response.status === 415) {
      throw new R2ClientUploadError({
        category: 'invalid_file',
        status: 415,
        code: serverCode,
        message: `Unsupported image file (415): ${serverMessage}`,
      });
    }

    if (
      response.status === 400 &&
      (serverCode === 'INVALID_FOLDER' ||
        serverCode === 'DISALLOWED_FOLDER_PREFIX')
    ) {
      throw new R2ClientUploadError({
        category: 'invalid_folder',
        status: 400,
        code: serverCode,
        message: `Invalid upload folder (400): ${serverMessage}`,
      });
    }

    throw new R2ClientUploadError({
      category: 'upload_failed',
      status: response.status,
      code: serverCode,
      message: `R2 Upload Worker error (${response.status}): ${serverMessage}`,
    });
  }

  if (
    typeof payload.key !== 'string' ||
    typeof payload.url !== 'string' ||
    !payload.key.trim() ||
    !payload.url.trim()
  ) {
    throw new R2ClientUploadError({
      category: 'upload_failed',
      message: 'Worker returned an incomplete upload response (missing key or url).',
    });
  }

  return {
    key: payload.key.trim(),
    url: payload.url.trim(),
    contentType:
      typeof payload.contentType === 'string'
        ? payload.contentType
        : file.type,
    size: typeof payload.size === 'number' ? payload.size : file.size,
  };
}

/**
 * Lists uploaded media objects from the Cloudflare R2 Worker (`GET /media`)
 * beneath an approved folder prefix with cursor pagination.
 */
export async function listMediaFromR2Worker(params: {
  prefix: string;
  cursor?: string | null;
  limit?: number;
  idToken: string;
}): Promise<R2MediaListResponse> {
  const { prefix, cursor, limit = 24, idToken } = params;

  const endpoint = getUploadWorkerEndpointResolution();
  if (!endpoint.isConfigured || !endpoint.mediaListEndpointUrl) {
    throw new R2ClientUploadError({
      category: 'unconfigured',
      message:
        'Upload Worker URL is not configured. Set NEXT_PUBLIC_R2_UPLOAD_WORKER_URL in your environment to browse and manage R2 media.',
    });
  }

  if (!idToken || !idToken.trim()) {
    throw new R2ClientUploadError({
      category: 'auth',
      message:
        'Missing Firebase ID token. Sign in as an administrator to browse media.',
    });
  }

  const folderCheck = validateClientUploadFolder(prefix);
  if (!folderCheck.valid) {
    throw new R2ClientUploadError({
      category: 'invalid_folder',
      message: folderCheck.error || 'Invalid folder prefix.',
    });
  }

  const query = new URLSearchParams();
  query.set('prefix', folderCheck.normalizedFolder);
  query.set('limit', String(Math.max(1, Math.min(100, limit))));
  if (cursor && cursor.trim()) {
    query.set('cursor', cursor.trim());
  }

  const requestUrl = `${endpoint.mediaListEndpointUrl}?${query.toString()}`;
  let response: Response;
  try {
    response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${idToken}`,
        Accept: 'application/json',
      },
    });
  } catch (err) {
    throw new R2ClientUploadError({
      category: 'network',
      message: `Network or CORS error reaching Media Worker at ${endpoint.mediaListEndpointUrl}: ${
        err instanceof Error ? err.message : 'Failed to fetch'
      }`,
    });
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    // Non-JSON response
  }

  if (!response.ok) {
    const serverMessage =
      typeof payload.error === 'string' && payload.error.trim().length > 0
        ? payload.error
        : `Media list failed with HTTP ${response.status}.`;
    const serverCode =
      typeof payload.code === 'string' ? payload.code : undefined;

    throw new R2ClientUploadError({
      category:
        response.status === 401
          ? 'auth'
          : response.status === 403
            ? 'forbidden'
            : 'upload_failed',
      status: response.status,
      code: serverCode,
      message: serverMessage,
    });
  }

  const rawItems = Array.isArray(payload.items) ? payload.items : [];
  const items: R2MediaItem[] = rawItems
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Record<string, unknown>).key === 'string' &&
        typeof (item as Record<string, unknown>).url === 'string'
    )
    .map((item) => ({
      key: String(item.key),
      url: String(item.url),
      size: typeof item.size === 'number' ? item.size : 0,
      uploadedAt:
        typeof item.uploadedAt === 'string'
          ? item.uploadedAt
          : new Date(0).toISOString(),
      contentType:
        typeof item.contentType === 'string'
          ? item.contentType
          : 'image/jpeg',
    }));

  const subfolders = Array.isArray(payload.subfolders)
    ? payload.subfolders.filter((s): s is string => typeof s === 'string')
    : [];

  return {
    prefix:
      typeof payload.prefix === 'string'
        ? payload.prefix
        : folderCheck.normalizedFolder,
    items,
    subfolders,
    truncated: Boolean(payload.truncated),
    cursor: typeof payload.cursor === 'string' ? payload.cursor : null,
    limit: typeof payload.limit === 'number' ? payload.limit : limit,
  };
}

/**
 * Permanently deletes an unreferenced R2 object via `POST /media/delete`.
 * The Worker verifies admin authorization, acquires a `/media_objects/{mediaId}` lock,
 * checks all 22 `/cms_sections` documents in Firestore, deletes from R2, and finalizes status.
 */
export async function deleteMediaFromR2Worker(params: {
  key: string;
  idToken: string;
}): Promise<R2MediaDeleteResponse> {
  const { key, idToken } = params;

  const endpoint = getUploadWorkerEndpointResolution();
  if (!endpoint.isConfigured || !endpoint.mediaDeleteEndpointUrl) {
    throw new R2ClientUploadError({
      category: 'unconfigured',
      message:
        'Upload Worker URL is not configured. Set NEXT_PUBLIC_R2_UPLOAD_WORKER_URL in your environment to manage R2 media.',
    });
  }

  if (!idToken || !idToken.trim()) {
    throw new R2ClientUploadError({
      category: 'auth',
      message:
        'Missing Firebase ID token. Sign in as an administrator to delete media.',
    });
  }

  let response: Response;
  try {
    response = await fetch(endpoint.mediaDeleteEndpointUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ key: key.trim() }),
    });
  } catch (err) {
    throw new R2ClientUploadError({
      category: 'network',
      message: `Network or CORS error reaching Media Worker at ${endpoint.mediaDeleteEndpointUrl}: ${
        err instanceof Error ? err.message : 'Failed to fetch'
      }`,
    });
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    // Non-JSON response
  }

  if (!response.ok) {
    const serverMessage =
      typeof payload.error === 'string' && payload.error.trim().length > 0
        ? payload.error
        : `Media deletion failed with HTTP ${response.status}.`;
    const serverCode =
      typeof payload.code === 'string' ? payload.code : undefined;

    throw new R2ClientUploadError({
      category:
        response.status === 401
          ? 'auth'
          : response.status === 403
            ? 'forbidden'
            : 'upload_failed',
      status: response.status,
      code: serverCode,
      message: serverMessage,
    });
  }

  return {
    deleted: Boolean(payload.deleted),
    key: typeof payload.key === 'string' ? payload.key : key.trim(),
    mediaId: typeof payload.mediaId === 'string' ? payload.mediaId : '',
    lifecycleStatus: 'deleted',
    cacheNotice:
      typeof payload.cacheNotice === 'string'
        ? payload.cacheNotice
        : 'Object removed from R2 storage. Copies already cached by Cloudflare CDN (https://cdn.bimondotours.com) may remain accessible until cache expiration or a separate cache purge.',
  };
}

