import {
  FirebaseApp,
  FirebaseOptions,
  getApp,
  getApps,
  initializeApp,
} from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import {
  doc,
  Firestore,
  getDocFromServer,
  getFirestore,
  initializeFirestore,
  setLogLevel,
} from 'firebase/firestore';
import appletConfigJson from '../firebase-applet-config.json';

export interface FirebaseConfigResolution {
  isConfigured: boolean;
  configSource: 'env' | 'applet-config' | 'unconfigured';
  missingEnvKeys: string[];
  config: FirebaseOptions | null;
  firestoreDatabaseId?: string;
}

const REQUIRED_ENV_KEYS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
] as const;

export const ALL_FIREBASE_WEB_ENV_KEYS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
] as const;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function isPlaceholderValue(value: string | undefined | null): boolean {
  if (!value) return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  const lower = trimmed.toLowerCase();
  return (
    lower.includes('your_firebase') ||
    lower.includes('your-project-id') ||
    lower === 'remixed-project-id' ||
    lower === 'todo' ||
    lower === 'changeme'
  );
}

/**
 * Resolves Firebase Web SDK configuration from NEXT_PUBLIC_FIREBASE_* environment
 * variables (Next.js standard convention), with a safe fallback to firebase-applet-config.json
 * when running in an AI Studio provisioned workspace.
 *
 * Never includes service-account keys or admin SDK credentials.
 */
export function resolveFirebaseWebConfig(): FirebaseConfigResolution {
  const envValues: Record<string, string> = {
    NEXT_PUBLIC_FIREBASE_API_KEY: (
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''
    ).trim(),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: (
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ''
    ).trim(),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: (
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ''
    ).trim(),
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: (
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ''
    ).trim(),
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: (
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ''
    ).trim(),
    NEXT_PUBLIC_FIREBASE_APP_ID: (
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''
    ).trim(),
    NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID: (
      process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID || ''
    ).trim(),
  };

  const appletCfg = appletConfigJson as Partial<{
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    firestoreDatabaseId: string;
  }>;

  const missingEnvKeys = REQUIRED_ENV_KEYS.filter((key) =>
    isPlaceholderValue(envValues[key])
  );

  // 1. Primary path: All required NEXT_PUBLIC_FIREBASE_* env vars are configured
  if (missingEnvKeys.length === 0) {
    const dbId =
      envValues.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID ||
      appletCfg?.firestoreDatabaseId ||
      undefined;
    return {
      isConfigured: true,
      configSource: 'env',
      missingEnvKeys: [],
      firestoreDatabaseId: dbId,
      config: {
        apiKey: envValues.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: envValues.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: envValues.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket:
          envValues.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || undefined,
        messagingSenderId:
          envValues.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || undefined,
        appId: envValues.NEXT_PUBLIC_FIREBASE_APP_ID,
      },
    };
  }

  // 2. Fallback path: Check provisioned firebase-applet-config.json if present and valid
  const hasValidAppletConfig =
    !isPlaceholderValue(appletCfg?.apiKey) &&
    !isPlaceholderValue(appletCfg?.authDomain) &&
    !isPlaceholderValue(appletCfg?.projectId) &&
    !isPlaceholderValue(appletCfg?.appId);

  if (hasValidAppletConfig) {
    return {
      isConfigured: true,
      configSource: 'applet-config',
      missingEnvKeys,
      firestoreDatabaseId:
        envValues.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID ||
        appletCfg.firestoreDatabaseId ||
        undefined,
      config: {
        apiKey: envValues.NEXT_PUBLIC_FIREBASE_API_KEY || appletCfg.apiKey,
        authDomain:
          envValues.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || appletCfg.authDomain,
        projectId:
          envValues.NEXT_PUBLIC_FIREBASE_PROJECT_ID || appletCfg.projectId,
        storageBucket:
          envValues.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
          appletCfg.storageBucket ||
          undefined,
        messagingSenderId:
          envValues.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
          appletCfg.messagingSenderId ||
          undefined,
        appId: envValues.NEXT_PUBLIC_FIREBASE_APP_ID || appletCfg.appId,
      },
    };
  }

  return {
    isConfigured: false,
    configSource: 'unconfigured',
    missingEnvKeys,
    config: null,
  };
}

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;
let hasTestedConnection = false;

/**
 * Singleton initializer for Firebase Client App, Auth, and Cloud Firestore.
 * Avoids duplicate initialization across hot reloads or route transitions.
 * Returns null instances if Firebase web configuration is missing or invalid.
 */
export function getFirebaseClientServices(): {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
  resolution: FirebaseConfigResolution;
} {
  const resolution = resolveFirebaseWebConfig();

  if (!resolution.isConfigured || !resolution.config) {
    return { app: null, auth: null, db: null, resolution };
  }

  try {
    setLogLevel('silent');

    if (!cachedApp) {
      cachedApp =
        getApps().length > 0 ? getApp() : initializeApp(resolution.config);
    }
    if (!cachedAuth) {
      cachedAuth = getAuth(cachedApp);
    }
    if (!cachedDb) {
      const targetDbId =
        resolution.firestoreDatabaseId &&
        resolution.firestoreDatabaseId !== '(default)'
          ? resolution.firestoreDatabaseId
          : undefined;
      try {
        cachedDb = targetDbId
          ? initializeFirestore(
              cachedApp,
              {
                experimentalForceLongPolling: true,
              },
              targetDbId
            )
          : initializeFirestore(cachedApp, {
              experimentalForceLongPolling: true,
            });
      } catch {
        cachedDb = targetDbId
          ? getFirestore(cachedApp, targetDbId)
          : getFirestore(cachedApp);
      }
    }

    if (typeof window !== 'undefined' && !hasTestedConnection && cachedDb) {
      hasTestedConnection = true;
      void testFirestoreConnection(cachedDb, resolution);
    }

    return {
      app: cachedApp,
      auth: cachedAuth,
      db: cachedDb,
      resolution,
    };
  } catch {
    return {
      app: null,
      auth: null,
      db: null,
      resolution: {
        ...resolution,
        isConfigured: false,
      },
    };
  }
}

export function getFirebaseClientAuth(): {
  app: FirebaseApp | null;
  auth: Auth | null;
  resolution: FirebaseConfigResolution;
} {
  const { app, auth, resolution } = getFirebaseClientServices();
  return { app, auth, resolution };
}

async function testFirestoreConnection(
  dbInstance: Firestore,
  resolution: FirebaseConfigResolution
) {
  try {
    await getDocFromServer(doc(dbInstance, 'cms_sections', 'shared_header'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      // Verify via direct REST check before reporting a configuration error,
      // as iframe proxies or browser extensions can transiently delay WebChannel.
      const projectId = resolution.config?.projectId;
      const apiKey = resolution.config?.apiKey;
      const dbId = resolution.firestoreDatabaseId || '(default)';
      if (projectId && apiKey) {
        try {
          const res = await fetch(
            `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
              projectId
            )}/databases/${encodeURIComponent(
              dbId
            )}/documents/cms_sections/shared_header?key=${encodeURIComponent(
              apiKey
            )}`
          );
          if (res.ok || res.status === 404) {
            return;
          }
        } catch {
          // Ignore network offline check error
        }
      }
      console.warn('Firestore client is operating in offline/cached mode.');
    }
  }
}

/**
 * Standardized Firestore permission/operation error handler with diagnostic context.
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const { auth } = getFirebaseClientServices();
  const currentUser = auth?.currentUser;

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid ?? null,
      email: currentUser?.email ?? null,
      emailVerified: currentUser?.emailVerified ?? null,
      isAnonymous: currentUser?.isAnonymous ?? null,
      tenantId: currentUser?.tenantId ?? null,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
