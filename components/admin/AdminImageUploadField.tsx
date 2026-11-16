'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  FolderOpen,
  Image as ImageIcon,
  Loader2,
  SlidersHorizontal,
  Trash2,
  Upload,
} from 'lucide-react';
import { AdminFieldItem } from '@/lib/admin-ui-schema';
import { isForbiddenImageUrl } from '@/lib/content-repository';
import {
  APPROVED_UPLOAD_FOLDER_PRESETS,
  getDefaultFolderForSection,
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
  unconfigured: 'R2 Binding Unavailable (503)',
  auth: 'Authentication Error (401)',
  forbidden: 'Access Denied (403)',
  invalid_file: 'Invalid Image File',
  size_limit: 'File Too Large (Max 10 MiB)',
  invalid_folder: 'Invalid Folder Path',
  network: 'Network Error',
  upload_failed: 'Upload Failed',
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

export default function AdminImageUploadField({
  field,
  sectionId,
  isSectionSaving,
  isAnyUploadInProgress,
  pendingUploadInfo,
  publishedUrl: _publishedUrl,
  publishedObjectKey: _publishedObjectKey,
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
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [isUploadingThisField, setIsUploadingThisField] =
    useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<{
    category: R2UploadErrorCategory;
    message: string;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  const clearPreview = () => {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }
    setLocalPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Auto-upload immediately when a file is chosen for a 1-click workflow
  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] || null;
    setUploadError(null);

    if (!file) {
      clearPreview();
      return;
    }

    const folderValidation = validateClientUploadFolder(folderInput);
    const targetFolder = folderValidation.valid
      ? folderValidation.normalizedFolder
      : getDefaultFolderForSection(sectionId);

    try {
      await validateClientImageFileBeforeUpload(file);
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
      const nextPreviewUrl = URL.createObjectURL(file);
      setLocalPreviewUrl(nextPreviewUrl);
    } catch (err) {
      clearPreview();
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
      return;
    }

    setIsUploadingThisField(true);
    onUploadStart(field.id);

    try {
      const idToken = await getAdminIdToken();
      const uploaded = await uploadImageToR2Worker({
        file,
        folder: targetFolder,
        idToken,
      });

      clearPreview();
      onUploadSuccess(uploaded);
    } catch (err) {
      clearPreview();
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

  const displayPreviewSrc =
    localPreviewUrl || (!hasForbiddenUrl ? currentValue : '');

  const isPendingSave =
    Boolean(pendingUploadInfo) &&
    currentValue === pendingUploadInfo?.url &&
    currentKey === pendingUploadInfo?.key;

  const isControlsDisabled =
    isSectionSaving || (isAnyUploadInProgress && !isUploadingThisField);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        {/* Clean Thumbnail Preview */}
        <div className="w-full sm:w-36 h-24 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden relative shrink-0">
          {displayPreviewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayPreviewSrc}
              alt={currentAlt || field.label}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-slate-400 px-2 text-center">
              <ImageIcon className="w-4 h-4" />
              <span className="text-[11px]">No image</span>
            </div>
          )}

          {isUploadingThisField && (
            <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          )}
        </div>

        {/* Minimal Action Row + Alt Text */}
        <div className="flex-1 w-full space-y-2.5 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
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
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  isUploadingThisField || isControlsDisabled
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-900 text-white hover:bg-slate-800 cursor-pointer'
                }`}
              >
                {isUploadingThisField ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    Upload Image
                  </>
                )}
              </label>

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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                Media Library
              </button>

              {(currentValue || currentKey) && (
                <button
                  type="button"
                  disabled={isUploadingThisField || isSectionSaving}
                  onClick={onRemoveFromPlacement}
                  title="Remove image from this field"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowAdvanced((prev) => !prev)}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {showAdvanced ? 'Hide options' : 'URL & folder'}
            </button>
          </div>

          {/* Alt Text Input */}
          <div>
            <input
              id={`${field.id}-alt`}
              type="text"
              disabled={isUploadingThisField || isSectionSaving}
              value={currentAlt}
              onChange={(e) => onChangeAlt(e.target.value)}
              placeholder="Alt text description (for accessibility & SEO)..."
              aria-label={`${field.label} alt text`}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500"
            />
          </div>

          {/* Unboxed Status Line */}
          {isPendingSave && pendingUploadInfo && (
            <div className="flex items-center gap-1.5 text-xs text-amber-800">
              <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                {pendingUploadInfo.source === 'library'
                  ? 'Selected from library'
                  : 'Uploaded to R2'}{' '}
                · Click <strong>Save Changes</strong> in the top bar to publish.
              </span>
            </div>
          )}

          {/* Upload Error */}
          {uploadError && (
            <div
              role="alert"
              className="flex items-start justify-between gap-2 p-2.5 text-xs bg-red-50 text-red-900 border border-red-200 rounded-md"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">
                    {ERROR_CATEGORY_LABELS[uploadError.category]}:{' '}
                  </span>
                  <span>{uploadError.message}</span>
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

          {hasForbiddenUrl && (
            <p className="text-[11px] text-red-600">
              Base64 data: and temporary blob: URLs cannot be saved. Upload an
              image or enter a valid HTTPS URL.
            </p>
          )}
        </div>
      </div>

      {/* Collapsible Advanced Options (Direct URL, Target Folder, R2 Object Key) */}
      {(showAdvanced || hasForbiddenUrl) && (
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label
              htmlFor={field.id}
              className="block text-[11px] font-medium text-slate-600 mb-1"
            >
              Image URL or Path
            </label>
            <input
              id={field.id}
              type="text"
              disabled={isUploadingThisField || isSectionSaving}
              value={currentValue}
              onChange={(e) => onChangeUrl(e.target.value)}
              placeholder={`${PUBLIC_CDN_BASE_URL}/pages/... or /images/example.jpg`}
              className={`w-full px-2.5 py-1.5 text-xs font-mono bg-white border rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none ${
                hasForbiddenUrl
                  ? 'border-red-500 focus:border-red-600'
                  : 'border-slate-200 focus:border-slate-500'
              }`}
            />
          </div>

          <div>
            <label
              htmlFor={`${field.id}-folder-preset`}
              className="block text-[11px] font-medium text-slate-600 mb-1"
            >
              Upload Folder ({folderCheck.valid ? folderCheck.normalizedFolder : 'custom'})
            </label>
            <select
              id={`${field.id}-folder-preset`}
              disabled={isUploadingThisField || isControlsDisabled}
              value={matchingPreset ? matchingPreset.value : folderInput}
              onChange={(e) => {
                setFolderInput(e.target.value);
                setUploadError(null);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-slate-500"
            >
              {APPROVED_UPLOAD_FOLDER_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          {currentKey && (
            <div className="sm:col-span-2 text-[11px] font-mono text-slate-500 truncate">
              R2 Object Key: {currentKey}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
