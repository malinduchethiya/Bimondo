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
  Eye,
  EyeOff,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
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

type WorkspaceMode = 'editor' | 'media' | 'trash';

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

export default function AdminPanelPage() {
  const { user, signOut } = useAdminAuth();
  const currentAdminUid = user?.uid || 'admin';

  const {
    adminCms: savedCms,
    existingSectionCount,
    totalSectionCount,
    loading: loadingFirestore,
    loadError,
    reloadFromRepository,
    saveCmsToFirestore,
    initializeFirestoreContent,
  } = useSiteCms();

  const [draftOverride, setDraftOverride] = useState<SiteCmsData | null>(null);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('editor');
  const [activePageId, setActivePageId] = useState<string>('home-page');
  const [activeSectionId, setActiveSectionId] = useState<string>('home-hero');
  const [searchQuery, setSearchQuery] = useState<string>('');
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

  const handleSelectPageAndSection = (pageId: string, sectionId?: string) => {
    setWorkspaceMode('editor');
    setActivePageId(pageId);
    const targetPage = pages.find((p) => p.id === pageId);
    if (sectionId) {
      setActiveSectionId(sectionId);
    } else if (targetPage && targetPage.sections.length > 0) {
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
      message: `Uploaded image for "${field.label}". Click "Save Changes" to publish.`,
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
      message: `Selected image for "${field.label}". Click "Save Changes" to publish.`,
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
  };

  const handleSaveChanges = async () => {
    if (!user?.uid) {
      setFeedback({
        type: 'error',
        message: 'You must be signed in as an administrator to save.',
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
            message: `Concurrent edit conflict on "${result.conflict.title}". Reload the latest content before saving.`,
            conflictDetails: result.conflict,
          });
        } else {
          setFeedback({
            type: 'error',
            message:
              result.error ||
              'Unable to save changes. Your edits are still preserved in the editor.',
          });
        }
        return;
      }

      setDraftOverride(null);
      setPendingR2UploadsByFieldId({});
      setFeedback({
        type: 'success',
        message: 'Changes saved and published.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelUnsaved = () => {
    if (isAnyUploadInProgress) return;
    setDraftOverride(null);
    setPendingR2UploadsByFieldId({});
    setFeedback({
      type: 'info',
      message: 'Discarded unsaved changes.',
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
        message: 'Reloaded latest published content.',
      });
    } finally {
      setIsReloading(false);
    }
  };

  const handleInitializeWebsiteContent = async () => {
    if (!user?.uid) return;
    setIsInitializing(true);
    setFeedback(null);

    try {
      const res = await initializeFirestoreContent(user.uid);
      if (!res.success) {
        setFeedback({
          type: 'error',
          message: `Initialization incomplete (${res.failedDocs.length} failed). Click "Initialize Content" to retry.`,
        });
        return;
      }

      setDraftOverride(null);
      setFeedback({
        type: 'success',
        message: `Initialized ${res.createdDocIds.length} section document(s) in Firestore.`,
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleRestoreTrashItem = (entry: TrashItemEntry) => {
    applyDraftMutation((prev) => restoreSoftDeletedEntry(prev, entry));
    setFeedback({
      type: 'info',
      message: `Restored "${entry.title}". Click "Save Changes" to publish.`,
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
  }, [activeSection, searchQuery]);

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
      {/* Top Bar: Clean 3-Zone Contract */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between gap-8">
        {/* Zone 1: Single Brand Wordmark */}
        <Link
          href="/admin"
          className="text-sm font-semibold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          Bimondo Admin
        </Link>

        {/* Zone 2: Concise Single-Line Navigation Links */}
        <nav
          aria-label="Admin Workspace"
          className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600"
        >
          <button
            type="button"
            onClick={() => setWorkspaceMode('editor')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              workspaceMode === 'editor'
                ? 'text-slate-900 underline underline-offset-4'
                : 'hover:text-slate-900'
            }`}
          >
            Content
          </button>
          <button
            type="button"
            onClick={() => setWorkspaceMode('media')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              workspaceMode === 'media'
                ? 'text-slate-900 underline underline-offset-4'
                : 'hover:text-slate-900'
            }`}
          >
            Media Library
          </button>
          <button
            type="button"
            onClick={() => setWorkspaceMode('trash')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
              workspaceMode === 'trash'
                ? 'text-slate-900 underline underline-offset-4'
                : 'hover:text-slate-900'
            }`}
          >
            Trash ({trashItems.length})
          </button>
          <Link
            href={activePage?.routePath || '/'}
            prefetch={false}
            className="py-1 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            View Site
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="py-1 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Sign Out
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={!hasUnsavedChanges || isSaving || isAnyUploadInProgress}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
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
        </div>
      </header>

      {/* Main Workspace: Left Sidebar + Focused Content Area */}
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)] min-h-[calc(100vh-3.5rem)]">
        {/* Unified Left Sidebar: Pages & Sections Tree */}
        <aside className="bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-4 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            {/* Mobile workspace switcher */}
            <div className="flex md:hidden items-center gap-1 p-1 bg-slate-100 rounded-md">
              <button
                type="button"
                onClick={() => setWorkspaceMode('editor')}
                className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                  workspaceMode === 'editor'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                Content
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceMode('media')}
                className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                  workspaceMode === 'media'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                Media
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceMode('trash')}
                className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer tabular-nums ${
                  workspaceMode === 'trash'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                Trash ({trashItems.length})
              </button>
            </div>

            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-semibold text-slate-500">
                Pages &amp; Sections
              </span>
              <button
                type="button"
                onClick={handleReloadFromFirestore}
                disabled={isReloading || isSaving || isAnyUploadInProgress}
                title="Reload published content from Firestore"
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3 h-3 ${isReloading ? 'animate-spin' : ''}`}
                />
                Reload
              </button>
            </div>

            <nav aria-label="Site Pages and Sections" className="space-y-1">
              {pages.map((page) => {
                const isPageActive =
                  workspaceMode === 'editor' && page.id === activePage?.id;

                return (
                  <div key={page.id} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => handleSelectPageAndSection(page.id)}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        isPageActive
                          ? 'bg-slate-100 text-slate-900 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span className="truncate">{page.title}</span>
                      {isPageActive ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                    </button>

                    {/* Nested Sections for the Active Page */}
                    {isPageActive && (
                      <div className="pl-3 pr-1 py-1 space-y-0.5 border-l border-slate-200 ml-3">
                        {page.sections.map((section) => {
                          const isSecActive = section.id === activeSection?.id;
                          const isHidden = section.visible === false;
                          const isDeleted = section.sectionDeleted === true;

                          return (
                            <button
                              key={section.id}
                              type="button"
                              onClick={() =>
                                handleSelectPageAndSection(page.id, section.id)
                              }
                              className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                                isSecActive
                                  ? 'bg-slate-900 text-white font-medium'
                                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                              }`}
                            >
                              <span className="truncate">{section.title}</span>
                              {isDeleted ? (
                                <span
                                  className={`text-[10px] shrink-0 ${
                                    isSecActive ? 'text-red-200' : 'text-red-600'
                                  }`}
                                >
                                  Trash
                                </span>
                              ) : isHidden ? (
                                <EyeOff
                                  className={`w-3 h-3 shrink-0 ${
                                    isSecActive
                                      ? 'text-slate-300'
                                      : 'text-slate-400'
                                  }`}
                                />
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Account Footer in Sidebar */}
          <div className="pt-4 border-t border-slate-200 px-2 flex items-center justify-between gap-2 text-xs text-slate-500">
            <span className="truncate" title={user?.email || ''}>
              {user?.email || 'Administrator'}
            </span>
            <button
              type="button"
              onClick={signOut}
              className="md:hidden text-slate-700 hover:text-slate-900 font-medium cursor-pointer shrink-0"
            >
              Sign Out
            </button>
          </div>
        </aside>

        {/* Right Main Content Viewport */}
        <main className="p-6 lg:p-8 space-y-6 min-w-0 max-w-4xl">
          {/* Unsaved Changes Bar */}
          {hasUnsavedChanges && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-950">
              <span>You have unsaved changes in your draft.</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelUnsaved}
                  disabled={isSaving || isAnyUploadInProgress}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={isSaving || isAnyUploadInProgress}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Firestore Initialization Prompt (only if uninitialized) */}
          {!loadingFirestore && existingSectionCount < totalSectionCount && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 text-xs bg-white border border-slate-200 rounded-md">
              <div className="flex items-center gap-2 text-slate-700">
                <Database className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  {existingSectionCount} of {totalSectionCount} website sections
                  are initialized in Cloud Firestore.
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
                  'Initialize Content'
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
                  Firestore read warning: {loadError}. Showing default content for
                  unreachable sections.
                </span>
              </div>
              <button
                type="button"
                onClick={handleReloadFromFirestore}
                className="px-2.5 py-1 text-xs font-medium bg-white border border-amber-300 rounded-md hover:bg-amber-100 cursor-pointer shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {feedback && (
            <div
              role="status"
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-3 text-xs rounded-md border ${
                feedback.type === 'error' || feedback.type === 'conflict'
                  ? 'bg-red-50 text-red-900 border-red-200'
                  : feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-white text-slate-800 border-slate-200'
              }`}
            >
              <div className="flex items-start gap-2">
                {feedback.type === 'error' || feedback.type === 'conflict' ? (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <span>{feedback.message}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {feedback.type === 'conflict' && (
                  <button
                    type="button"
                    onClick={handleReloadFromFirestore}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-700 hover:bg-red-800 rounded-md cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reload Latest
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
              MODE 1: MEDIA LIBRARY
             ================================================================= */}
          {workspaceMode === 'media' && (
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
              onClose={() => setWorkspaceMode('editor')}
            />
          )}

          {/* =================================================================
              MODE 2: TRASH
             ================================================================= */}
          {workspaceMode === 'trash' && (
            <div className="bg-white border border-slate-200 rounded-md p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">
                    Trash ({trashItems.length})
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Soft-deleted sections and items are hidden from the public
                    site. Restore any item below and save to republish.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setWorkspaceMode('editor')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer shrink-0"
                >
                  Back to Editor
                </button>
              </div>

              {trashItems.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-md">
                  Trash is empty.
                </div>
              ) : (
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-md">
                  {trashItems.map((entry) => (
                    <div
                      key={`${entry.collectionKey}:${entry.id}`}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {entry.title}
                        </div>
                        <div className="text-xs text-slate-500">
                          {entry.locationLabel} · Deleted{' '}
                          {new Date(entry.deletedAt).toLocaleDateString()}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRestoreTrashItem(entry)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              MODE 3: CLEAN SECTION EDITOR
             ================================================================= */}
          {workspaceMode === 'editor' && activePage && activeSection && (
            <div className="space-y-6">
              {/* Clean Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <div className="text-xs text-slate-500">
                    {activePage.title} · {activePage.routePath}
                  </div>
                  <h1 className="text-xl font-semibold text-slate-900 mt-0.5">
                    {activeSection.title}
                  </h1>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                    {activeSection.description}
                  </p>
                </div>

                {/* Section Actions & Quick Search */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter fields..."
                      className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 w-40 sm:w-48"
                    />
                  </div>

                  {activeSection.canToggleSectionVisible &&
                    activeSection.onToggleSectionVisible && (
                      <button
                        type="button"
                        onClick={() =>
                          applyDraftMutation(
                            activeSection.onToggleSectionVisible!
                          )
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                          activeSection.visible !== false
                            ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                        }`}
                      >
                        {activeSection.visible !== false ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                            Visible
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                            Hidden
                          </>
                        )}
                      </button>
                    )}

                  {activeSection.canSoftDeleteSection &&
                    activeSection.onSoftDeleteSection && (
                      <button
                        type="button"
                        onClick={() =>
                          applyDraftMutation(activeSection.onSoftDeleteSection!)
                        }
                        title={
                          activeSection.sectionDeleted
                            ? 'Restore section from Trash'
                            : 'Move section to Trash'
                        }
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                          activeSection.sectionDeleted
                            ? 'bg-red-50 text-red-900 border-red-300 hover:bg-red-100'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                        }`}
                      >
                        {activeSection.sectionDeleted ? (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" />
                            Restore
                          </>
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}

                  {activeSection.addRepeatableLabel &&
                    activeSection.onAddRepeatable && (
                      <button
                        type="button"
                        onClick={() => {
                          applyDraftMutation(activeSection.onAddRepeatable!);
                          setFeedback({
                            type: 'info',
                            message: `Added new item via "${activeSection.addRepeatableLabel}". Upload or configure below, then click "Save Changes".`,
                          });
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {activeSection.addRepeatableLabel}
                      </button>
                    )}
                </div>
              </div>

              {/* Dedicated Hero Slideshow Quick Bar when editing Home Hero */}
              {activeSection.id === 'home-hero' &&
                activeSection.onAddRepeatable && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-white border border-slate-200 rounded-md">
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-slate-900">
                        Hero Background Slideshow · 4-Second Auto Transition
                      </div>
                      <div className="text-xs text-slate-500">
                        {(draft.pages.home.hero.slides || []).filter(
                          (s) => !s.deletedAt && s.visible !== false && Boolean(s.image?.url?.trim())
                        ).length}{' '}
                        uploaded active slide(s) of{' '}
                        {(draft.pages.home.hero.slides || []).filter(
                          (s) => !s.deletedAt
                        ).length}{' '}
                        slide slot(s). Add multiple images below to cycle automatically every 4 seconds.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        applyDraftMutation(activeSection.onAddRepeatable!);
                        setFeedback({
                          type: 'info',
                          message:
                            'Added a new Hero Slide Image slot. Upload or select an image from the Media Library, then click "Save Changes".',
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Hero Slide Image
                    </button>
                  </div>
                )}

              {/* Subsections List */}
              {filteredSubsections.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-md p-8 text-center text-xs text-slate-500">
                  No fields match your search in this section.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSubsections.map((sub) => {
                    const isCollapsed = Boolean(collapsedSubsections[sub.id]);
                    const isSubHidden = sub.visible === false;

                    return (
                      <section
                        key={sub.id}
                        className="bg-white border border-slate-200 rounded-md overflow-hidden"
                      >
                        {/* Subsection Header */}
                        <div className="w-full px-5 py-3 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => toggleSubsectionCollapse(sub.id)}
                            className="flex items-center gap-2 min-w-0 text-left cursor-pointer"
                          >
                            {isCollapsed ? (
                              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span className="text-sm font-medium text-slate-900 truncate">
                              {sub.title}
                            </span>
                            {isSubHidden && (
                              <span className="text-xs text-amber-700 shrink-0">
                                · Hidden
                              </span>
                            )}
                          </button>

                          <div className="flex items-center gap-1 shrink-0">
                            {sub.canToggleVisible && sub.onToggleVisible && (
                              <button
                                type="button"
                                onClick={() =>
                                  applyDraftMutation(sub.onToggleVisible!)
                                }
                                title={
                                  isSubHidden
                                    ? 'Show on public site'
                                    : 'Hide on public site'
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

                            {sub.onMoveUp && (
                              <button
                                type="button"
                                disabled={!sub.canMoveUp}
                                onClick={() =>
                                  applyDraftMutation(sub.onMoveUp!)
                                }
                                title="Move up"
                                className={`p-1.5 text-xs rounded border transition-colors ${
                                  sub.canMoveUp
                                    ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 cursor-pointer'
                                    : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                                }`}
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {sub.onMoveDown && (
                              <button
                                type="button"
                                disabled={!sub.canMoveDown}
                                onClick={() =>
                                  applyDraftMutation(sub.onMoveDown!)
                                }
                                title="Move down"
                                className={`p-1.5 text-xs rounded border transition-colors ${
                                  sub.canMoveDown
                                    ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 cursor-pointer'
                                    : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                                }`}
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {sub.onRemove && (
                              <button
                                type="button"
                                disabled={!sub.canRemove}
                                onClick={() =>
                                  applyDraftMutation(sub.onRemove!)
                                }
                                title="Move to Trash"
                                className={`p-1.5 text-xs rounded border transition-colors ${
                                  sub.canRemove
                                    ? 'bg-white text-red-600 border-slate-200 hover:bg-red-50 hover:border-red-200 cursor-pointer'
                                    : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                                }`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
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

                            <div className="space-y-5">
                              {sub.fields.map((field) => {
                                const currentValue = field.value ?? '';
                                const publishedFieldState =
                                  publishedFieldsById.get(field.id);

                                return (
                                  <div
                                    key={field.id}
                                    className="space-y-1.5 border-b border-slate-100 pb-5 last:border-b-0 last:pb-0"
                                  >
                                    <label
                                      htmlFor={field.id}
                                      className="block text-xs font-medium text-slate-800"
                                    >
                                      {field.label}
                                    </label>

                                    {field.helperText && (
                                      <p className="text-[11px] text-slate-500">
                                        {field.helperText}
                                      </p>
                                    )}

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
                                          publishedFieldState?.objectKey ?? null
                                        }
                                        getAdminIdToken={getAdminIdToken}
                                        onChangeUrl={(nextUrl) =>
                                          handleFieldValueChange(field, nextUrl)
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
                                          handleFieldRemoveFromPlacement(field)
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
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modal Picker when "Media Library" is clicked on an Image Field */}
      {mediaPickerModalState && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Choose Image from Media Library"
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-xl rounded-md">
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
