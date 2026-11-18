'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  FolderOpen,
  ImagePlus,
  Loader2,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  CmsGalleryPhoto,
  SiteCmsData,
  createImageRef,
} from '@/lib/cms-defaults';
import {
  R2ClientUploadError,
  uploadImageToR2Worker,
} from '@/lib/r2-upload-client';

export type GalleryCategoryId = 'culture' | 'highlands' | 'wildlife' | 'coast';

export const GALLERY_CATEGORIES: {
  id: GalleryCategoryId;
  label: string;
}[] = [
  { id: 'culture', label: 'Culture & Heritage' },
  { id: 'highlands', label: 'Hill Country & Hiking' },
  { id: 'wildlife', label: 'Wildlife & Nature' },
  { id: 'coast', label: 'Sea & Sand' },
];

export function getGalleryCategoryLabel(category: string): string {
  const match = GALLERY_CATEGORIES.find((c) => c.id === category);
  return match ? match.label : 'Culture & Heritage';
}

function titleFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
  if (!base) return '';
  return base.replace(/\b\w/g, (ch) => ch.toUpperCase());
}

interface AdminGalleryStudioProps {
  draft: SiteCmsData;
  currentAdminUid: string;
  isSaving: boolean;
  isAnyUploadInProgress: boolean;
  getAdminIdToken: () => Promise<string>;
  onMutateDraft: (mutator: (prev: SiteCmsData) => SiteCmsData) => void;
  onOpenMediaLibrary: (
    preferredFolder: string,
    onPicked: (asset: { key: string; url: string }) => void
  ) => void;
  onUploadStart: (fieldId: string) => void;
  onUploadEnd: (fieldId: string) => void;
  onNotify: (type: 'info' | 'error', message: string) => void;
}

export default function AdminGalleryStudio({
  draft,
  currentAdminUid,
  isSaving,
  isAnyUploadInProgress,
  getAdminIdToken,
  onMutateDraft,
  onOpenMediaLibrary,
  onUploadStart,
  onUploadEnd,
  onNotify,
}: AdminGalleryStudioProps) {
  const [activeCategory, setActiveCategory] =
    useState<GalleryCategoryId>('culture');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activePhotos = useMemo(
    () =>
      [...(draft.gallery || [])]
        .filter((p) => !p.deletedAt)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [draft.gallery]
  );

  const countsByCategory = useMemo(() => {
    const counts: Record<GalleryCategoryId, number> = {
      culture: 0,
      highlands: 0,
      wildlife: 0,
      coast: 0,
    };
    for (const p of activePhotos) {
      const cat =
        p.category === 'highlands' ||
        p.category === 'wildlife' ||
        p.category === 'coast'
          ? p.category
          : 'culture';
      counts[cat] += 1;
    }
    return counts;
  }, [activePhotos]);

  const categoryPhotos = useMemo(
    () =>
      activePhotos.filter((p) => {
        const cat =
          p.category === 'highlands' ||
          p.category === 'wildlife' ||
          p.category === 'coast'
            ? p.category
            : 'culture';
        return cat === activeCategory;
      }),
    [activePhotos, activeCategory]
  );

  const appendUploadedPhotos = (
    entries: {
      url: string;
      key: string | null;
      title: string;
      category: GalleryCategoryId;
    }[]
  ) => {
    if (entries.length === 0) return;
    onMutateDraft((prev) => {
      const existing = [...(prev.gallery || [])];
      const maxOrder = existing.reduce(
        (max, item) => Math.max(max, item.order ?? 0),
        0
      );
      const baseTime = Date.now();
      const added: CmsGalleryPhoto[] = entries.map((entry, idx) => ({
        id: `gallery-${baseTime}-${idx}`,
        title: entry.title,
        location: '',
        category: entry.category,
        categoryLabel: getGalleryCategoryLabel(entry.category),
        image: entry.url,
        imageRef: createImageRef(entry.url, entry.title, entry.key),
        description: '',
        visible: true,
        order: maxOrder + idx + 1,
        deletedAt: null,
        deletedBy: null,
      }));
      return {
        ...prev,
        gallery: [...existing, ...added],
      };
    });
  };

  const handleFilesSelected = async (fileList: FileList | File[] | null) => {
    const files = fileList ? Array.from(fileList) : [];
    if (files.length === 0) return;

    setUploadError(null);
    const targetCategory = activeCategory;
    const uploadLockId = `gallery-batch-${Date.now()}`;
    onUploadStart(uploadLockId);
    setUploadProgress({ done: 0, total: files.length });

    const uploadedEntries: {
      url: string;
      key: string | null;
      title: string;
      category: GalleryCategoryId;
    }[] = [];
    const errors: string[] = [];

    try {
      const idToken = await getAdminIdToken();

      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        try {
          const uploaded = await uploadImageToR2Worker({
            file,
            folder: 'gallery/featured',
            idToken,
          });
          uploadedEntries.push({
            url: uploaded.url,
            key: uploaded.key,
            title: titleFromFilename(file.name),
            category: targetCategory,
          });
        } catch (err) {
          const msg =
            err instanceof R2ClientUploadError || err instanceof Error
              ? err.message
              : 'Upload failed.';
          errors.push(`${file.name}: ${msg}`);
        }
        setUploadProgress({ done: i + 1, total: files.length });
      }

      if (uploadedEntries.length > 0) {
        appendUploadedPhotos(uploadedEntries);
        onNotify(
          'info',
          `Uploaded ${uploadedEntries.length} image(s) to ${getGalleryCategoryLabel(
            targetCategory
          )}. Click "Save Changes" to publish.`
        );
      }

      if (errors.length > 0) {
        setUploadError(errors.join(' | '));
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Unable to authenticate upload.';
      setUploadError(msg);
      onNotify('error', msg);
    } finally {
      setUploadProgress(null);
      onUploadEnd(uploadLockId);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePickFromLibrary = () => {
    const targetCategory = activeCategory;
    onOpenMediaLibrary('gallery/featured', (asset) => {
      const filename = asset.key.split('/').pop() || '';
      appendUploadedPhotos([
        {
          url: asset.url,
          key: asset.key,
          title: titleFromFilename(filename),
          category: targetCategory,
        },
      ]);
      onNotify(
        'info',
        `Added image to ${getGalleryCategoryLabel(
          targetCategory
        )}. Click "Save Changes" to publish.`
      );
    });
  };

  const updatePhotoById = (
    photoId: string,
    updater: (photo: CmsGalleryPhoto) => CmsGalleryPhoto
  ) => {
    onMutateDraft((prev) => ({
      ...prev,
      gallery: (prev.gallery || []).map((p) =>
        p.id === photoId ? updater(p) : p
      ),
    }));
  };

  const movePhotoInCategory = (photoId: string, direction: 'prev' | 'next') => {
    const idx = categoryPhotos.findIndex((p) => p.id === photoId);
    if (idx === -1) return;
    const swapIdx = direction === 'prev' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categoryPhotos.length) return;

    const current = categoryPhotos[idx];
    const target = categoryPhotos[swapIdx];
    const currentOrder = current.order ?? idx + 1;
    const targetOrder = target.order ?? swapIdx + 1;

    onMutateDraft((prev) => ({
      ...prev,
      gallery: (prev.gallery || []).map((p) => {
        if (p.id === current.id) {
          return {
            ...p,
            order: currentOrder === targetOrder ? swapIdx + 1 : targetOrder,
          };
        }
        if (p.id === target.id) {
          return {
            ...p,
            order: currentOrder === targetOrder ? idx + 1 : currentOrder,
          };
        }
        return p;
      }),
    }));
  };

  const softDeletePhoto = (photoId: string) => {
    const now = new Date().toISOString();
    onMutateDraft((prev) => ({
      ...prev,
      gallery: (prev.gallery || []).map((p) =>
        p.id === photoId
          ? { ...p, deletedAt: now, deletedBy: currentAdminUid }
          : p
      ),
    }));
  };

  const isUploadingBatch = uploadProgress !== null;

  return (
    <div className="space-y-4">
      {/* Category Selector */}
      <div className="bg-white border border-slate-200 rounded-md p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {GALLERY_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[11px] tabular-nums ${
                    isActive ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  ({countsByCategory[cat.id]})
                </span>
              </button>
            );
          })}
        </div>

        <span className="text-xs text-slate-500 tabular-nums">
          Total: {activePhotos.length} photos
        </span>
      </div>

      {/* Quick Multi-Image Upload Bar */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!isUploadingBatch && !isSaving) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (!isUploadingBatch && !isSaving) {
            void handleFilesSelected(e.dataTransfer.files);
          }
        }}
        className={`bg-white border-2 border-dashed rounded-md p-5 transition-colors ${
          isDragging
            ? 'border-slate-900 bg-slate-50'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => void handleFilesSelected(e.target.files)}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center shrink-0 text-slate-700">
              {isUploadingBatch ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ImagePlus className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-slate-900">
                Upload to {getGalleryCategoryLabel(activeCategory)}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isUploadingBatch
                  ? `Uploading ${uploadProgress.done} of ${uploadProgress.total} image(s)...`
                  : 'Select or drop one or multiple images. Added directly to the 4-column category grid.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isUploadingBatch || isSaving || isAnyUploadInProgress}
              onClick={() => fileInputRef.current?.click()}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-md transition-colors ${
                isUploadingBatch || isSaving || isAnyUploadInProgress
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-900 text-white hover:bg-slate-800 cursor-pointer'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Photos
            </button>

            <button
              type="button"
              disabled={isUploadingBatch || isSaving}
              onClick={handlePickFromLibrary}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Media Library
            </button>
          </div>
        </div>

        {uploadError && (
          <div className="mt-3 flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-800">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* 4-Column Thumbnail Grid */}
      {categoryPhotos.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-md p-8 text-center text-xs text-slate-500">
          No photos in {getGalleryCategoryLabel(activeCategory)} yet. Use Upload
          Photos or Media Library above to add images.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {categoryPhotos.map((photo, idx) => {
            const imgUrl = (photo.imageRef?.url || photo.image || '').trim();
            const isHidden = photo.visible === false;

            return (
              <div
                key={photo.id}
                className={`bg-white border rounded-md overflow-hidden flex flex-col ${
                  isHidden
                    ? 'border-amber-300 opacity-75'
                    : 'border-slate-200'
                }`}
              >
                <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                  {imgUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imgUrl}
                      alt={photo.title || 'Gallery photo'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[11px] text-slate-400">
                      No image
                    </div>
                  )}

                  {/* Minimal Top Controls */}
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => movePhotoInCategory(photo.id, 'prev')}
                      title="Move earlier"
                      className={`p-1 rounded bg-white/90 text-slate-700 shadow-xs transition-colors ${
                        idx === 0
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:bg-white cursor-pointer'
                      }`}
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === categoryPhotos.length - 1}
                      onClick={() => movePhotoInCategory(photo.id, 'next')}
                      title="Move later"
                      className={`p-1 rounded bg-white/90 text-slate-700 shadow-xs transition-colors ${
                        idx === categoryPhotos.length - 1
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:bg-white cursor-pointer'
                      }`}
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updatePhotoById(photo.id, (p) => ({
                          ...p,
                          visible: p.visible === false,
                        }))
                      }
                      title={isHidden ? 'Show on site' : 'Hide on site'}
                      className={`p-1 rounded shadow-xs transition-colors cursor-pointer ${
                        isHidden
                          ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          : 'bg-white/90 text-slate-700 hover:bg-white'
                      }`}
                    >
                      {isHidden ? (
                        <EyeOff className="w-3 h-3" />
                      ) : (
                        <Eye className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => softDeletePhoto(photo.id)}
                      title="Move to Trash"
                      className="p-1 rounded bg-white/90 text-red-600 hover:bg-red-50 shadow-xs transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Minimal Optional Caption & Quick Category Switch */}
                <div className="p-2 space-y-1.5 border-t border-slate-100">
                  <input
                    type="text"
                    value={photo.title || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      updatePhotoById(photo.id, (p) => ({
                        ...p,
                        title: val,
                        imageRef: createImageRef(
                          p.imageRef?.url || p.image || '',
                          val,
                          p.imageRef?.key ?? null
                        ),
                      }));
                    }}
                    placeholder="Optional caption"
                    className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-400"
                  />

                  <select
                    aria-label="Category"
                    value={
                      photo.category === 'highlands' ||
                      photo.category === 'wildlife' ||
                      photo.category === 'coast'
                        ? photo.category
                        : 'culture'
                    }
                    onChange={(e) => {
                      const nextCat = e.target.value as GalleryCategoryId;
                      updatePhotoById(photo.id, (p) => ({
                        ...p,
                        category: nextCat,
                        categoryLabel: getGalleryCategoryLabel(nextCat),
                      }));
                    }}
                    className="w-full px-2 py-1 text-[11px] bg-white border border-slate-200 rounded text-slate-600 focus:outline-none focus:border-slate-400"
                  >
                    {GALLERY_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
