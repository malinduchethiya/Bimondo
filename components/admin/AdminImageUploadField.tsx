'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  FolderOpen,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Upload,
  X,
} from 'lucide-react';
import { AdminFieldItem } from '@/lib/admin-ui-schema';
import { isForbiddenImageUrl } from '@/lib/content-repository';
import {
  APPROVED_UPLOAD_FOLDER_PRESETS,
  getDefaultFolderForSection,
  getUploadWorkerEndpointResolution,
  PUBLIC_CDN_BASE_URL,
  R2ClientUploadError,
  R2UploadErrorCategory,
  R2UploadSuccessResponse,
  uploadImageToR2Worker,
  validateClientImageFileBeforeUpload,
  validateClientUploadFolder,
} from '@/lib/r2-upload-client';

export interface PendingFieldImageAssignment {
  key: string;
  url: string;
  contentType: string;
  size: number;
  source: 'uploaded' | 'library';
}

interface AdminImageUploadFieldProps {
  field: AdminFieldItem;
  sectionId: string;
  isSectionSaving: boolean;
  isAnyUploadInProgress: boolean;
  pendingUploadInfo?: PendingFieldImageAssignment | null;
  publishedUrl: string;
  publishedObjectKey: string | null;
  getAdminIdToken: () => Promise<string>;
  onChangeUrl: (nextUrl: string) => void;
  onChangeAlt: (nextAlt: string) => void;
  onUploadSuccess: (uploaded: R2UploadSuccessResponse) => void;
  onOpenMediaLibraryPicker: (preferredFolder: string) => void;
  onRemoveFromPlacement: () => void;
  onUploadStart: (fieldId: string) => void;
  onUploadEnd: (fieldId: string) => void;
}

const ERROR_CATEGORY_LABELS: Record<R2UploadErrorCategory, string> = {
  unconfigured: 'Worker Endpoint Not Configured',
  auth: 'Authentication Error (401)',
  forbidden: 'Authorization / Origin Denied (403)',
  invalid_file: 'Invalid Image File / Signature Mismatch',
  size_limit: 'File Size Limit Exceeded (Max 10 MiB)',
  invalid_folder: 'Invalid Upload Folder Path',
  network: 'Network or CORS Error',
  upload_failed: 'R2 Upload Failed',
};

function inferInitialFolder(
  objectKey: string | null | undefined,
  sectionId: string
): string {
  if (objectKey && objectKey.includes('/')) {
    const lastSlash = objectKey.lastIndexOf('/');
    const dir = objectKey.slice(0, lastSlash).trim();
    const check = validateClientUploadFolder(dir);
    if (check.valid) {
      return check.normalizedFolder;
    }
  }
  return getDefaultFolderForSection(sectionId);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}

export default function AdminImageUploadField({
  field,
  sectionId,
  isSectionSaving,
  isAnyUploadInProgress,
  pendingUploadInfo,
  publishedUrl,
  publishedObjectKey,
  getAdminIdToken,
  onChangeUrl,
  onChangeAlt,
  onUploadSuccess,
  onOpenMediaLibraryPicker,
  onRemoveFromPlacement,
  onUploadStart,
  onUploadEnd,
}: AdminImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [folderInput, setFolderInput] = useState<string>(() =>
    inferInitialFolder(field.objectKey, sectionId)
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [isUploadingThisField, setIsUploadingThisField] =
    useState<boolean>(false);
  const [uploadError, setUploadError] = useState<{
    category: R2UploadErrorCategory;
    message: string;
  } | null>(null);

  // Revoke temporary blob object URLs when changed or unmounted
  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  const clearSelectedFileAndPreview = () => {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }
    setLocalPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] || null;
    setUploadError(null);

    if (!file) {
      clearSelectedFileAndPreview();
      return;
    }

    try {
      await validateClientImageFileBeforeUpload(file);
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
      const nextPreviewUrl = URL.createObjectURL(file);
      setSelectedFile(file);
      setLocalPreviewUrl(nextPreviewUrl);
    } catch (err) {
      clearSelectedFileAndPreview();
      if (err instanceof R2ClientUploadError) {
        setUploadError({
          category: err.category,
          message: err.message,
        });
      } else {
        setUploadError({
          category: 'invalid_file',
          message:
            err instanceof Error
              ? err.message
              : 'Selected file is not a valid image.',
        });
      }
    }
  };

  const handleUploadClick = async () => {
    if (!selectedFile || isUploadingThisField || isSectionSaving) return;

    const folderValidation = validateClientUploadFolder(folderInput);
    if (!folderValidation.valid) {
      setUploadError({
        category: 'invalid_folder',
        message:
          folderValidation.error ||
          'Choose an approved folder prefix (pages/, shared/, tours/, or gallery/).',
      });
      return;
    }

    setIsUploadingThisField(true);
    setUploadError(null);
    onUploadStart(field.id);

    try {
      const idToken = await getAdminIdToken();
      const uploaded = await uploadImageToR2Worker({
        file: selectedFile,
        folder: folderValidation.normalizedFolder,
        idToken,
      });

      clearSelectedFileAndPreview();
      onUploadSuccess(uploaded);
    } catch (err) {
      if (err instanceof R2ClientUploadError) {
        setUploadError({
          category: err.category,
          message: err.message,
        });
      } else {
        setUploadError({
          category: 'upload_failed',
          message:
            err instanceof Error
              ? err.message
              : 'Failed to upload image to Cloudflare R2.',
        });
      }
    } finally {
      setIsUploadingThisField(false);
      onUploadEnd(field.id);
    }
  };

  const currentValue = field.value ?? '';
  const currentAlt = field.altText ?? '';
  const currentKey = field.objectKey ?? null;
  const hasForbiddenUrl = isForbiddenImageUrl(currentValue);

  const folderCheck = validateClientUploadFolder(folderInput);
  const matchingPreset = APPROVED_UPLOAD_FOLDER_PRESETS.find(
    (p) => p.value === folderCheck.normalizedFolder
  );
  const workerResolution = getUploadWorkerEndpointResolution();

  // Display local preview if a file is staged for upload, otherwise the draft/saved URL
  const displayPreviewSrc =
    localPreviewUrl || (!hasForbiddenUrl ? currentValue : '');

  const isPendingSave =
    Boolean(pendingUploadInfo) &&
    currentValue === pendingUploadInfo?.url &&
    currentKey === pendingUploadInfo?.key;

  const isControlsDisabled =
    isSectionSaving || (isAnyUploadInProgress && !isUploadingThisField);

  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-3.5">
      {/* Top Status Banner when an R2 upload or Media Library selection is waiting for Section Save */}
      {isPendingSave && pendingUploadInfo && (
        <div
          role="status"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5 text-xs bg-amber-50 text-amber-950 border border-amber-300 rounded-md"
        >
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-semibold text-amber-950">
                {pendingUploadInfo.source === 'library'
                  ? 'Selected from Media Library — save this section to publish'
                  : 'Uploaded — save this section to publish'}
              </div>
              <div className="text-[11px] text-amber-900 font-mono break-all">
                Key: {pendingUploadInfo.key} ({formatBytes(pendingUploadInfo.size)})
              </div>
              <div className="text-[11px] text-amber-800">
                The live website still displays the previously published image until you click{' '}
                <strong>Save Changes</strong>.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-start">
        {/* Image Thumbnail Preview Slot */}
        <div className="w-full sm:w-40 space-y-1.5 shrink-0">
          <div className="w-full h-28 rounded bg-slate-200/70 border border-slate-300 flex items-center justify-center overflow-hidden relative">
            {displayPreviewSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayPreviewSrc}
                alt={currentAlt || field.label}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-1 text-slate-500 px-2 text-center">
                <ImageIcon className="w-4 h-4 text-slate-400" />
                <span className="text-[11px] font-mono">No image set</span>
              </div>
            )}

            {localPreviewUrl && (
              <span className="absolute bottom-1 left-1 right-1 px-1.5 py-0.5 text-[10px] font-mono bg-slate-900/85 text-white rounded text-center truncate">
                Staged file preview
              </span>
            )}
          </div>

          {publishedUrl && publishedUrl !== currentValue && (
            <div className="text-[10px] font-mono text-slate-500 truncate" title={publishedUrl}>
              Live: {publishedUrl}
            </div>
          )}
        </div>

        {/* Right Controls Column */}
        <div className="flex-1 w-full space-y-3 min-w-0">
          {/* 1. R2 Upload & Media Library Controls */}
          <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-800 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                Upload New Image or Choose from R2 Media Library ({PUBLIC_CDN_BASE_URL})
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isUploadingThisField || isControlsDisabled}
                  onClick={() =>
                    onOpenMediaLibraryPicker(
                      folderCheck.valid
                        ? folderCheck.normalizedFolder
                        : getDefaultFolderForSection(sectionId)
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-800 bg-slate-100 border border-slate-300 rounded hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-slate-600" />
                  Choose from Media Library…
                </button>
              </div>
            </div>

            {/* Folder Selector + Custom Nested Folder Input */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label
                  htmlFor={`${field.id}-folder-preset`}
                  className="block text-[11px] font-medium text-slate-600 mb-1"
                >
                  Approved Folder Preset
                </label>
                <select
                  id={`${field.id}-folder-preset`}
                  disabled={isUploadingThisField || isControlsDisabled}
                  value={matchingPreset ? matchingPreset.value : '__custom__'}
                  onChange={(e) => {
                    if (e.target.value !== '__custom__') {
                      setFolderInput(e.target.value);
                      setUploadError(null);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:bg-white focus:border-slate-500"
                >
                  {APPROVED_UPLOAD_FOLDER_PRESETS.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                  <option value="__custom__">
                    Custom nested folder (pages/, shared/, tours/, gallery/)…
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor={`${field.id}-folder-path`}
                  className="block text-[11px] font-medium text-slate-600 mb-1"
                >
                  Target Folder Path (<code className="font-mono">folder</code>)
                </label>
                <div className="relative">
                  <FolderOpen className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id={`${field.id}-folder-path`}
                    type="text"
                    disabled={isUploadingThisField || isControlsDisabled}
                    value={folderInput}
                    onChange={(e) => {
                      setFolderInput(e.target.value);
                      if (uploadError?.category === 'invalid_folder') {
                        setUploadError(null);
                      }
                    }}
                    placeholder="pages/home/hero"
                    className={`w-full pl-8 pr-2.5 py-1.5 text-xs font-mono bg-white border rounded text-slate-900 focus:outline-none ${
                      folderCheck.valid
                        ? 'border-slate-200 focus:border-slate-500'
                        : 'border-red-400 focus:border-red-600'
                    }`}
                  />
                </div>
                {!folderCheck.valid && (
                  <p className="text-[10px] text-red-600 mt-0.5">
                    {folderCheck.error}
                  </p>
                )}
              </div>
            </div>

            {/* File Input & Upload Button Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <input
                  ref={fileInputRef}
                  id={`${field.id}-file-input`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                  disabled={isUploadingThisField || isControlsDisabled}
                  onChange={handleFileInputChange}
                  className="sr-only"
                />
                <label
                  htmlFor={`${field.id}-file-input`}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
                    isUploadingThisField || isControlsDisabled
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer'
                  }`}
                >
                  Choose Image File…
                </label>

                {selectedFile ? (
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 max-w-xs truncate">
                    <span className="font-mono truncate">
                      {selectedFile.name}
                    </span>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      ({formatBytes(selectedFile.size)})
                    </span>
                    {!isUploadingThisField && (
                      <button
                        type="button"
                        onClick={clearSelectedFileAndPreview}
                        title="Remove selected file"
                        className="text-slate-500 hover:text-slate-900 ml-1 cursor-pointer shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-500">
                    JPEG, PNG, WebP, GIF · Max 10 MiB
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleUploadClick}
                disabled={
                  !selectedFile ||
                  !folderCheck.valid ||
                  isUploadingThisField ||
                  isControlsDisabled
                }
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded transition-colors shrink-0 ${
                  selectedFile &&
                  folderCheck.valid &&
                  !isUploadingThisField &&
                  !isControlsDisabled
                    ? 'bg-slate-900 text-white hover:bg-slate-800 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isUploadingThisField ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Uploading to R2…
                  </>
                ) : uploadError && selectedFile ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry Upload to R2
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    Upload to R2
                  </>
                )}
              </button>
            </div>

            {!workerResolution.isConfigured && (
              <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5">
                <strong>Setup Note:</strong> Set{' '}
                <code className="font-mono">
                  NEXT_PUBLIC_R2_UPLOAD_WORKER_URL
                </code>{' '}
                to your deployed Cloudflare Worker URL to enable live R2
                uploads and Media Library browsing.
              </div>
            )}

            {/* Distinct Upload Error State */}
            {uploadError && (
              <div
                role="alert"
                className="flex items-start justify-between gap-2 p-2.5 text-xs bg-red-50 text-red-900 border border-red-200 rounded"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="font-semibold">
                      {ERROR_CATEGORY_LABELS[uploadError.category]}
                    </div>
                    <div className="text-[11px] leading-relaxed">
                      {uploadError.message}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadError(null)}
                  className="text-red-700 hover:text-red-950 text-[11px] font-medium shrink-0 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {/* 2. Image URL or Asset Path Input + Remove from Placement */}
          <div>
            <label
              htmlFor={field.id}
              className="block text-[11px] font-medium text-slate-600 mb-1"
            >
              Image URL or Asset Path (<code className="font-mono">url</code>)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id={field.id}
                type="text"
                disabled={isUploadingThisField || isSectionSaving}
                value={currentValue}
                onChange={(e) => onChangeUrl(e.target.value)}
                placeholder={`${PUBLIC_CDN_BASE_URL}/pages/... or /images/example.jpg`}
                className={`flex-1 px-3 py-1.5 text-xs font-mono bg-white border rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none ${
                  hasForbiddenUrl
                    ? 'border-red-500 focus:border-red-600'
                    : 'border-slate-200 focus:border-slate-500'
                }`}
              />
              {(currentValue || currentKey) && (
                <button
                  type="button"
                  disabled={isUploadingThisField || isSectionSaving}
                  onClick={onRemoveFromPlacement}
                  title="Remove image reference from this placement without deleting the R2 file"
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                >
                  Remove from Placement
                </button>
              )}
            </div>
            {hasForbiddenUrl && (
              <p className="text-[11px] text-red-600 mt-1">
                Base64 data: strings and temporary blob: URLs cannot be saved to
                Firestore. Upload via R2 or enter an HTTPS image URL.
              </p>
            )}
          </div>

          {/* 3. Alt Text & R2 Object Key */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label
                htmlFor={`${field.id}-alt`}
                className="block text-[11px] font-medium text-slate-600 mb-1"
              >
                Alt Text / Image Description (
                <code className="font-mono">alt</code>)
              </label>
              <input
                id={`${field.id}-alt`}
                type="text"
                disabled={isUploadingThisField || isSectionSaving}
                value={currentAlt}
                onChange={(e) => onChangeAlt(e.target.value)}
                placeholder="Describe this image for accessibility..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <span className="block text-[11px] font-medium text-slate-600 mb-1">
                R2 Object Key (<code className="font-mono">key</code>)
              </span>
              <div
                className={`px-3 py-1.5 text-xs font-mono border rounded-md truncate ${
                  currentKey
                    ? 'bg-emerald-50/60 border-emerald-200 text-slate-800'
                    : 'bg-slate-100 border-slate-200 text-slate-500'
                }`}
                title={currentKey || 'null'}
              >
                {currentKey ?? 'null (external/local asset or none)'}
              </div>
              {publishedObjectKey && publishedObjectKey !== currentKey && (
                <div
                  className="text-[10px] font-mono text-slate-500 mt-0.5 truncate"
                  title={publishedObjectKey}
                >
                  Published key: {publishedObjectKey}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
