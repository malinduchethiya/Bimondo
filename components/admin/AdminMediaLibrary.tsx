'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Eye,
  FolderOpen,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { SiteCmsData } from '@/lib/cms-defaults';
import {
  evaluateMediaObjectUsage,
  MediaUsageReport,
} from '@/lib/media-usage';
import {
  ALLOWED_ROOT_UPLOAD_PREFIXES,
  APPROVED_UPLOAD_FOLDER_PRESETS,
  deleteMediaFromR2Worker,
  listMediaFromR2Worker,
  PUBLIC_CDN_BASE_URL,
  R2ClientUploadError,
  R2MediaItem,
  uploadImageToR2Worker,
  validateClientImageFileBeforeUpload,
  validateClientUploadFolder,
} from '@/lib/r2-upload-client';

export interface SelectedMediaLibraryAsset {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

interface AdminMediaLibraryProps {
  mode: 'screen' | 'picker';
  initialFolder?: string;
  savedCms: SiteCmsData;
  draftCms: SiteCmsData;
  loadingFirestore: boolean;
  existingSectionCount: number;
  totalSectionCount: number;
  firestoreLoadError: string | null;
  getAdminIdToken: () => Promise<string>;
  onSelectMedia?: (asset: SelectedMediaLibraryAsset) => void;
  onClose?: () => void;
}

type UsageFilterTab = 'all' | 'unused' | 'in_use';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}

function formatUploadDate(iso: string): string {
  if (!iso) return 'Unknown date';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime()) || d.getTime() <= 0) return 'Unknown date';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getFilenameFromKey(key: string): string {
  const parts = key.split('/');
  return parts[parts.length - 1] || key;
}

export default function AdminMediaLibrary({
  mode,
  initialFolder = 'pages/home/hero',
  savedCms,
  draftCms,
  loadingFirestore,
  existingSectionCount,
  totalSectionCount,
  firestoreLoadError,
  getAdminIdToken,
  onSelectMedia,
  onClose,
}: AdminMediaLibraryProps) {
  const [selectedFolder, setSelectedFolder] = useState<string>(() => {
    const check = validateClientUploadFolder(initialFolder);
    return check.valid ? check.normalizedFolder : 'pages/home/hero';
  });
  const [customFolderInput, setCustomFolderInput] =
    useState<string>(selectedFolder);

  const [items, setItems] = useState<R2MediaItem[]>([]);
  const [discoveredSubfolders, setDiscoveredSubfolders] = useState<string[]>(
    []
  );
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [listError, setListError] = useState<string | null>(null);

  // Scoped search & usage filter
  const [localSearchQuery, setLocalSearchQuery] = useState<string>('');
  const [usageFilterTab, setUsageFilterTab] = useState<UsageFilterTab>('all');

  // Upload into selected folder state
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [stagedUploadFile, setStagedUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadFeedback, setUploadFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Copy URL feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Preview & Usage Inspector modal state
  const [inspectedItem, setInspectedItem] = useState<R2MediaItem | null>(null);

  // Permanent Deletion confirmation modal state
  const [deleteTargetItem, setDeleteTargetItem] = useState<R2MediaItem | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccessNotice, setDeleteSuccessNotice] = useState<{
    key: string;
    cacheNotice: string;
  } | null>(null);

  const loadFolderMedia = useCallback(
    async (folderToLoad: string, cursorToLoad?: string | null) => {
      const folderCheck = validateClientUploadFolder(folderToLoad);
      if (!folderCheck.valid) {
        setListError(folderCheck.error || 'Invalid folder prefix.');
        return;
      }

      const isPagination = Boolean(cursorToLoad);
      if (isPagination) {
        setIsLoadingMore(true);
      } else {
        setIsLoadingInitial(true);
        setListError(null);
      }

      try {
        const idToken = await getAdminIdToken();
        const response = await listMediaFromR2Worker({
          prefix: folderCheck.normalizedFolder,
          cursor: cursorToLoad || null,
          limit: 24,
          idToken,
        });

        if (isPagination) {
          setItems((prev) => {
            const existingKeys = new Set(prev.map((i) => i.key));
            const merged = [...prev];
            for (const item of response.items) {
              if (!existingKeys.has(item.key)) {
                merged.push(item);
              }
            }
            return merged;
          });
          setDiscoveredSubfolders((prev) =>
            Array.from(new Set([...prev, ...response.subfolders])).sort()
          );
        } else {
          setItems(response.items);
          setDiscoveredSubfolders(response.subfolders);
        }

        setHasMore(response.truncated);
        setNextCursor(response.cursor);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Failed to load media from Cloudflare R2.';
        setListError(msg);
      } finally {
        setIsLoadingInitial(false);
        setIsLoadingMore(false);
      }
    },
    [getAdminIdToken]
  );

  const handleSelectFolder = (folder: string) => {
    setSelectedFolder(folder);
    setCustomFolderInput(folder);
  };

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) {
        void loadFolderMedia(selectedFolder, null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedFolder, loadFolderMedia]);

  // Compute usage reports for all loaded items across saved + draft CMS data
  const usageByKey = useMemo(() => {
    const map = new Map<string, MediaUsageReport>();
    for (const item of items) {
      const report = evaluateMediaObjectUsage({
        objectKey: item.key,
        savedCms,
        draftCms,
        loadingFirestore,
        loadError: firestoreLoadError,
        existingSectionCount,
        totalSectionCount,
        publicBaseUrl: PUBLIC_CDN_BASE_URL,
      });
      map.set(item.key, report);
    }
    return map;
  }, [
    items,
    savedCms,
    draftCms,
    loadingFirestore,
    existingSectionCount,
    totalSectionCount,
    firestoreLoadError,
  ]);

  const filteredItems = useMemo(() => {
    const q = localSearchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const usage = usageByKey.get(item.key);
      if (usageFilterTab === 'unused' && usage?.status !== 'unused') {
        return false;
      }
      if (usageFilterTab === 'in_use' && usage?.status !== 'in_use') {
        return false;
      }
      if (!q) return true;
      const filename = getFilenameFromKey(item.key).toLowerCase();
      return filename.includes(q) || item.key.toLowerCase().includes(q);
    });
  }, [items, localSearchQuery, usageFilterTab, usageByKey]);

  const counts = useMemo(() => {
    let inUse = 0;
    let unused = 0;
    let incomplete = 0;
    for (const item of items) {
      const u = usageByKey.get(item.key);
      if (u?.status === 'in_use') inUse += 1;
      else if (u?.status === 'unused') unused += 1;
      else incomplete += 1;
    }
    return { total: items.length, inUse, unused, incomplete };
  }, [items, usageByKey]);

  const handleApplyCustomFolder = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateClientUploadFolder(customFolderInput);
    if (!check.valid) {
      setListError(check.error || 'Invalid folder path.');
      return;
    }
    setListError(null);
    handleSelectFolder(check.normalizedFolder);
  };

  const handleUploadFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] || null;
    setUploadFeedback(null);
    if (!file) {
      setStagedUploadFile(null);
      return;
    }
    try {
      await validateClientImageFileBeforeUpload(file);
      setStagedUploadFile(file);
    } catch (err) {
      setStagedUploadFile(null);
      if (uploadInputRef.current) {
        uploadInputRef.current.value = '';
      }
      setUploadFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Selected file is not a valid image.',
      });
    }
  };

  const handleUploadIntoFolder = async () => {
    if (!stagedUploadFile || isUploading) return;
    const folderCheck = validateClientUploadFolder(selectedFolder);
    if (!folderCheck.valid) {
      setUploadFeedback({
        type: 'error',
        message: folderCheck.error || 'Select a valid approved folder.',
      });
      return;
    }

    setIsUploading(true);
    setUploadFeedback(null);

    try {
      const idToken = await getAdminIdToken();
      const uploaded = await uploadImageToR2Worker({
        file: stagedUploadFile,
        folder: folderCheck.normalizedFolder,
        idToken,
      });

      setStagedUploadFile(null);
      if (uploadInputRef.current) {
        uploadInputRef.current.value = '';
      }
      setUploadFeedback({
        type: 'success',
        message: `Uploaded "${uploaded.key}" (${formatBytes(uploaded.size)}) to ${folderCheck.normalizedFolder}/. Refreshing folder listing…`,
      });

      await loadFolderMedia(folderCheck.normalizedFolder, null);
    } catch (err) {
      setUploadFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Failed to upload image to Cloudflare R2.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyUrl = async (item: R2MediaItem) => {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopiedKey(item.key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === item.key ? null : prev));
      }, 2000);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleConfirmPermanentDelete = async () => {
    if (!deleteTargetItem || isDeleting) return;
    const usage = usageByKey.get(deleteTargetItem.key);
    if (!usage || !usage.canDeletePermanently) {
      setDeleteError(
        usage?.incompleteReason ||
          'This image cannot be deleted because it is either in use or its reference check is incomplete.'
      );
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const idToken = await getAdminIdToken();
      const res = await deleteMediaFromR2Worker({
        key: deleteTargetItem.key,
        idToken,
      });

      const deletedKey = deleteTargetItem.key;
      setItems((prev) => prev.filter((i) => i.key !== deletedKey));
      if (inspectedItem?.key === deletedKey) {
        setInspectedItem(null);
      }
      setDeleteTargetItem(null);
      setDeleteSuccessNotice({
        key: res.key,
        cacheNotice: res.cacheNotice,
      });
    } catch (err) {
      const msg =
        err instanceof R2ClientUploadError || err instanceof Error
          ? err.message
          : 'Permanent deletion failed.';
      setDeleteError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const inspectedUsage = inspectedItem
    ? usageByKey.get(inspectedItem.key) || null
    : null;
  const deleteTargetUsage = deleteTargetItem
    ? usageByKey.get(deleteTargetItem.key) || null
    : null;

  return (
    <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
      {/* Header Bar */}
      <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/70">
        <div>
          <div className="text-[11px] font-mono text-slate-500 flex flex-wrap items-center gap-2">
            <span>CLOUDFLARE R2 MEDIA LIBRARY · {PUBLIC_CDN_BASE_URL}</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mt-0.5">
            {mode === 'picker'
              ? 'Choose Image from R2 Media Library'
              : 'R2 Media Library & Usage Inspector'}
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 max-w-3xl">
            Browse uploaded images beneath approved prefixes (
            <code className="font-mono">pages/</code>,{' '}
            <code className="font-mono">shared/</code>,{' '}
            <code className="font-mono">tours/</code>,{' '}
            <code className="font-mono">gallery/</code>), reuse images across
            sections with per-placement alt text, and inspect active, hidden, or
            Trash references before cleanup.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => loadFolderMedia(selectedFolder, null)}
            disabled={isLoadingInitial || isLoadingMore}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoadingInitial ? 'animate-spin' : ''}`}
            />
            Refresh Folder
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              {mode === 'picker' ? 'Cancel' : 'Back to Page Editor'}
            </button>
          )}
        </div>
      </div>

      {/* Reference Check Completeness Warning if fewer than 22 sections exist in Firestore */}
      {(existingSectionCount < totalSectionCount || firestoreLoadError) && (
        <div
          role="alert"
          className="px-6 py-3 bg-amber-50 border-b border-amber-200 text-xs text-amber-950 flex items-start gap-2.5"
        >
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-semibold">
              Usage Check Incomplete — Permanent R2 Deletion Safeguard Active
            </div>
            <div className="text-[11px] text-amber-900 leading-relaxed">
              {firestoreLoadError
                ? `Cloud Firestore reported a read error (${firestoreLoadError}).`
                : `Only ${existingSectionCount} of ${totalSectionCount} CMS section documents are currently initialized in Cloud Firestore.`}{' '}
              Because the system cannot authoritatively verify all 22 sections,
              every unreferenced image is marked{' '}
              <strong>&ldquo;Usage check incomplete&rdquo;</strong> and
              permanent R2 deletion is disabled until all sections are
              initialized and readable.
            </div>
          </div>
        </div>
      )}

      {/* Permanent Deletion Success Banner with CDN Cache Notice */}
      {deleteSuccessNotice && (
        <div
          role="status"
          className="px-6 py-3 bg-emerald-50 border-b border-emerald-200 text-xs text-emerald-950 flex items-start justify-between gap-4"
        >
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-semibold">
                Permanently deleted R2 object:{' '}
                <code className="font-mono">{deleteSuccessNotice.key}</code>
              </div>
              <div className="text-[11px] text-emerald-900 leading-relaxed">
                {deleteSuccessNotice.cacheNotice}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDeleteSuccessNotice(null)}
            className="text-emerald-800 hover:text-emerald-950 font-medium text-[11px] shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)]">
        {/* Left Column: Approved Folder Navigation */}
        <aside className="border-b lg:border-b-0 lg:border-r border-slate-200 p-4 bg-slate-50/40 space-y-4">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Approved Root Prefixes
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {ALLOWED_ROOT_UPLOAD_PREFIXES.map((rootPrefix) => {
                const isRootActive =
                  selectedFolder === rootPrefix ||
                  selectedFolder.startsWith(`${rootPrefix}/`);
                return (
                  <button
                    key={rootPrefix}
                    type="button"
                    onClick={() => handleSelectFolder(rootPrefix)}
                    className={`px-2.5 py-1.5 text-xs font-mono rounded border text-left transition-colors cursor-pointer ${
                      selectedFolder === rootPrefix
                        ? 'bg-slate-900 text-white border-slate-900'
                        : isRootActive
                          ? 'bg-slate-200/80 text-slate-900 border-slate-300 font-semibold'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {rootPrefix}/
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Standard Section Folders
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
              {APPROVED_UPLOAD_FOLDER_PRESETS.map((preset) => {
                const isSelected = selectedFolder === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleSelectFolder(preset.value)}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-700 hover:bg-slate-200/60'
                    }`}
                  >
                    <div className="font-mono text-[11px] truncate">
                      {preset.value}/
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {discoveredSubfolders.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Subfolders in {selectedFolder}/
              </div>
              <div className="space-y-1">
                {discoveredSubfolders.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => handleSelectFolder(sub)}
                    className="w-full text-left px-2.5 py-1.5 rounded text-xs font-mono text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{sub}/</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form
            onSubmit={handleApplyCustomFolder}
            className="pt-3 border-t border-slate-200 space-y-1.5"
          >
            <label
              htmlFor="media-custom-folder-input"
              className="block text-[11px] font-medium text-slate-600"
            >
              Browse Custom Approved Folder
            </label>
            <div className="flex gap-1.5">
              <input
                id="media-custom-folder-input"
                type="text"
                value={customFolderInput}
                onChange={(e) => setCustomFolderInput(e.target.value)}
                placeholder="pages/home/hero"
                className="flex-1 min-w-0 px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-500"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 text-xs font-medium bg-slate-900 text-white rounded hover:bg-slate-800 cursor-pointer shrink-0"
              >
                Go
              </button>
            </div>
          </form>
        </aside>

        {/* Right Column: Upload Bar, Filter/Search Bar, and Thumbnail Grid */}
        <div className="p-5 space-y-5 min-w-0">
          {/* Upload directly into selected approved folder */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Upload className="w-3.5 h-3.5 text-slate-700" />
                <span className="text-xs font-semibold text-slate-900">
                  Upload New Image into{' '}
                  <code className="font-mono text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {selectedFolder}/
                  </code>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={uploadInputRef}
                  id="media-library-upload-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                  disabled={isUploading}
                  onChange={handleUploadFileSelect}
                  className="sr-only"
                />
                <label
                  htmlFor="media-library-upload-input"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
                    isUploading
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer'
                  }`}
                >
                  Choose Image File…
                </label>

                {stagedUploadFile && (
                  <span className="text-xs font-mono text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 truncate max-w-[200px]">
                    {stagedUploadFile.name} ({formatBytes(stagedUploadFile.size)})
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleUploadIntoFolder}
                  disabled={!stagedUploadFile || isUploading}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded transition-colors ${
                    stagedUploadFile && !isUploading
                      ? 'bg-slate-900 text-white hover:bg-slate-800 cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      Upload &amp; Refresh
                    </>
                  )}
                </button>
              </div>
            </div>

            {uploadFeedback && (
              <div
                role="status"
                className={`px-3 py-2 text-xs rounded border flex items-center justify-between gap-2 ${
                  uploadFeedback.type === 'error'
                    ? 'bg-red-50 text-red-900 border-red-200'
                    : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                }`}
              >
                <span>{uploadFeedback.message}</span>
                <button
                  type="button"
                  onClick={() => setUploadFeedback(null)}
                  className="text-[11px] font-medium underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {/* Filter Tabs & Clearly Scoped Current-Folder Search */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono text-slate-500">
                CURRENT FOLDER: <strong className="text-slate-800">{selectedFolder}/</strong>{' '}
                · {items.length} loaded object{items.length === 1 ? '' : 's'}
                {hasMore ? ' (more pages available)' : ''}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setUsageFilterTab('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                    usageFilterTab === 'all'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  All Loaded ({counts.total})
                </button>
                <button
                  type="button"
                  onClick={() => setUsageFilterTab('in_use')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                    usageFilterTab === 'in_use'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  In Use ({counts.inUse})
                </button>
                <button
                  type="button"
                  onClick={() => setUsageFilterTab('unused')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                    usageFilterTab === 'unused'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Unused Images Review ({counts.unused})
                </button>
              </div>
            </div>

            <div className="w-full md:w-80">
              <label
                htmlFor="media-scoped-search"
                className="block text-[11px] font-medium text-slate-600 mb-1"
              >
                Filter loaded images in{' '}
                <code className="font-mono">{selectedFolder}/</code> only
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="media-scoped-search"
                  type="search"
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  placeholder="Filter loaded items by filename..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Scope: Filters only the currently loaded objects in{' '}
                <code className="font-mono">{selectedFolder}/</code> (does not
                search the entire R2 bucket).
              </p>
            </div>
          </div>

          {listError ? (
            <div
              role="alert"
              className="p-5 bg-red-50 border border-red-200 rounded-md text-xs text-red-900 flex items-center justify-between gap-4"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">
                    Unable to Load R2 Media Folder ({selectedFolder}/)
                  </div>
                  <div className="mt-0.5">{listError}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => loadFolderMedia(selectedFolder, null)}
                className="px-3 py-1.5 text-xs font-medium bg-white border border-red-300 rounded hover:bg-red-100 cursor-pointer shrink-0"
              >
                Retry
              </button>
            </div>
          ) : isLoadingInitial ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin text-slate-700" />
              <span>
                Loading images in{' '}
                <code className="font-mono">{selectedFolder}/</code>…
              </span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-14 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-md space-y-1">
              <div className="font-medium text-slate-700">
                {items.length === 0
                  ? `No uploaded images found in "${selectedFolder}/".`
                  : 'No loaded images match your current filter.'}
              </div>
              <div>
                {items.length === 0
                  ? 'Upload an image above or select another approved folder on the left.'
                  : 'Clear the search filter or switch back to "All Loaded".'}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Thumbnail Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredItems.map((item) => {
                  const filename = getFilenameFromKey(item.key);
                  const usage = usageByKey.get(item.key);
                  const isCopied = copiedKey === item.key;

                  return (
                    <div
                      key={item.key}
                      className="border border-slate-200 rounded-md bg-white overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-colors"
                    >
                      <div>
                        {/* Image Thumbnail */}
                        <div className="h-40 bg-slate-100 border-b border-slate-200 relative flex items-center justify-center overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.url}
                            alt={filename}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />

                          {/* Usage Status Badge */}
                          <div className="absolute top-2 left-2">
                            {usage?.status === 'in_use' ? (
                              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-950/90 text-emerald-200 rounded border border-emerald-700">
                                In use ({usage.placements.length})
                              </span>
                            ) : usage?.status === 'unused' ? (
                              <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-900/85 text-slate-200 rounded border border-slate-700">
                                No saved references found
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-950/90 text-amber-200 rounded border border-amber-700">
                                Usage check incomplete
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Metadata Body */}
                        <div className="p-3.5 space-y-2">
                          <div
                            className="text-xs font-semibold text-slate-900 truncate"
                            title={filename}
                          >
                            {filename}
                          </div>
                          <div
                            className="text-[11px] font-mono text-slate-500 truncate"
                            title={item.key}
                          >
                            {item.key}
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-100">
                            <span>{formatBytes(item.size)}</span>
                            <span>{formatUploadDate(item.uploadedAt)}</span>
                          </div>

                          {/* Short Usage Summary */}
                          {usage && usage.placements.length > 0 && (
                            <div className="pt-1 space-y-1">
                              <div className="text-[10px] font-semibold text-slate-600">
                                Referenced in:
                              </div>
                              <div className="space-y-0.5">
                                {usage.placements.slice(0, 2).map((pl) => (
                                  <div
                                    key={`${pl.fieldId}-${pl.state}`}
                                    className="text-[11px] text-slate-700 truncate flex items-center gap-1.5"
                                    title={pl.readableLocation}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                        pl.state === 'active'
                                          ? 'bg-emerald-500'
                                          : pl.state === 'trashed'
                                            ? 'bg-red-500'
                                            : pl.state === 'hidden'
                                              ? 'bg-amber-500'
                                              : 'bg-blue-500'
                                      }`}
                                    />
                                    <span className="truncate">
                                      {pl.readableLocation}
                                    </span>
                                  </div>
                                ))}
                                {usage.placements.length > 2 && (
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    +{usage.placements.length - 2} more placement
                                    {usage.placements.length - 2 === 1 ? '' : 's'}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectedItem(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-100 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            Preview &amp; Usage
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyUrl(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-100 cursor-pointer"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copy URL
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {mode === 'picker' && onSelectMedia && (
                            <button
                              type="button"
                              onClick={() =>
                                onSelectMedia({
                                  key: item.key,
                                  url: item.url,
                                  size: item.size,
                                  contentType: item.contentType,
                                })
                              }
                              className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-medium text-white bg-slate-900 rounded hover:bg-slate-800 cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              Use Image
                            </button>
                          )}

                          {mode === 'screen' && (
                            <button
                              type="button"
                              disabled={!usage?.canDeletePermanently}
                              onClick={() => {
                                setDeleteError(null);
                                setDeleteTargetItem(item);
                              }}
                              title={
                                usage?.canDeletePermanently
                                  ? 'Permanently delete unused image from R2'
                                  : usage?.status === 'in_use'
                                    ? 'Cannot delete: image is still referenced in site content'
                                    : 'Cannot delete: usage check is incomplete'
                              }
                              className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded border transition-colors ${
                                usage?.canDeletePermanently
                                  ? 'text-red-700 bg-white border-red-200 hover:bg-red-50 cursor-pointer'
                                  : 'text-slate-400 bg-slate-100 border-slate-200 cursor-not-allowed'
                              }`}
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cursor Pagination Load More */}
              {hasMore && nextCursor && (
                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    disabled={isLoadingMore}
                    onClick={() => loadFolderMedia(selectedFolder, nextCursor)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-md hover:bg-slate-50 cursor-pointer"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Loading more objects…
                      </>
                    ) : (
                      <>Load More from {selectedFolder}/</>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          MODAL 1: Preview & Full Usage Report
         ===================================================================== */}
      {inspectedItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image Preview and Usage Details"
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-md max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[11px] font-mono text-slate-500">
                  IMAGE PREVIEW &amp; CONTENT REFERENCES
                </div>
                <h3 className="text-sm font-semibold text-slate-900 truncate">
                  {inspectedItem.key}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectedItem(null)}
                className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-slate-100 border border-slate-200 rounded-md overflow-hidden max-h-72 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={inspectedItem.url}
                  alt={inspectedItem.key}
                  referrerPolicy="no-referrer"
                  className="max-h-72 w-auto object-contain"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded border border-slate-200 font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">
                    R2 OBJECT KEY
                  </span>
                  <span className="text-slate-900 break-all">
                    {inspectedItem.key}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">
                    PUBLIC CDN URL
                  </span>
                  <span className="text-slate-900 break-all">
                    {inspectedItem.url}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">
                    SIZE &amp; CONTENT TYPE
                  </span>
                  <span className="text-slate-900">
                    {formatBytes(inspectedItem.size)} · {inspectedItem.contentType}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">
                    UPLOADED AT
                  </span>
                  <span className="text-slate-900">
                    {formatUploadDate(inspectedItem.uploadedAt)}
                  </span>
                </div>
              </div>

              {/* Where This Image Is Used */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-900">
                    Where This Image Is Used
                  </h4>
                  {inspectedUsage?.status === 'in_use' ? (
                    <span className="px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
                      In use ({inspectedUsage.placements.length} placement
                      {inspectedUsage.placements.length === 1 ? '' : 's'})
                    </span>
                  ) : inspectedUsage?.status === 'unused' ? (
                    <span className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 rounded">
                      No saved references found
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-200 rounded">
                      Usage check incomplete
                    </span>
                  )}
                </div>

                {inspectedUsage?.status === 'check_incomplete' && (
                  <div className="p-3 text-xs bg-amber-50 text-amber-950 border border-amber-200 rounded">
                    {inspectedUsage.incompleteReason}
                  </div>
                )}

                {inspectedUsage && inspectedUsage.placements.length === 0 ? (
                  <div className="p-4 text-xs text-slate-500 border border-dashed border-slate-200 rounded text-center">
                    No active, hidden, soft-deleted Trash, or unsaved draft
                    placements reference this image.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded">
                    {inspectedUsage?.placements.map((pl) => (
                      <div
                        key={`${pl.fieldId}-${pl.state}`}
                        className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="font-medium text-slate-900">
                            {pl.readableLocation}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono truncate">
                            Section Doc: /cms_sections/{pl.sectionDocId} · Alt:{' '}
                            {pl.altText ? `"${pl.altText}"` : '(empty)'}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-mono rounded border shrink-0 ${
                            pl.state === 'active'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : pl.state === 'hidden'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : pl.state === 'trashed'
                                  ? 'bg-red-50 text-red-800 border-red-200'
                                  : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}
                        >
                          {pl.state === 'active'
                            ? 'Published (Active)'
                            : pl.state === 'hidden'
                              ? 'Hidden (visible: false)'
                              : pl.state === 'trashed'
                                ? 'Soft-Deleted in Trash'
                                : 'Unsaved Editor Draft'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleCopyUrl(inspectedItem)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedKey === inspectedItem.key ? 'Copied CDN URL' : 'Copy CDN URL'}
              </button>

              <div className="flex items-center gap-2">
                {mode === 'picker' && onSelectMedia && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectMedia({
                        key: inspectedItem.key,
                        url: inspectedItem.url,
                        size: inspectedItem.size,
                        contentType: inspectedItem.contentType,
                      });
                      setInspectedItem(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Select This Image
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setInspectedItem(null)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-200/70 rounded hover:bg-slate-200 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: Explicit Permanent R2 Deletion Confirmation
         ===================================================================== */}
      {deleteTargetItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Permanent R2 Deletion"
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-md max-w-lg w-full overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-red-50/60">
              <div className="flex items-center gap-2 text-red-900">
                <Trash2 className="w-4 h-4 text-red-700 shrink-0" />
                <h3 className="text-sm font-semibold">
                  Confirm Permanent R2 Object Deletion
                </h3>
              </div>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTargetItem(null)}
                className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex gap-3.5 items-start">
                <div className="w-24 h-20 rounded bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={deleteTargetItem.url}
                    alt={deleteTargetItem.key}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1 min-w-0 font-mono text-[11px]">
                  <div className="text-slate-500">Exact R2 Object Key:</div>
                  <div className="text-slate-900 font-semibold break-all">
                    {deleteTargetItem.key}
                  </div>
                  <div className="text-slate-500">
                    Size: {formatBytes(deleteTargetItem.size)} · Uploaded:{' '}
                    {formatUploadDate(deleteTargetItem.uploadedAt)}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-950 space-y-1.5 leading-relaxed">
                <div className="font-semibold">
                  Permanent Deletion Cannot Be Undone
                </div>
                <p>
                  This action permanently deletes{' '}
                  <code className="font-mono">{deleteTargetItem.key}</code> from
                  the Cloudflare R2 bucket (<code className="font-mono">BIMONDO_IMAGES</code>) after
                  locking <code className="font-mono">/media_objects</code> and
                  verifying across all 22 Firestore{' '}
                  <code className="font-mono">/cms_sections</code> documents that
                  no active, hidden, or soft-deleted Trash content references it.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-700 space-y-1 leading-relaxed">
                <div className="font-semibold text-slate-900">
                  CDN Caching Notice ({PUBLIC_CDN_BASE_URL})
                </div>
                <p>
                  Uploaded images use long-lived{' '}
                  <code className="font-mono">
                    Cache-Control: public, max-age=31536000, immutable
                  </code>{' '}
                  headers. Deleting an object from R2 removes the origin file
                  immediately, but copies already cached at Cloudflare CDN edge
                  locations may remain accessible until cache expiration or a
                  separate Cloudflare cache purge.
                </p>
              </div>

              {deleteError && (
                <div
                  role="alert"
                  className="p-3 bg-red-100 border border-red-300 rounded text-red-950 flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                  <span>{deleteError}</span>
                </div>
              )}
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTargetItem(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting || !deleteTargetUsage?.canDeletePermanently}
                onClick={handleConfirmPermanentDelete}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-red-700 hover:bg-red-800 disabled:bg-slate-300 rounded cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Verifying &amp; Deleting from R2…
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Permanently Delete from R2
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
