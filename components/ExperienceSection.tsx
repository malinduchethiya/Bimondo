'use client';

import React from 'react';
import Link from 'next/link';
import { useSiteCms } from '@/hooks/useSiteCms';
import CmsImage from '@/components/CmsImage';

export default function ExperienceSection() {
  const { cms } = useSiteCms();
  const expSection = cms.pages.home.experience;

  if (expSection.visible === false) {
    return null;
  }

  const experiences = expSection.items || [];

  return (
    <section className="section experience" id="discover">
      <div className="wrap">
        <div className="experience-grid">
          <div>
            <div className="eyebrow">{expSection.eyebrow}</div>
            <h2 className="serif">
              {expSection.headingLine1}
              <br />
              {expSection.headingLine2Prefix}{' '}
              <em>{expSection.headingItalic}</em>
              <br />
              {expSection.headingLine3}
            </h2>
            <p>{expSection.description}</p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link
                className="pill dark"
                href={expSection.primaryCtaHref || '/packages'}
                prefetch={false}
              >
                {expSection.primaryCtaLabel}
              </Link>
              <Link
                className="pill"
                href={expSection.secondaryCtaHref || '/contact'}
                prefetch={false}
              >
                {expSection.secondaryCtaLabel}
              </Link>
            </div>
          </div>

          <div className="experience-photo" style={{ position: 'relative' }}>
            <CmsImage
              imageRef={expSection.featureImage}
              src={expSection.featureImage?.url}
              alt={
                expSection.featureImage?.alt ||
                'Sri Lanka coastal and highland landscapes'
              }
              fill
              sizes="(max-width: 720px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="experiences">
          {experiences.map((exp) => (
            <div key={exp.id || exp.num} className="exp">
              <span>✺ {exp.num}</span>
              <b>{exp.title}</b>
              <span>{exp.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
