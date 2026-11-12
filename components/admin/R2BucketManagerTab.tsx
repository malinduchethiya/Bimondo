'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { R2UploadedItemMeta } from '@/components/admin/AdminImageUploadField';
import { SiteCmsData } from '@/lib/cms-defaults';

interface R2ConfigStatus {
  configured: boolean;
  s3Connected?: boolean;
  storageMode?: 'cloudflare-s3' | 'managed-local-r2';
  accountId: string;
  bucketName: string;
  publicCdnUrl: string;
  hasCredentials: boolean;
  endpointUrl?: string;
}

interface R2BucketObjectItem {
  id: string;
  objectKey: string;
  cdnUrl: string;
  folder: 'tours' | 'stays' | 'destinations' | 'gallery' | 'general';
  fileName: string;
  contentType?: string;
  sizeBytes: number;
  lastModified: string;
  source?: 's3' | 'local-r2' | 'cms-catalog';
}

export type R2QuickAssignTarget =
  | { type: 'hero_add' }
  | { type: 'gallery_add' }
  | { type: 'tour'; id: string }
  | { type: 'stay'; id: string }
  | { type: 'destination'; id: string }
  | { type: 'review'; id: string };

interface R2BucketManagerTabProps {
  cms?: SiteCmsData;
  onR2Uploaded?: (item: R2UploadedItemMeta) => Promise<void> | void;
  onR2Deleted?: (deletedKey: string, mediaDocId: string) => Promise<void> | void;
  onR2Renamed?: (
    oldUrl: string,
    newUrl: string,
    newItem: R2UploadedItemMeta
  ) => Promise<void> | void;
  onQuickAssignToSite?: (
    target: R2QuickAssignTarget,
    cdnUrl: string,
    item: R2UploadedItemMeta
  ) => Promise<void> | void;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function R2BucketManagerTab({
  cms,
  onR2Uploaded,
  onR2Deleted,
  onR2Renamed,
  onQuickAssignToSite,
}: R2BucketManagerTabProps) {
  const [status, setStatus] = useState<R2ConfigStatus>({
    configured: true,
    s3Connected: false,
    storageMode: 'managed-local-r2',
    accountId: '',
    bucketName: 'bimondo-media',
    publicCdnUrl: '',
    hasCredentials: false,
  });
  const [accountId, setAccountId] = useState<string>('');
  const [bucketName, setBucketName] = useState<string>('');
  const [publicCdnUrl, setPublicCdnUrl] = useState<string>('');
  const [accessKeyId, setAccessKeyId] = useState<string>('');
  const [secretAccessKey, setSecretAccessKey] = useState<string>('');

  const [items, setItems] = useState<R2BucketObjectItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingConfig, setSavingConfig] = useState<boolean>(false);
  const [testingConn, setTestingConn] = useState<boolean>(false);
  const [syncingCatalog, setSyncingCatalog] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadFolder, setUploadFolder] = useState<
    'tours' | 'stays' | 'destinations' | 'gallery' | 'general'
  >('general');
  const [filterFolder, setFilterFolder] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [renameDrafts, setRenameDrafts] = useState<Record<string, string>>({});
  const [assignSelections, setAssignSelections] = useState<
    Record<string, string>
  >({});
  const [banner, setBanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchR2BucketData = useCallback(async () => {
    const res = await fetch('/api/admin/r2', { cache: 'no-store' });
    return res.json();
  }, []);

  const applyR2BucketData = useCallback(
    (data: {
      status?: R2ConfigStatus;
      items?: R2BucketObjectItem[];
      warning?: string;
    }) => {
      if (data.status) {
        setStatus(data.status);
        setAccountId(data.status.accountId || '');
        setBucketName(data.status.bucketName || 'bimondo-media');
        setPublicCdnUrl(
          data.status.publicCdnUrl &&
            !data.status.publicCdnUrl.includes('/api/admin/r2/file')
            ? data.status.publicCdnUrl
            : ''
        );
      }
      if (Array.isArray(data.items)) {
        setItems(data.items);
      }
      if (data.warning) {
        setError(data.warning);
      }
    },
    []
  );

  const loadR2Bucket = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchR2BucketData();
      applyR2BucketData(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load Cloudflare R2 bucket.'
      );
    } finally {
      setLoading(false);
    }
  }, [fetchR2BucketData, applyR2BucketData]);

  useEffect(() => {
    let active = true;
    fetchR2BucketData()
      .then((data) => {
        if (!active) return;
        applyR2BucketData(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load Cloudflare R2 bucket.'
        );
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchR2BucketData, applyR2BucketData]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setBanner(null);
    setError(null);

    try {
      const res = await fetch('/api/admin/r2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_config',
          accountId,
          bucketName,
          publicCdnUrl,
          accessKeyId: accessKeyId.trim() || undefined,
          secretAccessKey: secretAccessKey.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save R2 configuration.');
      }

      setStatus(data.status);
      setAccessKeyId('');
      setSecretAccessKey('');
      if (Array.isArray(data.items)) {
        setItems(data.items);
      }
      setBanner(
        data.connectionTest?.message ||
          'Cloudflare R2 configuration saved and connected.'
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error saving R2 credentials.'
      );
    } finally {
      setSavingConfig(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConn(true);
    setBanner(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/r2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_connection' }),
      });
      const data = await res.json();
      if (data.status) {
        setStatus(data.status);
      }
      if (Array.isArray(data.items)) {
        setItems(data.items);
      }
      if (data.connectionTest?.ok) {
        setBanner(data.connectionTest.message);
      } else {
        setError(
          data.connectionTest?.message ||
            'Could not verify remote S3 endpoint.'
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error testing R2 connection.'
      );
    } finally {
      setTestingConn(false);
    }
  };

  const handleSyncCatalogToFirestore = async () => {
    setSyncingCatalog(true);
    setBanner(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/r2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_catalog' }),
      });
      const data = await res.json();
      const loadedItems: R2BucketObjectItem[] = Array.isArray(data.items)
        ? data.items
        : [];
      setItems(loadedItems);

      if (onR2Uploaded) {
        for (const item of loadedItems) {
          await onR2Uploaded({
            id: item.id,
            objectKey: item.objectKey,
            cdnUrl: item.cdnUrl,
            folder: item.folder,
            fileName: item.fileName,
            contentType: item.contentType || 'image/jpeg',
            sizeBytes: item.sizeBytes || 245760,
          });
        }
      }
      setBanner(
        `Synced ${loadedItems.length} R2 media objects into Firebase Firestore (/r2_media).`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to sync R2 catalog to Firestore.'
      );
    } finally {
      setSyncingCatalog(false);
    }
  };

  const handleDirectUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setBanner(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', uploadFolder);

      const res = await fetch('/api/admin/r2', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data?.item) {
        throw new Error(data.error || 'Failed to upload to R2 bucket.');
      }

      const uploaded = data.item as R2UploadedItemMeta;
      if (onR2Uploaded) {
        await onR2Uploaded(uploaded);
      }
      setBanner(
        `Uploaded "${uploaded.objectKey}" to R2 Bucket and registered CDN link in Firebase Firestore (/r2_media).`
      );
      await loadR2Bucket();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRenameObject = async (item: R2BucketObjectItem) => {
    const targetKey = (renameDrafts[item.objectKey] ?? item.objectKey).trim();
    if (!targetKey || targetKey === item.objectKey) return;

    setBanner(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/r2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rename_object',
          oldKeyOrUrl: item.objectKey,
          newKey: targetKey,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.renamed) {
        throw new Error(data.error || 'Failed to rename R2 object.');
      }

      const { id, objectKey, cdnUrl } = data.renamed;
      if (onR2Deleted && data.oldDocId) {
        await onR2Deleted(item.objectKey, data.oldDocId);
      }
      if (onR2Renamed) {
        await onR2Renamed(item.cdnUrl, cdnUrl, {
          id,
          objectKey,
          cdnUrl,
          folder: item.folder,
          fileName: objectKey.split('/').pop() || objectKey,
          contentType: 'image/jpeg',
          sizeBytes: item.sizeBytes,
        });
      }
      setBanner(
        `Renamed "${item.objectKey}" → "${objectKey}" in R2 & synced all references in Firebase Firestore.`
      );
      await loadR2Bucket();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rename failed.');
    }
  };

  const handleDeleteObject = async (item: R2BucketObjectItem) => {
    setBanner(null);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/r2?key=${encodeURIComponent(item.objectKey)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete R2 object.');
      }
      if (onR2Deleted) {
        await onR2Deleted(item.objectKey, data.mediaDocId || item.id);
      }
      setBanner(
        `Deleted "${item.objectKey}" from R2 bucket and removed its CDN record from Firebase Firestore.`
      );
      await loadR2Bucket();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  const handleQuickAssign = async (item: R2BucketObjectItem) => {
    const rawTarget = assignSelections[item.objectKey];
    if (!rawTarget || !onQuickAssignToSite) return;

    let parsedTarget: R2QuickAssignTarget | null = null;
    if (rawTarget === 'hero_add') {
      parsedTarget = { type: 'hero_add' };
    } else if (rawTarget === 'gallery_add') {
      parsedTarget = { type: 'gallery_add' };
    } else if (rawTarget.startsWith('tour:')) {
      parsedTarget = { type: 'tour', id: rawTarget.slice('tour:'.length) };
    } else if (rawTarget.startsWith('stay:')) {
      parsedTarget = { type: 'stay', id: rawTarget.slice('stay:'.length) };
    } else if (rawTarget.startsWith('destination:')) {
      parsedTarget = {
        type: 'destination',
        id: rawTarget.slice('destination:'.length),
      };
    } else if (rawTarget.startsWith('review:')) {
      parsedTarget = { type: 'review', id: rawTarget.slice('review:'.length) };
    }

    if (!parsedTarget) return;

    try {
      await onQuickAssignToSite(parsedTarget, item.cdnUrl, {
        id: item.id,
        objectKey: item.objectKey,
        cdnUrl: item.cdnUrl,
        folder: item.folder,
        fileName: item.fileName,
        contentType: item.contentType || 'image/jpeg',
        sizeBytes: item.sizeBytes || 0,
      });
      setBanner(
        `Assigned "${item.fileName}" directly to website section & synced to Firebase Firestore.`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to assign R2 image.'
      );
    }
  };

  // Compute where each CDN URL is currently used across the live CMS
  const getUsageBadges = (cdnUrl: string): string[] => {
    if (!cms) return [];
    const badges: string[] = [];
    (cms.general.heroImages || []).forEach((u, i) => {
      if (u === cdnUrl) badges.push(`Hero Slide #${i + 1}`);
    });
    cms.tours.forEach((t) => {
      if (t.image === cdnUrl) badges.push(`Tour: ${t.name}`);
    });
    cms.stays.forEach((s) => {
      if (s.image === cdnUrl) badges.push(`Stay: ${s.name}`);
    });
    cms.destinations.forEach((d) => {
      if (d.image === cdnUrl) badges.push(`Destination: ${d.name}`);
    });
    cms.gallery.forEach((g) => {
      if (g.image === cdnUrl) badges.push(`Gallery: ${g.title}`);
    });
    cms.reviews.forEach((r) => {
      if (r.image === cdnUrl) badges.push(`Review: ${r.name}`);
    });
    return badges;
  };

  const filteredItems = items.filter((item) => {
    const matchesFolder =
      filterFolder === 'all' || item.folder === filterFolder;
    const matchesSearch =
      !searchQuery.trim() ||
      item.objectKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  return (
    <div style={{ display: 'grid', gap: '28px' }}>
      {/* R2 Credentials & Connection Card */}
      <div className="admin-assignments-card">
        <div className="section-head" style={{ marginBottom: '20px' }}>
          <div>
            <span className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              06B / CLOUDFLARE R2 BUCKET &amp; FIREBASE CDN ARCHITECTURE
            </span>
            <h3 className="serif" style={{ fontSize: '28px', margin: '4px 0 0' }}>
              Cloudflare R2 Storage Configuration
            </h3>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--muted)',
                margin: '6px 0 0',
              }}
            >
              Every image uploaded in the Admin Panel is stored in your R2
              bucket and linked across Hero Slideshow, Tours, Stays,
              Destinations, Gallery, and Tourist Thoughts in Firebase Firestore
              (<code>/site_cms/main</code> &amp; <code>/r2_media</code>).
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span
              className="admin-status-pill"
              style={{
                background: 'rgba(29, 60, 46, 0.12)',
                color: 'var(--green)',
              }}
            >
              {status.s3Connected
                ? `Cloudflare R2 S3 Connected (${status.bucketName})`
                : `R2 Storage Active (${items.length} Objects Ready)`}
            </span>
            <button
              type="button"
              className="pill"
              disabled={testingConn}
              onClick={handleTestConnection}
            >
              {testingConn ? 'TESTING…' : 'TEST R2 CONNECTION'}
            </button>
            <button
              type="button"
              className="pill dark"
              disabled={syncingCatalog}
              onClick={handleSyncCatalogToFirestore}
            >
              {syncingCatalog
                ? 'SYNCING TO FIRESTORE…'
                : 'SYNC ALL TO FIRESTORE (/r2_media)'}
            </button>
          </div>
        </div>

        {banner && (
          <div className="admin-alert-banner" style={{ marginBottom: '18px' }}>
            ✓ {banner}
          </div>
        )}
        {error && (
          <div
            className="admin-alert-banner"
            style={{
              marginBottom: '18px',
              background: '#fef3f2',
              color: '#b42318',
              borderColor: '#fecdca',
            }}
          >
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSaveConfig} className="admin-booking-form">
          <div className="admin-form-grid-3">
            <div className="admin-field">
              <label>CLOUDFLARE ACCOUNT ID OR S3 ENDPOINT</label>
              <input
                type="text"
                placeholder="e.g. 8f92a1b3c4d5e6f7a8b9c0d1e2f3a4b5 or https://<id>.r2.cloudflarestorage.com"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              />
              <small>
                Paste either your 32-character Account ID or full{' '}
                <code>r2.cloudflarestorage.com</code> S3 endpoint URL.
              </small>
            </div>

            <div className="admin-field">
              <label>R2 BUCKET NAME</label>
              <input
                type="text"
                placeholder="e.g. bimondo-media"
                value={bucketName}
                onChange={(e) => setBucketName(e.target.value)}
              />
              <small>Target Cloudflare R2 bucket name.</small>
            </div>

            <div className="admin-field">
              <label>PUBLIC CDN BASE URL (OPTIONAL)</label>
              <input
                type="text"
                placeholder="https://pub-xxxx.r2.dev or leave blank for built-in R2 streaming proxy"
                value={publicCdnUrl}
                onChange={(e) => setPublicCdnUrl(e.target.value)}
              />
              <small>
                If left blank, objects stream automatically via{' '}
                <code>/api/admin/r2/file/...</code>.
              </small>
            </div>
          </div>

          <div className="admin-form-grid-2" style={{ marginTop: '14px' }}>
            <div className="admin-field">
              <label>R2 S3 ACCESS KEY ID (SERVER-ONLY)</label>
              <input
                type="password"
                placeholder={
                  status.hasCredentials
                    ? '•••••••••••••••• (Saved on server — enter to replace)'
                    : 'Enter R2 Access Key ID'
                }
                value={accessKeyId}
                onChange={(e) => setAccessKeyId(e.target.value)}
              />
            </div>

            <div className="admin-field">
              <label>R2 S3 SECRET ACCESS KEY (SERVER-ONLY)</label>
              <input
                type="password"
                placeholder={
                  status.hasCredentials
                    ? '•••••••••••••••••••••••••••••••• (Saved on server)'
                    : 'Enter R2 Secret Access Key'
                }
                value={secretAccessKey}
                onChange={(e) => setSecretAccessKey(e.target.value)}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '14px',
            }}
          >
            <button
              type="button"
              className="pill"
              onClick={loadR2Bucket}
              disabled={loading}
            >
              REFRESH BUCKET
            </button>
            <button
              type="submit"
              className="pill dark"
              disabled={savingConfig}
            >
              {savingConfig ? 'SAVING R2 CONFIG…' : 'SAVE R2 CREDENTIALS'}
            </button>
          </div>
        </form>
      </div>

      {/* Direct Bucket Browser, Uploader & Site Section Assigner */}
      <div className="admin-assignments-card">
        <div className="section-head" style={{ marginBottom: '20px' }}>
          <div>
            <span className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              LIVE CLOUDFLARE R2 BUCKET OBJECTS ({filteredItems.length} OF{' '}
              {items.length})
            </span>
            <h3 className="serif" style={{ fontSize: '26px', margin: '4px 0 0' }}>
              Upload, Rename, Delete &amp; Assign R2 Images to Website Sections
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
                padding: '8px 12px',
                borderRadius: '999px',
                border: '1px solid var(--line)',
                fontSize: '12px',
                background: 'var(--bg-elev)',
              }}
            >
              <option value="general">Folder: general/ (Hero &amp; Reviews)</option>
              <option value="tours">Folder: tours/</option>
              <option value="stays">Folder: stays/</option>
              <option value="destinations">Folder: destinations/</option>
              <option value="gallery">Folder: gallery/</option>
            </select>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleDirectUpload}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="pill dark"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading
                ? 'UPLOADING TO R2…'
                : `+ UPLOAD IMAGE TO R2 (${uploadFolder}/)`}
            </button>
          </div>
        </div>

        {/* Folder Filter Pills & Search */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            alignItems: 'center',
            marginBottom: '18px',
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
              className={`pill ${filterFolder === f ? 'dark' : ''}`}
              style={{
                padding: '6px 12px',
                minHeight: '30px',
                fontSize: '10.5px',
              }}
              onClick={() => setFilterFolder(f)}
            >
              {f === 'all' ? 'ALL FOLDERS' : `${f.toUpperCase()}/`}
            </button>
          ))}
          <input
            type="text"
            placeholder="Filter by R2 key or filename…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              marginLeft: 'auto',
              padding: '7px 14px',
              borderRadius: '999px',
              border: '1px solid var(--line)',
              fontSize: '12px',
              minWidth: '230px',
            }}
          />
        </div>

        {loading ? (
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
            Querying R2 bucket objects…
          </p>
        ) : filteredItems.length === 0 ? (
          <div className="admin-empty-state">
            <p>
              No objects found in folder filter. Upload an image above or switch
              folder filters.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '14px' }}>
            {filteredItems.map((item) => {
              const usageBadges = getUsageBadges(item.cdnUrl);
              const isLocalStream = item.cdnUrl.includes(
                '/api/admin/r2/file/'
              );

              return (
                <div key={item.objectKey} className="admin-item-editor-card">
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '110px 1fr auto',
                      gap: '18px',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        width: '110px',
                        height: '86px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        background: '#e5e0d5',
                      }}
                    >
                      {isLocalStream ? (
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
                          sizes="110px"
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>

                    <div style={{ display: 'grid', gap: '8px' }}>
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span className="admin-type-pill">{item.folder}/</span>
                        <strong style={{ fontSize: '13px' }}>
                          {item.fileName}
                        </strong>
                        <span
                          style={{
                            fontSize: '12px',
                            color: 'var(--muted)',
                          }}
                        >
                          {formatBytes(item.sizeBytes)}
                        </span>
                        {usageBadges.length > 0 ? (
                          usageBadges.map((badge) => (
                            <span
                              key={badge}
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '999px',
                                background: 'rgba(29, 60, 46, 0.12)',
                                color: 'var(--green)',
                              }}
                            >
                              ✓ {badge}
                            </span>
                          ))
                        ) : (
                          <span
                            style={{
                              fontSize: '10.5px',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              background: 'rgba(0,0,0,0.05)',
                              color: 'var(--muted)',
                            }}
                          >
                            Available in R2 Library
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                        }}
                      >
                        <input
                          type="text"
                          value={renameDrafts[item.objectKey] ?? item.objectKey}
                          onChange={(e) =>
                            setRenameDrafts({
                              ...renameDrafts,
                              [item.objectKey]: e.target.value,
                            })
                          }
                          style={{
                            flex: 1,
                            minWidth: '220px',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1px solid var(--line)',
                            fontSize: '12px',
                          }}
                        />
                        <button
                          type="button"
                          className="pill"
                          style={{
                            padding: '6px 12px',
                            minHeight: '32px',
                            fontSize: '10.5px',
                          }}
                          onClick={() => handleRenameObject(item)}
                        >
                          RENAME IN R2
                        </button>
                      </div>

                      {/* Quick Assign to any Website Section */}
                      {cms && onQuickAssignToSite && (
                        <div
                          style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                          }}
                        >
                          <select
                            value={assignSelections[item.objectKey] || ''}
                            onChange={(e) =>
                              setAssignSelections({
                                ...assignSelections,
                                [item.objectKey]: e.target.value,
                              })
                            }
                            style={{
                              flex: 1,
                              minWidth: '220px',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: '1px solid var(--line)',
                              fontSize: '12px',
                              background: 'var(--bg-elev)',
                            }}
                          >
                            <option value="">
                              Assign this R2 image to a website section…
                            </option>
                            <optgroup label="Hero Section (#home)">
                              <option value="hero_add">
                                + Add Slide to Hero 4s Slideshow
                              </option>
                            </optgroup>
                            <optgroup label="Visual Gallery (#gallery)">
                              <option value="gallery_add">
                                + Add as New Gallery Photo
                              </option>
                            </optgroup>
                            <optgroup label="Signature Tours (#packages)">
                              {cms.tours.map((t) => (
                                <option key={t.id} value={`tour:${t.id}`}>
                                  Tour: {t.name}
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="Boutique Stays (#stays)">
                              {cms.stays.map((s) => (
                                <option key={s.id} value={`stay:${s.id}`}>
                                  Stay: {s.name}
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="Destinations (#places)">
                              {cms.destinations.map((d) => (
                                <option
                                  key={d.id}
                                  value={`destination:${d.id}`}
                                >
                                  Destination: {d.name}
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="Tourist Thoughts (#why)">
                              {cms.reviews.map((r) => (
                                <option key={r.id} value={`review:${r.id}`}>
                                  Guest Card: {r.name}
                                </option>
                              ))}
                            </optgroup>
                          </select>
                          <button
                            type="button"
                            className="pill dark"
                            style={{
                              padding: '6px 12px',
                              minHeight: '32px',
                              fontSize: '10.5px',
                            }}
                            disabled={!assignSelections[item.objectKey]}
                            onClick={() => handleQuickAssign(item)}
                          >
                            ASSIGN &amp; SAVE TO SITE
                          </button>
                        </div>
                      )}

                      <code
                        style={{
                          fontSize: '11px',
                          color: 'var(--muted)',
                          wordBreak: 'break-all',
                        }}
                      >
                        CDN Link: {item.cdnUrl}
                      </code>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
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
                          navigator.clipboard?.writeText(item.cdnUrl);
                          setBanner(`Copied R2 CDN URL: ${item.cdnUrl}`);
                        }}
                      >
                        COPY CDN URL
                      </button>
                      <button
                        type="button"
                        className="pill"
                        style={{
                          padding: '6px 12px',
                          minHeight: '32px',
                          fontSize: '10.5px',
                        }}
                        onClick={() => handleDeleteObject(item)}
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
