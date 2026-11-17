'use client';

import React, { useState } from 'react';
import { CmsImageRef } from '@/lib/cms-defaults';
import { isForbiddenImageUrl } from '@/lib/content-repository';

interface CmsImageProps {
  src?: string;
  imageRef?: CmsImageRef;
  alt: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  fetchPriority?: 'high' | 'low' | 'auto';
  className?: string;
  fallbackSrc?: string;
}

/**
 * Renders an image when a valid URL is configured in the content model,
 * or a clean minimal placeholder surface when empty or failed to load.
 * Uses asynchronous off-thread decoding and pre-decodes on load so scrolling
 * into image sections never triggers synchronous rasterization freezes.
 */
export default function CmsImage({
  src,
  imageRef,
  alt,
  fill = true,
  sizes,
  priority = false,
  loading,
  decoding,
  fetchPriority,
  className = 'object-cover',
}: CmsImageProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const rawUrl = (imageRef?.url || src || '').trim();
  const resolvedAlt = (imageRef?.alt || alt || '').trim() || 'Image';
  const canRenderImg =
    rawUrl.length > 0 &&
    !isForbiddenImageUrl(rawUrl) &&
    failedUrl !== rawUrl;

  if (!canRenderImg) {
    return (
      <div
        aria-label={resolvedAlt}
        className={`${
          fill ? 'absolute inset-0 w-full h-full' : 'w-full h-full'
        } bg-stone-200/60 ${className}`.trim()}
      />
    );
  }

  const resolvedLoading = loading ?? 'eager';
  const resolvedDecoding = decoding ?? 'async';
  const resolvedFetchPriority =
    fetchPriority ?? (priority ? 'high' : 'low');

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={rawUrl}
      alt={resolvedAlt}
      sizes={sizes}
      loading={resolvedLoading}
      decoding={resolvedDecoding}
      fetchPriority={resolvedFetchPriority}
      referrerPolicy="no-referrer"
      onLoad={(e) => {
        const target = e.currentTarget;
        if (typeof target.decode === 'function') {
          target.decode().catch(() => {});
        }
      }}
      onError={() => setFailedUrl(rawUrl)}
      className={`${
        fill ? 'absolute inset-0 w-full h-full' : 'w-full h-full'
      } ${className}`.trim()}
    />
  );
}
