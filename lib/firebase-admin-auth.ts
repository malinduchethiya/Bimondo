import { NextRequest } from 'next/server';
import firebaseConfig from '@/firebase-applet-config.json';

const PRIMARY_ADMIN_EMAIL = 'merlinfiverr0@gmail.com';
const GOOGLE_SECURETOKEN_JWK_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

interface GoogleJwkItem extends JsonWebKey {
  kid?: string;
}

interface DecodedJwtHeader {
  alg?: string;
  kid?: string;
  typ?: string;
}

interface DecodedFirebaseIdTokenPayload {
  iss?: string;
  aud?: string;
  sub?: string;
  user_id?: string;
  email?: string;
  email_verified?: boolean;
  exp?: number;
  iat?: number;
}

let cachedJwks: { expiresAt: number; keys: GoogleJwkItem[] } | null = null;

function decodeBase64UrlToUint8Array(input: string): Uint8Array {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = Buffer.from(padded, 'base64');
  return new Uint8Array(binary);
}

function decodeBase64UrlToJson<T>(input: string): T {
  const bytes = decodeBase64UrlToUint8Array(input);
  const text = new TextDecoder().decode(bytes);
  return JSON.parse(text) as T;
}

async function getGooglePublicJwks(): Promise<GoogleJwkItem[]> {
  const now = Date.now();
  if (cachedJwks && cachedJwks.expiresAt > now && cachedJwks.keys.length > 0) {
    return cachedJwks.keys;
  }

  const res = await fetch(GOOGLE_SECURETOKEN_JWK_URL, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch Google JWK public keys (HTTP ${res.status}).`);
  }

  const cacheControl = res.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const ttlMs = maxAgeMatch ? Number(maxAgeMatch[1]) * 1000 : 3600 * 1000;

  const data = (await res.json()) as { keys?: GoogleJwkItem[] };
  const keys = Array.isArray(data.keys) ? data.keys : [];
  cachedJwks = {
    expiresAt: now + Math.max(ttlMs, 60_000),
    keys,
  };
  return keys;
}

async function checkAdminDocExistsInFirestore(
  uid: string,
  idToken: string
): Promise<boolean> {
  try {
    const projectId = firebaseConfig.projectId;
    const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/admins/${encodeURIComponent(
      uid
    )}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
      cache: 'no-store',
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

export type AdminAuthVerificationResult =
  | {
      ok: true;
      uid: string;
      email: string;
      idToken: string;
    }
  | {
      ok: false;
      status: 401 | 403;
      step: 'auth';
      error: string;
    };

/**
 * Verifies the caller's Firebase ID token using RS256 Web Crypto + Google JWKs
 * and enforces the same verified-admin policy used in Firestore security rules.
 */
export async function verifyAdminRequest(
  req: NextRequest
): Promise<AdminAuthVerificationResult> {
  const authHeader = req.headers.get('authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const idToken = match?.[1]?.trim() || '';

  if (!idToken) {
    return {
      ok: false,
      status: 401,
      step: 'auth',
      error:
        'Authentication required. Sign in with your authorized Google admin account first.',
    };
  }

  const segments = idToken.split('.');
  if (segments.length !== 3) {
    return {
      ok: false,
      status: 401,
      step: 'auth',
      error: 'Malformed Firebase ID token.',
    };
  }

  let header: DecodedJwtHeader;
  let payload: DecodedFirebaseIdTokenPayload;
  try {
    header = decodeBase64UrlToJson<DecodedJwtHeader>(segments[0]);
    payload = decodeBase64UrlToJson<DecodedFirebaseIdTokenPayload>(segments[1]);
  } catch {
    return {
      ok: false,
      status: 401,
      step: 'auth',
      error: 'Invalid Firebase ID token encoding.',
    };
  }

  if (header.alg !== 'RS256' || !header.kid) {
    return {
      ok: false,
      status: 401,
      step: 'auth',
      error: 'Unsupported Firebase ID token signature algorithm.',
    };
  }

  const expectedProjectId = firebaseConfig.projectId;
  const expectedIssuer = `https://securetoken.google.com/${expectedProjectId}`;
  const nowSec = Math.floor(Date.now() / 1000);

  if (payload.aud !== expectedProjectId || payload.iss !== expectedIssuer) {
    return {
      ok: false,
      status: 401,
      step: 'auth',
      error: 'Firebase ID token project audience or issuer mismatch.',
    };
  }

  const uid = (payload.sub || payload.user_id || '').trim();
  if (!uid) {
    return {
      ok: false,
      status: 401,
      step: 'auth',
      error: 'Firebase ID token is missing subject UID.',
    };
  }

  if (!payload.exp || payload.exp <= nowSec - 30) {
    return {
      ok: false,
      status: 401,
      step: 'auth',
      error: 'Firebase session token has expired. Please refresh or sign in again.',
    };
  }

  if (!payload.iat || payload.iat > nowSec + 300) {
    return {
      ok: false,
      status: 401,
      step: 'auth',
      error: 'Firebase ID token issued-at timestamp is invalid.',
    };
  }

  try {
    const jwks = await getGooglePublicJwks();
    const matchingJwk = jwks.find((k) => k.kid === header.kid);
    if (!matchingJwk) {
      cachedJwks = null;
      const refreshedJwks = await getGooglePublicJwks();
      const retryJwk = refreshedJwks.find((k) => k.kid === header.kid);
      if (!retryJwk) {
        return {
          ok: false,
          status: 401,
          step: 'auth',
          error: 'Could not find matching Google signing key for Firebase ID token.',
        };
      }
      const cryptoKey = await crypto.subtle.importKey(
        'jwk',
        retryJwk,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify']
      );
      const signedData = new TextEncoder().encode(`${segments[0]}.${segments[1]}`);
      const signature = decodeBase64UrlToUint8Array(segments[2]);
      const valid = await crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        cryptoKey,
        signature as BufferSource,
        signedData
      );
      if (!valid) {
        return {
          ok: false,
          status: 401,
          step: 'auth',
          error: 'Invalid Firebase ID token cryptographic signature.',
        };
      }
    } else {
      const cryptoKey = await crypto.subtle.importKey(
        'jwk',
        matchingJwk,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify']
      );
      const signedData = new TextEncoder().encode(`${segments[0]}.${segments[1]}`);
      const signature = decodeBase64UrlToUint8Array(segments[2]);
      const valid = await crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        cryptoKey,
        signature as BufferSource,
        signedData
      );
      if (!valid) {
        return {
          ok: false,
          status: 401,
          step: 'auth',
          error: 'Invalid Firebase ID token cryptographic signature.',
        };
      }
    }
  } catch {
    return {
      ok: false,
      status: 401,
      step: 'auth',
      error: 'Failed to cryptographically verify Firebase ID token.',
    };
  }

  const email = (payload.email || '').trim().toLowerCase();
  const emailVerified = payload.email_verified === true;

  const isPrimaryVerifiedAdmin =
    email === PRIMARY_ADMIN_EMAIL.toLowerCase() && emailVerified;
  const isDelegatedAdmin = isPrimaryVerifiedAdmin
    ? true
    : await checkAdminDocExistsInFirestore(uid, idToken);

  if (!isPrimaryVerifiedAdmin && !isDelegatedAdmin) {
    return {
      ok: false,
      status: 403,
      step: 'auth',
      error: `Signed-in account (${
        email || uid
      }) is not an authorized Bimondo administrator.`,
    };
  }

  return {
    ok: true,
    uid,
    email,
    idToken,
  };
}
