'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  extractObjectKeyFromUrl,
  getR2RequestHeaders,
  getStoredR2Config,
  loadR2ConfigFromFirestore,
  normalizeR2PublicDomain,
  resolveCmsImageUrl,
  saveR2ConfigToFirestore,
} from '@/lib/r2-client';

export interface R2UploadedItemMeta {
  id: string;
  objectKey: string;
  cdnUrl: string;
  folder: 'tours' | 'stays' | 'destinations' | 'gallery' | 'general';
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

interface R2BucketPickerItem {
  id: string;
  objectKey: string;
  cdnUrl: string;
  folder: 'tours' | 'stays' | 'destinations' | 'gallery' | 'general';
  fileName: string;
  contentType?: string;
  sizeBytes: number;
  lastModified: string;
}

interface AdminImageUploadFieldProps {
  label?: string;
  folder?: 'tours' | 'stays' | 'destinations' | 'gallery' | 'general';
  value: string;
  onChange: (nextCdnUrl: string) => void;
  onR2Uploaded?: (item: R2UploadedItemMeta) => Promise<void> | void;
  onR2Deleted?: (deletedKey: string, mediaDocId: string) => Promise<void> | void;
  onOpenR2Settings?: () => void;
}

export default function AdminImageUploadField({
  label = 'SECTION IMAGE (CLOUDFLARE R2)',
  folder = 'general',
  value,
  onChange,
  onR2Uploaded,
  onR2Deleted,
  onOpenR2Settings,
}: AdminImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showR2Config, setShowR2Config] = useState(false);
  const [savingR2, setSavingR2] = useState(false);
  const [r2AccountId, setR2AccountId] = useState('');
  const [r2BucketName, setR2BucketName] = useState('bimondo-media');
  const [r2PublicCdnUrl, setR2PublicCdnUrl] = useState('');
  const [r2AccessKeyId, setR2AccessKeyId] = useState('');
  const [r2SecretAccessKey, setR2SecretAccessKey] = useState('');
  const [s3Connected, setS3Connected] = useState(false);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerItems, setPickerItems] = useState<R2BucketPickerItem[]>([]);

  useEffect(() => {
    let active = true;
    const init = async () => {
      const cfg = await loadR2ConfigFromFirestore();
      if (!active) return;
      setR2AccountId(cfg.accountId || '');
      setR2BucketName(cfg.bucketName || 'bimondo-media');
      setR2PublicCdnUrl(cfg.publicCdnUrl || '');
      setR2AccessKeyId(cfg.accessKeyId || '');
      setR2SecretAccessKey(cfg.secretAccessKey || '');

      try {
        const res = await fetch('/api/admin/r2', {
          cache: 'no-store',
          headers: getR2RequestHeaders(cfg),
        });
        const data = await res.json();
        if (!active) return;
        const connected = Boolean(data?.status?.s3Connected);
        setS3Connected(connected);
        if (!connected && !cfg.accessKeyId) {
          setShowR2Config(true);
        }
        if (data?.status?.accountId && !cfg.accountId) {
          setR2AccountId(data.status.accountId);
        }
        if (data?.status?.bucketName) {
          setR2BucketName(data.status.bucketName);
        }
        const serverCdn = normalizeR2PublicDomain(data?.status?.publicCdnUrl);
        if (serverCdn && !cfg.publicCdnUrl) {
          setR2PublicCdnUrl(serverCdn);
        }
      } catch {
        // Ignore background status error
      }
    };
    init();
    return () => {
      active = false;
    };
  }, []);

  const handleSaveR2Credentials = async () => {
    setSavingR2(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const saved = await saveR2ConfigToFirestore({
        accountId: r2AccountId,
        bucketName: r2BucketName || 'bimondo-media',
        publicCdnUrl: r2PublicCdnUrl,
        accessKeyId: r2AccessKeyId || undefined,
        secretAccessKey: r2SecretAccessKey || undefined,
      });

      const res = await fetch('/api/admin/r2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getR2RequestHeaders(saved),
        },
        body: JSON.stringify({
          action: 'save_config',
          accountId: saved.accountId,
          bucketName: saved.bucketName,
          publicCdnUrl: saved.publicCdnUrl,
          accessKeyId: saved.accessKeyId || undefined,
          secretAccessKey: saved.secretAccessKey || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not save R2 settings.');
      }

      const ok = Boolean(data?.connectionTest?.ok ?? data?.status?.s3Connected);
      setS3Connected(ok);
      setR2AccountId(saved.accountId);
      setR2BucketName(saved.bucketName);
      setR2PublicCdnUrl(saved.publicCdnUrl);

      if (!ok && data?.connectionTest?.message) {
        setErrorMsg(data.connectionTest.message);
        return;
      }

      if (saved.publicCdnUrl && value) {
        const key = extractObjectKeyFromUrl(value);
        if (key) {
          const nextUrl = `${saved.publicCdnUrl}/${key}`;
          onChange(nextUrl);
          if (onR2Uploaded) {
            await onR2Uploaded({
              id: key.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 120),
              objectKey: key,
              cdnUrl: nextUrl,
              folder,
              fileName: key.split('/').pop() || 'image.jpg',
              contentType: 'image/jpeg',
              sizeBytes: 0,
            });
          }
        }
      }

      setStatusMsg(
        data?.connectionTest?.message || 'R2 connected and saved to Firestore.'
      );
      setShowR2Config(false);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to save R2 settings.'
      );
    } finally {
      setSavingR2(false);
    }
  };

  const handleUploadFile = async (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select an image file (JPG, PNG, WebP, AVIF).');
      return;
    }

    setUploading(true);
    setErrorMsg(null);
    setStatusMsg(null);

    try {
      let stored = getStoredR2Config();
      if (
        r2AccountId.trim() ||
        r2PublicCdnUrl.trim() ||
        r2AccessKeyId.trim() ||
        r2SecretAccessKey.trim()
      ) {
        stored = await saveR2ConfigToFirestore({
          accountId: r2AccountId.trim() || stored.accountId,
          bucketName:
            r2BucketName.trim() || stored.bucketName || 'bimondo-media',
          publicCdnUrl: r2PublicCdnUrl.trim() || stored.publicCdnUrl,
          accessKeyId: r2AccessKeyId.trim() || stored.accessKeyId,
          secretAccessKey: r2SecretAccessKey.trim() || stored.secretAccessKey,
        });
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      if (value && value.startsWith('http')) {
        formData.append('replaceKey', value);
      }
      if (stored.accountId) formData.append('accountId', stored.accountId);
      if (stored.bucketName) formData.append('bucketName', stored.bucketName);
      if (stored.publicCdnUrl) {
        formData.append('publicCdnUrl', stored.publicCdnUrl);
      }
      if (stored.accessKeyId) {
        formData.append('accessKeyId', stored.accessKeyId);
      }
      if (stored.secretAccessKey) {
        formData.append('secretAccessKey', stored.secretAccessKey);
      }

      const res = await fetch('/api/admin/r2', {
        method: 'POST',
        headers: getR2RequestHeaders(stored),
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data?.item?.cdnUrl) {
        setShowR2Config(true);
        throw new Error(
          data?.error || 'R2 upload failed. Check your R2 credentials above.'
        );
      }

      setS3Connected(true);
      const uploaded = data.item as R2UploadedItemMeta;
      onChange(uploaded.cdnUrl);
      if (onR2Uploaded) {
        await onR2Uploaded(uploaded);
      }
      setStatusMsg(
        `Uploaded to R2 (${uploaded.objectKey}) & saved link to Firestore.`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'R2 upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteFromR2 = async () => {
    if (!value) return;
    setDeleting(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const res = await fetch(
        `/api/admin/r2?url=${encodeURIComponent(value)}`,
        {
          method: 'DELETE',
          headers: getR2RequestHeaders(),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to delete from R2.');
      }
      const deletedKey = String(data.deletedKey || '');
      const mediaDocId = String(data.mediaDocId || '');
      onChange('');
      if (onR2Deleted && deletedKey) {
        await onR2Deleted(deletedKey, mediaDocId);
      }
      setStatusMsg('Removed image from R2 and cleared link.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  const openBucketPicker = async () => {
    setPickerOpen(true);
    setPickerLoading(true);
    try {
      const res = await fetch('/api/admin/r2', {
        cache: 'no-store',
        headers: getR2RequestHeaders(),
      });
      const data = await res.json();
      setPickerItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setPickerItems([]);
    } finally {
      setPickerLoading(false);
    }
  };

  const previewUrl = resolveCmsImageUrl(value, r2PublicCdnUrl);

  return (
    <div className="border border-stone-200 rounded-xl p-4 bg-stone-50/60 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-600">
          {label}
        </span>
        <button
          type="button"
          onClick={() => setShowR2Config((v) => !v)}
          className={`text-xs px-2.5 py-1 rounded-md border font-medium transition ${
            s3Connected
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-amber-300 bg-amber-50 text-amber-900'
          }`}
        >
          {s3Connected
            ? `R2 Connected (${r2BucketName})${
                r2PublicCdnUrl
                  ? ` · ${r2PublicCdnUrl.replace(/^https?:\/\//, '')}`
                  : ''
              }`
            : 'Configure R2 Bucket & Public Domain'}
        </button>
      </div>

      {showR2Config && (
        <div className="bg-white border border-stone-200 rounded-lg p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-800">
              Cloudflare R2 Direct Upload &amp; Public Domain Settings
            </span>
            {onOpenR2Settings && (
              <button
                type="button"
                onClick={onOpenR2Settings}
                className="text-xs text-emerald-800 underline font-medium"
              >
                Open R2 Bucket Manager
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-stone-600 mb-1">
                Public R2 Domain (https://pub-xxx.r2.dev)
              </label>
              <input
                type="text"
                placeholder="https://pub-xxxx.r2.dev"
                value={r2PublicCdnUrl}
                onChange={(e) => setR2PublicCdnUrl(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-md bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-stone-600 mb-1">
                Cloudflare Account ID (or S3 Endpoint)
              </label>
              <input
                type="text"
                placeholder="32-character Account ID"
                value={r2AccountId}
                onChange={(e) => setR2AccountId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-md bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-stone-600 mb-1">
                R2 Bucket Name
              </label>
              <input
                type="text"
                placeholder="bimondo-media"
                value={r2BucketName}
                onChange={(e) => setR2BucketName(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-md bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-stone-600 mb-1">
                R2 S3 Access Key ID
              </label>
              <input
                type="password"
                placeholder="R2 S3 Access Key ID"
                value={r2AccessKeyId}
                onChange={(e) => setR2AccessKeyId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-md bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-stone-600 mb-1">
                R2 S3 Secret Access Key
              </label>
              <input
                type="password"
                placeholder="R2 S3 Secret Access Key"
                value={r2SecretAccessKey}
                onChange={(e) => setR2SecretAccessKey(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-md bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowR2Config(false)}
              className="px-3 py-1.5 text-xs rounded-md border border-stone-300 text-stone-700 hover:bg-stone-100"
            >
              Close
            </button>
            <button
              type="button"
              disabled={savingR2}
              onClick={handleSaveR2Credentials}
              className="px-3.5 py-1.5 text-xs rounded-md bg-stone-900 text-white font-medium hover:bg-stone-800 disabled:opacity-50"
            >
              {savingR2 ? 'Connecting R2…' : 'Save & Connect R2'}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3.5 items-start">
        <div className="w-28 h-20 rounded-lg overflow-hidden bg-stone-200 border border-stone-300 shrink-0 flex items-center justify-center">
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
              accept="image/*"
              onChange={(e) => handleUploadFile(e.target.files?.[0])}
              className="hidden"
            />
            <button
              type="button"
              disabled={uploading || deleting}
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 text-xs font-medium rounded-md bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50"
            >
              {uploading
                ? 'Uploading to R2…'
                : value
                ? 'Upload & Replace in R2'
                : 'Upload Image to R2'}
            </button>

            <button
              type="button"
              disabled={uploading || deleting}
              onClick={openBucketPicker}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-stone-300 bg-white text-stone-800 hover:bg-stone-100"
            >
              Choose from R2 Bucket
            </button>

            {value && (
              <button
                type="button"
                disabled={uploading || deleting}
                onClick={handleDeleteFromR2}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-red-200 bg-white text-red-700 hover:bg-red-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            )}
          </div>

          <input
            type="url"
            placeholder="https://pub-xxxx.r2.dev/..."
            value={value}
            onChange={(e) => {
              const nextVal = e.target.value;
              if (nextVal.trim().startsWith('data:image/')) {
                setErrorMsg(
                  'Base64 images are disabled. Upload the file to R2 or paste an https:// URL.'
                );
                return;
              }
              setErrorMsg(null);
              onChange(nextVal);
            }}
            className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-md bg-white text-stone-800 font-mono"
          />

          {statusMsg && (
            <p className="text-xs text-emerald-700 font-medium">{statusMsg}</p>
          )}
          {errorMsg && (
            <p className="text-xs text-red-600 font-medium">{errorMsg}</p>
          )}
        </div>
      </div>

      {pickerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] flex flex-col overflow-hidden border border-stone-200 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-stone-900">
                  Cloudflare R2 Bucket Objects ({pickerItems.length})
                </h4>
                <p className="text-xs text-stone-500">
                  Click any image in your R2 bucket to link it to this section
                  in Firestore.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="px-3 py-1 text-xs rounded-md border border-stone-300 text-stone-700"
              >
                Close
              </button>
            </div>

            <div className="p-5 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {pickerLoading ? (
                <p className="text-xs text-stone-500 col-span-full">
                  Loading objects from R2 bucket…
                </p>
              ) : pickerItems.length === 0 ? (
                <div className="col-span-full text-center py-8 space-y-2">
                  <p className="text-xs text-stone-500">
                    No objects found in R2 bucket yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setPickerOpen(false);
                      fileInputRef.current?.click();
                    }}
                    className="px-3.5 py-1.5 text-xs rounded-md bg-stone-900 text-white font-medium"
                  >
                    Upload First Image to R2
                  </button>
                </div>
              ) : (
                pickerItems.map((item) => (
                  <button
                    key={item.objectKey}
                    type="button"
                    onClick={async () => {
                      onChange(item.cdnUrl);
                      if (onR2Uploaded) {
                        await onR2Uploaded({
                          id: item.id,
                          objectKey: item.objectKey,
                          cdnUrl: item.cdnUrl,
                          folder: item.folder,
                          fileName: item.fileName,
                          contentType: item.contentType || 'image/jpeg',
                          sizeBytes: item.sizeBytes || 0,
                        });
                      }
                      setPickerOpen(false);
                      setStatusMsg(
                        `Linked R2 object (${item.objectKey}) to Firestore.`
                      );
                    }}
                    className="text-left border border-stone-200 rounded-lg p-2 hover:border-stone-900 transition flex flex-col gap-1.5"
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
                      {item.fileName}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
