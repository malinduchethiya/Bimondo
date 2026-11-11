'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { R2UploadedItemMeta } from '@/components/admin/AdminImageUploadField';

export interface R2ConfigStatus {
  configured: boolean;
  accountId: string;
  bucketName: string;
  publicCdnUrl: string;
  hasCredentials: boolean;
}

export interface R2ObjectEntry {
  id: string;
  objectKey: string;
  cdnUrl: string;
  folder: 'tours' | 'stays' | 'destinations' | 'gallery' | 'general';
  fileName: string;
  sizeBytes: number;
  lastModified: string;
}

interface R2BucketManagerTabProps {
  onR2Uploaded: (item: R2UploadedItemMeta) => Promise<void> | void;
  onR2Deleted: (deletedKey: string, mediaDocId: string) => Promise<void> | void;
  onR2Renamed?: (oldCdnUrl: string, newCdnUrl: string, item: R2UploadedItemMeta) => Promise<void> | void;
}

export default function R2BucketManagerTab({
  onR2Uploaded,
  onR2Deleted,
  onR2Renamed,
}: R2BucketManagerTabProps) {
  const [config, setConfig] = useState<R2ConfigStatus>({
    configured: false,
    accountId: '',
    bucketName: '',
    publicCdnUrl: '',
    hasCredentials: false,
  });
  const [accessKeyId, setAccessKeyId] = useState<string>('');
  const [secretAccessKey, setSecretAccessKey] = useState<string>('');

  const [objects, setObjects] = useState<R2ObjectEntry[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [folderFilter, setFolderFilter] = useState<string>('all');
  const [uploadFolder, setUploadFolder] = useState<
    'tours' | 'stays' | 'destinations' | 'gallery' | 'general'
  >('gallery');

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [editingKeyMap, setEditingKeyMap] = useState<Record<string, string>>({});

  const newFileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceFileInputRefs = useRef<Record<string, HTMLInputElement | null>>(
    {}
  );

  const loadR2Bucket = useCallback(async () => {
    setLoadingList(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/r2', { cache: 'no-store' });
      const data = await res.json();
      if (data?.config) {
        setConfig(data.config);
      }
      if (Array.isArray(data?.objects)) {
        setObjects(data.objects);
      }
      if (data?.error) {
        setErrorMessage(data.error);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to load R2 bucket.'
      );
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/r2', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data?.config) {
          setConfig(data.config);
        }
        if (Array.isArray(data?.objects)) {
          setObjects(data.objects);
        }
        if (data?.error) {
          setErrorMessage(data.error);
        }
      })
      .catch((err) => {
        if (!active) return;
        setErrorMessage(
          err instanceof Error ? err.message : 'Failed to load R2 bucket.'
        );
      })
      .finally(() => {
        if (active) setLoadingList(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSaveR2Config = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);
    setBusyKey('save_config');

    try {
      const res = await fetch('/api/admin/r2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_config',
          accountId: config.accountId,
          bucketName: config.bucketName,
          publicCdnUrl: config.publicCdnUrl,
          accessKeyId: accessKeyId.trim() || undefined,
          secretAccessKey: secretAccessKey.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save R2 configuration.');
      }
      setConfig(data.config);
      setAccessKeyId('');
      setSecretAccessKey('');
      setStatusMessage(
        'Cloudflare R2 bucket configuration saved securely on the server.'
      );
      await loadR2Bucket();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to save R2 config.'
      );
    } finally {
      setBusyKey(null);
    }
  };

  const handleDirectUploadFromDevice = async (
    file: File | null | undefined,
    targetFolder: 'tours' | 'stays' | 'destinations' | 'gallery' | 'general',
    replaceExistingObject?: R2ObjectEntry
  ) => {
    if (!file) return;
    setStatusMessage(null);
    setErrorMessage(null);
    setBusyKey(replaceExistingObject ? replaceExistingObject.objectKey : 'new_upload');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', targetFolder);
      if (replaceExistingObject) {
        formData.append('customKey', replaceExistingObject.objectKey);
        formData.append('replaceKey', replaceExistingObject.objectKey);
      }

      const res = await fetch('/api/admin/r2', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data?.item) {
        throw new Error(
          data?.error || 'Failed to push file to Cloudflare R2 bucket.'
        );
      }

      const uploaded = data.item as R2UploadedItemMeta;
      await onR2Uploaded(uploaded);
      setStatusMessage(
        replaceExistingObject
          ? `Updated "${uploaded.objectKey}" in Cloudflare R2 & synced CDN link to Firebase.`
          : `Uploaded "${uploaded.objectKey}" directly to Cloudflare R2 & registered CDN link in Firebase.`
      );
      await loadR2Bucket();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'R2 upload error.'
      );
    } finally {
      setBusyKey(null);
      if (newFileInputRef.current) {
        newFileInputRef.current.value = '';
      }
    }
  };

  const handleRenameObject = async (obj: R2ObjectEntry) => {
    const nextKey = (editingKeyMap[obj.objectKey] ?? obj.objectKey).trim();
    if (!nextKey || nextKey === obj.objectKey) return;

    setStatusMessage(null);
    setErrorMessage(null);
    setBusyKey(obj.objectKey);

    try {
      const res = await fetch('/api/admin/r2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rename_object',
          oldKeyOrUrl: obj.objectKey,
          newKey: nextKey,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.renamed) {
        throw new Error(data?.error || 'Failed to rename R2 object.');
      }

      const oldDocId = obj.id;
      await onR2Deleted(obj.objectKey, oldDocId);

      const newMeta: R2UploadedItemMeta = {
        id: data.renamed.id,
        objectKey: data.renamed.objectKey,
        cdnUrl: data.renamed.cdnUrl,
        folder: obj.folder,
        fileName: data.renamed.objectKey.split('/').pop() || obj.fileName,
        contentType: 'image/jpeg',
        sizeBytes: obj.sizeBytes,
      };
      await onR2Uploaded(newMeta);
      if (onR2Renamed) {
        await onR2Renamed(obj.cdnUrl, data.renamed.cdnUrl, newMeta);
      }

      setStatusMessage(
        `Renamed R2 object "${obj.objectKey}" → "${data.renamed.objectKey}" and updated CDN links in Firebase.`
      );
      await loadR2Bucket();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to rename R2 object.'
      );
    } finally {
      setBusyKey(null);
    }
  };

  const handleDeleteObject = async (obj: R2ObjectEntry) => {
    setStatusMessage(null);
    setErrorMessage(null);
    setBusyKey(obj.objectKey);

    try {
      const res = await fetch(
        `/api/admin/r2?key=${encodeURIComponent(obj.objectKey)}`,
        {
          method: 'DELETE',
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to delete object from R2.');
      }

      await onR2Deleted(obj.objectKey, obj.id);
      setStatusMessage(
        `Deleted "${obj.objectKey}" from Cloudflare R2 bucket and removed its CDN reference from Firebase.`
      );
      await loadR2Bucket();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to delete R2 object.'
      );
    } finally {
      setBusyKey(null);
    }
  };

  const filteredObjects =
    folderFilter === 'all'
      ? objects
      : objects.filter((o) => o.folder === folderFilter);

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {statusMessage && (
        <div className="admin-save-banner" role="status">
          <strong>✓ {statusMessage}</strong>
        </div>
      )}
      {errorMessage && (
        <div
          className="admin-save-banner"
          role="alert"
          style={{
            background: '#fef3f2',
            color: '#b42318',
            borderColor: 'rgba(180, 35, 24, 0.25)',
          }}
        >
          <strong>⚠ {errorMessage}</strong>
        </div>
      )}

      {/* 1. CLOUDFLARE R2 BUCKET & CDN CONFIGURATION */}
      <form onSubmit={handleSaveR2Config} className="admin-assignments-card">
        <div className="section-head" style={{ marginBottom: '18px' }}>
          <div>
            <span className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              CLOUDFLARE R2 STORAGE ENGINE · ZERO FIRESTORE IMAGE STORAGE
            </span>
            <h3
              className="serif"
              style={{ fontSize: '28px', margin: '4px 0 0' }}
            >
              Cloudflare R2 Bucket &amp; Public CDN Settings
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              className={
                config.configured ? 'badge-live' : 'badge-unconfigured'
              }
            >
              {config.configured
                ? 'R2 BUCKET CONNECTED ✓'
                : 'AWAITING R2 CREDENTIALS'}
            </span>
            <button
              type="submit"
              className="pill dark"
              disabled={busyKey === 'save_config'}
            >
              {busyKey === 'save_config' ? 'SAVING…' : 'SAVE R2 SETTINGS'}
            </button>
          </div>
        </div>

        <p
          style={{
            fontSize: '13px',
            color: 'var(--muted)',
            margin: '0 0 18px',
            lineHeight: 1.6,
          }}
        >
          All images chosen from your device are pushed directly to your
          Cloudflare R2 bucket. Firebase Firestore stores{' '}
          <strong>only the R2 CDN URLs and metadata</strong> — never raw or
          base64 images.
        </p>

        <div className="admin-form-grid-2">
          <div className="admin-field">
            <label>CLOUDFLARE ACCOUNT ID</label>
            <input
              type="text"
              placeholder="e.g. 8f9a2b3c4d5e6f7a8b9c0d1e2f3a4b5c"
              value={config.accountId}
              onChange={(e) =>
                setConfig({ ...config, accountId: e.target.value })
              }
              required
            />
          </div>

          <div className="admin-field">
            <label>R2 BUCKET NAME</label>
            <input
              type="text"
              placeholder="e.g. bimondo-media"
              value={config.bucketName}
              onChange={(e) =>
                setConfig({ ...config, bucketName: e.target.value })
              }
              required
            />
          </div>

          <div className="admin-field">
            <label>R2 PUBLIC CDN BASE URL (R2.DEV OR CUSTOM DOMAIN)</label>
            <input
              type="url"
              placeholder="e.g. https://pub-xxxxxxxxxxxxxxxx.r2.dev or https://cdn.bimondo.com"
              value={config.publicCdnUrl}
              onChange={(e) =>
                setConfig({ ...config, publicCdnUrl: e.target.value })
              }
              required
            />
          </div>

          <div className="admin-field">
            <label>
              R2 S3 API ACCESS KEY ID &amp; SECRET KEY (STORED SERVER-SIDE ·{' '}
              {config.hasCredentials ? 'SET ✓' : 'NOT SET'})
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="R2 Access Key ID"
                value={accessKeyId}
                onChange={(e) => setAccessKeyId(e.target.value)}
                style={{ flex: 1 }}
              />
              <input
                type="password"
                placeholder="R2 Secret Access Key"
                value={secretAccessKey}
                onChange={(e) => setSecretAccessKey(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
          </div>
        </div>
      </form>

      {/* 2. DIRECT DEVICE UPLOAD & R2 BUCKET OBJECT BROWSER */}
      <div className="admin-assignments-card">
        <div className="section-head" style={{ marginBottom: '20px' }}>
          <div>
            <span className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              DIRECT R2 BUCKET MEDIA MANAGER ({objects.length} OBJECTS)
            </span>
            <h3
              className="serif"
              style={{ fontSize: '28px', margin: '4px 0 0' }}
            >
              Upload, Replace, Rename &amp; Delete R2 Bucket Images
            </h3>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <select
              value={uploadFolder}
              onChange={(e) =>
                setUploadFolder(
                  e.target.value as
                    | 'tours'
                    | 'stays'
                    | 'destinations'
                    | 'gallery'
                    | 'general'
                )
              }
              style={{
                padding: '9px 12px',
                borderRadius: '999px',
                border: '1px solid rgba(21,91,114,0.24)',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              <option value="tours">Folder: tours/</option>
              <option value="stays">Folder: stays/</option>
              <option value="destinations">Folder: destinations/</option>
              <option value="gallery">Folder: gallery/</option>
              <option value="general">Folder: general/</option>
            </select>

            <input
              ref={newFileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) =>
                handleDirectUploadFromDevice(
                  e.target.files?.[0],
                  uploadFolder
                )
              }
            />

            <button
              type="button"
              className="pill dark"
              disabled={busyKey === 'new_upload'}
              onClick={() => newFileInputRef.current?.click()}
            >
              {busyKey === 'new_upload'
                ? 'UPLOADING TO R2…'
                : '+ UPLOAD IMAGE FROM DEVICE TO R2'}
            </button>

            <button
              type="button"
              className="pill"
              onClick={loadR2Bucket}
              disabled={loadingList}
            >
              {loadingList ? 'REFRESHING…' : 'REFRESH R2 BUCKET'}
            </button>
          </div>
        </div>

        {/* Folder Filter Pills */}
        <div className="filter" style={{ marginBottom: '20px' }}>
          {(['all', 'tours', 'stays', 'destinations', 'gallery', 'general'] as const).map(
            (f) => (
              <button
                key={f}
                type="button"
                className={folderFilter === f ? 'active' : ''}
                onClick={() => setFolderFilter(f)}
              >
                {f === 'all' ? 'All R2 Objects' : `${f}/`}
              </button>
            )
          )}
        </div>

        {!config.configured ? (
          <p style={{ color: 'var(--muted)', fontSize: '13.5px' }}>
            Enter your Cloudflare R2 credentials above and click{' '}
            <strong>SAVE R2 SETTINGS</strong> to browse, upload, edit, and
            delete objects directly in your R2 bucket.
          </p>
        ) : loadingList ? (
          <p style={{ color: 'var(--muted)', fontSize: '13.5px' }}>
            Loading objects from Cloudflare R2 bucket…
          </p>
        ) : filteredObjects.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: '13.5px' }}>
            No image objects found in this R2 bucket folder yet. Click{' '}
            <strong>+ UPLOAD IMAGE FROM DEVICE TO R2</strong> above to push an
            image from your device.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '14px' }}>
            {filteredObjects.map((obj) => {
              const editedKey = editingKeyMap[obj.objectKey] ?? obj.objectKey;
              const isBusy = busyKey === obj.objectKey;
              return (
                <div key={obj.objectKey} className="admin-item-editor-card">
                  <div
                    style={{
                      display: 'flex',
                      gap: '16px',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div
                      className="admin-image-preview-thumb"
                      style={{ width: '96px', height: '72px' }}
                    >
                      <Image
                        src={obj.cdnUrl}
                        alt={obj.fileName}
                        fill
                        sizes="96px"
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexWrap: 'wrap',
                          marginBottom: '6px',
                        }}
                      >
                        <span className="admin-type-pill">{obj.folder}/</span>
                        <small style={{ color: 'var(--muted)' }}>
                          {(obj.sizeBytes / 1024).toFixed(1)} KB · Updated{' '}
                          {obj.lastModified ? obj.lastModified.slice(0, 10) : ''}
                        </small>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          marginBottom: '6px',
                        }}
                      >
                        <input
                          type="text"
                          value={editedKey}
                          onChange={(e) =>
                            setEditingKeyMap((prev) => ({
                              ...prev,
                              [obj.objectKey]: e.target.value,
                            }))
                          }
                          aria-label="R2 Object Key"
                          style={{
                            flex: 1,
                            minWidth: '200px',
                            padding: '6px 10px',
                            borderRadius: '7px',
                            border: '1px solid rgba(21,91,114,0.22)',
                            fontSize: '12.5px',
                          }}
                        />
                        {editedKey !== obj.objectKey && (
                          <button
                            type="button"
                            className="pill dark"
                            style={{
                              padding: '6px 12px',
                              minHeight: '32px',
                              fontSize: '10.5px',
                            }}
                            disabled={isBusy}
                            onClick={() => handleRenameObject(obj)}
                          >
                            SAVE KEY RENAME
                          </button>
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: '11.5px',
                          color: 'var(--green)',
                          wordBreak: 'break-all',
                        }}
                      >
                        <strong>CDN Link:</strong> {obj.cdnUrl}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <button
                        type="button"
                        className="pill"
                        style={{
                          padding: '6px 12px',
                          minHeight: '32px',
                          fontSize: '10.5px',
                        }}
                        onClick={() => {
                          navigator.clipboard?.writeText(obj.cdnUrl);
                          setStatusMessage(
                            `Copied R2 CDN link: ${obj.cdnUrl}`
                          );
                        }}
                      >
                        COPY CDN URL
                      </button>

                      <input
                        ref={(el) => {
                          replaceFileInputRefs.current[obj.objectKey] = el;
                        }}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) =>
                          handleDirectUploadFromDevice(
                            e.target.files?.[0],
                            obj.folder,
                            obj
                          )
                        }
                      />

                      <button
                        type="button"
                        className="pill dark"
                        style={{
                          padding: '6px 12px',
                          minHeight: '32px',
                          fontSize: '10.5px',
                        }}
                        disabled={isBusy}
                        onClick={() =>
                          replaceFileInputRefs.current[obj.objectKey]?.click()
                        }
                      >
                        {isBusy ? 'WORKING…' : 'REPLACE FILE'}
                      </button>

                      <button
                        type="button"
                        className="pill"
                        style={{
                          padding: '6px 12px',
                          minHeight: '32px',
                          fontSize: '10.5px',
                        }}
                        disabled={isBusy}
                        onClick={() => handleDeleteObject(obj)}
                      >
                        DELETE FROM R2
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
