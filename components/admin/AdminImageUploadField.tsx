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
            'Failed to upload image to Cloudflare R2 bucket. Check R2 credentials in the Cloudflare R2 Storage tab.'
        );
      }

      const uploadedItem = data.item as R2UploadedItemMeta;
      onChange(uploadedItem.cdnUrl);
      if (onR2Uploaded) {
        await onR2Uploaded(uploadedItem);
      }
      setStatusMsg(
        `Pushed to Cloudflare R2 (${uploadedItem.objectKey}) · Linked via R2 CDN`
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
          data?.error || 'Could not delete object from Cloudflare R2 bucket.'
        );
      }

      const deletedKey = String(data.deletedKey || '');
      const mediaDocId =
        deletedKey.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 120) || '';
      onChange('');
      if (onR2Deleted && deletedKey) {
        await onR2Deleted(deletedKey, mediaDocId);
      }
      setStatusMsg(`Deleted "${deletedKey}" from Cloudflare R2 bucket.`);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Error deleting from Cloudflare R2.'
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
            <Image
              src={value}
              alt="R2 CDN Preview"
              fill
              sizes="96px"
              className="object-cover"
              referrerPolicy="no-referrer"
            />
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
              Pushes directly to Cloudflare R2 bucket (`{folder}/`) · Zero
              images stored in Firestore
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
                  'Base64 data:image strings are blocked. Please upload the image file to Cloudflare R2 or paste an https:// R2 CDN URL.'
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
    </div>
  );
}
