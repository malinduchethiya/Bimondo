'use client';

import React, { useRef, useState } from 'react';
import {
  deleteImageViaAdminR2,
  fetchR2AdminBucket,
  R2ClientActionError,
  R2FolderName,
  R2UploadedMediaItem,
  resolveCmsImageUrl,
  uploadImageViaAdminR2,
} from '@/lib/r2-client';
import { useSiteCms } from '@/hooks/useSiteCms';

export type R2UploadedItemMeta = R2UploadedMediaItem;

interface AdminImageUploadFieldProps {
  label?: string;
  folder?: R2FolderName;
  slotId?: string;
  value: string;
  onChange: (
    nextCdnUrl: string,
    uploadedItem?: R2UploadedMediaItem
  ) => Promise<void> | void;
  onR2Uploaded?: (item: R2UploadedMediaItem) => Promise<void> | void;
  onR2Deleted?: (
    deletedKey: string,
    mediaDocId: string
  ) => Promise<void> | void;
  onOpenR2Settings?: () => void;
}

export default function AdminImageUploadField({
  label = 'SECTION IMAGE (CLOUDFLARE R2)',
  folder = 'general',
  slotId,
  value,
  onChange,
  onR2Uploaded,
  onR2Deleted,
  onOpenR2Settings,
}: AdminImageUploadFieldProps) {
  const { isVerifiedAdmin } = useSiteCms();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [retryingSave, setRetryingSave] = useState(false);

  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorInfo, setErrorInfo] = useState<{
    message: string;
    step?: string;
    requestId?: string;
  } | null>(null);

  // Holds an image that succeeded R2 upload + CDN verification but failed Firestore assignment
  const [pendingRetryItem, setPendingRetryItem] =
    useState<R2UploadedMediaItem | null>(null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerAssigningKey, setPickerAssigningKey] = useState<string | null>(
    null
  );
  const [pickerItems, setPickerItems] = useState<R2UploadedMediaItem[]>([]);
  const [bucketSummary, setBucketSummary] = useState<{
    bucketName: string;
    publicCdnUrl: string;
    s3Connected: boolean;
  } | null>(null);

  const formatError = (err: unknown, fallbackStep: string) => {
    if (err instanceof R2ClientActionError) {
      return {
        message: err.message,
        step: err.step,
        requestId: err.requestId,
      };
    }
    return {
      message: err instanceof Error ? err.message : 'Operation failed.',
      step: fallbackStep,
    };
  };

  const commitAssignmentToFirestore = async (
    item: R2UploadedMediaItem,
    requestId?: string
  ) => {
    try {
      await onChange(item.cdnUrl, item);
      if (onR2Uploaded) {
        await onR2Uploaded(item);
      }
      setPendingRetryItem(null);
      setErrorInfo(null);
      setStatusMsg(
        `Published to Firestore & verified on CDN (${item.objectKey})${
          requestId ? ` [${requestId}]` : ''
        }.`
      );
    } catch (assignErr) {
      // Keep the uploaded R2 item so the admin can retry Firestore assignment without re-uploading
      setPendingRetryItem(item);
      const formatted = formatError(assignErr, 'firestore_save');
      setErrorInfo({
        message: `${formatted.message} — Image is already uploaded to R2 (${item.objectKey}). Click "Retry Firestore Save" below.`,
        step: formatted.step || 'firestore_save',
        requestId: formatted.requestId || requestId,
      });
      throw assignErr;
    }
  };

  const handleUploadFile = async (file: File | null | undefined) => {
    if (!file) return;
    setUploading(true);
    setErrorInfo(null);
    setStatusMsg(null);

    try {
      const { item, requestId } = await uploadImageViaAdminR2({
        file,
        folder,
      });

      await commitAssignmentToFirestore(item, requestId);
    } catch (err) {
      if (!pendingRetryItem) {
        setErrorInfo(formatError(err, 'r2_write'));
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRetryFirestoreSave = async () => {
    if (!pendingRetryItem) return;
    setRetryingSave(true);
    setErrorInfo(null);
    setStatusMsg(null);
    try {
      await commitAssignmentToFirestore(pendingRetryItem);
    } catch {
      // Error state is already updated by commitAssignmentToFirestore
    } finally {
      setRetryingSave(false);
    }
  };

  const handleDeleteFromR2 = async () => {
    if (!value) return;
    setDeleting(true);
    setErrorInfo(null);
    setStatusMsg(null);
    try {
      const result = await deleteImageViaAdminR2({
        keyOrUrl: value,
        ignoreSlot: slotId,
      });
      await onChange('');
      if (onR2Deleted && result.deletedKey) {
        await onR2Deleted(result.deletedKey, result.mediaDocId);
      }
      setPendingRetryItem(null);
      setStatusMsg(
        `Removed image (${result.deletedKey}) from R2 and cleared link from Firestore.`
      );
    } catch (err) {
      setErrorInfo(formatError(err, 'r2_delete'));
    } finally {
      setDeleting(false);
    }
  };

  const openBucketPicker = async () => {
    setPickerOpen(true);
    setPickerLoading(true);
    setErrorInfo(null);
    try {
      const res = await fetchR2AdminBucket();
      setPickerItems(res.items);
      setBucketSummary({
        bucketName: res.status.bucketName,
        publicCdnUrl: res.status.publicCdnUrl,
        s3Connected: res.status.s3Connected,
      });
    } catch (err) {
      setPickerItems([]);
      setErrorInfo(formatError(err, 'r2_list'));
    } finally {
      setPickerLoading(false);
    }
  };

  const previewUrl = resolveCmsImageUrl(value);

  return (
    <div className="border border-stone-200 rounded-lg p-4 bg-stone-50/60 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-600">
          {label}
        </span>
        {onOpenR2Settings && (
          <button
            type="button"
            onClick={onOpenR2Settings}
            className="text-xs px-2.5 py-1 rounded border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 font-medium transition"
          >
            {bucketSummary?.s3Connected
              ? `R2 Connected (${bucketSummary.bucketName})`
              : 'View R2 Bucket Status'}
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3.5 items-start">
        <div className="w-28 h-20 rounded overflow-hidden bg-stone-200 border border-stone-300 shrink-0 flex items-center justify-center">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Section preview"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-[11px] text-stone-500">No image</span>
          )}
        </div>

        <div className="flex-1 w-full space-y-2">
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={(e) => handleUploadFile(e.target.files?.[0])}
              className="hidden"
            />
            <button
              type="button"
              disabled={!isVerifiedAdmin || uploading || deleting || retryingSave}
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 text-xs font-medium rounded bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50"
            >
              {uploading
                ? 'Uploading & Verifying R2…'
                : value
                ? 'Upload & Replace in R2'
                : 'Upload Image to R2'}
            </button>

            <button
              type="button"
              disabled={!isVerifiedAdmin || uploading || deleting || retryingSave}
              onClick={openBucketPicker}
              className="px-3 py-1.5 text-xs font-medium rounded border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 disabled:opacity-50"
            >
              Choose from R2 Bucket
            </button>

            {value && (
              <button
                type="button"
                disabled={!isVerifiedAdmin || uploading || deleting || retryingSave}
                onClick={handleDeleteFromR2}
                className="px-3 py-1.5 text-xs font-medium rounded border border-red-200 bg-white text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            )}

            {pendingRetryItem && (
              <button
                type="button"
                disabled={!isVerifiedAdmin || retryingSave}
                onClick={handleRetryFirestoreSave}
                className="px-3 py-1.5 text-xs font-medium rounded bg-amber-700 text-white hover:bg-amber-800 disabled:opacity-50"
              >
                {retryingSave
                  ? 'Retrying Firestore Save…'
                  : 'Retry Firestore Save'}
              </button>
            )}
          </div>

          <input
            type="url"
            readOnly
            placeholder="Upload an image or choose from R2 Bucket..."
            value={value}
            className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded bg-stone-100 text-stone-700 font-mono"
          />

          {statusMsg && (
            <p className="text-xs text-emerald-700 font-medium">{statusMsg}</p>
          )}

          {errorInfo && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2 space-y-0.5">
              <p className="font-medium">{errorInfo.message}</p>
              <p className="text-[11px] font-mono text-red-600">
                {errorInfo.step ? `step=${errorInfo.step}` : ''}
                {errorInfo.requestId ? ` · requestId=${errorInfo.requestId}` : ''}
              </p>
            </div>
          )}
        </div>
      </div>

      {pickerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] flex flex-col overflow-hidden border border-stone-200 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-stone-900">
                  Cloudflare R2 Bucket Objects ({pickerItems.length})
                </h4>
                <p className="text-xs text-stone-500">
                  Click any verified object in R2 bucket{' '}
                  <span className="font-mono">
                    {bucketSummary?.bucketName || 'bimondo'}
                  </span>{' '}
                  to assign and publish it to Firestore.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="px-3 py-1 text-xs rounded border border-stone-300 text-stone-700"
              >
                Close
              </button>
            </div>

            <div className="p-5 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {pickerLoading ? (
                <p className="text-xs text-stone-500 col-span-full">
                  Loading objects from Cloudflare R2 bucket…
                </p>
              ) : pickerItems.length === 0 ? (
                <div className="col-span-full text-center py-8 space-y-2">
                  <p className="text-xs text-stone-500">
                    No objects found in R2 bucket.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setPickerOpen(false);
                      fileInputRef.current?.click();
                    }}
                    className="px-3.5 py-1.5 text-xs rounded bg-stone-900 text-white font-medium"
                  >
                    Upload Image to R2
                  </button>
                </div>
              ) : (
                pickerItems.map((item) => {
                  const isAssigningThis = pickerAssigningKey === item.objectKey;
                  return (
                    <button
                      key={item.objectKey}
                      type="button"
                      disabled={Boolean(pickerAssigningKey)}
                      onClick={async () => {
                        setPickerAssigningKey(item.objectKey);
                        try {
                          await commitAssignmentToFirestore(item);
                          setPickerOpen(false);
                        } catch {
                          setPickerOpen(false);
                        } finally {
                          setPickerAssigningKey(null);
                        }
                      }}
                      className="text-left border border-stone-200 rounded p-2 hover:border-stone-900 transition flex flex-col gap-1.5 disabled:opacity-50"
                    >
                      <div className="w-full h-24 rounded bg-stone-100 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.cdnUrl}
                          alt={item.fileName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className="text-[10px] font-semibold uppercase text-stone-500">
                        {item.folder}/
                      </span>
                      <span className="text-xs font-medium text-stone-800 truncate w-full">
                        {isAssigningThis ? 'Saving to Firestore…' : item.fileName}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
