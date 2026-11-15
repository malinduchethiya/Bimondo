'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSiteCms } from '@/hooks/useSiteCms';

export default function PlanningSection() {
  const { cms } = useSiteCms();
  const planningFaq = cms.pages.home.planningFaq;

  const visibleFaqs = Array.isArray(cms.faqs)
    ? [...cms.faqs]
        .filter((f) => f.visible !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : [];

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openId, setOpenId] = useState<string | null>(
    visibleFaqs[0]?.id || 'who-is-bimondo'
  );

  if (planningFaq.visible === false) {
    return null;
  }

  const filteredFaqs = (
    activeCategory === 'all'
      ? visibleFaqs
      : visibleFaqs.filter((item) => item.category === activeCategory)
  ).slice(0, 6);

  const toggleFAQ = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const faqCategories = [
    { id: 'all', label: planningFaq.categoryLabels?.all ?? 'All FAQs' },
    {
      id: 'private',
      label: planningFaq.categoryLabels?.private ?? 'Private Journeys',
    },
    {
      id: 'stays',
      label: planningFaq.categoryLabels?.stays ?? 'Stays & Guides',
    },
    {
      id: 'booking',
      label: planningFaq.categoryLabels?.booking ?? 'Seasons & Booking',
    },
  ];

  return (
    <section className="section planning-faq-wrapper" id="planning-faq">
      <div className="wrap planning-faq-grid">
        <div className="planning-top-split">
          <div className="planning-intro-col">
            <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              {planningFaq.eyebrow}
            </div>
            <h2 className="big-heading serif">
              {planningFaq.headingLine1}
              <br />
              <em style={{ color: 'var(--terracotta)' }}>
                {planningFaq.headingItalic}
              </em>
            </h2>
            <p className="planning-intro-lead">{planningFaq.lead}</p>

            <div className="planning-steps-compact-grid">
              {(planningFaq.steps || []).map((step) => (
                <div key={step.id || step.num} className="planning-step-chip">
                  <div className="planning-step-chip-head">
                    <span className="planning-step-num">{step.num}</span>
                    <strong className="planning-step-title">
                      {step.title}
                    </strong>
                  </div>
                  <p className="planning-step-desc">{step.desc}</p>
                </div>
              ))}
              <Link
                className="planning-step-cta-card"
                href={planningFaq.stepCtaHref || '/contact'}
                prefetch={false}
              >
                <span>{planningFaq.stepCtaKicker}</span>
                <strong>{planningFaq.stepCtaLabel}</strong>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Clean Pill-Filtered FAQ Card */}
        <div className="minimal-faq-block" id="faq">
          <div style={{ marginBottom: '16px' }}>
            <span
              className="eyebrow"
              style={{
                color: 'var(--terracotta)',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              {planningFaq.faqEyebrow}
            </span>
            <h3
              className="serif"
              style={{
                fontSize: 'clamp(22px, 2.4vw, 30px)',
                margin: 0,
                color: 'var(--ink)',
              }}
            >
              {planningFaq.faqHeading}
            </h3>
          </div>

          <div
            className="minimal-faq-pills"
            role="tablist"
            aria-label="FAQ Categories"
          >
            {faqCategories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`minimal-faq-pill ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="minimal-faq-list">
            {filteredFaqs.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div
                  key={item.id}
                  className={`minimal-faq-row ${isOpen ? 'is-open' : ''}`}
                >
                  <button
                    type="button"
                    className="minimal-faq-trigger"
                    onClick={() => toggleFAQ(item.id)}
                    aria-expanded={isOpen}
                  >
                    <span className="minimal-faq-question">{item.q}</span>
                    <span className="minimal-faq-plus" aria-hidden="true">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  <div
                    className="minimal-faq-panel"
                    style={{
                      maxHeight: isOpen ? '240px' : '0px',
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <p className="minimal-faq-answer">{item.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
