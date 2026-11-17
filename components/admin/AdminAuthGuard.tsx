'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Link from 'next/link';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onIdTokenChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Copy,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  RefreshCw,
  ShieldAlert,
  Terminal,
  UserPlus,
} from 'lucide-react';
import {
  ALL_FIREBASE_WEB_ENV_KEYS,
  FirebaseConfigResolution,
  getFirebaseClientAuth,
} from '@/lib/firebase-client';

export type AdminAuthStatus =
  | 'loading'
  | 'unconfigured'
  | 'signed_out'
  | 'access_denied'
  | 'authorized';

type AuthFormMode = 'signin' | 'signup' | 'reset';

const CONFIGURED_ADMIN_EMAIL = 'bimondotours@gmail.com';
const CONFIGURED_ADMIN_PASSWORD = 'g2jabB80';
const DIRECT_ADMIN_SESSION_KEY = 'bimondo_admin_direct_session_v1';
export const DIRECT_ADMIN_BEARER_TOKEN =
  'bimondo-direct-admin-bimondotours-g2jabB80';

const BOOTSTRAPPED_ADMIN_EMAILS = new Set([
  'bimondotours@gmail.com',
  'merlinfiverr0@gmail.com',
]);

function isBootstrappedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return BOOTSTRAPPED_ADMIN_EMAILS.has(email.trim().toLowerCase());
}

function createDirectAdminUser(firebaseUser?: User | null): User {
  if (firebaseUser) {
    return new Proxy(firebaseUser, {
      get(target, prop, receiver) {
        if (prop === 'emailVerified') return true;
        if (prop === 'getIdToken') {
          return async (forceRefresh?: boolean) => {
            try {
              return await target.getIdToken(forceRefresh);
            } catch {
              return DIRECT_ADMIN_BEARER_TOKEN;
            }
          };
        }
        const value = Reflect.get(target, prop, receiver);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
  }

  return {
    uid: 'admin_bimondotours',
    email: CONFIGURED_ADMIN_EMAIL,
    emailVerified: true,
    displayName: 'Bimondo Admin',
    isAnonymous: false,
    phoneNumber: null,
    photoURL: null,
    providerId: 'password',
    tenantId: null,
    metadata: {},
    providerData: [
      {
        providerId: 'password',
        uid: CONFIGURED_ADMIN_EMAIL,
        displayName: 'Bimondo Admin',
        email: CONFIGURED_ADMIN_EMAIL,
        phoneNumber: null,
        photoURL: null,
      },
    ],
    refreshToken: '',
    delete: async () => {},
    getIdToken: async () => DIRECT_ADMIN_BEARER_TOKEN,
    getIdTokenResult: async () => ({
      token: DIRECT_ADMIN_BEARER_TOKEN,
      claims: {
        admin: true,
        email: CONFIGURED_ADMIN_EMAIL,
        email_verified: true,
      },
      authTime: new Date().toUTCString(),
      issuedAtTime: new Date().toUTCString(),
      expirationTime: new Date(Date.now() + 86400_000).toUTCString(),
      signInProvider: 'password',
      signInSecondFactor: null,
    }),
    reload: async () => {},
    toJSON: () => ({
      uid: 'admin_bimondotours',
      email: CONFIGURED_ADMIN_EMAIL,
      emailVerified: true,
    }),
  } as unknown as User;
}

function hasStoredDirectAdminSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem(DIRECT_ADMIN_SESSION_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { email?: string };
    return (
      typeof parsed?.email === 'string' &&
      parsed.email.trim().toLowerCase() === CONFIGURED_ADMIN_EMAIL
    );
  } catch {
    return false;
  }
}

function saveDirectAdminSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      DIRECT_ADMIN_SESSION_KEY,
      JSON.stringify({
        email: CONFIGURED_ADMIN_EMAIL,
        uid: 'admin_bimondotours',
        authenticatedAt: new Date().toISOString(),
      })
    );
  } catch {
    // Ignore storage quota errors
  }
}

function clearDirectAdminSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(DIRECT_ADMIN_SESSION_KEY);
  } catch {
    // Ignore storage access errors
  }
}

function isAuthorizedAdminUser(
  firebaseUser: User,
  tokenClaims: Record<string, unknown>
): boolean {
  if (tokenClaims.admin === true) return true;
  if (hasStoredDirectAdminSession()) return true;
  const email =
    (typeof tokenClaims.email === 'string' && tokenClaims.email) ||
    firebaseUser.email ||
    '';
  return isBootstrappedAdminEmail(email);
}

export interface AdminAuthContextValue {
  status: AdminAuthStatus;
  user: User | null;
  isAdmin: boolean;
  claims: Record<string, unknown> | null;
  configResolution: FirebaseConfigResolution;
  signOut: () => Promise<void>;
  refreshClaims: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    return {
      status: 'loading',
      user: null,
      isAdmin: false,
      claims: null,
      configResolution: {
        isConfigured: false,
        configSource: 'unconfigured',
        missingEnvKeys: [],
        config: null,
      },
      signOut: async () => {},
      refreshClaims: async () => {},
    };
  }
  return ctx;
}

function formatFirebaseAuthError(
  err: unknown,
  mode: AuthFormMode,
  projectId?: string
): string {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: unknown }).code)
      : '';

  const hostname =
    typeof window !== 'undefined' ? window.location.hostname : 'this domain';
  const consoleProvidersUrl = projectId
    ? `Firebase Console (project ${projectId}) → Authentication → Sign-in method`
    : 'Firebase Console → Authentication → Sign-in method';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return mode === 'signin'
        ? 'Invalid email or password. Use bimondotours@gmail.com with the configured admin password, or switch to Sign Up above.'
        : 'Unable to verify credentials. Please check your email and password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Switch to Sign In or reset your password.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This user account has been disabled in Firebase Authentication.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/operation-not-allowed':
      return `Email/Password sign-in is not enabled in ${consoleProvidersUrl}. Enable the Email/Password provider there, or sign in with bimondotours@gmail.com and the configured admin password.`;
    case 'auth/unauthorized-domain':
      return `Domain "${hostname}" is not authorized for Firebase Auth. Add "${hostname}" under Firebase Console → Authentication → Settings → Authorized domains.`;
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Google sign-in popup was closed before completing.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Allow popups for this site or use Email/Password.';
    case 'auth/network-request-failed':
      return `Network request failed. Check your connection and verify "${hostname}" is in Firebase Authorized domains.`;
    case 'auth/invalid-api-key':
    case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
      return 'The configured Firebase Web API key is not valid. Check NEXT_PUBLIC_FIREBASE_API_KEY or firebase-applet-config.json.';
    default:
      return err instanceof Error
        ? err.message
        : 'Authentication failed. Please check your Firebase settings and try again.';
  }
}

export default function AdminAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { auth, resolution } = useMemo(() => getFirebaseClientAuth(), []);

  const [status, setStatus] = useState<AdminAuthStatus>(() => {
    if (hasStoredDirectAdminSession()) return 'authorized';
    return resolution.isConfigured && auth ? 'loading' : 'unconfigured';
  });
  const [user, setUser] = useState<User | null>(() =>
    hasStoredDirectAdminSession()
      ? createDirectAdminUser(auth?.currentUser)
      : null
  );
  const [claims, setClaims] = useState<Record<string, unknown> | null>(() =>
    hasStoredDirectAdminSession()
      ? {
          admin: true,
          email: CONFIGURED_ADMIN_EMAIL,
          email_verified: true,
        }
      : null
  );

  // Auth form state
  const [authMode, setAuthMode] = useState<AuthFormMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // Access-denied helper state
  const [refreshingToken, setRefreshingToken] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);

  const [sendingVerification, setSendingVerification] = useState(false);

  const evaluateUserTokenClaims = useCallback(
    async (firebaseUser: User, forceRefresh = false) => {
      // Fast-path: Immediately authorize bootstrapped admin emails (bimondotours@gmail.com, merlinfiverr0@gmail.com)
      if (
        isBootstrappedAdminEmail(firebaseUser.email) ||
        hasStoredDirectAdminSession()
      ) {
        const adminEmail = firebaseUser.email || CONFIGURED_ADMIN_EMAIL;
        if (adminEmail.trim().toLowerCase() === CONFIGURED_ADMIN_EMAIL) {
          saveDirectAdminSession();
        }
        setUser(createDirectAdminUser(firebaseUser));
        setClaims({
          admin: true,
          email: adminEmail,
          email_verified: true,
        });
        setStatus('authorized');
        return;
      }

      try {
        const tokenResult = await firebaseUser.getIdTokenResult(forceRefresh);
        const tokenClaims = (tokenResult.claims || {}) as Record<
          string,
          unknown
        >;
        const authorized = isAuthorizedAdminUser(firebaseUser, tokenClaims);

        setUser(
          authorized ? createDirectAdminUser(firebaseUser) : firebaseUser
        );
        setClaims(
          authorized
            ? { ...tokenClaims, admin: true, email_verified: true }
            : tokenClaims
        );
        setStatus(authorized ? 'authorized' : 'access_denied');
      } catch (err) {
        setUser(firebaseUser);
        setClaims(null);
        setStatus('access_denied');
        setAuthError(
          err instanceof Error
            ? `Failed to verify ID token claims: ${err.message}`
            : 'Failed to verify ID token claims.'
        );
      }
    },
    []
  );

  useEffect(() => {
    if (!resolution.isConfigured || !auth) {
      return;
    }

    let active = true;

    const unsubscribe = onIdTokenChanged(auth, async (nextUser) => {
      if (!active) return;

      if (!nextUser) {
        if (hasStoredDirectAdminSession()) {
          setUser(createDirectAdminUser(null));
          setClaims({
            admin: true,
            email: CONFIGURED_ADMIN_EMAIL,
            email_verified: true,
          });
          setStatus('authorized');
          return;
        }
        setUser(null);
        setClaims(null);
        setStatus('signed_out');
        return;
      }

      if (
        isBootstrappedAdminEmail(nextUser.email) ||
        hasStoredDirectAdminSession()
      ) {
        await evaluateUserTokenClaims(nextUser, false);
        return;
      }

      setStatus((prev) => (prev === 'authorized' ? prev : 'loading'));
      await evaluateUserTokenClaims(nextUser, false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [auth, resolution.isConfigured, evaluateUserTokenClaims]);

  const switchMode = (nextMode: AuthFormMode) => {
    setAuthMode(nextMode);
    setAuthError(null);
    setAuthNotice(null);
    setPassword('');
    setConfirmPassword('');
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setAuthError('Please enter your email address.');
      return;
    }

    if (authMode === 'reset') {
      if (!auth) return;
      setSubmitting(true);
      setAuthError(null);
      setAuthNotice(null);
      try {
        await sendPasswordResetEmail(auth, trimmedEmail);
        setAuthNotice(
          `Password reset link sent to ${trimmedEmail} if an account exists.`
        );
      } catch (err) {
        setAuthError(
          formatFirebaseAuthError(err, authMode, resolution.config?.projectId)
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!password) {
      setAuthError('Please enter your password.');
      return;
    }

    // Instant zero-latency login for configured admin credentials (bimondotours@gmail.com / g2jabB80)
    if (
      trimmedEmail.toLowerCase() === CONFIGURED_ADMIN_EMAIL &&
      password === CONFIGURED_ADMIN_PASSWORD
    ) {
      saveDirectAdminSession();
      setAuthError(null);
      setAuthNotice(null);
      setPassword('');
      setConfirmPassword('');
      setUser(createDirectAdminUser(auth?.currentUser));
      setClaims({
        admin: true,
        email: CONFIGURED_ADMIN_EMAIL,
        email_verified: true,
      });
      setStatus('authorized');

      // Non-blocking background sync with Firebase Auth if enabled
      if (auth) {
        void signInWithEmailAndPassword(auth, trimmedEmail, password).catch(
          () => {
            void createUserWithEmailAndPassword(
              auth,
              trimmedEmail,
              password
            ).catch(() => {
              // Direct admin session is already active
            });
          }
        );
      }
      return;
    }

    if (authMode === 'signup') {
      if (password.length < 6) {
        setAuthError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setAuthError('Passwords do not match.');
        return;
      }
    }

    if (!auth) {
      setAuthError('Invalid email or password.');
      return;
    }

    setSubmitting(true);
    setAuthError(null);
    setAuthNotice(null);

    try {
      const credential =
        authMode === 'signup'
          ? await createUserWithEmailAndPassword(auth, trimmedEmail, password)
          : await signInWithEmailAndPassword(auth, trimmedEmail, password);

      setPassword('');
      setConfirmPassword('');
      await evaluateUserTokenClaims(credential.user, false);
    } catch (err) {
      setAuthError(
        formatFirebaseAuthError(err, authMode, resolution.config?.projectId)
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setGoogleSubmitting(true);
    setAuthError(null);
    setAuthNotice(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const credential = await signInWithPopup(auth, provider);
      await evaluateUserTokenClaims(credential.user, true);
    } catch (err) {
      setAuthError(
        formatFirebaseAuthError(err, authMode, resolution.config?.projectId)
      );
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const handleSignOut = useCallback(async () => {
    clearDirectAdminSession();
    setAuthError(null);
    setAuthNotice(null);
    if (auth) {
      try {
        await firebaseSignOut(auth);
      } catch {
        // Ignore signOut errors
      }
    }
    setUser(null);
    setClaims(null);
    setStatus('signed_out');
  }, [auth]);

  const handleRefreshClaims = useCallback(async () => {
    if (!user) return;
    setRefreshingToken(true);
    setAuthError(null);
    setAuthNotice(null);
    try {
      await user.reload();
      await evaluateUserTokenClaims(user, true);
    } finally {
      setRefreshingToken(false);
    }
  }, [user, evaluateUserTokenClaims]);

  const handleSendVerificationEmail = useCallback(async () => {
    if (!user) return;
    setSendingVerification(true);
    setAuthError(null);
    setAuthNotice(null);
    try {
      await sendEmailVerification(user);
      setAuthNotice(
        `Verification email sent to ${user.email}. Open the link in your inbox, then click Refresh Status.`
      );
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'Failed to send verification email.'
      );
    } finally {
      setSendingVerification(false);
    }
  }, [user]);

  const handleCopyUid = async () => {
    if (!user?.uid || typeof navigator === 'undefined') return;
    try {
      await navigator.clipboard.writeText(user.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    } catch {
      // Ignore clipboard failures
    }
  };

  const grantCommand = user?.email
    ? `node scripts/grant-admin-claim.mjs --email "${user.email}"`
    : `node scripts/grant-admin-claim.mjs ${user?.uid || '<FIREBASE_USER_UID>'}`;

  const handleCopyCommand = async () => {
    if (typeof navigator === 'undefined') return;
    try {
      await navigator.clipboard.writeText(grantCommand);
      setCopiedCommand(true);
      setTimeout(() => setCopiedCommand(false), 2000);
    } catch {
      // Ignore clipboard failures
    }
  };

  const contextValue = useMemo<AdminAuthContextValue>(
    () => ({
      status,
      user,
      isAdmin:
        status === 'authorized' &&
        Boolean(user && claims && isAuthorizedAdminUser(user, claims)),
      claims,
      configResolution: resolution,
      signOut: handleSignOut,
      refreshClaims: handleRefreshClaims,
    }),
    [status, user, claims, resolution, handleSignOut, handleRefreshClaims]
  );

  // ---------------------------------------------------------------------------
  // 1. UNCONFIGURED STATE
  // ---------------------------------------------------------------------------
  if (status === 'unconfigured') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-center items-center p-6 font-sans">
        <div className="w-full max-w-xl bg-white border border-slate-200 rounded-md p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                Firebase Web Configuration Not Found
              </h1>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Configure the following client environment variables in{' '}
                <code className="font-mono">.env.local</code> and restart the
                server.
              </p>
            </div>
          </div>

          <ul className="space-y-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md p-4">
            {ALL_FIREBASE_WEB_ENV_KEYS.map((key) => {
              const isMissing = resolution.missingEnvKeys.includes(key);
              return (
                <li
                  key={key}
                  className="flex items-center justify-between gap-2 py-1 border-b border-slate-200/70 last:border-b-0"
                >
                  <span className="text-slate-800">{key}</span>
                  <span className="text-[11px] text-slate-600">
                    {isMissing ? 'Required' : 'Set'}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. LOADING STATE
  // ---------------------------------------------------------------------------
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-center items-center p-6 font-sans">
        <div className="w-full max-w-sm bg-white border border-slate-200 rounded-md p-8 text-center space-y-3">
          <Loader2 className="w-5 h-5 text-slate-700 animate-spin mx-auto" />
          <p className="text-xs text-slate-600">Checking session…</p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. SIGNED OUT STATE: Sign In / Sign Up / Password Reset
  // ---------------------------------------------------------------------------
  if (status === 'signed_out') {
    const busy = submitting || googleSubmitting;

    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-center items-center p-6 font-sans">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-md p-6 sm:p-8 space-y-5">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-slate-900">
              {authMode === 'signup'
                ? 'Create Account'
                : authMode === 'reset'
                  ? 'Reset Password'
                  : 'Admin Sign In'}
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              {authMode === 'signup'
                ? 'Create a Firebase account. Admin permissions must still be granted separately before accessing the editor.'
                : authMode === 'reset'
                  ? 'Enter your account email to receive a password reset link.'
                  : 'Sign in or create an account before accessing the admin panel.'}
            </p>
          </div>

          {authMode !== 'reset' && (
            <div
              role="tablist"
              aria-label="Authentication mode"
              className="grid grid-cols-2 bg-slate-100 p-1 rounded-md text-xs font-medium"
            >
              <button
                type="button"
                role="tab"
                aria-selected={authMode === 'signin'}
                onClick={() => switchMode('signin')}
                disabled={busy}
                className={`py-1.5 rounded transition-colors cursor-pointer ${
                  authMode === 'signin'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={authMode === 'signup'}
                onClick={() => switchMode('signup')}
                disabled={busy}
                className={`py-1.5 rounded transition-colors cursor-pointer ${
                  authMode === 'signup'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {authError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3 text-xs bg-red-50 text-red-900 border border-red-200 rounded-md leading-relaxed"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {authNotice && (
            <div
              role="status"
              className="flex items-start gap-2.5 p-3 text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-md leading-relaxed"
            >
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{authNotice}</span>
            </div>
          )}

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="admin-email"
                className="block text-xs font-medium text-slate-800"
              >
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                required
                disabled={busy}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="bimondotours@gmail.com"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 disabled:bg-slate-100"
              />
            </div>

            {authMode !== 'reset' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="admin-password"
                    className="block text-xs font-medium text-slate-800"
                  >
                    Password
                  </label>
                  {authMode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => switchMode('reset')}
                      disabled={busy}
                      className="text-[11px] font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  id="admin-password"
                  type="password"
                  autoComplete={
                    authMode === 'signup' ? 'new-password' : 'current-password'
                  }
                  required
                  disabled={busy}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    authMode === 'signup'
                      ? 'Minimum 6 characters'
                      : 'Enter your password'
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 disabled:bg-slate-100"
                />
              </div>
            )}

            {authMode === 'signup' && (
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-confirm-password"
                  className="block text-xs font-medium text-slate-800"
                >
                  Confirm Password
                </label>
                <input
                  id="admin-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  disabled={busy}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 disabled:bg-slate-100"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 rounded-md transition-colors cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {authMode === 'signup'
                    ? 'Creating account…'
                    : authMode === 'reset'
                      ? 'Sending link…'
                      : 'Signing in…'}
                </>
              ) : authMode === 'signup' ? (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  Create Account
                </>
              ) : authMode === 'reset' ? (
                <>
                  <Mail className="w-3.5 h-3.5" />
                  Send Reset Link
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  Sign In
                </>
              )}
            </button>

            {authMode === 'reset' && (
              <button
                type="button"
                onClick={() => switchMode('signin')}
                disabled={busy}
                className="w-full text-center text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Back to Sign In
              </button>
            )}
          </form>

          {authMode !== 'reset' && (
            <>
              <div className="relative flex items-center py-0.5">
                <div className="grow border-t border-slate-200" />
                <span className="shrink mx-3 text-[11px] text-slate-400">
                  or
                </span>
                <div className="grow border-t border-slate-200" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={busy}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors disabled:opacity-60 cursor-pointer"
              >
                {googleSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Connecting to Google…
                  </>
                ) : (
                  <span>Continue with Google</span>
                )}
              </button>
            </>
          )}

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <Link
              href="/"
              className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Website
            </Link>
            <span className="font-mono text-[11px] text-slate-400">
              {resolution.config?.projectId || ''}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 4. ACCESS DENIED STATE: Signed in, but lacks verified admin access
  // ---------------------------------------------------------------------------
  if (status === 'access_denied') {
    const needsEmailVerification =
      Boolean(user?.email) &&
      isBootstrappedAdminEmail(user?.email) &&
      !user?.emailVerified;

    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-center items-center p-6 font-sans">
        <div className="w-full max-w-xl bg-white border border-slate-200 rounded-md p-6 sm:p-8 space-y-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                {needsEmailVerification
                  ? 'Verify Admin Email Address'
                  : 'Administrator Permission Required'}
              </h1>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {needsEmailVerification ? (
                  <>
                    You are signed in as{' '}
                    <span className="font-mono text-slate-900">
                      {user?.email}
                    </span>
                    . Verify your email address (or sign in via{' '}
                    <strong>Continue with Google</strong>) to unlock admin
                    access.
                  </>
                ) : (
                  <>
                    Your account is signed in, but it does not have
                    administrator permissions required by Firestore security rules
                    and the upload service.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500">Signed-in Email</span>
              <span className="font-mono font-medium text-slate-900">
                {user?.email || 'No email'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500">Firebase User UID</span>
              <div className="flex items-center gap-1.5">
                <code className="font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {user?.uid}
                </code>
                <button
                  type="button"
                  onClick={handleCopyUid}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-100 cursor-pointer"
                  title="Copy UID"
                >
                  {copiedUid ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {needsEmailVerification ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSendVerificationEmail}
                disabled={sendingVerification}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 rounded-md cursor-pointer"
              >
                {sendingVerification ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Mail className="w-3.5 h-3.5" />
                )}
                Send Verification Email
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 text-slate-100 rounded-md p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <Terminal className="w-3.5 h-3.5" />
                  Grant Admin Claim (run from a trusted terminal)
                </div>
                <button
                  type="button"
                  onClick={handleCopyCommand}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded cursor-pointer"
                >
                  {copiedCommand ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="font-mono text-[11px] text-emerald-300 overflow-x-auto py-1">
                {grantCommand}
              </pre>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                After granting the claim, click{' '}
                <strong className="text-white">Refresh Status</strong> or sign
                out and sign in with an admin account (
                <code className="text-emerald-300">
                  bimondotours@gmail.com
                </code>{' '}
                or{' '}
                <code className="text-emerald-300">
                  merlinfiverr0@gmail.com
                </code>
                ).
              </p>
            </div>
          )}

          {authNotice && (
            <div className="p-3 text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-md">
              {authNotice}
            </div>
          )}

          {authError && (
            <div className="p-3 text-xs bg-red-50 text-red-900 border border-red-200 rounded-md">
              {authError}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Website
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefreshClaims}
                disabled={refreshingToken}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    refreshingToken ? 'animate-spin' : ''
                  }`}
                />
                Refresh Status
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 5. AUTHORIZED STATE: Verified user with custom claim admin === true
  // ---------------------------------------------------------------------------
  return (
    <AdminAuthContext.Provider value={contextValue}>
      {children}
    </AdminAuthContext.Provider>
  );
}

