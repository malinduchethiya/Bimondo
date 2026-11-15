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
  className?: string;
  fallbackSrc?: string;
}

/**
 * Renders an image when a valid URL is configured in the content model,
 * or a clean minimal placeholder surface when empty or failed to load.
 */
export default function CmsImage({
  src,
  imageRef,
  alt,
  fill = true,
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

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={rawUrl}
      alt={resolvedAlt}
      referrerPolicy="no-referrer"
      onError={() => setFailedUrl(rawUrl)}
      className={`${
        fill ? 'absolute inset-0 w-full h-full' : 'w-full h-full'
      } ${className}`.trim()}
    />
  );
}
