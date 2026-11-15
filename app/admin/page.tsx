'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  Database,
  ExternalLink,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  Type,
  X,
} from 'lucide-react';
import {
  AdminFieldItem,
  AdminPageSchema,
  buildAdminPagesFromCms,
} from '@/lib/admin-ui-schema';
import { SiteCmsData } from '@/lib/cms-defaults';
import {
  CmsSectionDocId,
  listSoftDeletedItems,
  normalizeCmsData,
  restoreSoftDeletedEntry,
  TrashItemEntry,
} from '@/lib/content-repository';
import { R2UploadSuccessResponse } from '@/lib/r2-upload-client';
import { useSiteCms } from '@/hooks/useSiteCms';
import { useAdminAuth } from '@/components/admin/AdminAuthGuard';
import AdminImageUploadField, {
  PendingFieldImageAssignment,
} from '@/components/admin/AdminImageUploadField';
import AdminMediaLibrary, {
  SelectedMediaLibraryAsset,
} from '@/components/admin/AdminMediaLibrary';

type FieldFilterMode = 'all' | 'text' | 'image';

interface FeedbackBanner {
  type: 'success' | 'error' | 'info' | 'conflict';
  message: string;
  conflictDetails?: {
    docId: CmsSectionDocId;
    title: string;
    expectedRevision: number;
    actualRevision: number;
    updatedBy?: string | null;
  };
}

function serializeComparableCms(data: SiteCmsData): string {
  const normalized = normalizeCmsData(data);
  const { updatedAt: _ignored, ...rest } = normalized;
  return JSON.stringify(rest);
}

const SECTION_TO_FIRESTORE_DOC: Record<string, CmsSectionDocId> = {
  'global-header': 'shared_header',
  'global-footer': 'shared_footer',
  'global-whatsapp': 'shared_whatsapp',
  'home-hero': 'home_hero',
  'home-transition': 'home_transition',
  'home-story': 'home_story',
  'home-bento': 'home_bento',
  'home-experience': 'home_experience',
  'home-places': 'home_places',
  'home-reviews': 'home_reviews',
  'home-planning-faq': 'home_planning_faq',
  'home-contact': 'home_contact',
  'dest-banner-intro': 'destinations_page',
  'dest-regions': 'destinations_catalog',
  'dest-colombo-day': 'destinations_catalog',
  'pkg-banner': 'packages_page',
  'pkg-tours-list': 'packages_tours',
  'stays-banner': 'stays_page',
  'stays-collection': 'stays_catalog',
  'gallery-banner': 'gallery_page',
  'gallery-photos': 'gallery_page',
  'story-page-banner': 'our_story_page',
  'story-page-chapters': 'our_story_page',
  'story-page-milestones': 'our_story_page',
  'story-page-founders': 'our_story_page',
  'contact-page-banner': 'contact_page',
  'contact-page-cards': 'contact_page',
  'contact-page-faqs': 'contact_page',
  'booking-page-main': 'booking_page',
  'booking-confirmation-sub': 'booking_page',
};

export default function AdminPanelPage() {
  const { user, signOut } = useAdminAuth();
  const currentAdminUid = user?.uid || 'admin';

  const {
    adminCms: savedCms,
    sectionMeta,
    existingSectionCount,
    totalSectionCount,
    loading: loadingFirestore,
    loadError,
    reloadFromRepository,
    saveCmsToFirestore,
    initializeFirestoreContent,
  } = useSiteCms();

  const [draftOverride, setDraftOverride] = useState<SiteCmsData | null>(null);
  const [activePageId, setActivePageId] = useState<string>('home-page');
  const [activeSectionId, setActiveSectionId] = useState<string>('home-hero');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [fieldFilter, setFieldFilter] = useState<FieldFilterMode>('all');
  const [collapsedSubsections, setCollapsedSubsections] = useState<
    Record<string, boolean>
  >({});
  const [feedback, setFeedback] = useState<FeedbackBanner | null>(null);
  const [uploadingFieldIds, setUploadingFieldIds] = useState<
    Record<string, boolean>
  >({});
  const [pendingR2UploadsByFieldId, setPendingR2UploadsByFieldId] = useState<
    Record<string, PendingFieldImageAssignment>
  >({});

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [showTrashView, setShowTrashView] = useState<boolean>(false);
  const [showMediaLibraryView, setShowMediaLibraryView] =
    useState<boolean>(false);
  const [mediaPickerModalState, setMediaPickerModalState] = useState<{
    field: AdminFieldItem;
    preferredFolder: string;
  } | null>(null);

  const isAnyUploadInProgress = Object.keys(uploadingFieldIds).length > 0;

  const draft = useMemo(
    () => (draftOverride ? draftOverride : normalizeCmsData(savedCms)),
    [draftOverride, savedCms]
  );

  const savedSerialized = useMemo(
    () => serializeComparableCms(savedCms),
    [savedCms]
  );
  const draftSerialized = useMemo(
    () => serializeComparableCms(draft),
    [draft]
  );

  const hasUnsavedChanges = savedSerialized !== draftSerialized;

  const trashItems = useMemo(() => listSoftDeletedItems(draft), [draft]);

  const pages: AdminPageSchema[] = useMemo(
    () => buildAdminPagesFromCms(draft, currentAdminUid),
    [draft, currentAdminUid]
  );

  const publishedFieldsById = useMemo(() => {
    const map = new Map<string, { url: string; objectKey: string | null }>();
    const savedPages = buildAdminPagesFromCms(
      normalizeCmsData(savedCms),
      currentAdminUid
    );
    for (const p of savedPages) {
      for (const sec of p.sections) {
        for (const sub of sec.subsections) {
          for (const f of sub.fields) {
            if (f.type === 'image') {
              map.set(f.id, {
                url: f.value || '',
                objectKey: f.objectKey ?? null,
              });
            }
          }
        }
      }
    }
    return map;
  }, [savedCms, currentAdminUid]);

  const activePage = useMemo(
    () => pages.find((p) => p.id === activePageId) || pages[0],
    [pages, activePageId]
  );

  const activeSection = useMemo(() => {
    if (!activePage) return null;
    return (
      activePage.sections.find((s) => s.id === activeSectionId) ||
      activePage.sections[0] ||
      null
    );
  }, [activePage, activeSectionId]);

  const activeFirestoreDocMeta = useMemo(() => {
    if (!activeSection) return null;
    const docId = SECTION_TO_FIRESTORE_DOC[activeSection.id];
    if (!docId) return null;
    return sectionMeta[docId] || null;
  }, [activeSection, sectionMeta]);

  const handleSelectPage = (pageId: string) => {
    setActivePageId(pageId);
    setShowTrashView(false);
    setShowMediaLibraryView(false);
    const targetPage = pages.find((p) => p.id === pageId);
    if (targetPage && targetPage.sections.length > 0) {
      setActiveSectionId(targetPage.sections[0].id);
    }
  };

  const applyDraftMutation = (mutator: (prev: SiteCmsData) => SiteCmsData) => {
    setDraftOverride((prev) =>
      normalizeCmsData(mutator(prev ?? normalizeCmsData(savedCms)))
    );
    if (feedback?.type === 'success' || feedback?.type === 'info') {
      setFeedback(null);
    }
  };

  const getAdminIdToken = async (): Promise<string> => {
    if (!user) {
      throw new Error(
        'You must be signed in as an authorized administrator to upload images.'
      );
    }
    return await user.getIdToken();
  };

  const handleUploadStart = (fieldId: string) => {
    setUploadingFieldIds((prev) => ({ ...prev, [fieldId]: true }));
  };

  const handleUploadEnd = (fieldId: string) => {
    setUploadingFieldIds((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  };

  const handleFieldUploadSuccess = (
    field: AdminFieldItem,
    uploaded: R2UploadSuccessResponse
  ) => {
    if (field.applyImage) {
      applyDraftMutation((prev) =>
        field.applyImage!(prev, { url: uploaded.url, key: uploaded.key })
      );
    }
    setPendingR2UploadsByFieldId((prev) => ({
      ...prev,
      [field.id]: {
        ...uploaded,
        source: 'uploaded',
      },
    }));
    setFeedback({
      type: 'info',
      message: `Uploaded "${uploaded.key}" to Cloudflare R2 (${uploaded.url}). Click "Save Changes" to publish this image reference to Cloud Firestore.`,
    });
  };

  const handleFieldSelectFromMediaLibrary = (
    field: AdminFieldItem,
    asset: SelectedMediaLibraryAsset
  ) => {
    if (field.applyImage) {
      applyDraftMutation((prev) =>
        field.applyImage!(prev, { url: asset.url, key: asset.key })
      );
    }
    setPendingR2UploadsByFieldId((prev) => ({
      ...prev,
      [field.id]: {
        key: asset.key,
        url: asset.url,
        contentType: asset.contentType,
        size: asset.size,
        source: 'library',
      },
    }));
    setMediaPickerModalState(null);
    setFeedback({
      type: 'info',
      message: `Selected "${asset.key}" from Media Library for "${field.label}". You can customize its Alt Text for this placement and click "Save Changes" to publish.`,
    });
  };

  const handleFieldRemoveFromPlacement = (field: AdminFieldItem) => {
    if (field.applyImage) {
      applyDraftMutation((prev) =>
        field.applyImage!(prev, { url: '', key: null })
      );
    }
    setPendingR2UploadsByFieldId((prev) => {
      const next = { ...prev };
      delete next[field.id];
      return next;
    });
    setFeedback({
      type: 'info',
      message: `Removed image from placement "${field.label}" in draft (the R2 object itself was not deleted). Click "Save Changes" to persist.`,
    });
  };

  const handleSaveChanges = async () => {
    if (!user?.uid) {
      setFeedback({
        type: 'error',
        message: 'You must be signed in as an authorized administrator to save.',
      });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const result = await saveCmsToFirestore(draft, user.uid);
      if (!result.valid) {
        if (result.conflict) {
          setFeedback({
            type: 'conflict',
            message: `Concurrent edit conflict detected on "${result.conflict.title}" (/cms_sections/${result.conflict.docId}). Your session loaded revision #${result.conflict.expectedRevision}, but Firestore is now at revision #${result.conflict.actualRevision}. Reload the latest content from Firestore before re-applying your change.`,
            conflictDetails: result.conflict,
          });
        } else {
          setFeedback({
            type: 'error',
            message:
              result.error ||
              'Unable to save changes to Cloud Firestore. Your unsaved edits are still preserved in the editor.',
          });
        }
        return;
      }

      setDraftOverride(null);
      setPendingR2UploadsByFieldId({});
      const timeStr = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const updatedSummary =
        result.updatedDocIds.length > 0
          ? `Updated ${result.updatedDocIds.length} Firestore section document(s): ${result.updatedDocIds.join(', ')}`
          : 'No section documents required updates';
      setFeedback({
        type: 'success',
        message: `Confirmed by Cloud Firestore at ${timeStr}. ${updatedSummary}.`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelUnsaved = () => {
    if (isAnyUploadInProgress) return;
    const hadPendingR2Uploads =
      Object.keys(pendingR2UploadsByFieldId).length > 0;
    setDraftOverride(null);
    setPendingR2UploadsByFieldId({});
    setFeedback({
      type: 'info',
      message: hadPendingR2Uploads
        ? 'Discarded unsaved content edits and restored the last saved Firestore state. Note: Image files already uploaded to Cloudflare R2 remain stored in the bucket and were not deleted.'
        : 'Discarded unsaved local edits and restored the last loaded/saved Firestore state.',
    });
  };

  const handleReloadFromFirestore = async () => {
    if (isAnyUploadInProgress) return;
    setIsReloading(true);
    setFeedback(null);
    try {
      await reloadFromRepository();
      setDraftOverride(null);
      setPendingR2UploadsByFieldId({});
      setFeedback({
        type: 'info',
        message:
          'Reloaded latest published documents and revision numbers from Cloud Firestore.',
      });
    } finally {
      setIsReloading(false);
    }
  };

  const handleInitializeWebsiteContent = async () => {
    if (!user?.uid) {
      setFeedback({
        type: 'error',
        message:
          'You must be signed in as an authorized administrator to initialize Firestore content.',
      });
      return;
    }

    setIsInitializing(true);
    setFeedback(null);

    try {
      const res = await initializeFirestoreContent(user.uid);
      if (!res.success) {
        const failedList = res.failedDocs
          .map((f) => `${f.docId} (${f.error})`)
          .join('; ');
        setFeedback({
          type: 'error',
          message: `Initial import partially failed. Created: ${res.createdDocIds.length}, Skipped existing: ${res.skippedDocIds.length}, Failed: ${res.failedDocs.length} — ${failedList}. You can safely click "Initialize Website Content" again to retry.`,
        });
        return;
      }

      setDraftOverride(null);
      setFeedback({
        type: 'success',
        message:
          res.createdDocIds.length > 0
            ? `Initialized ${res.createdDocIds.length} missing section document(s) in Cloud Firestore (${res.skippedDocIds.length} existing document(s) preserved untouched).`
            : `All ${res.skippedDocIds.length} section documents already exist in Cloud Firestore. Existing edits were preserved without overwriting.`,
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleRestoreTrashItem = (entry: TrashItemEntry) => {
    applyDraftMutation((prev) => restoreSoftDeletedEntry(prev, entry));
    setFeedback({
      type: 'info',
      message: `Restored "${entry.title}" (ID: ${entry.id}) in draft. Click "Save Changes" to persist restoration to Cloud Firestore.`,
    });
  };

  const toggleSubsectionCollapse = (subId: string) => {
    setCollapsedSubsections((prev) => ({
      ...prev,
      [subId]: !prev[subId],
    }));
  };

  const filteredSubsections = useMemo(() => {
    if (!activeSection) return [];
    const q = searchQuery.trim().toLowerCase();

    return activeSection.subsections
      .map((sub) => {
        const matchingFields = sub.fields.filter((f) => {
          if (fieldFilter === 'text' && f.type === 'image') return false;
          if (fieldFilter === 'image' && f.type !== 'image') return false;
          if (!q) return true;
          return (
            f.label.toLowerCase().includes(q) ||
            f.value.toLowerCase().includes(q) ||
            (f.altText && f.altText.toLowerCase().includes(q)) ||
            sub.title.toLowerCase().includes(q)
          );
        });
        return {
          ...sub,
          fields: matchingFields,
        };
      })
      .filter((sub) => sub.fields.length > 0);
  }, [activeSection, searchQuery, fieldFilter]);

  const handleFieldValueChange = (field: AdminFieldItem, nextVal: string) => {
    if (field.type === 'image') {
      if (field.applyImage) {
        applyDraftMutation((prev) => field.applyImage!(prev, { url: nextVal }));
      }
      return;
    }
    if (field.applyText) {
      applyDraftMutation((prev) => field.applyText!(prev, nextVal));
    }
  };

  const handleImageAltChange = (field: AdminFieldItem, nextAlt: string) => {
    if (field.applyImage) {
      applyDraftMutation((prev) => field.applyImage!(prev, { alt: nextAlt }));
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            Bimondo Admin
          </span>
          <span
            aria-hidden="true"
            className="hidden sm:inline text-slate-300 text-xs"
          >
            /
          </span>
          <span className="hidden sm:inline text-xs text-slate-600 font-medium truncate">
            {showMediaLibraryView
              ? 'Media Library'
              : showTrashView
                ? 'Trash'
                : activePage?.title || 'Editor'}
          </span>
          {hasUnsavedChanges && (
            <span className="hidden md:inline text-xs text-amber-700 font-medium whitespace-nowrap ml-2">
              Unsaved changes
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 overflow-x-auto">
          {(hasUnsavedChanges || isSaving) && (
            <button
              type="button"
              onClick={handleCancelUnsaved}
              disabled={!hasUnsavedChanges || isSaving || isAnyUploadInProgress}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Discard
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={!hasUnsavedChanges || isSaving || isAnyUploadInProgress}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              hasUnsavedChanges && !isSaving && !isAnyUploadInProgress
                ? 'text-white bg-slate-900 hover:bg-slate-800 cursor-pointer'
                : 'text-slate-400 bg-slate-100 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving…
              </>
            ) : isAnyUploadInProgress ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Save Changes
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setShowMediaLibraryView((prev) => {
                const next = !prev;
                if (next) setShowTrashView(false);
                return next;
              });
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              showMediaLibraryView
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Media
          </button>

          <button
            type="button"
            onClick={() => {
              setShowTrashView((prev) => {
                const next = !prev;
                if (next) setShowMediaLibraryView(false);
                return next;
              });
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
              showTrashView
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Trash ({trashItems.length})
          </button>

          <Link
            href={activePage?.routePath || '/'}
            prefetch={false}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            View Site
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Workspace Layout: Left Page Sidebar + Main Content Area */}
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] min-h-[calc(100vh-3.5rem)]">
        {/* Left Sidebar: Pages Hierarchy */}
        <aside className="bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-4 lg:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold text-slate-500 tracking-wide">
              Site Pages ({pages.length})
            </h2>
            <button
              type="button"
              onClick={handleReloadFromFirestore}
              disabled={isReloading || isSaving || isAnyUploadInProgress}
              title="Reload latest published content from Cloud Firestore"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw
                className={`w-3 h-3 ${isReloading ? 'animate-spin' : ''}`}
              />
              Reload
            </button>
          </div>

          <nav
            aria-label="Site Pages"
            className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0"
          >
            {pages.map((page) => {
              const isSelected =
                !showTrashView &&
                !showMediaLibraryView &&
                page.id === activePage?.id;
              const totalSections = page.sections.length;
              const totalSubsections = page.sections.reduce(
                (acc, sec) => acc + sec.subsections.length,
                0
              );

              return (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => handleSelectPage(page.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-md transition-colors shrink-0 lg:shrink cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium whitespace-nowrap truncate">
                      {page.title}
                    </span>
                    <span
                      className={`text-[11px] font-mono tabular-nums whitespace-nowrap shrink-0 ${
                        isSelected ? 'text-slate-300' : 'text-slate-400'
                      }`}
                    >
                      {totalSections}s · {totalSubsections}sub
                    </span>
                  </div>
                  <div
                    className={`text-[11px] font-mono truncate mt-0.5 ${
                      isSelected ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {page.routePath}
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Current Page Quick Summary */}
          {activePage && !showTrashView && (
            <div className="hidden lg:block mt-6 pt-5 border-t border-slate-200 text-xs text-slate-500 space-y-2">
              <div className="font-medium text-slate-800">
                Structure Overview
              </div>
              <div className="flex items-center justify-between tabular-nums">
                <span>Sections</span>
                <span className="font-mono text-slate-800">
                  {activePage.sections.length}
                </span>
              </div>
              <div className="flex items-center justify-between tabular-nums">
                <span>Subsections / Items</span>
                <span className="font-mono text-slate-800">
                  {activePage.sections.reduce(
                    (sum, s) => sum + s.subsections.length,
                    0
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between tabular-nums">
                <span>Soft-Deleted in Trash</span>
                <span className="font-mono text-slate-800">
                  {trashItems.length}
                </span>
              </div>
            </div>
          )}
        </aside>

        {/* Right Main Content Viewport */}
        <main className="p-5 lg:p-8 space-y-6 min-w-0">
          {!loadingFirestore && existingSectionCount < totalSectionCount && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 text-xs bg-white border border-slate-200 rounded-md">
              <div className="flex items-center gap-2 text-slate-700">
                <Database className="w-4 h-4 text-slate-500 shrink-0" />
                <span>
                  {existingSectionCount} of {totalSectionCount} website content
                  sections are initialized in Firestore.
                </span>
              </div>
              <button
                type="button"
                onClick={handleInitializeWebsiteContent}
                disabled={isInitializing || isSaving || isAnyUploadInProgress}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {isInitializing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Initializing…
                  </>
                ) : (
                  'Initialize Website Content'
                )}
              </button>
            </div>
          )}
          {loadError && (
            <div
              role="alert"
              className="flex items-center justify-between gap-4 px-4 py-3 text-xs rounded-md border bg-amber-50 text-amber-900 border-amber-200"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  Firestore read warning: {loadError}. Displaying bundled default
                  content for any unreachable sections.
                </span>
              </div>
              <button
                type="button"
                onClick={handleReloadFromFirestore}
                className="px-2.5 py-1 text-xs font-medium bg-white border border-amber-300 rounded hover:bg-amber-100 cursor-pointer shrink-0"
              >
                Retry Fetch
              </button>
            </div>
          )}

          {feedback && (
            <div
              role="status"
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-3.5 text-xs rounded-md border ${
                feedback.type === 'error' || feedback.type === 'conflict'
                  ? 'bg-red-50 text-red-900 border-red-200'
                  : feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-white text-slate-800 border-slate-300'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {feedback.type === 'error' || feedback.type === 'conflict' ? (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="leading-relaxed">{feedback.message}</div>
                  {feedback.type === 'conflict' && feedback.conflictDetails && (
                    <div className="text-[11px] font-mono text-red-800">
                      Section Doc: /cms_sections/{feedback.conflictDetails.docId}{' '}
                      · Expected Rev #{feedback.conflictDetails.expectedRevision}{' '}
                      · Remote Rev #{feedback.conflictDetails.actualRevision}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {feedback.type === 'conflict' && (
                  <button
                    type="button"
                    onClick={handleReloadFromFirestore}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-700 hover:bg-red-800 rounded cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reload Latest from Firestore
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setFeedback(null)}
                  className="text-slate-500 hover:text-slate-900 font-medium cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* =================================================================
              MEDIA LIBRARY VIEW OR TRASH VIEW OR PAGE EDITOR
             ================================================================= */}
          {showMediaLibraryView ? (
            <AdminMediaLibrary
              mode="screen"
              initialFolder="pages/home/hero"
              savedCms={savedCms}
              draftCms={draft}
              loadingFirestore={loadingFirestore}
              existingSectionCount={existingSectionCount}
              totalSectionCount={totalSectionCount}
              firestoreLoadError={loadError}
              getAdminIdToken={getAdminIdToken}
              onClose={() => setShowMediaLibraryView(false)}
            />
          ) : showTrashView ? (
            <div className="bg-white border border-slate-200 rounded-md p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <div className="text-xs font-mono text-slate-500">
                    SOFT DELETION &amp; RESTORATION · /cms_sections
                  </div>
                  <h1 className="text-xl font-semibold text-slate-900 mt-0.5">
                    Trash ({trashItems.length} Soft-Deleted Item
                    {trashItems.length === 1 ? '' : 's'})
                  </h1>
                  <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
                    Soft-deleted sections and repeatable items are hidden from
                    the public website and active editor while keeping their
                    stable IDs, text, and R2 image references intact. Restoring
                    an item returns its exact stable ID and content.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowTrashView(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer shrink-0"
                >
                  Back to Page Editor
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-md p-3.5 text-xs text-amber-950 leading-relaxed">
                <strong>Transparency Note on Public Readability:</strong> Soft
                deletion (<code className="font-mono">deletedAt</code> /{' '}
                <code className="font-mono">deletedBy</code>) hides items from
                public website rendering without destroying stable IDs or image
                references. Because soft-deleted items remain inside publicly
                readable <code className="font-mono">/cms_sections</code>{' '}
                documents, soft deletion is a publishing visibility state rather
                than a confidential draft store.
              </div>

              {trashItems.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-md">
                  Trash is empty. No sections or repeatable items are currently
                  soft-deleted.
                </div>
              ) : (
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-md">
                  {trashItems.map((entry) => (
                    <div
                      key={`${entry.collectionKey}:${entry.id}`}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 text-[11px] font-mono bg-slate-100 text-slate-700 rounded border border-slate-200">
                            {entry.locationLabel}
                          </span>
                          <code className="text-[11px] font-mono text-slate-500">
                            ID: {entry.id}
                          </code>
                        </div>
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {entry.title}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Deleted at: {entry.deletedAt}
                          {entry.deletedBy ? ` · by UID: ${entry.deletedBy}` : ''}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRestoreTrashItem(entry)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restore Item
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Page Header & Search / Filter Toolbar */}
              {activePage && (
                <div className="bg-white border border-slate-200 rounded-md p-5 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-mono text-slate-500">
                        PAGE · {activePage.routePath}
                      </div>
                      <h1 className="text-xl font-semibold text-slate-900 mt-0.5">
                        {activePage.title}
                      </h1>
                      <p className="text-xs text-slate-600 mt-1 max-w-3xl">
                        {activePage.description}
                      </p>
                    </div>

                    {/* Search & Type Filter */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="search"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Filter fields or text..."
                          className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 w-48 sm:w-56"
                        />
                      </div>

                      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
                        <button
                          type="button"
                          onClick={() => setFieldFilter('all')}
                          className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                            fieldFilter === 'all'
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          All
                        </button>
                        <button
                          type="button"
                          onClick={() => setFieldFilter('text')}
                          className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                            fieldFilter === 'text'
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Text
                        </button>
                        <button
                          type="button"
                          onClick={() => setFieldFilter('image')}
                          className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                            fieldFilter === 'image'
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Images
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Section Selector Tabs within the Active Page */}
                  <div className="pt-3 border-t border-slate-200">
                    <div className="text-[11px] font-medium text-slate-500 mb-2">
                      Select Section ({activePage.sections.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activePage.sections.map((section) => {
                        const isSecActive = section.id === activeSection?.id;
                        const isHidden = section.visible === false;
                        const isDeleted = section.sectionDeleted === true;
                        return (
                          <button
                            key={section.id}
                            type="button"
                            onClick={() => {
                              setActiveSectionId(section.id);
                            }}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer border ${
                              isSecActive
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span
                              className={`font-mono text-[11px] ${
                                isSecActive ? 'text-slate-300' : 'text-slate-400'
                              }`}
                            >
                              {section.code}
                            </span>
                            <span>{section.title}</span>
                            {isDeleted && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-100 text-red-800">
                                In Trash
                              </span>
                            )}
                            {!isDeleted && isHidden && (
                              <EyeOff className="w-3 h-3 text-amber-500" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Active Section Header & Repeatable / Visibility / Soft-Delete Controls */}
              {activeSection && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-medium text-slate-500">
                          {activeSection.code}
                        </span>
                        <h2 className="text-base font-semibold text-slate-900">
                          {activeSection.title}
                        </h2>
                        {activeFirestoreDocMeta && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            /cms_sections/{activeFirestoreDocMeta.docId} ·{' '}
                            {activeFirestoreDocMeta.existsInFirestore
                              ? `Rev #${activeFirestoreDocMeta.revision}`
                              : 'Not initialized in Firestore (using default)'}
                          </span>
                        )}
                        {activeSection.sectionDeleted && (
                          <span className="px-2 py-0.5 text-[11px] font-medium bg-red-50 text-red-800 border border-red-200 rounded">
                            Soft-Deleted (In Trash)
                          </span>
                        )}
                        {!activeSection.sectionDeleted &&
                          activeSection.visible === false && (
                            <span className="px-2 py-0.5 text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 rounded">
                              Hidden on public website
                            </span>
                          )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {activeSection.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* Section Visibility Toggle (separate from soft deletion) */}
                      {activeSection.canToggleSectionVisible &&
                        activeSection.onToggleSectionVisible && (
                          <button
                            type="button"
                            onClick={() =>
                              applyDraftMutation(
                                activeSection.onToggleSectionVisible!
                              )
                            }
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                              activeSection.visible !== false
                                ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                            }`}
                          >
                            {activeSection.visible !== false ? (
                              <>
                                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                Visible on Site
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                                Hidden on Site
                              </>
                            )}
                          </button>
                        )}

                      {/* Section Soft-Delete / Restore Toggle */}
                      {activeSection.canSoftDeleteSection &&
                        activeSection.onSoftDeleteSection && (
                          <button
                            type="button"
                            onClick={() =>
                              applyDraftMutation(
                                activeSection.onSoftDeleteSection!
                              )
                            }
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                              activeSection.sectionDeleted
                                ? 'bg-red-50 text-red-900 border-red-300 hover:bg-red-100'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                            }`}
                          >
                            {activeSection.sectionDeleted ? (
                              <>
                                <RotateCcw className="w-3.5 h-3.5" />
                                Restore Section from Trash
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-3.5 h-3.5" />
                                Move Section to Trash
                              </>
                            )}
                          </button>
                        )}

                      {/* Add Repeatable Item Button */}
                      {activeSection.addRepeatableLabel &&
                        activeSection.onAddRepeatable && (
                          <button
                            type="button"
                            onClick={() =>
                              applyDraftMutation(activeSection.onAddRepeatable!)
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            {activeSection.addRepeatableLabel}
                          </button>
                        )}
                    </div>
                  </div>

                  {/* Subsections List */}
                  {filteredSubsections.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-md p-8 text-center text-xs text-slate-500">
                      No editable fields match the current filter in this
                      section.
                    </div>
                  ) : (
                    filteredSubsections.map((sub) => {
                      const isCollapsed = Boolean(collapsedSubsections[sub.id]);
                      const isSubHidden = sub.visible === false;

                      return (
                        <section
                          key={sub.id}
                          className="bg-white border border-slate-200 rounded-md overflow-hidden"
                        >
                          {/* Subsection Header */}
                          <div className="w-full px-5 py-3.5 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => toggleSubsectionCollapse(sub.id)}
                              className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer"
                            >
                              {isCollapsed ? (
                                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                              <span className="text-xs font-mono text-slate-500 shrink-0">
                                SUB {sub.code}
                              </span>
                              <span className="text-sm font-semibold text-slate-900 truncate">
                                {sub.title}
                              </span>
                              {sub.repeatableItemId && (
                                <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400">
                                  ID: {sub.repeatableItemId}
                                </span>
                              )}
                              {isSubHidden && (
                                <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200 rounded">
                                  Hidden
                                </span>
                              )}
                            </button>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Item Visibility Toggle */}
                              {sub.canToggleVisible && sub.onToggleVisible && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    applyDraftMutation(sub.onToggleVisible!)
                                  }
                                  title={
                                    isSubHidden
                                      ? 'Show this item on the public website'
                                      : 'Hide this item on the public website'
                                  }
                                  className={`p-1.5 text-xs rounded border transition-colors cursor-pointer ${
                                    isSubHidden
                                      ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  {isSubHidden ? (
                                    <EyeOff className="w-3.5 h-3.5" />
                                  ) : (
                                    <Eye className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}

                              {/* Move Up */}
                              {sub.onMoveUp && (
                                <button
                                  type="button"
                                  disabled={!sub.canMoveUp}
                                  onClick={() =>
                                    applyDraftMutation(sub.onMoveUp!)
                                  }
                                  title="Move item up"
                                  className={`p-1.5 text-xs rounded border transition-colors ${
                                    sub.canMoveUp
                                      ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 cursor-pointer'
                                      : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                                  }`}
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Move Down */}
                              {sub.onMoveDown && (
                                <button
                                  type="button"
                                  disabled={!sub.canMoveDown}
                                  onClick={() =>
                                    applyDraftMutation(sub.onMoveDown!)
                                  }
                                  title="Move item down"
                                  className={`p-1.5 text-xs rounded border transition-colors ${
                                    sub.canMoveDown
                                      ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 cursor-pointer'
                                      : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                                  }`}
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Soft-Delete Item to Trash */}
                              {sub.onRemove && (
                                <button
                                  type="button"
                                  disabled={!sub.canRemove}
                                  onClick={() =>
                                    applyDraftMutation(sub.onRemove!)
                                  }
                                  title="Move item to Trash (soft delete)"
                                  className={`p-1.5 text-xs rounded border transition-colors ${
                                    sub.canRemove
                                      ? 'bg-white text-red-600 border-slate-200 hover:bg-red-50 hover:border-red-200 cursor-pointer'
                                      : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                                  }`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <span className="text-[11px] font-mono text-slate-500 ml-1">
                                {sub.fields.length} field
                                {sub.fields.length === 1 ? '' : 's'}
                              </span>
                            </div>
                          </div>

                          {/* Subsection Fields Body */}
                          {!isCollapsed && (
                            <div className="p-5 space-y-5">
                              {sub.description && (
                                <p className="text-xs text-slate-500 border-b border-slate-100 pb-3">
                                  {sub.description}
                                </p>
                              )}

                              <div className="grid grid-cols-1 gap-5">
                                {sub.fields.map((field) => {
                                  const isImage = field.type === 'image';
                                  const currentValue = field.value ?? '';
                                  const publishedFieldState =
                                    publishedFieldsById.get(field.id);

                                  return (
                                    <div
                                      key={field.id}
                                      className="space-y-1.5 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <label
                                          htmlFor={field.id}
                                          className="text-xs font-medium text-slate-800 flex items-center gap-1.5"
                                        >
                                          {isImage ? (
                                            <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                                          ) : (
                                            <Type className="w-3.5 h-3.5 text-slate-400" />
                                          )}
                                          <span>{field.label}</span>
                                        </label>

                                        <span className="text-[11px] font-mono text-slate-400">
                                          {isImage
                                            ? 'IMAGE ASSET'
                                            : field.type === 'textarea'
                                              ? 'MULTILINE TEXT'
                                              : 'TEXT'}
                                        </span>
                                      </div>

                                      {field.helperText && (
                                        <p className="text-[11px] text-slate-500">
                                          {field.helperText}
                                        </p>
                                      )}

                                      {/* Field Editor Input */}
                                      {field.type === 'textarea' && (
                                        <textarea
                                          id={field.id}
                                          rows={3}
                                          value={currentValue}
                                          onChange={(e) =>
                                            handleFieldValueChange(
                                              field,
                                              e.target.value
                                            )
                                          }
                                          placeholder={
                                            field.placeholder || 'Enter text...'
                                          }
                                          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500"
                                        />
                                      )}

                                      {field.type === 'text' && (
                                        <input
                                          id={field.id}
                                          type="text"
                                          value={currentValue}
                                          onChange={(e) =>
                                            handleFieldValueChange(
                                              field,
                                              e.target.value
                                            )
                                          }
                                          placeholder={
                                            field.placeholder || 'Enter text...'
                                          }
                                          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500"
                                        />
                                      )}

                                      {field.type === 'image' && (
                                        <AdminImageUploadField
                                          field={field}
                                          sectionId={activeSection.id}
                                          isSectionSaving={isSaving}
                                          isAnyUploadInProgress={
                                            isAnyUploadInProgress
                                          }
                                          pendingUploadInfo={
                                            pendingR2UploadsByFieldId[field.id]
                                          }
                                          publishedUrl={
                                            publishedFieldState?.url || ''
                                          }
                                          publishedObjectKey={
                                            publishedFieldState?.objectKey ??
                                            null
                                          }
                                          getAdminIdToken={getAdminIdToken}
                                          onChangeUrl={(nextUrl) =>
                                            handleFieldValueChange(
                                              field,
                                              nextUrl
                                            )
                                          }
                                          onChangeAlt={(nextAlt) =>
                                            handleImageAltChange(field, nextAlt)
                                          }
                                          onUploadSuccess={(uploaded) =>
                                            handleFieldUploadSuccess(
                                              field,
                                              uploaded
                                            )
                                          }
                                          onOpenMediaLibraryPicker={(
                                            preferredFolder
                                          ) =>
                                            setMediaPickerModalState({
                                              field,
                                              preferredFolder,
                                            })
                                          }
                                          onRemoveFromPlacement={() =>
                                            handleFieldRemoveFromPlacement(
                                              field
                                            )
                                          }
                                          onUploadStart={handleUploadStart}
                                          onUploadEnd={handleUploadEnd}
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </section>
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Modal Picker when "Choose from Media Library…" is clicked on an Image Field */}
      {mediaPickerModalState && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Choose Image from Media Library"
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="max-w-6xl w-full max-h-[92vh] overflow-y-auto shadow-2xl rounded-md">
            <AdminMediaLibrary
              mode="picker"
              initialFolder={mediaPickerModalState.preferredFolder}
              savedCms={savedCms}
              draftCms={draft}
              loadingFirestore={loadingFirestore}
              existingSectionCount={existingSectionCount}
              totalSectionCount={totalSectionCount}
              firestoreLoadError={loadError}
              getAdminIdToken={getAdminIdToken}
              onSelectMedia={(asset) =>
                handleFieldSelectFromMediaLibrary(
                  mediaPickerModalState.field,
                  asset
                )
              }
              onClose={() => setMediaPickerModalState(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
