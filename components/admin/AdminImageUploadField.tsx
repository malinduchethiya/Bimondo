'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  extractObjectKeyFromUrl,
  getR2RequestHeaders,
  getStoredR2Config,
  loadR2ConfigFromFirestore,
  normalizeR2PublicDomain,
  resolveCmsImageUrl,
  saveR2ConfigToFirestore,
  shouldUseDirectImgTag,
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
  label = 'CLOUDFLARE R2 IMAGE (DIRECT R2 BUCKET UPLOAD & R2 DOMAIN LINK)',
  folder = 'general',
  value,
  onChange,
  onR2Uploaded,
  onR2Deleted,
  onOpenR2Settings,
}: AdminImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);

  // Inline R2 Domain & Credentials Quick-Setup state
  const [showR2QuickConfig, setShowR2QuickConfig] = useState<boolean>(false);
  const [savingQuickR2, setSavingQuickR2] = useState<boolean>(false);
  const [r2AccountId, setR2AccountId] = useState<string>('');
  const [r2BucketName, setR2BucketName] = useState<string>('bimondo-media');
  const [r2PublicCdnUrl, setR2PublicCdnUrl] = useState<string>('');
  const [r2AccessKeyId, setR2AccessKeyId] = useState<string>('');
  const [r2SecretAccessKey, setR2SecretAccessKey] = useState<string>('');
  const [s3Connected, setS3Connected] = useState<boolean>(false);

  // R2 Bucket Picker Modal State
  const [pickerOpen, setPickerOpen] = useState<boolean>(false);
  const [pickerLoading, setPickerLoading] = useState<boolean>(false);
  const [pickerItems, setPickerItems] = useState<R2BucketPickerItem[]>([]);
  const [pickerFolder, setPickerFolder] = useState<string>('all');
  const [pickerSearch, setPickerSearch] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    const initR2State = async () => {
      const cfg = await loadR2ConfigFromFirestore();
      if (!mounted) return;
      setR2AccountId(cfg.accountId || '');
      setR2BucketName(cfg.bucketName || 'bimondo-media');
      setR2PublicCdnUrl(cfg.publicCdnUrl || '');
      setR2AccessKeyId(cfg.accessKeyId || '');
      setR2SecretAccessKey(cfg.secretAccessKey || '');

      try {
        const res = await fetch('/api/admin/r2', {
          cache: 'no-store',
          headers: getR2RequestHeaders(),
        });
        const data = await res.json();
        if (!mounted) return;
        if (data?.status) {
          setS3Connected(Boolean(data.status.s3Connected));
          if (data.status.accountId && !cfg.accountId) {
            setR2AccountId(data.status.accountId);
          }
          if (data.status.bucketName) {
            setR2BucketName(data.status.bucketName);
          }
          const cleanServerCdn = normalizeR2PublicDomain(
            data.status.publicCdnUrl
          );
          if (cleanServerCdn && !cfg.publicCdnUrl) {
            setR2PublicCdnUrl(cleanServerCdn);
          }
        }
      } catch {
        // Ignore background status check error
      }
    };
    initR2State();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSaveQuickR2Config = async () => {
    setSavingQuickR2(true);
    setErrorMsg(null);
    setStatusMsg(null);

    try {
      const cleanCdn = normalizeR2PublicDomain(r2PublicCdnUrl);
      const savedLocal = await saveR2ConfigToFirestore({
        accountId: r2AccountId,
        bucketName: r2BucketName || 'bimondo-media',
        publicCdnUrl: cleanCdn,
        accessKeyId: r2AccessKeyId || undefined,
        secretAccessKey: r2SecretAccessKey || undefined,
      });

      const res = await fetch('/api/admin/r2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getR2RequestHeaders(),
        },
        body: JSON.stringify({
          action: 'save_config',
          accountId: savedLocal.accountId,
          bucketName: savedLocal.bucketName,
          publicCdnUrl: savedLocal.publicCdnUrl,
          accessKeyId: savedLocal.accessKeyId || undefined,
          secretAccessKey: savedLocal.secretAccessKey || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save R2 configuration.');
      }

      setS3Connected(Boolean(data?.status?.s3Connected));
      setR2PublicCdnUrl(savedLocal.publicCdnUrl);

      // If current value is a /api/admin/r2/file/<key> URL and publicCdnUrl is now set,
      // automatically convert it to the direct R2 domain link and save to Firestore!
      if (savedLocal.publicCdnUrl && value) {
        const extractedKey = extractObjectKeyFromUrl(value);
        if (extractedKey) {
          const directR2Url = `${savedLocal.publicCdnUrl}/${extractedKey}`;
          onChange(directR2Url);
          if (onR2Uploaded) {
            await onR2Uploaded({
              id: extractedKey.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 120),
              objectKey: extractedKey,
              cdnUrl: directR2Url,
              folder,
              fileName: extractedKey.split('/').pop() || 'image.jpg',
              contentType: 'image/jpeg',
              sizeBytes: 245760,
            });
          }
          setStatusMsg(
            `R2 Domain saved & image link upgraded to ${directR2Url}`
          );
          setShowR2QuickConfig(false);
          return;
        }
      }

      setStatusMsg(
        data?.connectionTest?.message ||
          'Cloudflare R2 credentials & domain saved to Firestore.'
      );
      setShowR2QuickConfig(false);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to save R2 configuration.'
      );
    } finally {
      setSavingQuickR2(false);
    }
  };

  const openR2BucketPicker = async () => {
    setPickerOpen(true);
    setPickerLoading(true);
    setPickerFolder(folder || 'all');
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

  const handleSelectFromBucket = async (item: R2BucketPickerItem) => {
    const cleanCdn = normalizeR2PublicDomain(r2PublicCdnUrl);
    const resolvedUrl =
      cleanCdn && item.objectKey && item.cdnUrl.includes('/api/admin/r2/file/')
        ? `${cleanCdn}/${item.objectKey}`
        : item.cdnUrl;

    onChange(resolvedUrl);
    if (onR2Uploaded) {
      await onR2Uploaded({
        id: item.id,
        objectKey: item.objectKey,
        cdnUrl: resolvedUrl,
        folder: item.folder,
        fileName: item.fileName,
        contentType: item.contentType || 'image/jpeg',
        sizeBytes: item.sizeBytes || 0,
      });
    }
    setPickerOpen(false);
    setErrorMsg(null);
    setStatusMsg(
      `Selected from R2 (${item.objectKey}) · Saved R2 link to Firestore`
    );
  };

  const handleUploadToR2 = async (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WebP, AVIF).');
      return;
    }

    setUploading(true);
    setStatusMsg(null);
    setErrorMsg(null);

    try {
      const storedCfg = getStoredR2Config();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      if (value && value.startsWith('http')) {
        formData.append('replaceKey', value);
      }
      if (storedCfg.accountId) formData.append('accountId', storedCfg.accountId);
      if (storedCfg.bucketName) formData.append('bucketName', storedCfg.bucketName);
      if (storedCfg.publicCdnUrl) {
        formData.append('publicCdnUrl', storedCfg.publicCdnUrl);
      }
      if (storedCfg.accessKeyId) {
        formData.append('accessKeyId', storedCfg.accessKeyId);
      }
      if (storedCfg.secretAccessKey) {
        formData.append('secretAccessKey', storedCfg.secretAccessKey);
      }

      const res = await fetch('/api/admin/r2', {
        method: 'POST',
        headers: getR2RequestHeaders(),
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data?.item?.cdnUrl) {
        setShowR2QuickConfig(true);
        throw new Error(
          data?.error ||
            'Failed to upload image to Cloudflare R2. Please verify your R2 Account ID, Bucket Name, Public R2.dev Domain, and S3 keys below.'
        );
      }

      const uploadedItem = data.item as R2UploadedItemMeta & {
        storageMode?: string;
      };
      onChange(uploadedItem.cdnUrl);
      if (onR2Uploaded) {
        await onR2Uploaded(uploadedItem);
      }

      if (uploadedItem.cdnUrl.includes('/api/admin/r2/file/')) {
        setStatusMsg(
          `Uploaded (${uploadedItem.objectKey}) & saved to Firestore. Tip: Set your Public R2 Domain (https://pub-xxx.r2.dev) via "⚙ R2 Domain & Keys" so links use your direct R2 domain.`
        );
      } else {
        setStatusMsg(
          `Uploaded directly to R2 (${uploadedItem.objectKey}) · Saved R2 domain link (${uploadedItem.cdnUrl}) to Firestore`
        );
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Failed to upload image to Cloudflare R2.'
      );
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
    setStatusMsg(null);
    setErrorMsg(null);

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
        throw new Error(
          data?.error || 'Could not delete object from R2 bucket.'
        );
      }

      const deletedKey = String(data.deletedKey || '');
      const mediaDocId =
        deletedKey.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 120) || '';
      onChange('');
      if (onR2Deleted && deletedKey) {
        await onR2Deleted(deletedKey, mediaDocId);
      }
      setStatusMsg(`Deleted "${deletedKey}" from R2 bucket.`);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Error deleting from R2.'
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleUploadToR2(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleUploadToR2(file);
  };

  const filteredPickerItems = pickerItems.filter((item) => {
    const matchesFolder =
      pickerFolder === 'all' || item.folder === pickerFolder;
    const matchesSearch =
      !pickerSearch.trim() ||
      item.objectKey.toLowerCase().includes(pickerSearch.toLowerCase()) ||
      item.fileName.toLowerCase().includes(pickerSearch.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  const displayPreviewUrl = resolveCmsImageUrl(value, r2PublicCdnUrl);
  const useDirectImg = shouldUseDirectImgTag(displayPreviewUrl);
  const isLegacyProxyLink =
    Boolean(value) && value.includes('/api/admin/r2/file/');

  return (
    <div className="admin-field">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '6px',
        }}
      >
        <label style={{ marginBottom: 0 }}>{label}</label>
        <button
          type="button"
          onClick={() => setShowR2QuickConfig((prev) => !prev)}
          style={{
            background: isLegacyProxyLink
              ? 'rgba(180, 35, 24, 0.08)'
              : 'rgba(29, 60, 46, 0.08)',
            border: '1px solid var(--line)',
            borderRadius: '999px',
            padding: '3px 10px',
            fontSize: '10.5px',
            fontWeight: 700,
            color: isLegacyProxyLink ? '#b42318' : 'var(--green)',
            cursor: 'pointer',
          }}
        >
          {r2PublicCdnUrl
            ? `✓ R2 Domain: ${r2PublicCdnUrl.replace(/^https?:\/\//, '')}`
            : s3Connected
            ? `✓ R2 S3 Connected (${r2BucketName}) · Set R2.dev Domain`
            : '⚙ Configure R2 Bucket & Public R2.dev Domain'}
        </button>
      </div>

      {/* Inline R2 Domain & Credentials Quick-Setup Drawer */}
      {showR2QuickConfig && (
        <div
          style={{
            padding: '14px',
            borderRadius: '12px',
            background: '#fff',
            border: '1px solid var(--line)',
            marginBottom: '12px',
            display: 'grid',
            gap: '10px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <strong style={{ fontSize: '12px', color: 'var(--ink)' }}>
              Direct Cloudflare R2 Upload &amp; Public R2 Domain Setup
            </strong>
            {onOpenR2Settings && (
              <button
                type="button"
                onClick={onOpenR2Settings}
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: 0,
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--green)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                }}
              >
                Open Full R2 Media Library →
              </button>
            )}
          </div>

          <div className="admin-form-grid-3">
            <div className="admin-field" style={{ marginBottom: 0 }}>
              <label>PUBLIC R2 DOMAIN (FOR SITE DISPLAY)</label>
              <input
                type="text"
                placeholder="https://pub-xxxx.r2.dev or custom domain"
                value={r2PublicCdnUrl}
                onChange={(e) => setR2PublicCdnUrl(e.target.value)}
              />
            </div>

            <div className="admin-field" style={{ marginBottom: 0 }}>
              <label>CLOUDFLARE ACCOUNT ID OR S3 ENDPOINT</label>
              <input
                type="text"
                placeholder="Account ID or https://<id>.r2.cloudflarestorage.com"
                value={r2AccountId}
                onChange={(e) => setR2AccountId(e.target.value)}
              />
            </div>

            <div className="admin-field" style={{ marginBottom: 0 }}>
              <label>R2 BUCKET NAME</label>
              <input
                type="text"
                placeholder="e.g. bimondo-media"
                value={r2BucketName}
                onChange={(e) => setR2BucketName(e.target.value)}
              />
            </div>
          </div>

          <div className="admin-form-grid-2">
            <div className="admin-field" style={{ marginBottom: 0 }}>
              <label>R2 S3 ACCESS KEY ID</label>
              <input
                type="password"
                placeholder="R2 S3 Access Key ID"
                value={r2AccessKeyId}
                onChange={(e) => setR2AccessKeyId(e.target.value)}
              />
            </div>

            <div className="admin-field" style={{ marginBottom: 0 }}>
              <label>R2 S3 SECRET ACCESS KEY</label>
              <input
                type="password"
                placeholder="R2 S3 Secret Access Key"
                value={r2SecretAccessKey}
                onChange={(e) => setR2SecretAccessKey(e.target.value)}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            <small style={{ color: 'var(--muted)', fontSize: '11px' }}>
              Saved to Firestore so uploads go directly to R2 and save your{' '}
              <code>https://pub-xxx.r2.dev/...</code> link in Firestore.
            </small>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="pill"
                style={{
                  padding: '5px 12px',
                  minHeight: '30px',
                  fontSize: '10.5px',
                }}
                onClick={() => setShowR2QuickConfig(false)}
              >
                CLOSE
              </button>
              <button
                type="button"
                className="pill dark"
                style={{
                  padding: '5px 14px',
                  minHeight: '30px',
                  fontSize: '10.5px',
                }}
                disabled={savingQuickR2}
                onClick={handleSaveQuickR2Config}
              >
                {savingQuickR2
                  ? 'SAVING R2 CONFIG…'
                  : 'SAVE R2 DOMAIN & KEYS'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={`admin-image-upload-box ${dragOver ? 'is-drag-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="admin-image-preview-thumb">
          {displayPreviewUrl && !displayPreviewUrl.startsWith('data:') ? (
            useDirectImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayPreviewUrl}
                alt="R2 CDN Preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Image
                src={displayPreviewUrl}
                alt="R2 CDN Preview"
                fill
                sizes="96px"
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            )
          ) : (
            <span>No R2 Image</span>
          )}
        </div>

        <div className="admin-image-upload-controls">
          <div className="admin-image-upload-btn-row">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="pill dark"
              style={{
                padding: '7px 14px',
                minHeight: '34px',
                fontSize: '10.5px',
              }}
              disabled={uploading || deleting}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading
                ? 'UPLOADING TO R2…'
                : value
                ? 'UPLOAD & REPLACE IN R2'
                : 'UPLOAD TO R2 FROM DEVICE'}
            </button>

            <button
              type="button"
              className="pill"
              style={{
                padding: '7px 12px',
                minHeight: '34px',
                fontSize: '10.5px',
              }}
              disabled={uploading || deleting}
              onClick={openR2BucketPicker}
            >
              SELECT FROM R2 BUCKET
            </button>

            {value && (
              <button
                type="button"
                className="pill"
                style={{
                  padding: '7px 12px',
                  minHeight: '34px',
                  fontSize: '10.5px',
                }}
                disabled={uploading || deleting}
                onClick={handleDeleteFromR2}
              >
                {deleting ? 'DELETING…' : 'DELETE FROM R2'}
              </button>
            )}

            <span className="admin-image-drop-hint">
              Uploads to R2 (`{folder}/`) &amp; saves R2 domain link in Firestore
            </span>
          </div>

          <input
            type="url"
            placeholder="Cloudflare R2 Domain link (https://pub-xxx.r2.dev/...)"
            value={value}
            onChange={(e) => {
              const nextVal = e.target.value;
              if (nextVal.trim().startsWith('data:image/')) {
                setErrorMsg(
                  'Base64 data:image strings are blocked. Please upload the image file to R2 or paste an https:// R2 domain URL.'
                );
                return;
              }
              setErrorMsg(null);
              onChange(nextVal);
            }}
          />

          <div className="admin-image-meta-row">
            {isLegacyProxyLink && !r2PublicCdnUrl && (
              <small style={{ color: '#b42318', fontWeight: 600 }}>
                ⚠ Currently using proxy URL (<code>/api/admin/r2/file/...</code>
                ). Click &ldquo;⚙ Configure R2 Bucket &amp; Public R2.dev
                Domain&rdquo; above to use your direct R2 domain link.
              </small>
            )}
            {statusMsg && (
              <small style={{ color: 'var(--green)', fontWeight: 700 }}>
                ✓ {statusMsg}
              </small>
            )}
            {errorMsg && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}
              >
                <small style={{ color: '#b42318', fontWeight: 700 }}>
                  ⚠ {errorMsg}
                </small>
                {onOpenR2Settings && (
                  <button
                    type="button"
                    onClick={onOpenR2Settings}
                    style={{
                      background: 'transparent',
                      border: 0,
                      padding: 0,
                      color: 'var(--green)',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Open Cloudflare R2 Bucket Settings →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* R2 Bucket Media Picker Modal */}
      {pickerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(17, 24, 19, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setPickerOpen(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '18px',
              width: 'min(920px, 100%)',
              maxHeight: '84vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid var(--line)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '18px 22px',
                borderBottom: '1px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <span
                  className="eyebrow"
                  style={{ color: 'var(--terracotta)' }}
                >
                  CLOUDFLARE R2 BUCKET MEDIA LIBRARY
                </span>
                <h4
                  className="serif"
                  style={{ fontSize: '22px', margin: '2px 0 0' }}
                >
                  Select an Image from R2 Bucket ({filteredPickerItems.length})
                </h4>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  className="pill dark"
                  style={{
                    padding: '6px 12px',
                    minHeight: '32px',
                    fontSize: '10.5px',
                  }}
                  onClick={() => {
                    setPickerOpen(false);
                    fileInputRef.current?.click();
                  }}
                >
                  + UPLOAD NEW FILE
                </button>
                <button
                  type="button"
                  className="pill"
                  style={{
                    padding: '6px 12px',
                    minHeight: '32px',
                    fontSize: '10.5px',
                  }}
                  onClick={() => setPickerOpen(false)}
                >
                  CLOSE
                </button>
              </div>
            </div>

            <div
              style={{
                padding: '12px 22px',
                borderBottom: '1px solid var(--line)',
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                alignItems: 'center',
                background: 'var(--bg-elev)',
              }}
            >
              {(
                [
                  'all',
                  'general',
                  'tours',
                  'stays',
                  'destinations',
                  'gallery',
                ] as const
              ).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`pill ${pickerFolder === f ? 'dark' : ''}`}
                  style={{
                    padding: '5px 11px',
                    minHeight: '28px',
                    fontSize: '10px',
                  }}
                  onClick={() => setPickerFolder(f)}
                >
                  {f === 'all' ? 'ALL FOLDERS' : `${f.toUpperCase()}/`}
                </button>
              ))}
              <input
                type="text"
                placeholder="Search R2 filename or key…"
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                style={{
                  marginLeft: 'auto',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  fontSize: '12px',
                  minWidth: '210px',
                }}
              />
            </div>

            <div
              style={{
                padding: '18px 22px',
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))',
                gap: '14px',
              }}
            >
              {pickerLoading ? (
                <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
                  Loading R2 bucket objects…
                </p>
              ) : filteredPickerItems.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
                  No matching images in `{pickerFolder}/`. Click &ldquo;+ UPLOAD
                  NEW FILE&rdquo; or switch to &ldquo;ALL FOLDERS&rdquo;.
                </p>
              ) : (
                filteredPickerItems.map((item) => {
                  const itemResolvedUrl = resolveCmsImageUrl(
                    item.cdnUrl,
                    r2PublicCdnUrl
                  );
                  const isSelected = value === itemResolvedUrl || value === item.cdnUrl;
                  const useImgTag = shouldUseDirectImgTag(itemResolvedUrl);
                  return (
                    <button
                      key={item.objectKey}
                      type="button"
                      onClick={() => handleSelectFromBucket(item)}
                      style={{
                        textAlign: 'left',
                        background: isSelected
                          ? 'rgba(29, 60, 46, 0.06)'
                          : '#fff',
                        border: isSelected
                          ? '2px solid var(--green)'
                          : '1px solid var(--line)',
                        borderRadius: '12px',
                        padding: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div
                        style={{
                          position: 'relative',
                          width: '100%',
                          height: '110px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          background: '#f2efe9',
                        }}
                      >
                        {useImgTag ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={itemResolvedUrl}
                            alt={item.fileName}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <Image
                            src={itemResolvedUrl}
                            alt={item.fileName}
                            fill
                            sizes="180px"
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: 'var(--terracotta)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {item.folder}/
                      </span>
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 600,
                          color: 'var(--ink)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          width: '100%',
                        }}
                        title={item.objectKey}
                      >
                        {item.fileName}
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
