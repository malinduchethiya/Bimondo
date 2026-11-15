'use client';

import React, { useState } from 'react';
import Image from 'next/image';
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

function isDirectR2OrCustomDomainUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('/images/')) return false;
  if (url.includes('images.unsplash.com') || url.includes('picsum.photos')) {
    return false;
  }
  return true;
}

/**
 * Renders an image in its assigned website section directly from the Cloudflare R2 domain
 * link saved in Firestore (while keeping Next.js <Image> for local/stock assets).
 */
export default function CmsImage({
  src,
  alt,
  fill = true,
  sizes = '100vw',
  priority = false,
  className = 'object-cover',
  fallbackSrc,
}: CmsImageProps) {
  const { cms } = useSiteCms();
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const primaryResolved = resolveCmsImageUrl(
    src,
    cms.general.r2PublicCdnUrl
  );
  const effectiveSrc =
    failedSrc === primaryResolved && fallbackSrc
      ? fallbackSrc
      : primaryResolved || fallbackSrc || '/images/hero-vibrant-srilanka.jpg';

  // Serve R2 domain URLs directly from Cloudflare R2 edge without /_next/image rewriting
  if (isDirectR2OrCustomDomainUrl(effectiveSrc)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={effectiveSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => {
          if (failedSrc !== primaryResolved) {
            setFailedSrc(primaryResolved);
          }
        }}
        className={`${
          fill ? 'absolute inset-0 w-full h-full' : ''
        } ${className}`.trim()}
      />
    );
  }

  return (
    <Image
      src={effectiveSrc}
      alt={alt}
      fill={fill}
      sizes={sizes}
      priority={priority}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => {
        if (failedSrc !== primaryResolved) {
          setFailedSrc(primaryResolved);
        }
      }}
    />
  );
}
