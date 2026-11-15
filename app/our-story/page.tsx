'use client';

import React from 'react';
import Link from 'next/link';
import PageBanner from '@/components/PageBanner';
import StorySection from '@/components/StorySection';
import { useSiteCms } from '@/hooks/useSiteCms';

export default function OurStoryPage() {
  const { cms } = useSiteCms();
  const pageContent = cms.pages.ourStoryPage;

  const identityCards = pageContent.identitySection.cards || [];
  const coreValues = pageContent.valuesSection.coreValues || [];
  const leadershipValues =
    pageContent.founderSection.leadershipValues || [];
  const growthRoadmap = pageContent.roadmapSection.stages || [];

  return (
    <main>
      <PageBanner
        eyebrow={pageContent.banner.eyebrow}
        title={pageContent.banner.title}
      />

      {/* Section 01: Origin Story in Thalangama South, Battaramulla */}
      <StorySection />

      {/* Section 02 & 04: Company Identity & Our Home Base in Battaramulla */}
      <section className="section wrap" style={{ paddingTop: '20px' }}>
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              {pageContent.identitySection.eyebrow}
            </div>
            <h2 className="serif">
              {pageContent.identitySection.headingPrefix}{' '}
              <em style={{ color: 'var(--terracotta)' }}>
                {pageContent.identitySection.headingItalic}
              </em>
            </h2>
          </div>
          <p>{pageContent.identitySection.description}</p>
        </div>

        <div
          className="values-grid"
          style={{
            marginBottom: '56px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          }}
        >
          {identityCards.map((card) => (
            <div
              key={card.id}
              className="value"
              style={{ borderTopColor: '#c8dbe2' }}
            >
              <span
                className="number"
                style={{ color: 'var(--terracotta)', fontWeight: 700 }}
              >
                {card.kicker}
              </span>
              <h3
                className="serif"
                style={{
                  color: 'var(--ink)',
                  fontSize: '26px',
                  margin: '12px 0 10px',
                }}
              >
                {card.title}
              </h3>
              <p style={{ color: '#557180', lineHeight: 1.8 }}>
                {card.description}
              </p>
            </div>
          ))}
        </div>

        {/* Section 05: Vision, Mission & Six Core Values */}
        <div className="section-head" style={{ marginTop: '20px' }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              {pageContent.valuesSection.eyebrow}
            </div>
            <h2 className="serif">
              {pageContent.valuesSection.headingPrefix}{' '}
              <em style={{ color: 'var(--terracotta)' }}>
                {pageContent.valuesSection.headingItalic}
              </em>
            </h2>
          </div>
          <div>
            <p style={{ marginBottom: '10px' }}>
              <strong>{pageContent.valuesSection.visionLabel}</strong>{' '}
              {pageContent.valuesSection.visionText}
            </p>
            <p>
              <strong>{pageContent.valuesSection.missionLabel}</strong>{' '}
              {pageContent.valuesSection.missionText}
            </p>
          </div>
        </div>

        <div className="values-grid" style={{ marginBottom: '60px' }}>
          {coreValues.map((v) => (
            <div
              key={v.id || v.number}
              className="value"
              style={{ borderTopColor: '#c8dbe2' }}
            >
              <span
                className="number"
                style={{ color: 'var(--terracotta)', fontWeight: 700 }}
              >
                {v.number} / CORE VALUE
              </span>
              <h3
                className="serif"
                style={{
                  color: 'var(--ink)',
                  fontSize: '26px',
                  margin: '12px 0 10px',
                }}
              >
                {v.title}
              </h3>
              <p style={{ color: '#557180', lineHeight: 1.8 }}>{v.desc}</p>
            </div>
          ))}
        </div>

        {/* Section 03: Founder & Leadership + Section 18: Our Promise */}
        <div className="founder-quote-card" style={{ marginBottom: '60px' }}>
          <div>
            <span className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              {pageContent.founderSection.eyebrow}
            </span>
            <h3
              className="serif"
              style={{
                fontSize: 'clamp(24px, 2.6vw, 34px)',
                lineHeight: 1.3,
                color: 'var(--ink)',
                margin: '12px 0 16px',
              }}
            >
              {pageContent.founderSection.founderName}
            </h3>
            <p
              style={{
                color: '#536f7e',
                lineHeight: 1.8,
                marginBottom: '14px',
              }}
            >
              {pageContent.founderSection.credentialsLine}
            </p>
            <p
              style={{
                color: '#536f7e',
                lineHeight: 1.8,
                marginBottom: '16px',
              }}
            >
              {pageContent.founderSection.bioParagraph}
            </p>
            <blockquote
              className="serif"
              style={{
                fontSize: 'clamp(19px, 2vw, 24px)',
                lineHeight: 1.45,
                color: 'var(--ink)',
                margin: '18px 0 22px',
                paddingLeft: '16px',
                borderLeft: '3px solid var(--terracotta)',
              }}
            >
              {pageContent.founderSection.quote}
            </blockquote>
            <Link
              href={pageContent.founderSection.ctaHref || '/contact'}
              prefetch={false}
              className="pill dark"
            >
              {pageContent.founderSection.ctaLabel}
            </Link>
          </div>

          <div className="founder-glance-box">
            <h4
              className="serif"
              style={{
                fontSize: '22px',
                margin: '0 0 12px',
                color: 'var(--ink)',
              }}
            >
              {pageContent.founderSection.glanceHeading}
            </h4>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'grid',
                gap: '10px',
                fontSize: '13px',
                color: '#3d5c6b',
              }}
            >
              {leadershipValues.map((lv) => (
                <li key={lv.id || lv.title}>
                  ✳ <strong>{lv.title}:</strong> {lv.desc}
                </li>
              ))}
              <li>
                ✳ <strong>Primary Markets:</strong>{' '}
                {pageContent.founderSection.primaryMarketsText}
              </li>
              <li>
                ✳ <strong>Support:</strong>{' '}
                {pageContent.founderSection.supportText}
              </li>
            </ul>
          </div>
        </div>

        {/* Section 17: Looking Ahead — Realistic Growth Roadmap */}
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              {pageContent.roadmapSection.eyebrow}
            </div>
            <h2 className="serif">
              {pageContent.roadmapSection.headingPrefix}{' '}
              <em style={{ color: 'var(--terracotta)' }}>
                {pageContent.roadmapSection.headingItalic}
              </em>
            </h2>
          </div>
          <p>{pageContent.roadmapSection.description}</p>
        </div>

        <div className="values-grid">
          {growthRoadmap.map((step) => (
            <div
              key={step.id || step.stage}
              className="value"
              style={{ borderTopColor: '#c8dbe2' }}
            >
              <span
                className="number"
                style={{ color: 'var(--terracotta)', fontWeight: 700 }}
              >
                {step.stage}
              </span>
              <h3
                className="serif"
                style={{
                  color: 'var(--ink)',
                  fontSize: '26px',
                  margin: '12px 0 10px',
                }}
              >
                {step.title}
              </h3>
              <p style={{ color: '#557180', lineHeight: 1.8 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
