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
  Settings,
  Database,
  Image as ImageIcon,
} from 'lucide-react';
import {
  getR2RequestHeaders,
  getStoredR2Config,
  loadR2ConfigFromFirestore,
  normalizeR2PublicDomain,
  saveR2ConfigToFirestore,
} from '@/lib/r2-client';

export interface R2QuickAssignTarget {
  id: string;
  group: string;
  label: string;
  currentUrl?: string;
}

export interface R2BucketItem {
  id: string;
  objectKey: string;
  cdnUrl: string;
  folder: 'tours' | 'stays' | 'destinations' | 'gallery' | 'general';
  fileName: string;
  contentType: string;
  sizeBytes: number;
  lastModified: string;
}

export interface R2StatusInfo {
  accountId: string;
  bucketName: string;
  publicCdnUrl: string;
  s3Connected: boolean;
  storageMode: string;
  lastS3Error?: string;
}

interface R2BucketManagerTabProps {
  onAssignUrlToHero?: (url: string) => void;
  onAssignUrlToGallery?: (url: string, title?: string) => void;
  quickAssignTargets?: R2QuickAssignTarget[];
  onAssignToTarget?: (targetId: string, url: string, label?: string) => void;
  onRegisterMediaInFirestore?: (item: {
    id: string;
    objectKey: string;
    cdnUrl: string;
    folder: 'tours' | 'stays' | 'destinations' | 'gallery' | 'general';
    fileName: string;
    contentType: string;
    sizeBytes: number;
  }) => Promise<void> | void;
  onRemoveMediaFromFirestore?: (mediaId: string) => Promise<void> | void;
}

const FOLDERS: { id: 'all' | 'general' | 'destinations' | 'tours' | 'stays' | 'gallery'; label: string }[] = [
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
  const [items, setItems] = useState<R2BucketItem[]>([]);
  const [status, setStatus] = useState<R2StatusInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadFolder, setUploadFolder] = useState<'general' | 'destinations' | 'tours' | 'stays' | 'gallery'>('general');
  const [filterFolder, setFilterFolder] = useState<string>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // R2 Credentials Form
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [accountId, setAccountId] = useState('');
  const [accessKeyId, setAccessKeyId] = useState('');
  const [secretAccessKey, setSecretAccessKey] = useState('');
  const [bucketName, setBucketName] = useState('bimondo-media');
  const [publicCdnUrl, setPublicCdnUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshBucket = useCallback(async () => {
    setLoading(true);
    try {
      const cfg = await loadR2ConfigFromFirestore();
      setAccountId(cfg.accountId || '');
      setBucketName(cfg.bucketName || 'bimondo-media');
      setPublicCdnUrl(cfg.publicCdnUrl || '');
      setAccessKeyId(cfg.accessKeyId || '');
      setSecretAccessKey(cfg.secretAccessKey || '');

      const res = await fetch('/api/admin/r2', {
        cache: 'no-store',
        headers: getR2RequestHeaders(cfg),
      });
      const data = await res.json();
      setItems(Array.isArray(data?.items) ? data.items : []);
      setStatus(data?.status || null);

      if (data?.status) {
        if (data.status.accountId && !cfg.accountId) setAccountId(data.status.accountId);
        if (data.status.bucketName) setBucketName(data.status.bucketName);
        const srvCdn = normalizeR2PublicDomain(data.status.publicCdnUrl);
        if (srvCdn && !cfg.publicCdnUrl) setPublicCdnUrl(srvCdn);
        if (!data.status.s3Connected) {
          setShowConfigForm(true);
        }
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to load R2 bucket',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!active) return;
      await refreshBucket();
    })();
    return () => {
      active = false;
    };
  }, [refreshBucket]);

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setFeedback(null);
    try {
      const saved = await saveR2ConfigToFirestore({
        accountId: accountId.trim(),
        bucketName: bucketName.trim() || 'bimondo-media',
        publicCdnUrl: publicCdnUrl.trim(),
        accessKeyId: accessKeyId.trim() || undefined,
        secretAccessKey: secretAccessKey.trim() || undefined,
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
        throw new Error(data?.error || 'Could not save R2 configuration.');
      }

      setStatus(data?.status || null);
      setItems(Array.isArray(data?.items) ? data.items : []);

      if (data?.connectionTest?.ok || data?.status?.s3Connected) {
        setFeedback({
          type: 'success',
          message:
            data?.connectionTest?.message ||
            `Connected to Cloudflare R2 bucket "${saved.bucketName}".`,
        });
        setShowConfigForm(false);
      } else {
        setFeedback({
          type: 'error',
          message:
            data?.connectionTest?.message ||
            data?.status?.lastS3Error ||
            'Saved credentials, but R2 connection check failed.',
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save R2 configuration',
      });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setFeedback(null);
    let uploadedCount = 0;

    try {
      const stored = getStoredR2Config();
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', uploadFolder);
        if (stored.accountId) formData.append('accountId', stored.accountId);
        if (stored.bucketName) formData.append('bucketName', stored.bucketName);
        if (stored.publicCdnUrl) formData.append('publicCdnUrl', stored.publicCdnUrl);
        if (stored.accessKeyId) formData.append('accessKeyId', stored.accessKeyId);
        if (stored.secretAccessKey) formData.append('secretAccessKey', stored.secretAccessKey);

        const res = await fetch('/api/admin/r2', {
          method: 'POST',
          headers: getR2RequestHeaders(stored),
          body: formData,
        });
        const data = await res.json();
        if (!res.ok || !data?.item?.cdnUrl) {
          throw new Error(data?.error || 'Upload to R2 failed.');
        }

        const uploaded = data.item as R2BucketItem;
        if (onRegisterMediaInFirestore) {
          await onRegisterMediaInFirestore({
            id: uploaded.id,
            objectKey: uploaded.objectKey,
            cdnUrl: uploaded.cdnUrl,
            folder: uploaded.folder,
            fileName: uploaded.fileName,
            contentType: uploaded.contentType,
            sizeBytes: uploaded.sizeBytes,
          });
        }
        uploadedCount++;
      }

      setFeedback({
        type: 'success',
        message: `Uploaded ${uploadedCount} image${uploadedCount > 1 ? 's' : ''} to R2 (${uploadFolder}/) and saved link in Firestore.`,
      });
      await refreshBucket();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Upload failed',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteObject = async (obj: R2BucketItem) => {
    setFeedback(null);
    try {
      const res = await fetch(
        `/api/admin/r2?key=${encodeURIComponent(obj.objectKey)}`,
        {
          method: 'DELETE',
          headers: getR2RequestHeaders(),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to delete from R2');
      }
      if (onRemoveMediaFromFirestore && data?.mediaDocId) {
        await onRemoveMediaFromFirestore(String(data.mediaDocId));
      }
      setItems((prev) => prev.filter((item) => item.objectKey !== obj.objectKey));
      setFeedback({
        type: 'success',
        message: `Deleted ${obj.objectKey} from R2 and removed its record from Firestore.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Delete failed',
      });
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
      {/* Connection Status Header */}
      <div className="border border-stone-200 bg-white p-5 rounded-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-stone-700" />
              <h2 className="text-base font-semibold text-stone-900">
                Cloudflare R2 Storage &amp; Firestore Media Index
              </h2>
              {isConnected ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 rounded">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Not Connected
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500">
              Bucket:{' '}
              <span className="font-mono text-stone-700">
                {status?.bucketName || bucketName || 'Not set'}
              </span>
              {' · '}
              Public R2 Domain:{' '}
              <span className="font-mono text-stone-700">
                {status?.publicCdnUrl || publicCdnUrl || 'Not set'}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowConfigForm((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded hover:bg-stone-50"
            >
              <Settings className="w-3.5 h-3.5" />
              {showConfigForm ? 'Hide R2 Credentials' : 'Configure R2'}
            </button>
            <button
              type="button"
              onClick={refreshBucket}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded hover:bg-stone-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`mt-4 p-3 rounded border text-xs flex items-start gap-2 ${
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
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Connection Error */}
        {!isConnected && status?.lastS3Error && !feedback && (
          <div className="mt-4 p-3 rounded border bg-amber-50 border-amber-200 text-amber-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{status.lastS3Error}</span>
          </div>
        )}

        {/* R2 Configuration Form */}
        {showConfigForm && (
          <form onSubmit={handleSaveCredentials} className="mt-5 pt-5 border-t border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                Cloudflare R2 S3 API Credentials &amp; Public Domain
              </h3>
              <span className="text-[11px] text-stone-500">
                Saved to Firestore (<code className="font-mono">faqs/r2_system_config</code>)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Cloudflare Account ID
                </label>
                <input
                  type="text"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  placeholder="e.g. 8f9a2b3c4d5e6f7a8b9c0d1e2f3a4b5c"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded font-mono focus:outline-none focus:border-stone-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  R2 Bucket Name
                </label>
                <input
                  type="text"
                  value={bucketName}
                  onChange={(e) => setBucketName(e.target.value)}
                  placeholder="e.g. bimondo-media"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded font-mono focus:outline-none focus:border-stone-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  R2 S3 Access Key ID
                </label>
                <input
                  type="text"
                  value={accessKeyId}
                  onChange={(e) => setAccessKeyId(e.target.value)}
                  placeholder="R2 API Token Access Key ID"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded font-mono focus:outline-none focus:border-stone-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  R2 S3 Secret Access Key
                </label>
                <input
                  type="password"
                  value={secretAccessKey}
                  onChange={(e) => setSecretAccessKey(e.target.value)}
                  placeholder="R2 API Token Secret Access Key"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded font-mono focus:outline-none focus:border-stone-900"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  R2 Public Domain URL (<code className="font-mono">https://pub-xxx.r2.dev</code> or custom domain)
                </label>
                <input
                  type="url"
                  value={publicCdnUrl}
                  onChange={(e) => setPublicCdnUrl(e.target.value)}
                  placeholder="https://pub-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.r2.dev"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded font-mono focus:outline-none focus:border-stone-900"
                  required
                />
                <p className="mt-1 text-[11px] text-stone-500">
                  Every uploaded file URL is constructed as{' '}
                  <code className="font-mono">{'{publicUrl}/{folder}/{filename}'}</code> and stored directly in Firestore.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="submit"
                disabled={savingConfig}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-stone-900 rounded hover:bg-stone-800 disabled:opacity-50"
              >
                {savingConfig ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                Save &amp; Connect R2
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Upload & Folder Filter Bar */}
      <div className="border border-stone-200 bg-white p-4 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium text-stone-600">Target Folder:</label>
          <select
            value={uploadFolder}
            onChange={(e) =>
              setUploadFolder(
                e.target.value as 'general' | 'destinations' | 'tours' | 'stays' | 'gallery'
              )
            }
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
            accept="image/*"
            multiple
            onChange={handleUploadFiles}
            className="hidden"
          />
          <button
            type="button"
            disabled={uploading || !isConnected}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-stone-900 rounded hover:bg-stone-800 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            {uploading ? 'Uploading to R2...' : `Upload to R2 (${uploadFolder}/)`}
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
            ({filteredObjects.length} file{filteredObjects.length === 1 ? '' : 's'})
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
          <p className="text-sm font-medium text-stone-700">No R2 objects found</p>
          <p className="text-xs text-stone-500">
            {isConnected
              ? 'Upload an image above or inside any section tab to store it in your Cloudflare R2 bucket.'
              : 'Configure your Cloudflare R2 credentials above to list and upload images.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredObjects.map((obj) => {
            const assignTargetId = selectedTargets[obj.objectKey] || '';
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
                      {(obj.sizeBytes / 1024).toFixed(1)} KB ·{' '}
                      {new Date(obj.lastModified).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Assign directly to a site section */}
                  {(onAssignToTarget || onAssignUrlToHero || onAssignUrlToGallery) && (
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
                            <option value="__hero__">Hero Slideshow (Add Slide)</option>
                          )}
                          {onAssignUrlToGallery && (
                            <option value="__gallery__">Visual Gallery (Add Item)</option>
                          )}
                          {quickAssignTargets.map((t) => (
                            <option key={t.id} value={t.id}>
                              [{t.group}] {t.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={!assignTargetId}
                          onClick={async () => {
                            if (!assignTargetId) return;
                            if (assignTargetId === '__hero__' && onAssignUrlToHero) {
                              onAssignUrlToHero(obj.cdnUrl);
                            } else if (
                              assignTargetId === '__gallery__' &&
                              onAssignUrlToGallery
                            ) {
                              onAssignUrlToGallery(obj.cdnUrl, obj.fileName);
                            } else if (onAssignToTarget) {
                              const target = quickAssignTargets.find(
                                (t) => t.id === assignTargetId
                              );
                              onAssignToTarget(assignTargetId, obj.cdnUrl, target?.label);
                            }
                            if (onRegisterMediaInFirestore) {
                              await onRegisterMediaInFirestore({
                                id: obj.id,
                                objectKey: obj.objectKey,
                                cdnUrl: obj.cdnUrl,
                                folder: obj.folder,
                                fileName: obj.fileName,
                                contentType: obj.contentType || 'image/jpeg',
                                sizeBytes: obj.sizeBytes || 0,
                              });
                            }
                            setFeedback({
                              type: 'success',
                              message: `Assigned ${obj.objectKey} to website slot and saved link in Firestore.`,
                            });
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-white bg-stone-900 rounded hover:bg-stone-800 disabled:opacity-40"
                        >
                          Apply
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
                      onClick={() => handleDeleteObject(obj)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
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
