'use client';

import React from 'react';
import Link from 'next/link';
import { useSiteCms } from '@/hooks/useSiteCms';
import CmsImage from '@/components/CmsImage';

export default function StorySection() {
  const { cms } = useSiteCms();
  const story = cms.pages.home.story;

  if (story.visible === false) {
    return null;
  }

  return (
    <section className="section wrap story" id="story">
      <div className="story-images">
        <div className="main" style={{ position: 'relative' }}>
          <CmsImage
            imageRef={story.mainImage}
            src={story.mainImage?.url}
            alt={story.mainImage?.alt || 'Our Story in Sri Lanka'}
            fill
            sizes="(max-width: 720px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </div>
        <div className="small">
          <CmsImage
            imageRef={story.secondaryImage}
            src={story.secondaryImage?.url}
            alt={
              story.secondaryImage?.alt ||
              'Living cultural traditions of Sri Lanka'
            }
            fill
            sizes="(max-width: 720px) 50vw, 25vw"
            className="object-cover"
          />
        </div>
      </div>

      <div>
        <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
          {story.eyebrow}
        </div>
        <h2 className="big-heading serif">
          {story.headingLine1}
          <br />
          {story.headingLine2}
          <br />
          <em style={{ color: 'var(--terracotta)' }}>{story.headingItalic}</em>
        </h2>
        <p>{story.paragraph1}</p>
        <p style={{ marginTop: '12px' }}>{story.paragraph2}</p>
        <div className="quote">{story.quote}</div>
        <Link
          className="pill"
          href={story.ctaHref || '/our-story'}
          prefetch={false}
        >
          {story.ctaLabel}
        </Link>
      </div>
    </section>
  );
}
