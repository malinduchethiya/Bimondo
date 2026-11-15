'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Save,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
  LogIn,
  LogOut,
  Calendar,
  Mail,
  Phone,
  Download,
  ShieldAlert,
} from 'lucide-react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, PRIMARY_ADMIN_EMAIL } from '@/lib/firebase';
import { useSiteCms } from '@/hooks/useSiteCms';
import {
  getDefaultCmsData,
  type SiteCmsData,
  type CmsDestination,
  type CmsGalleryPhoto,
  type CmsReviewItem,
  type CmsFaqItem,
  type CmsCustomerEnquiry,
} from '@/lib/cms-defaults';
import type { Tour } from '@/lib/tours';
import type { AccommodationItem } from '@/lib/booking-types';
import type { R2UploadedMediaItem } from '@/lib/r2-client';
import AdminImageUploadField from '@/components/admin/AdminImageUploadField';
import R2BucketManagerTab, {
  type R2QuickAssignTarget,
} from '@/components/admin/R2BucketManagerTab';

type AdminTabId =
  | 'hero'
  | 'reviews'
  | 'destinations'
  | 'tours'
  | 'stays'
  | 'gallery'
  | 'faqs'
  | 'settings'
  | 'enquiries'
  | 'r2';

const ADMIN_TABS: { id: AdminTabId; number: string; label: string }[] = [
  { id: 'hero', number: '01', label: 'Hero Section' },
  { id: 'reviews', number: '02', label: 'Tourist Thoughts' },
  { id: 'destinations', number: '03', label: 'Iconic Places' },
  { id: 'tours', number: '04', label: 'Signature Tours' },
  { id: 'stays', number: '05', label: 'Boutique Stays' },
  { id: 'gallery', number: '06', label: 'Visual Gallery' },
  { id: 'faqs', number: '07', label: 'Planning FAQs' },
  { id: 'settings', number: '08', label: 'Brand & Contact' },
  { id: 'enquiries', number: '09', label: 'Bookings & Enquiries' },
  { id: 'r2', number: '10', label: 'Cloudflare R2' },
];

export default function AdminPage() {
  const {
    cms,
    authReady,
    firebaseUser,
    isVerifiedAdmin,
    setCms,
    saveCmsToFirebase,
    registerR2MediaInFirebase,
    assignR2ImageToCmsSlot,
    removeR2MediaFromFirebase,
  } = useSiteCms();

  const [activeTab, setActiveTab] = useState<AdminTabId>('hero');
  const [saving, setSaving] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const heroImages = useMemo(
    () =>
      Array.isArray(cms.general?.heroImages) &&
      cms.general.heroImages.length > 0
        ? cms.general.heroImages
        : [''],
    [cms.general]
  );

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setAuthError(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const email = (cred.user?.email || '').toLowerCase();
      if (email !== PRIMARY_ADMIN_EMAIL || !cred.user?.emailVerified) {
        setAuthError(
          `Signed in as ${
            cred.user?.email || 'unknown'
          }, which is not the authorized admin (${PRIMARY_ADMIN_EMAIL}).`
        );
      }
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      const message =
        err instanceof Error ? err.message : 'Google Sign-In failed.';
      if (code === 'auth/unauthorized-domain') {
        setAuthError(
          `Firebase Auth blocked sign-in from this domain (${window.location.hostname}). Add "${window.location.hostname}" to Firebase Console -> Authentication -> Settings -> Authorized domains.`
        );
      } else {
        setAuthError(`Google Sign-In error${code ? ` (${code})` : ''}: ${message}`);
      }
    } finally {
      setSigningIn(false);
    }
  };

  // Update shared CMS state in memory and mark dirty for text edits
  const updateDraft = (updater: (prev: SiteCmsData) => SiteCmsData) => {
    setCms((prev) => updater(prev));
    setDirty(true);
  };

  // Persist full CMS state to Firestore and propagate errors to caller
  const persistToFirestore = async (
    nextData: SiteCmsData,
    successMessage = 'Saved to Firestore and updated live site.'
  ) => {
    setSaving(true);
    setStatusBanner(null);
    try {
      await saveCmsToFirebase(nextData);
      setDirty(false);
      setStatusBanner({ type: 'success', message: successMessage });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to save to Firestore';
      setStatusBanner({
        type: 'error',
        message: msg,
      });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveManual = async () => {
    try {
      await persistToFirestore(cms, 'All changes saved to Firestore.');
    } catch {
      // Banner already displayed
    }
  };

  const handleResetDefaults = async () => {
    const defaults = getDefaultCmsData();
    try {
      await persistToFirestore(
        defaults,
        'Reset all website content in Firestore to defaults.'
      );
    } catch {
      // Banner already displayed
    }
  };

  // Quick-assign targets for R2BucketManagerTab
  const quickAssignTargets = useMemo<R2QuickAssignTarget[]>(() => {
    const targets: R2QuickAssignTarget[] = [];
    heroImages.forEach((url, idx) => {
      targets.push({
        id: `hero:${idx}`,
        group: 'Homepage',
        label: `Hero Slide #${idx + 1}`,
        currentUrl: url,
      });
    });
    targets.push({
      id: 'general:storyMainImage',
      group: 'Homepage',
      label: 'Our Story Main Image',
      currentUrl: cms.general?.storyMainImage || '',
    });
    targets.push({
      id: 'general:storySecondaryImage',
      group: 'Homepage',
      label: 'Our Story Secondary Image',
      currentUrl: cms.general?.storySecondaryImage || '',
    });
    targets.push({
      id: 'general:experienceImage',
      group: 'Homepage',
      label: 'What We Do / Experience Section Image',
      currentUrl: cms.general?.experienceImage || '',
    });
    cms.destinations.forEach((d) => {
      targets.push({
        id: `destination:${d.id}`,
        group: 'Iconic Places',
        label: d.name,
        currentUrl: d.image,
      });
    });
    cms.tours.forEach((t) => {
      targets.push({
        id: `tour:${t.id}`,
        group: 'Signature Tours',
        label: t.name,
        currentUrl: t.image,
      });
    });
    cms.stays.forEach((s) => {
      targets.push({
        id: `stay:${s.id}`,
        group: 'Boutique Stays',
        label: s.name,
        currentUrl: s.image,
      });
    });
    cms.gallery.forEach((g) => {
      targets.push({
        id: `gallery:${g.id}`,
        group: 'Visual Gallery',
        label: g.title,
        currentUrl: g.image,
      });
    });
    cms.reviews.forEach((r) => {
      targets.push({
        id: `review:${r.id}`,
        group: 'Tourist Thoughts',
        label: r.name,
        currentUrl: r.image,
      });
    });
    return targets;
  }, [cms, heroImages]);

  /**
   * Atomically assigns an R2 image to any target slot and commits `site_cms/main`,
   * the collection doc, and `r2_media/{id}` in one writeBatch.
   */
  const handleAssignFromR2 = async (
    targetId: string,
    url: string,
    label?: string,
    mediaItem?: R2UploadedMediaItem
  ) => {
    const [type, id] = targetId.split(':');
    setSaving(true);
    setStatusBanner(null);

    try {
      if (type === 'hero') {
        const index = Number(id);
        await assignR2ImageToCmsSlot({
          mediaItem,
          applyToCms: (current) => {
            const currentHeroes =
              Array.isArray(current.general?.heroImages) &&
              current.general.heroImages.length > 0
                ? [...current.general.heroImages]
                : [''];
            if (
              !Number.isNaN(index) &&
              index >= 0 &&
              index < currentHeroes.length
            ) {
              currentHeroes[index] = url;
            } else {
              currentHeroes.push(url);
            }
            return {
              ...current,
              general: {
                ...current.general,
                heroImages: currentHeroes.filter(Boolean),
              },
            };
          },
        });
      } else if (type === 'general') {
        await assignR2ImageToCmsSlot({
          mediaItem,
          applyToCms: (current) => ({
            ...current,
            general: {
              ...current.general,
              [id]: url,
            },
          }),
        });
      } else if (type === 'destination') {
        await assignR2ImageToCmsSlot({
          mediaItem,
          applyToCms: (current) => ({
            ...current,
            destinations: current.destinations.map((d) =>
              d.id === id ? { ...d, image: url } : d
            ),
          }),
          collectionDoc: {
            collectionName: 'destinations',
            docId: id,
            getPayload: (updated) =>
              updated.destinations.find((d) => d.id === id),
          },
        });
      } else if (type === 'tour') {
        await assignR2ImageToCmsSlot({
          mediaItem,
          applyToCms: (current) => ({
            ...current,
            tours: current.tours.map((t) =>
              t.id === id ? { ...t, image: url } : t
            ),
          }),
          collectionDoc: {
            collectionName: 'tours',
            docId: id,
            getPayload: (updated) => updated.tours.find((t) => t.id === id),
          },
        });
      } else if (type === 'stay') {
        await assignR2ImageToCmsSlot({
          mediaItem,
          applyToCms: (current) => ({
            ...current,
            stays: current.stays.map((s) =>
              s.id === id ? { ...s, image: url } : s
            ),
          }),
          collectionDoc: {
            collectionName: 'stays',
            docId: id,
            getPayload: (updated) => updated.stays.find((s) => s.id === id),
          },
        });
      } else if (type === 'gallery') {
        await assignR2ImageToCmsSlot({
          mediaItem,
          applyToCms: (current) => ({
            ...current,
            gallery: current.gallery.map((g) =>
              g.id === id ? { ...g, image: url } : g
            ),
          }),
          collectionDoc: {
            collectionName: 'gallery',
            docId: id,
            getPayload: (updated) => updated.gallery.find((g) => g.id === id),
          },
        });
      } else if (type === 'review') {
        await assignR2ImageToCmsSlot({
          mediaItem,
          applyToCms: (current) => ({
            ...current,
            reviews: current.reviews.map((r) =>
              r.id === id ? { ...r, image: url } : r
            ),
          }),
          collectionDoc: {
            collectionName: 'reviews',
            docId: id,
            getPayload: (updated) => updated.reviews.find((r) => r.id === id),
          },
        });
      }

      setStatusBanner({
        type: 'success',
        message: `Assigned R2 image to ${
          label || targetId
        } and committed to Firestore.`,
      });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to assign image in Firestore.';
      setStatusBanner({
        type: 'error',
        message: msg,
      });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleExportEnquiriesCsv = () => {
    if (cms.enquiries.length === 0) return;
    const headers = [
      'ID',
      'Status',
      'Name',
      'Email',
      'Phone',
      'Method',
      'Package',
      'Arrival',
      'Guests',
      'Duration',
      'Created At',
    ];
    const rows = cms.enquiries.map((e) => [
      e.id || '',
      e.status || 'new',
      e.name || '',
      e.email || '',
      e.phone || '',
      e.bookingMethod || 'direct_admin',
      e.selectedPackage || '',
      e.arrival || '',
      e.guests || '',
      e.duration || '',
      e.createdAt || '',
    ]);
    const csv = [headers, ...rows]
      .map((r) =>
        r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bimondo-enquiries-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredEnquiries = cms.enquiries.filter((e) =>
    statusFilter === 'all' ? true : (e.status || 'new') === statusFilter
  );

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-sm tracking-tight text-stone-900">
              Bimondo CMS &amp; R2 Admin
            </span>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900"
            >
              View Live Site
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {firebaseUser ? (
              <div className="flex items-center gap-2 text-xs text-stone-600 mr-2">
                <span
                  className={`px-2 py-0.5 rounded border font-mono ${
                    isVerifiedAdmin
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}
                >
                  {firebaseUser.email}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthError(null);
                    signOut(auth);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-stone-200 rounded hover:bg-stone-100"
                >
                  <LogOut className="w-3 h-3" />
                  Sign out
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={signingIn}
                onClick={handleGoogleSignIn}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded hover:bg-stone-50 disabled:opacity-50"
              >
                {signingIn ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogIn className="w-3.5 h-3.5" />
                )}
                Admin Google Sign-In
              </button>
            )}

            <button
              type="button"
              onClick={handleResetDefaults}
              disabled={!isVerifiedAdmin || saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 bg-white border border-stone-300 rounded hover:bg-stone-50 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>

            <button
              type="button"
              onClick={handleSaveManual}
              disabled={!isVerifiedAdmin || saving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-stone-900 rounded hover:bg-stone-800 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {saving
                ? 'Saving...'
                : dirty
                ? 'Save Changes *'
                : 'Save to Firestore'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Navigation Sidebar */}
        <aside className="lg:col-span-3 space-y-1">
          {ADMIN_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-medium rounded border text-left transition-colors ${
                  active
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <span>
                  <span className="font-mono mr-2 text-stone-400">
                    {tab.number}
                  </span>
                  {tab.label}
                </span>
                {tab.id === 'enquiries' && cms.enquiries.length > 0 && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] rounded font-mono ${
                      active
                        ? 'bg-stone-700 text-white'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {cms.enquiries.length}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Main Content Panel */}
        <main className="lg:col-span-9 space-y-6">
          {/* Verified Admin Gate Banner */}
          {authReady && !isVerifiedAdmin && (
            <div className="p-4 rounded border border-amber-300 bg-amber-50 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                <div className="space-y-1">
                  <p className="font-semibold">
                    Verified Admin Sign-In Required
                  </p>
                  <p className="text-amber-800">
                    {firebaseUser
                      ? `Signed in as ${firebaseUser.email}, which does not have admin write permissions. Sign in with ${PRIMARY_ADMIN_EMAIL} to upload to R2 or publish changes to Firestore.`
                      : `Sign in with your authorized Google account (${PRIMARY_ADMIN_EMAIL}) to upload images to Cloudflare R2 and publish updates to Firestore.`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={signingIn}
                onClick={handleGoogleSignIn}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-stone-900 rounded hover:bg-stone-800 shrink-0 disabled:opacity-50"
              >
                {signingIn ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogIn className="w-3.5 h-3.5" />
                )}
                Sign In with Google
              </button>
            </div>
          )}

          {/* Google Sign-In Error Banner */}
          {authError && (
            <div className="p-3.5 rounded border border-red-200 bg-red-50 text-red-700 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
              <button
                type="button"
                onClick={() => setAuthError(null)}
                className="text-[11px] underline opacity-75 hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Status Notification */}
          {statusBanner && (
            <div
              className={`p-3.5 rounded border text-xs flex items-center justify-between gap-2 ${
                statusBanner.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusBanner.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{statusBanner.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setStatusBanner(null)}
                className="text-[11px] underline opacity-75 hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* 01. HERO SECTION */}
          {activeTab === 'hero' && (
            <div className="border border-stone-200 bg-white p-6 rounded-md space-y-6">
              <div>
                <h2 className="text-base font-semibold text-stone-900">
                  01. Hero Section
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Configure the main hero headline and background slideshow
                  images served from Cloudflare R2 and saved in Firestore (
                  <code className="font-mono">site_cms/main</code>).
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Site Name / Headline Brand
                  </label>
                  <input
                    type="text"
                    value={cms.general.siteName}
                    onChange={(e) =>
                      updateDraft((prev) => ({
                        ...prev,
                        general: { ...prev.general, siteName: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Hero Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={cms.general.tagline}
                    onChange={(e) =>
                      updateDraft((prev) => ({
                        ...prev,
                        general: { ...prev.general, tagline: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-stone-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                    Hero Slideshow Images ({heroImages.length})
                  </h3>
                  <button
                    type="button"
                    disabled={!isVerifiedAdmin}
                    onClick={() =>
                      updateDraft((prev) => ({
                        ...prev,
                        general: {
                          ...prev.general,
                          heroImages: [...heroImages, ''],
                        },
                      }))
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-stone-700 bg-stone-100 rounded hover:bg-stone-200 disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Slide
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {heroImages.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="border border-stone-200 rounded p-4 space-y-3 bg-stone-50/50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-stone-700">
                          Hero Slide #{idx + 1}
                        </span>
                        {heroImages.length > 1 && (
                          <button
                            type="button"
                            disabled={!isVerifiedAdmin}
                            onClick={() => {
                              const next = heroImages.filter(
                                (_, i) => i !== idx
                              );
                              persistToFirestore(
                                {
                                  ...cms,
                                  general: { ...cms.general, heroImages: next },
                                },
                                `Removed Hero Slide #${
                                  idx + 1
                                } and updated Firestore.`
                              ).catch(() => {});
                            }}
                            className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline disabled:opacity-50"
                          >
                            <Trash2 className="w-3 h-3" />
                            Remove
                          </button>
                        )}
                      </div>

                      <AdminImageUploadField
                        label={`Hero Slide #${idx + 1} (R2 general/)`}
                        slotId={`hero:${idx}`}
                        value={imgUrl}
                        folder="general"
                        onR2Deleted={(_, docId) =>
                          removeR2MediaFromFirebase(docId)
                        }
                        onOpenR2Settings={() => setActiveTab('r2')}
                        onChange={async (newUrl, uploadedItem) => {
                          await handleAssignFromR2(
                            `hero:${idx}`,
                            newUrl,
                            `Hero Slide #${idx + 1}`,
                            uploadedItem
                          );
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Homepage Story & Experience Section Images */}
              <div className="space-y-4 pt-4 border-t border-stone-200">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                  Homepage Section Images (Our Story &amp; What We Do)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <AdminImageUploadField
                    label="Our Story — Main Image (R2 general/)"
                    slotId="general:storyMainImage"
                    value={cms.general.storyMainImage || ''}
                    folder="general"
                    onR2Deleted={(_, docId) => removeR2MediaFromFirebase(docId)}
                    onOpenR2Settings={() => setActiveTab('r2')}
                    onChange={async (newUrl, uploadedItem) => {
                      await handleAssignFromR2(
                        'general:storyMainImage',
                        newUrl,
                        'Our Story Main Image',
                        uploadedItem
                      );
                    }}
                  />

                  <AdminImageUploadField
                    label="Our Story — Secondary Image (R2 general/)"
                    slotId="general:storySecondaryImage"
                    value={cms.general.storySecondaryImage || ''}
                    folder="general"
                    onR2Deleted={(_, docId) => removeR2MediaFromFirebase(docId)}
                    onOpenR2Settings={() => setActiveTab('r2')}
                    onChange={async (newUrl, uploadedItem) => {
                      await handleAssignFromR2(
                        'general:storySecondaryImage',
                        newUrl,
                        'Our Story Secondary Image',
                        uploadedItem
                      );
                    }}
                  />

                  <AdminImageUploadField
                    label="What We Do — Experience Image (R2 general/)"
                    slotId="general:experienceImage"
                    value={cms.general.experienceImage || ''}
                    folder="general"
                    onR2Deleted={(_, docId) => removeR2MediaFromFirebase(docId)}
                    onOpenR2Settings={() => setActiveTab('r2')}
                    onChange={async (newUrl, uploadedItem) => {
                      await handleAssignFromR2(
                        'general:experienceImage',
                        newUrl,
                        'What We Do Experience Image',
                        uploadedItem
                      );
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 02. TOURIST THOUGHTS (REVIEWS) */}
          {activeTab === 'reviews' && (
            <div className="border border-stone-200 bg-white p-6 rounded-md space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-stone-900">
                    02. Tourist Thoughts (Guest Reviews)
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Manage guest stories, ratings, and traveler photos synced to
                    Firestore (<code className="font-mono">/reviews</code>).
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!isVerifiedAdmin}
                  onClick={() => {
                    const newReview: CmsReviewItem = {
                      id: `thought-${Date.now()}`,
                      name: 'New Guest',
                      location: 'United Kingdom',
                      rating: 5,
                      tour: 'Signature Sri Lanka Journey',
                      date: 'Visited 2026',
                      quote:
                        'An unforgettable private journey through Sri Lanka.',
                      image: '',
                    };
                    updateDraft((prev) => ({
                      ...prev,
                      reviews: [newReview, ...prev.reviews],
                    }));
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-stone-900 rounded hover:bg-stone-800 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Review
                </button>
              </div>

              <div className="space-y-4">
                {cms.reviews.map((rev, idx) => (
                  <div
                    key={rev.id}
                    className="border border-stone-200 rounded p-4 space-y-4 bg-stone-50/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-stone-800">
                        {idx + 1}. {rev.name} ({rev.location})
                      </span>
                      <button
                        type="button"
                        disabled={!isVerifiedAdmin}
                        onClick={() => {
                          const next = cms.reviews.filter(
                            (r) => r.id !== rev.id
                          );
                          persistToFirestore(
                            { ...cms, reviews: next },
                            `Removed review "${rev.name}" from Firestore.`
                          ).catch(() => {});
                        }}
                        className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-stone-600 mb-1">
                          Guest Name
                        </label>
                        <input
                          type="text"
                          value={rev.name}
                          onChange={(e) =>
                            updateDraft((prev) => ({
                              ...prev,
                              reviews: prev.reviews.map((r) =>
                                r.id === rev.id
                                  ? { ...r, name: e.target.value }
                                  : r
                              ),
                            }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-stone-600 mb-1">
                          Country / Location
                        </label>
                        <input
                          type="text"
                          value={rev.location}
                          onChange={(e) =>
                            updateDraft((prev) => ({
                              ...prev,
                              reviews: prev.reviews.map((r) =>
                                r.id === rev.id
                                  ? { ...r, location: e.target.value }
                                  : r
                              ),
                            }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-stone-600 mb-1">
                          Tour Taken
                        </label>
                        <input
                          type="text"
                          value={rev.tour}
                          onChange={(e) =>
                            updateDraft((prev) => ({
                              ...prev,
                              reviews: prev.reviews.map((r) =>
                                r.id === rev.id
                                  ? { ...r, tour: e.target.value }
                                  : r
                              ),
                            }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-stone-600 mb-1">
                        Review Quote
                      </label>
                      <textarea
                        rows={2}
                        value={rev.quote}
                        onChange={(e) =>
                          updateDraft((prev) => ({
                            ...prev,
                            reviews: prev.reviews.map((r) =>
                              r.id === rev.id
                                ? { ...r, quote: e.target.value }
                                : r
                            ),
                          }))
                        }
                        className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded bg-white"
                      />
                    </div>

                    <AdminImageUploadField
                      label="Guest Photo (R2 general/ folder)"
                      slotId={`review:${rev.id}`}
                      value={rev.image || ''}
                      folder="general"
                      onR2Deleted={(_, docId) => removeR2MediaFromFirebase(docId)}
                      onOpenR2Settings={() => setActiveTab('r2')}
                      onChange={async (newUrl, uploadedItem) => {
                        await handleAssignFromR2(
                          `review:${rev.id}`,
                          newUrl,
                          `Review: ${rev.name}`,
                          uploadedItem
                        );
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 03. ICONIC PLACES (DESTINATIONS) */}
          {activeTab === 'destinations' && (
            <div className="border border-stone-200 bg-white p-6 rounded-md space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-stone-900">
                    03. Iconic Places (Destinations)
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Manage destination cards and R2 images synced to Firestore (
                    <code className="font-mono">/destinations</code>).
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!isVerifiedAdmin}
                  onClick={() => {
                    const newDest: CmsDestination = {
                      id: `dest-${Date.now()}`,
                      name: 'New Destination',
                      region: 'culture',
                      regionLabel: 'Cultural Triangle',
                      season: 'Year-round',
                      tagline: 'Cultural & Scenic Region',
                      description:
                        'Discover ancient heritage and breathtaking natural landscapes.',
                      highlights: ['Private Guided Tour', 'Scenic Views'],
                      image: '',
                    };
                    updateDraft((prev) => ({
                      ...prev,
                      destinations: [...prev.destinations, newDest],
                    }));
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-stone-900 rounded hover:bg-stone-800 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Destination
                </button>
              </div>

              <div className="space-y-4">
                {cms.destinations.map((dest, idx) => (
                  <div
                    key={dest.id}
                    className="border border-stone-200 rounded p-4 space-y-4 bg-stone-50/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-stone-800">
                        {idx + 1}. {dest.name} ({dest.regionLabel})
                      </span>
                      <button
                        type="button"
                        disabled={!isVerifiedAdmin}
                        onClick={() => {
                          const next = cms.destinations.filter(
                            (d) => d.id !== dest.id
                          );
                          persistToFirestore(
                            { ...cms, destinations: next },
                            `Deleted destination "${dest.name}" from Firestore.`
                          ).catch(() => {});
                        }}
                        className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-stone-600 mb-1">
                          Destination Name
                        </label>
                        <input
                          type="text"
                          value={dest.name}
                          onChange={(e) =>
                            updateDraft((prev) => ({
                              ...prev,
                              destinations: prev.destinations.map((d) =>
                                d.id === dest.id
                                  ? { ...d, name: e.target.value }
                                  : d
                              ),
                            }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-stone-600 mb-1">
                          Tagline
                        </label>
                        <input
                          type="text"
                          value={dest.tagline}
                          onChange={(e) =>
                            updateDraft((prev) => ({
                              ...prev,
                              destinations: prev.destinations.map((d) =>
                                d.id === dest.id
                                  ? { ...d, tagline: e.target.value }
                                  : d
                              ),
                            }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-stone-600 mb-1">
                          Best Season
                        </label>
                        <input
                          type="text"
                          value={dest.season}
                          onChange={(e) =>
                            updateDraft((prev) => ({
                              ...prev,
                              destinations: prev.destinations.map((d) =>
                                d.id === dest.id
                                  ? { ...d, season: e.target.value }
                                  : d
                              ),
                            }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-stone-600 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={2}
                        value={dest.description}
                        onChange={(e) =>
                          updateDraft((prev) => ({
                            ...prev,
                            destinations: prev.destinations.map((d) =>
                              d.id === dest.id
                                ? { ...d, description: e.target.value }
                                : d
                            ),
                          }))
                        }
                        className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded bg-white"
                      />
                    </div>

                    <AdminImageUploadField
                      label="Destination Image (R2 destinations/ folder)"
                      slotId={`destination:${dest.id}`}
                      value={dest.image}
                      folder="destinations"
                      onR2Deleted={(_, docId) => removeR2MediaFromFirebase(docId)}
                      onOpenR2Settings={() => setActiveTab('r2')}
                      onChange={async (newUrl, uploadedItem) => {
                        await handleAssignFromR2(
                          `destination:${dest.id}`,
                          newUrl,
                          `Destination: ${dest.name}`,
                          uploadedItem
                        );
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 04. SIGNATURE TOURS */}
          {activeTab === 'tours' && (
            <div className="border border-stone-200 bg-white p-6 rounded-md space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-stone-900">
                    04. Signature Tours
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Manage curated tour packages and cover images synced to
                    Firestore (<code className="font-mono">/tours</code>).
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!isVerifiedAdmin}
                  onClick={() => {
                    const fallbackTheme = cms.tours[0]?.theme || {
                      primary: '#1E3A2F',
                      accent: '#C89B5B',
                      bgGradient:
                        'linear-gradient(135deg, #1E3A2F 0%, #0F2019 100%)',
                      glowColor: 'rgba(200, 155, 91, 0.25)',
                      cardBorder: 'rgba(200, 155, 91, 0.3)',
                      tagBg: 'rgba(200, 155, 91, 0.15)',
                      tagColor: '#E5C384',
                    };
                    const newTour: Tour = {
                      id: `tour-${Date.now()}`,
                      name: 'New Private Sri Lanka Journey',
                      days: 7,
                      durationLabel: '7 Days / 6 Nights',
                      category: 'heritage',
                      categoryLabel: 'Cultural & Heritage',
                      route: 'Colombo · Sigiriya · Kandy · Ella · Galle',
                      description:
                        'A private tailor-made journey across Sri Lanka.',
                      highlights:
                        'Private Chauffeur-Guide, Boutique Stays, Cultural Icons',
                      image: '',
                      theme: fallbackTheme,
                    };
                    updateDraft((prev) => ({
                      ...prev,
                      tours: [...prev.tours, newTour],
                    }));
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-stone-900 rounded hover:bg-stone-800 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Tour Package
                </button>
              </div>

              <div className="space-y-5">
                {cms.tours.map((tour, idx) => (
                  <div
                    key={tour.id}
                    className="border border-stone-200 rounded p-4 space-y-4 bg-stone-50/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-stone-800">
                        {idx + 1}. {tour.name} (
                        {tour.durationLabel || `${tour.days} Days`})
                      </span>
                      <button
                        type="button"
                        disabled={!isVerifiedAdmin}
                        onClick={() => {
                          const next = cms.tours.filter(
                            (t) => t.id !== tour.id
                          );
                          persistToFirestore(
                            { ...cms, tours: next },
                            `Removed tour "${tour.name}" from Firestore.`
                          ).catch(() => {});
                        }}
                        className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-stone-600 mb-1">
                          Tour Name
                        </label>
                        <input
                          type="text"
                          value={tour.name}
                          onChange={(e) =>
                            updateDraft((prev) => ({
                              ...prev,
                              tours: prev.tours.map((t) =>
                                t.id === tour.id
                                  ? { ...t, name: e.target.value }
                                  : t
                              ),
                            }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-stone-600 mb-1">
                          Days
                        </label>
                        <input
                          type="number"
                          value={tour.days}
                          onChange={(e) =>
                            updateDraft((prev) => ({
                              ...prev,
                              tours: prev.tours.map((t) =>
                                t.id === tour.id
                                  ? { ...t, days: Number(e.target.value) || 1 }
                                  : t
                              ),
                            }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-stone-600 mb-1">
                          Category Label
                        </label>
                        <input
                          type="text"
                          value={tour.categoryLabel}
                          onChange={(e) =>
                            updateDraft((prev) => ({
                              ...prev,
                              tours: prev.tours.map((t) =>
                                t.id === tour.id
                                  ? { ...t, categoryLabel: e.target.value }
                                  : t
                              ),
                            }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-stone-600 mb-1">
                          Route
                        </label>
                        <input
                          type="text"
                          value={tour.route}
                          onChange={(e) =>
                            updateDraft((prev) => ({
                              ...prev,
                              tours: prev.tours.map((t) =>
                                t.id === tour.id
                                  ? { ...t, route: e.target.value }
                                  : t
                              ),
                            }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-stone-600 mb-1">
                          Highlights
                        </label>
                        <input
                          type="text"
                          value={tour.highlights}
                          onChange={(e) =>
                            updateDraft((prev) => ({
                              ...prev,
                              tours: prev.tours.map((t) =>
                                t.id === tour.id
                                  ? { ...t, highlights: e.target.value }
                                  : t
                              ),
                            }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-stone-600 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={2}
                        value={tour.description}
                        onChange={(e) =>
                          updateDraft((prev) => ({
                            ...prev,
                            tours: prev.tours.map((t) =>
                              t.id === tour.id
                                ? { ...t, description: e.target.value }
                                : t
                            ),
                          }))
                        }
                        className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded bg-white"
                      />
                    </div>

                    <AdminImageUploadField
                      label="Tour Cover Image (R2 tours/ folder)"
                      slotId={`tour:${tour.id}`}
                      value={tour.image}
                      folder="tours"
                      onR2Deleted={(_, docId) => removeR2MediaFromFirebase(docId)}
                      onOpenR2Settings={() => setActiveTab('r2')}
                      onChange={async (newUrl, uploadedItem) => {
                        await handleAssignFromR2(
                          `tour:${tour.id}`,
                          newUrl,
                          `Tour: ${tour.name}`,
                          uploadedItem
                        );
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 05. BOUTIQUE STAYS */}
          {activeTab === 'stays' && (
            <div className="border border-stone-200 bg-white p-6 rounded-md space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-stone-900">
                    05. Boutique Stays
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Manage partner boutique hotels, luxury lodges, and R2 images
                    synced to Firestore (<code className="font-mono">/stays</code>
                    ).
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!isVerifiedAdmin}
                  onClick={() => {
                    const newStay: AccommodationItem = {
                      id: `stay-${Date.now()}`,
                      name: 'New Boutique Sanctuary',
                      location: 'Hill Country, Sri Lanka',
                      region: 'hills',
                      regionLabel: 'Tea Country & Hills',
                      tagline: 'Tea Estate Sanctuary',
                      description:
                        'Intimate architectural sanctuary surrounded by nature.',
                      highlights: ['Infinity Pool', 'Spa', 'Fine Dining'],
                      maxGuestsPerRoom: 3,
                      image: '',
                    };
                    updateDraft((prev) => ({
                      ...prev,
                      stays: [...prev.stays, newStay],
                    }));
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-stone-900 rounded hover:bg-stone-800 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Stay
                </button>
              </div>

              <div className="space-y-4">
                {cms.stays.map((stay, idx) => (
                  <div
                    key={stay.id}
                    className="border border-stone-200 rounded p-4 space-y-4 bg-stone-50/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-stone-800">
                        {idx + 1}. {stay.name} ({stay.location})
                      </span>
                      <button
                        type="button"
                        disabled={!isVerifiedAdmin}
                        onClick={() => {
                          const next = cms.stays.filter(
                            (s) => s.id !== stay.id
                          );
                          persistToFirestore(
                            { ...cms, stays: next },
                            `Removed stay "${stay.name}" from Firestore.`
                          ).catch(() => {});
                        }}
                        className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-stone-600 mb-1">
                          Property Name
                        </label>
                        <input
                          type="text"
                          value={stay.name}
                          onChange={(e) =>
                            updateDraft((prev) => ({
                              ...prev,
                              stays: prev.stays.map((s) =>
                                s.id === stay.id
                                  ? { ...s, name: e.target.value }
                                  : s
                              ),
                            }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-stone-600 mb-1">
                          Location
                        </label>
                        <input
                          type="text"
                          value={stay.location}
                          onChange={(e) =>
                            updateDraft((prev) => ({
                              ...prev,
                              stays: prev.stays.map((s) =>
                                s.id === stay.id
                                  ? { ...s, location: e.target.value }
                                  : s
                              ),
                            }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-stone-600 mb-1">
                          Tagline / Style
                        </label>
                        <input
                          type="text"
                          value={stay.tagline}
                          onChange={(e) =>
                            updateDraft((prev) => ({
                              ...prev,
                              stays: prev.stays.map((s) =>
                                s.id === stay.id
                                  ? { ...s, tagline: e.target.value }
                                  : s
                              ),
                            }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-stone-600 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={2}
                        value={stay.description}
                        onChange={(e) =>
                          updateDraft((prev) => ({
                            ...prev,
                            stays: prev.stays.map((s) =>
                              s.id === stay.id
                                ? { ...s, description: e.target.value }
                                : s
                            ),
                          }))
                        }
                        className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded bg-white"
                      />
                    </div>

                    <AdminImageUploadField
                      label="Stay Image (R2 stays/ folder)"
                      slotId={`stay:${stay.id}`}
                      value={stay.image}
                      folder="stays"
                      onR2Deleted={(_, docId) => removeR2MediaFromFirebase(docId)}
                      onOpenR2Settings={() => setActiveTab('r2')}
                      onChange={async (newUrl, uploadedItem) => {
                        await handleAssignFromR2(
                          `stay:${stay.id}`,
                          newUrl,
                          `Stay: ${stay.name}`,
                          uploadedItem
                        );
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 06. VISUAL GALLERY */}
          {activeTab === 'gallery' && (
            <div className="border border-stone-200 bg-white p-6 rounded-md space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-stone-900">
                    06. Visual Gallery
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Curate visual gallery moments served from Cloudflare R2 and
                    synced to Firestore (<code className="font-mono">/gallery</code>
                    ).
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!isVerifiedAdmin}
                  onClick={() => {
                    const newItem: CmsGalleryPhoto = {
                      id: `gal-${Date.now()}`,
                      title: 'New Gallery Moment',
                      location: 'Sri Lanka',
                      category: 'culture',
                      categoryLabel: 'Sacred Heritage',
                      image: '',
                      description: 'Captured on a private Bimondo journey.',
                    };
                    updateDraft((prev) => ({
                      ...prev,
                      gallery: [...prev.gallery, newItem],
                    }));
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-stone-900 rounded hover:bg-stone-800 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Gallery Photo
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cms.gallery.map((item, idx) => (
                  <div
                    key={item.id}
                    className="border border-stone-200 rounded p-4 space-y-3 bg-stone-50/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-stone-800">
                        {idx + 1}. {item.title}
                      </span>
                      <button
                        type="button"
                        disabled={!isVerifiedAdmin}
                        onClick={() => {
                          const next = cms.gallery.filter(
                            (g) => g.id !== item.id
                          );
                          persistToFirestore(
                            { ...cms, gallery: next },
                            `Removed gallery item "${item.title}" from Firestore.`
                          ).catch(() => {});
                        }}
                        className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-stone-600 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) =>
                            updateDraft((prev) => ({
                              ...prev,
                              gallery: prev.gallery.map((g) =>
                                g.id === item.id
                                  ? { ...g, title: e.target.value }
                                  : g
                              ),
                            }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-stone-600 mb-1">
                          Location
                        </label>
                        <input
                          type="text"
                          value={item.location}
                          onChange={(e) =>
                            updateDraft((prev) => ({
                              ...prev,
                              gallery: prev.gallery.map((g) =>
                                g.id === item.id
                                  ? { ...g, location: e.target.value }
                                  : g
                              ),
                            }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded bg-white"
                        />
                      </div>
                    </div>

                    <AdminImageUploadField
                      label="Gallery Image (R2 gallery/ folder)"
                      slotId={`gallery:${item.id}`}
                      value={item.image}
                      folder="gallery"
                      onR2Deleted={(_, docId) => removeR2MediaFromFirebase(docId)}
                      onOpenR2Settings={() => setActiveTab('r2')}
                      onChange={async (newUrl, uploadedItem) => {
                        await handleAssignFromR2(
                          `gallery:${item.id}`,
                          newUrl,
                          `Gallery: ${item.title}`,
                          uploadedItem
                        );
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 07. PLANNING FAQS */}
          {activeTab === 'faqs' && (
            <div className="border border-stone-200 bg-white p-6 rounded-md space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-stone-900">
                    07. Planning FAQs
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Manage frequently asked questions synced to Firestore (
                    <code className="font-mono">/faqs</code>).
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!isVerifiedAdmin}
                  onClick={() => {
                    const newFaq: CmsFaqItem = {
                      id: `faq-${Date.now()}`,
                      category: 'booking',
                      q: 'How far in advance should we book?',
                      a: 'We recommend booking 2 to 4 months ahead for peak season boutique stays.',
                    };
                    updateDraft((prev) => ({
                      ...prev,
                      faqs: [...prev.faqs, newFaq],
                    }));
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-stone-900 rounded hover:bg-stone-800 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add FAQ
                </button>
              </div>

              <div className="space-y-3">
                {cms.faqs.map((faq, idx) => (
                  <div
                    key={faq.id}
                    className="border border-stone-200 rounded p-4 space-y-3 bg-stone-50/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-stone-800">
                        FAQ #{idx + 1}
                      </span>
                      <button
                        type="button"
                        disabled={!isVerifiedAdmin}
                        onClick={() => {
                          const next = cms.faqs.filter((f) => f.id !== faq.id);
                          persistToFirestore(
                            { ...cms, faqs: next },
                            'Removed FAQ item from Firestore.'
                          ).catch(() => {});
                        }}
                        className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-stone-600 mb-1">
                          Category
                        </label>
                        <select
                          value={faq.category}
                          onChange={(e) =>
                            updateDraft((prev) => ({
                              ...prev,
                              faqs: prev.faqs.map((f) =>
                                f.id === faq.id
                                  ? {
                                      ...f,
                                      category: e.target.value as
                                        | 'private'
                                        | 'stays'
                                        | 'booking',
                                    }
                                  : f
                              ),
                            }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded bg-white"
                        >
                          <option value="private">Private Tours</option>
                          <option value="stays">Stays &amp; Transport</option>
                          <option value="booking">Booking &amp; Seasons</option>
                        </select>
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-medium text-stone-600 mb-1">
                          Question
                        </label>
                        <input
                          type="text"
                          value={faq.q}
                          onChange={(e) =>
                            updateDraft((prev) => ({
                              ...prev,
                              faqs: prev.faqs.map((f) =>
                                f.id === faq.id
                                  ? { ...f, q: e.target.value }
                                  : f
                              ),
                            }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-stone-600 mb-1">
                        Answer
                      </label>
                      <textarea
                        rows={2}
                        value={faq.a}
                        onChange={(e) =>
                          updateDraft((prev) => ({
                            ...prev,
                            faqs: prev.faqs.map((f) =>
                              f.id === faq.id ? { ...f, a: e.target.value } : f
                            ),
                          }))
                        }
                        className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 08. BRAND & CONTACT */}
          {activeTab === 'settings' && (
            <div className="border border-stone-200 bg-white p-6 rounded-md space-y-6">
              <div>
                <h2 className="text-base font-semibold text-stone-900">
                  08. Brand &amp; Contact Settings
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Configure contact details and WhatsApp number stored in
                  Firestore (<code className="font-mono">site_cms/main</code>).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    WhatsApp Number (digits only, e.g. 94762232054)
                  </label>
                  <input
                    type="text"
                    value={cms.general.whatsappNumber}
                    onChange={(e) =>
                      updateDraft((prev) => ({
                        ...prev,
                        general: {
                          ...prev.general,
                          whatsappNumber: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={cms.general.contactEmail}
                    onChange={(e) =>
                      updateDraft((prev) => ({
                        ...prev,
                        general: {
                          ...prev.general,
                          contactEmail: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Office Location Label
                  </label>
                  <input
                    type="text"
                    value={cms.general.locationLabel}
                    onChange={(e) =>
                      updateDraft((prev) => ({
                        ...prev,
                        general: {
                          ...prev.general,
                          locationLabel: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Instagram URL
                  </label>
                  <input
                    type="url"
                    value={cms.general.instagramUrl}
                    onChange={(e) =>
                      updateDraft((prev) => ({
                        ...prev,
                        general: {
                          ...prev.general,
                          instagramUrl: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 09. BOOKINGS & ENQUIRIES */}
          {activeTab === 'enquiries' && (
            <div className="border border-stone-200 bg-white p-6 rounded-md space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-stone-900">
                    09. Bookings &amp; Enquiries ({filteredEnquiries.length})
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Real-time customer enquiries from Direct Admin, WhatsApp,
                    Email, and Callback channels stored in Firestore (
                    <code className="font-mono">/enquiries</code>).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs border border-stone-300 rounded bg-white"
                  >
                    <option value="all">All Statuses</option>
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="replied">Replied</option>
                    <option value="archived">Archived</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleExportEnquiriesCsv}
                    disabled={cms.enquiries.length === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded hover:bg-stone-50 disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                </div>
              </div>

              {filteredEnquiries.length === 0 ? (
                <div className="p-10 text-center border border-stone-200 rounded bg-stone-50 text-xs text-stone-500">
                  No booking enquiries match the current filter.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEnquiries.map((enq: CmsCustomerEnquiry) => (
                    <div
                      key={enq.id}
                      className="border border-stone-200 rounded p-4 space-y-3 bg-stone-50/40"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-stone-900">
                            {enq.id.slice(0, 10)}
                          </span>
                          <span className="text-xs font-medium text-stone-800">
                            {enq.name}
                          </span>
                          {enq.bookingMethod && (
                            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-stone-200 text-stone-700 rounded">
                              {enq.bookingMethod}
                            </span>
                          )}
                          <span className="text-xs text-stone-500">
                            ·{' '}
                            {enq.selectedPackage ||
                              enq.style ||
                              'Custom Journey'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            disabled={!isVerifiedAdmin}
                            value={enq.status || 'new'}
                            onChange={(e) => {
                              const nextStatus = e.target
                                .value as CmsCustomerEnquiry['status'];
                              const nextList = cms.enquiries.map((item) =>
                                item.id === enq.id
                                  ? { ...item, status: nextStatus }
                                  : item
                              );
                              persistToFirestore(
                                { ...cms, enquiries: nextList },
                                `Updated enquiry status for ${enq.name}.`
                              ).catch(() => {});
                            }}
                            className="px-2 py-1 text-xs border border-stone-300 rounded bg-white"
                          >
                            <option value="new">New</option>
                            <option value="in_progress">In Progress</option>
                            <option value="replied">Replied</option>
                            <option value="archived">Archived</option>
                          </select>

                          <button
                            type="button"
                            disabled={!isVerifiedAdmin}
                            onClick={() => {
                              const nextList = cms.enquiries.filter(
                                (item) => item.id !== enq.id
                              );
                              persistToFirestore(
                                { ...cms, enquiries: nextList },
                                `Deleted enquiry from ${enq.name}.`
                              ).catch(() => {});
                            }}
                            className="p-1 text-stone-400 hover:text-red-600 disabled:opacity-40"
                            title="Delete enquiry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600">
                        {enq.email && (
                          <a
                            href={`mailto:${enq.email}`}
                            className="inline-flex items-center gap-1 hover:text-stone-900 underline"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            {enq.email}
                          </a>
                        )}
                        {enq.phone && (
                          <a
                            href={`https://wa.me/${enq.phone.replace(
                              /\D/g,
                              ''
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 hover:text-stone-900 underline"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {enq.phone}
                          </a>
                        )}
                        {enq.arrival && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {enq.arrival}
                          </span>
                        )}
                        {enq.guests && <span>{enq.guests}</span>}
                        {enq.duration && <span>· {enq.duration}</span>}
                      </div>

                      {enq.message && (
                        <p className="text-xs text-stone-700 bg-white p-2.5 rounded border border-stone-200">
                          {enq.message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 10. CLOUDFLARE R2 & FIRESTORE MEDIA */}
          {activeTab === 'r2' && (
            <R2BucketManagerTab
              quickAssignTargets={quickAssignTargets}
              onAssignToTarget={handleAssignFromR2}
              onRegisterMediaInFirestore={registerR2MediaInFirebase}
              onRemoveMediaFromFirestore={removeR2MediaFromFirebase}
              onAssignUrlToHero={async (url, mediaItem) => {
                await assignR2ImageToCmsSlot({
                  mediaItem,
                  applyToCms: (current) => ({
                    ...current,
                    general: {
                      ...current.general,
                      heroImages: [
                        ...(current.general.heroImages || []).filter(Boolean),
                        url,
                      ],
                    },
                  }),
                });
              }}
              onAssignUrlToGallery={async (url, title, mediaItem) => {
                const newItemId = `gal-${Date.now()}`;
                const newItem: CmsGalleryPhoto = {
                  id: newItemId,
                  title: title || 'Sri Lanka Moment',
                  location: 'Sri Lanka',
                  category: 'culture',
                  categoryLabel: 'Sacred Heritage',
                  description: 'Uploaded via Cloudflare R2.',
                  image: url,
                };
                await assignR2ImageToCmsSlot({
                  mediaItem,
                  applyToCms: (current) => ({
                    ...current,
                    gallery: [...current.gallery, newItem],
                  }),
                  collectionDoc: {
                    collectionName: 'gallery',
                    docId: newItemId,
                    getPayload: () => newItem,
                  },
                });
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
