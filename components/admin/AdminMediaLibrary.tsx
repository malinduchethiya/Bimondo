'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Eye,
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

  const [items, setItems] = useState<R2MediaItem[]>([]);
  const [discoveredSubfolders, setDiscoveredSubfolders] = useState<string[]>(
    []
  );
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [listError, setListError] = useState<string | null>(null);

  const [localSearchQuery, setLocalSearchQuery] = useState<string>('');
  const [usageFilterTab, setUsageFilterTab] = useState<UsageFilterTab>('all');

  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadFeedback, setUploadFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [inspectedItem, setInspectedItem] = useState<R2MediaItem | null>(null);

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
    for (const item of items) {
      const u = usageByKey.get(item.key);
      if (u?.status === 'in_use') inUse += 1;
      else if (u?.status === 'unused') unused += 1;
    }
    return { total: items.length, inUse, unused };
  }, [items, usageByKey]);

  // 1-click upload into current folder when file is chosen
  const handleUploadFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] || null;
    setUploadFeedback(null);
    if (!file) return;

    const folderCheck = validateClientUploadFolder(selectedFolder);
    if (!folderCheck.valid) {
      setUploadFeedback({
        type: 'error',
        message: folderCheck.error || 'Select a valid approved folder.',
      });
      return;
    }

    try {
      await validateClientImageFileBeforeUpload(file);
    } catch (err) {
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
      return;
    }

    setIsUploading(true);
    try {
      const idToken = await getAdminIdToken();
      const uploaded = await uploadImageToR2Worker({
        file,
        folder: folderCheck.normalizedFolder,
        idToken,
      });

      if (uploadInputRef.current) {
        uploadInputRef.current.value = '';
      }
      setUploadFeedback({
        type: 'success',
        message: `Uploaded ${getFilenameFromKey(uploaded.key)} (${formatBytes(uploaded.size)})`,
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
          'This image cannot be deleted because it is in use or usage check is incomplete.'
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

  const folderOptions = useMemo(() => {
    const presetValues = new Set(
      APPROVED_UPLOAD_FOLDER_PRESETS.map((p) => p.value)
    );
    const extras = discoveredSubfolders.filter((s) => !presetValues.has(s));
    return { presets: APPROVED_UPLOAD_FOLDER_PRESETS, extras };
  }, [discoveredSubfolders]);

  return (
    <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
      {/* Clean Header Bar */}
      <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            {mode === 'picker' ? 'Select Image from Media Library' : 'Media Library'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {PUBLIC_CDN_BASE_URL} · {items.length} loaded in{' '}
            <span className="font-mono text-slate-700">{selectedFolder}/</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
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
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              isUploading
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-slate-900 text-white hover:bg-slate-800 cursor-pointer'
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
                Upload to Folder
              </>
            )}
          </label>

          <button
            type="button"
            onClick={() => loadFolderMedia(selectedFolder, null)}
            disabled={isLoadingInitial || isLoadingMore}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer whitespace-nowrap shrink-0"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoadingInitial ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer whitespace-nowrap shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              {mode === 'picker' ? 'Cancel' : 'Close'}
            </button>
          )}
        </div>
      </div>

      {/* Safeguard notice when fewer than 22 sections are initialized */}
      {(existingSectionCount < totalSectionCount || firestoreLoadError) && (
        <div
          role="alert"
          className="px-6 py-2.5 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-center gap-2"
        >
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            {firestoreLoadError
              ? `Firestore read warning (${firestoreLoadError}).`
              : `${existingSectionCount} of ${totalSectionCount} sections initialized in Firestore.`}{' '}
            Permanent R2 deletion is disabled until all 22 sections are initialized.
          </span>
        </div>
      )}

      {/* Upload or Delete Feedback */}
      {uploadFeedback && (
        <div
          role="status"
          className={`px-6 py-2.5 text-xs border-b flex items-center justify-between gap-2 ${
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

      {deleteSuccessNotice && (
        <div
          role="status"
          className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-200 text-xs text-emerald-950 flex items-center justify-between gap-4"
        >
          <span>
            Deleted <code className="font-mono">{deleteSuccessNotice.key}</code>.{' '}
            {deleteSuccessNotice.cacheNotice}
          </span>
          <button
            type="button"
            onClick={() => setDeleteSuccessNotice(null)}
            className="text-emerald-800 hover:text-emerald-950 font-medium text-[11px] shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Compact Toolbar: Folder Select + Usage Filter + Search */}
      <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <label htmlFor="media-folder-select" className="text-xs font-medium text-slate-600">
            Folder
          </label>
          <select
            id="media-folder-select"
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-slate-500"
          >
            {folderOptions.presets.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
            {folderOptions.extras.map((extra) => (
              <option key={extra} value={extra}>
                {extra}/
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-md">
            <button
              type="button"
              onClick={() => setUsageFilterTab('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                usageFilterTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({counts.total})
            </button>
            <button
              type="button"
              onClick={() => setUsageFilterTab('in_use')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                usageFilterTab === 'in_use'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              In Use ({counts.inUse})
            </button>
            <button
              type="button"
              onClick={() => setUsageFilterTab('unused')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                usageFilterTab === 'unused'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unused ({counts.unused})
            </button>
          </div>
        </div>

        <div className="relative w-full lg:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="media-scoped-search"
            type="search"
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            placeholder="Filter folder by filename..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500"
          />
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-6">
        {listError ? (
          <div
            role="alert"
            className="p-4 bg-red-50 border border-red-200 rounded-md text-xs text-red-900 flex items-center justify-between gap-4"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">
                  Unable to load folder ({selectedFolder}/)
                </div>
                <div className="mt-0.5">{listError}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => loadFolderMedia(selectedFolder, null)}
              className="px-3 py-1.5 text-xs font-medium bg-white border border-red-300 rounded-md hover:bg-red-100 cursor-pointer shrink-0"
            >
              Retry
            </button>
          </div>
        ) : isLoadingInitial ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-slate-700" />
            <span>Loading {selectedFolder}/…</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-14 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-md space-y-1">
            <div className="font-medium text-slate-700">
              {items.length === 0
                ? `No images in "${selectedFolder}/".`
                : 'No images match your current filter.'}
            </div>
            <div>
              {items.length === 0
                ? 'Click "Upload to Folder" above or switch folders.'
                : 'Clear the search filter or switch to "All".'}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
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
                      <div className="h-36 bg-slate-100 border-b border-slate-200 relative flex items-center justify-center overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.url}
                          alt={filename}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="p-3 space-y-1">
                        <div
                          className="text-xs font-medium text-slate-900 truncate"
                          title={filename}
                        >
                          {filename}
                        </div>

                        {/* Unboxed Metadata Line */}
                        <div className="text-[11px] text-slate-500 tabular-nums flex items-center gap-1.5 truncate">
                          <span>{formatBytes(item.size)}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {usage?.status === 'in_use'
                              ? `Used in ${usage.placements.length}`
                              : usage?.status === 'unused'
                                ? 'Unused'
                                : 'Check incomplete'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setInspectedItem(item)}
                          title="Inspect image details and placements"
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-100 cursor-pointer whitespace-nowrap"
                        >
                          <Eye className="w-3 h-3" />
                          Details
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyUrl(item)}
                          title="Copy public CDN URL"
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-100 cursor-pointer whitespace-nowrap"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              URL
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
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
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-white bg-slate-900 rounded hover:bg-slate-800 cursor-pointer whitespace-nowrap"
                          >
                            <Check className="w-3 h-3" />
                            Select
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
                                  ? 'Cannot delete: image is referenced in content'
                                  : 'Cannot delete: usage check is incomplete'
                            }
                            className={`p-1 text-[11px] rounded border transition-colors ${
                              usage?.canDeletePermanently
                                ? 'text-red-700 bg-white border-red-200 hover:bg-red-50 cursor-pointer'
                                : 'text-slate-300 bg-slate-100 border-slate-200 cursor-not-allowed'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

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
                      Loading more…
                    </>
                  ) : (
                    <>Load More</>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal 1: Image Details & Placements */}
      {inspectedItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image Details"
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-md max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-4">
              <h3 className="text-sm font-semibold text-slate-900 truncate">
                {getFilenameFromKey(inspectedItem.key)}
              </h3>
              <button
                type="button"
                onClick={() => setInspectedItem(null)}
                className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-slate-100 border border-slate-200 rounded-md overflow-hidden max-h-64 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={inspectedItem.url}
                  alt={inspectedItem.key}
                  referrerPolicy="no-referrer"
                  className="max-h-64 w-auto object-contain"
                />
              </div>

              <div className="text-xs space-y-1 text-slate-600 font-mono break-all">
                <div>Key: {inspectedItem.key}</div>
                <div>URL: {inspectedItem.url}</div>
                <div>
                  {formatBytes(inspectedItem.size)} · {inspectedItem.contentType} ·{' '}
                  {formatUploadDate(inspectedItem.uploadedAt)}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-900">
                  Placements ({inspectedUsage?.placements.length || 0})
                </div>

                {inspectedUsage && inspectedUsage.placements.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Not referenced in any section.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-md">
                    {inspectedUsage?.placements.map((pl) => (
                      <div
                        key={`${pl.fieldId}-${pl.state}`}
                        className="p-2.5 flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="text-slate-800 truncate">
                          {pl.readableLocation}
                        </span>
                        <span className="text-[11px] text-slate-500 shrink-0">
                          {pl.state}
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedKey === inspectedItem.key ? 'Copied' : 'Copy URL'}
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
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Select Image
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setInspectedItem(null)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-200/70 rounded-md hover:bg-slate-200 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Confirm Permanent Deletion */}
      {deleteTargetItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Permanent R2 Deletion"
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-md max-w-md w-full overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Delete Image Permanently
              </h3>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTargetItem(null)}
                className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs text-slate-600">
              <p>
                Permanently delete{' '}
                <code className="font-mono text-slate-900">
                  {deleteTargetItem.key}
                </code>{' '}
                from Cloudflare R2 (<code className="font-mono">BIMONDO_IMAGES</code>)?
                This action cannot be undone.
              </p>

              {deleteError && (
                <div
                  role="alert"
                  className="p-3 bg-red-50 border border-red-200 rounded-md text-red-900 flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{deleteError}</span>
                </div>
              )}
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTargetItem(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting || !deleteTargetUsage?.canDeletePermanently}
                onClick={handleConfirmPermanentDelete}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-slate-300 rounded-md cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Permanently
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
