'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';

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
  label = 'CLOUDFLARE R2 IMAGE (DIRECT R2 BUCKET UPLOAD & CDN LINK)',
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

  // R2 Bucket Picker Modal State
  const [pickerOpen, setPickerOpen] = useState<boolean>(false);
  const [pickerLoading, setPickerLoading] = useState<boolean>(false);
  const [pickerItems, setPickerItems] = useState<R2BucketPickerItem[]>([]);
  const [pickerFolder, setPickerFolder] = useState<string>('all');
  const [pickerSearch, setPickerSearch] = useState<string>('');

  const openR2BucketPicker = async () => {
    setPickerOpen(true);
    setPickerLoading(true);
    setPickerFolder(folder || 'all');
    try {
      const res = await fetch('/api/admin/r2', { cache: 'no-store' });
      const data = await res.json();
      setPickerItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setPickerItems([]);
    } finally {
      setPickerLoading(false);
    }
  };

  const handleSelectFromBucket = async (item: R2BucketPickerItem) => {
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
    setErrorMsg(null);
    setStatusMsg(
      `Selected from R2 Bucket (${item.objectKey}) · Linked via R2 CDN`
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
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      if (value && value.startsWith('http')) {
        formData.append('replaceKey', value);
      }

      const res = await fetch('/api/admin/r2', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data?.item?.cdnUrl) {
        throw new Error(
          data?.error ||
            'Failed to upload image to R2 bucket. Check R2 credentials in the Cloudflare R2 Storage tab.'
        );
      }

      const uploadedItem = data.item as R2UploadedItemMeta;
      onChange(uploadedItem.cdnUrl);
      if (onR2Uploaded) {
        await onR2Uploaded(uploadedItem);
      }
      setStatusMsg(
        `Uploaded to R2 (${uploadedItem.objectKey}) · Synced to Firebase R2 catalog`
      );
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

  const isLocalStreamUrl =
    Boolean(value) && value.includes('/api/admin/r2/file/');

  return (
    <div className="admin-field">
      <label>{label}</label>
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
          {value && !value.startsWith('data:') ? (
            isLocalStreamUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={value}
                alt="R2 CDN Preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Image
                src={value}
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
                ? 'REPLACE IN R2 FROM DEVICE'
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
              Connected to R2 Bucket (`{folder}/`) · Syncs CDN URL to Firestore
            </span>
          </div>

          <input
            type="url"
            placeholder="Cloudflare R2 CDN link (https://pub-xxx.r2.dev/...)"
            value={value}
            onChange={(e) => {
              const nextVal = e.target.value;
              if (nextVal.trim().startsWith('data:image/')) {
                setErrorMsg(
                  'Base64 data:image strings are blocked. Please upload the image file to R2 or paste an https:// R2 CDN URL.'
                );
                return;
              }
              setErrorMsg(null);
              onChange(nextVal);
            }}
          />

          <div className="admin-image-meta-row">
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
                  const isSelected = value === item.cdnUrl;
                  const useImgTag = item.cdnUrl.includes(
                    '/api/admin/r2/file/'
                  );
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
                            src={item.cdnUrl}
                            alt={item.fileName}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <Image
                            src={item.cdnUrl}
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
