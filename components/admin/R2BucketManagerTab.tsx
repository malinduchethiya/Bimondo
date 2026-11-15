'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Cloud,
  Upload,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import {
  deleteImageViaAdminR2,
  fetchR2AdminBucket,
  R2AdminStatusSnapshot,
  R2ClientActionError,
  R2FolderName,
  R2UploadedMediaItem,
  testR2AdminConnection,
  uploadImageViaAdminR2,
} from '@/lib/r2-client';
import { useSiteCms } from '@/hooks/useSiteCms';

export interface R2QuickAssignTarget {
  id: string;
  group: string;
  label: string;
  currentUrl?: string;
}

export type R2BucketItem = R2UploadedMediaItem;

interface R2BucketManagerTabProps {
  onAssignUrlToHero?: (
    url: string,
    mediaItem?: R2UploadedMediaItem
  ) => Promise<void> | void;
  onAssignUrlToGallery?: (
    url: string,
    title?: string,
    mediaItem?: R2UploadedMediaItem
  ) => Promise<void> | void;
  quickAssignTargets?: R2QuickAssignTarget[];
  onAssignToTarget?: (
    targetId: string,
    url: string,
    label?: string,
    mediaItem?: R2UploadedMediaItem
  ) => Promise<void> | void;
  onRegisterMediaInFirestore?: (
    item: R2UploadedMediaItem
  ) => Promise<void> | void;
  onRemoveMediaFromFirestore?: (mediaId: string) => Promise<void> | void;
}

const FOLDERS: {
  id: 'all' | R2FolderName;
  label: string;
}[] = [
  { id: 'all', label: 'All Folders' },
  { id: 'general', label: 'general/' },
  { id: 'destinations', label: 'destinations/' },
  { id: 'tours', label: 'tours/' },
  { id: 'stays', label: 'stays/' },
  { id: 'gallery', label: 'gallery/' },
];

export default function R2BucketManagerTab({
  onAssignUrlToHero,
  onAssignUrlToGallery,
  quickAssignTargets = [],
  onAssignToTarget,
  onRegisterMediaInFirestore,
  onRemoveMediaFromFirestore,
}: R2BucketManagerTabProps) {
  const { isVerifiedAdmin, authReady } = useSiteCms();

  const [items, setItems] = useState<R2UploadedMediaItem[]>([]);
  const [status, setStatus] = useState<R2AdminStatusSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [assigningKey, setAssigningKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const [uploadFolder, setUploadFolder] = useState<R2FolderName>('general');
  const [filterFolder, setFilterFolder] = useState<string>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<
    Record<string, string>
  >({});

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    step?: string;
    requestId?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const toFeedbackError = (err: unknown, fallbackStep: string) => {
    if (err instanceof R2ClientActionError) {
      return {
        type: 'error' as const,
        message: err.message,
        step: err.step,
        requestId: err.requestId,
      };
    }
    return {
      type: 'error' as const,
      message: err instanceof Error ? err.message : 'R2 operation failed.',
      step: fallbackStep,
    };
  };

  const refreshBucket = useCallback(async () => {
    if (!isVerifiedAdmin) {
      setLoading(false);
      setStatus(null);
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetchR2AdminBucket();
      setItems(res.items);
      setStatus(res.status);
    } catch (err) {
      setStatus((prev) =>
        prev ? { ...prev, s3Connected: false } : null
      );
      setItems([]);
      setFeedback(toFeedbackError(err, 'r2_list'));
    } finally {
      setLoading(false);
    }
  }, [isVerifiedAdmin]);

  useEffect(() => {
    if (!authReady) return;
    let active = true;
    (async () => {
      if (!active) return;
      await refreshBucket();
    })();
    return () => {
      active = false;
    };
  }, [authReady, refreshBucket]);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setFeedback(null);
    try {
      const res = await testR2AdminConnection();
      setStatus(res.status);
      setItems(res.items);
      setFeedback({
        type: 'success',
        message: res.message,
        requestId: res.requestId,
      });
    } catch (err) {
      setStatus((prev) =>
        prev ? { ...prev, s3Connected: false } : null
      );
      setFeedback(toFeedbackError(err, 'r2_list'));
    } finally {
      setTestingConnection(false);
    }
  };

  const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setFeedback(null);
    let uploadedCount = 0;
    let lastRequestId: string | undefined;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const { item, requestId } = await uploadImageViaAdminR2({
          file,
          folder: uploadFolder,
        });
        lastRequestId = requestId;

        // Register in r2_media collection only (does not mutate site_cms/main)
        if (onRegisterMediaInFirestore) {
          await onRegisterMediaInFirestore(item);
        }
        uploadedCount++;
      }

      setFeedback({
        type: 'success',
        message: `Uploaded and verified ${uploadedCount} image${
          uploadedCount > 1 ? 's' : ''
        } in R2 (${uploadFolder}/) and registered in Firestore r2_media catalog.`,
        requestId: lastRequestId,
      });
      await refreshBucket();
    } catch (err) {
      setFeedback(toFeedbackError(err, 'r2_write'));
      await refreshBucket();
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteObject = async (obj: R2UploadedMediaItem) => {
    setDeletingKey(obj.objectKey);
    setFeedback(null);
    try {
      const res = await deleteImageViaAdminR2({ keyOrUrl: obj.objectKey });
      if (onRemoveMediaFromFirestore && res.mediaDocId) {
        await onRemoveMediaFromFirestore(res.mediaDocId);
      }
      setItems((prev) =>
        prev.filter((item) => item.objectKey !== obj.objectKey)
      );
      setFeedback({
        type: 'success',
        message: `Deleted ${obj.objectKey} from R2 and removed its r2_media record from Firestore.`,
        requestId: res.requestId,
      });
    } catch (err) {
      setFeedback(toFeedbackError(err, 'r2_delete'));
    } finally {
      setDeletingKey(null);
    }
  };

  const handleQuickAssign = async (obj: R2UploadedMediaItem) => {
    const assignTargetId = selectedTargets[obj.objectKey] || '';
    if (!assignTargetId) return;

    setAssigningKey(obj.objectKey);
    setFeedback(null);
    try {
      if (assignTargetId === '__hero__' && onAssignUrlToHero) {
        await onAssignUrlToHero(obj.cdnUrl, obj);
      } else if (assignTargetId === '__gallery__' && onAssignUrlToGallery) {
        await onAssignUrlToGallery(obj.cdnUrl, obj.fileName, obj);
      } else if (onAssignToTarget) {
        const target = quickAssignTargets.find((t) => t.id === assignTargetId);
        await onAssignToTarget(
          assignTargetId,
          obj.cdnUrl,
          target?.label,
          obj
        );
      }

      setFeedback({
        type: 'success',
        message: `Assigned ${obj.objectKey} to website slot and committed to Firestore.`,
      });
    } catch (err) {
      setFeedback(toFeedbackError(err, 'firestore_save'));
    } finally {
      setAssigningKey(null);
    }
  };

  const handleCopyUrl = (url: string, key: string) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredObjects = items.filter((obj) => {
    if (filterFolder === 'all') return true;
    return obj.objectKey.startsWith(`${filterFolder}/`);
  });

  const isConnected = Boolean(status?.s3Connected);

  return (
    <div className="space-y-6">
      {/* Read-Only Authoritative Connection Status Header */}
      <div className="border border-stone-200 bg-white p-5 rounded-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Cloud className="w-5 h-5 text-stone-700" />
              <h2 className="text-base font-semibold text-stone-900">
                Cloudflare R2 Storage &amp; Firestore Media Catalog
              </h2>
              {isConnected ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 rounded">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {isVerifiedAdmin ? 'Disconnected' : 'Admin Sign-In Required'}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500">
              Server-side R2 configuration is authoritative. Credentials are stored exclusively in deployment secrets/bindings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={!isVerifiedAdmin || testingConnection || loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded hover:bg-stone-50 disabled:opacity-50"
            >
              {testingConnection ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              Probe R2 Bucket
            </button>
            <button
              type="button"
              onClick={refreshBucket}
              disabled={!isVerifiedAdmin || loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded hover:bg-stone-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Read-Only Server Configuration Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-stone-100 text-xs">
          <div className="p-2.5 rounded bg-stone-50 border border-stone-200">
            <span className="block text-[10px] uppercase tracking-wider text-stone-500">
              Bucket Name
            </span>
            <span className="font-mono font-medium text-stone-800">
              {status?.bucketName || '—'}
            </span>
          </div>
          <div className="p-2.5 rounded bg-stone-50 border border-stone-200 sm:col-span-2">
            <span className="block text-[10px] uppercase tracking-wider text-stone-500">
              Public CDN Origin (R2_PUBLIC_CDN_URL)
            </span>
            <span className="font-mono font-medium text-stone-800 break-all">
              {status?.publicCdnUrl || '—'}
            </span>
          </div>
          <div className="p-2.5 rounded bg-stone-50 border border-stone-200">
            <span className="block text-[10px] uppercase tracking-wider text-stone-500">
              Runtime Backend
            </span>
            <span className="font-mono font-medium text-stone-800">
              {status?.storageMode === 'cloudflare-binding'
                ? `Worker Binding (${status.bindingName})`
                : status?.storageMode === 'cloudflare-s3'
                ? 'S3 API (@aws-sdk)'
                : 'Unconfigured'}
            </span>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`p-3 rounded border text-xs flex items-start gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <p>{feedback.message}</p>
              {(feedback.step || feedback.requestId) && (
                <p className="text-[11px] font-mono opacity-80">
                  {feedback.step ? `step=${feedback.step}` : ''}
                  {feedback.requestId
                    ? `${feedback.step ? ' · ' : ''}requestId=${
                        feedback.requestId
                      }`
                    : ''}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Upload & Folder Filter Bar */}
      <div className="border border-stone-200 bg-white p-4 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium text-stone-600">
            Target Folder:
          </label>
          <select
            value={uploadFolder}
            onChange={(e) => setUploadFolder(e.target.value as R2FolderName)}
            className="px-2.5 py-1.5 text-xs border border-stone-300 rounded bg-white text-stone-800"
          >
            {FOLDERS.filter((f) => f.id !== 'all').map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            onChange={handleUploadFiles}
            className="hidden"
          />
          <button
            type="button"
            disabled={!isVerifiedAdmin || uploading || !isConnected}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-stone-900 rounded hover:bg-stone-800 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            {uploading
              ? 'Uploading & Verifying...'
              : `Upload to R2 Library (${uploadFolder}/)`}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500">Filter:</span>
          <select
            value={filterFolder}
            onChange={(e) => setFilterFolder(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-stone-300 rounded bg-white text-stone-800"
          >
            {FOLDERS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-stone-500 font-mono">
            ({filteredObjects.length} file
            {filteredObjects.length === 1 ? '' : 's'})
          </span>
        </div>
      </div>

      {/* Objects Grid */}
      {loading ? (
        <div className="border border-stone-200 bg-white p-12 rounded-md flex items-center justify-center gap-2 text-xs text-stone-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading objects from Cloudflare R2...
        </div>
      ) : filteredObjects.length === 0 ? (
        <div className="border border-stone-200 bg-white p-12 rounded-md text-center space-y-2">
          <ImageIcon className="w-6 h-6 text-stone-400 mx-auto" />
          <p className="text-sm font-medium text-stone-700">
            No R2 objects found
          </p>
          <p className="text-xs text-stone-500">
            {!isVerifiedAdmin
              ? 'Sign in with your verified Google admin account in the top bar to view and manage R2 objects.'
              : isConnected
              ? 'Upload an image above to store it in your Cloudflare R2 bucket and register it for assignment.'
              : 'Verify server R2 environment variables and click Probe R2 Bucket.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredObjects.map((obj) => {
            const assignTargetId = selectedTargets[obj.objectKey] || '';
            const isAssigningThis = assigningKey === obj.objectKey;
            const isDeletingThis = deletingKey === obj.objectKey;

            return (
              <div
                key={obj.objectKey}
                className="border border-stone-200 bg-white rounded-md overflow-hidden flex flex-col"
              >
                <div className="aspect-video bg-stone-100 relative overflow-hidden border-b border-stone-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={obj.cdnUrl}
                    alt={obj.objectKey}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="p-3 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <p
                      className="text-xs font-mono font-medium text-stone-800 truncate"
                      title={obj.objectKey}
                    >
                      {obj.objectKey}
                    </p>
                    <p
                      className="text-[11px] font-mono text-stone-500 truncate"
                      title={obj.cdnUrl}
                    >
                      {obj.cdnUrl}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      {(obj.sizeBytes / 1024).toFixed(1)} KB
                      {obj.lastModified
                        ? ` · ${new Date(obj.lastModified).toLocaleDateString()}`
                        : ''}
                    </p>
                  </div>

                  {/* Assign directly to a site section */}
                  {(onAssignToTarget ||
                    onAssignUrlToHero ||
                    onAssignUrlToGallery) && (
                    <div className="pt-2 border-t border-stone-100 space-y-1.5">
                      <label className="block text-[10px] font-medium uppercase tracking-wider text-stone-500">
                        Assign to Website Slot (Saves to Firestore)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={assignTargetId}
                          onChange={(e) =>
                            setSelectedTargets((prev) => ({
                              ...prev,
                              [obj.objectKey]: e.target.value,
                            }))
                          }
                          className="flex-1 min-w-0 px-2 py-1 text-xs border border-stone-300 rounded bg-white text-stone-800"
                        >
                          <option value="">Select section slot...</option>
                          {onAssignUrlToHero && (
                            <option value="__hero__">
                              Hero Slideshow (Add Slide)
                            </option>
                          )}
                          {onAssignUrlToGallery && (
                            <option value="__gallery__">
                              Visual Gallery (Add Item)
                            </option>
                          )}
                          {quickAssignTargets.map((t) => (
                            <option key={t.id} value={t.id}>
                              [{t.group}] {t.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={
                            !isVerifiedAdmin ||
                            !assignTargetId ||
                            isAssigningThis
                          }
                          onClick={() => handleQuickAssign(obj)}
                          className="px-2.5 py-1 text-xs font-medium text-white bg-stone-900 rounded hover:bg-stone-800 disabled:opacity-40"
                        >
                          {isAssigningThis ? 'Saving…' : 'Apply'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(obj.cdnUrl, obj.objectKey)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-stone-700 bg-stone-100 rounded hover:bg-stone-200"
                      >
                        {copiedKey === obj.objectKey ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy R2 URL
                          </>
                        )}
                      </button>
                      <a
                        href={obj.cdnUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-stone-600 hover:text-stone-900"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Open
                      </a>
                    </div>

                    <button
                      type="button"
                      disabled={!isVerifiedAdmin || isDeletingThis}
                      onClick={() => handleDeleteObject(obj)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 rounded disabled:opacity-40"
                    >
                      <Trash2 className="w-3 h-3" />
                      {isDeletingThis ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
