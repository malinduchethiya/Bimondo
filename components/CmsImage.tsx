'use client';

import React, { useState } from 'react';
import { useSiteCms } from '@/hooks/useSiteCms';
import { resolveCmsImageUrl } from '@/lib/r2-client';

interface CmsImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
  fallbackSrc?: string;
}

/**
 * Renders an image directly from the Cloudflare R2 domain URL saved in Firestore.
 * Never falls back to mock or stock images. If no R2 image is assigned yet, renders a clean neutral surface.
 */
export default function CmsImage({
  src,
  alt,
  fill = true,
  priority = false,
  className = 'object-cover',
}: CmsImageProps) {
  const { cms } = useSiteCms();
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const resolvedUrl = resolveCmsImageUrl(src, cms.general.r2PublicCdnUrl);

  if (!resolvedUrl || failedSrc === resolvedUrl) {
    return (
      <div
        aria-label={alt}
        className={`${
          fill ? 'absolute inset-0 w-full h-full' : 'w-full h-full'
        } bg-stone-200/70 ${className}`.trim()}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolvedUrl}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        if (failedSrc !== resolvedUrl) {
          setFailedSrc(resolvedUrl);
        }
      }}
      className={`${
        fill ? 'absolute inset-0 w-full h-full' : ''
      } ${className}`.trim()}
    />
  );
}
