'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSiteCms } from '@/hooks/useSiteCms';

export default function FaqSection() {
  const { cms } = useSiteCms();
  const faqSection = cms.pages.contactPage.faqSection;
  const items = faqSection.items || [];
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section className="section faq-section" id="faq">
      <div className="wrap faq-grid">
        <div className="faq-intro">
          <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
            {faqSection.eyebrow}
          </div>
          <h2 className="big-heading serif">
            {faqSection.headingLine1}
            <br />
            <em style={{ color: 'var(--terracotta)' }}>
              {faqSection.headingItalic}
            </em>
          </h2>
          <p className="faq-lead">{faqSection.lead}</p>
          <div className="faq-cta-box">
            <span>{faqSection.ctaPrompt}</span>
            <Link
              className="pill dark"
              href={faqSection.ctaHref || '/contact'}
              prefetch={false}
            >
              {faqSection.ctaLabel}
            </Link>
          </div>
        </div>

        <div className="faq-list">
          {items.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={item.id || idx}
                className={`faq-item ${isOpen ? 'open' : ''}`}
              >
                <button
                  type="button"
                  className="faq-question-btn"
                  aria-expanded={isOpen}
                  onClick={() => toggleFaq(idx)}
                >
                  <div className="faq-question-left">
                    <span className="faq-num">
                      0{idx + 1} / {item.category}
                    </span>
                    <h3 className="serif faq-question-title">
                      {item.question}
                    </h3>
                  </div>
                  <span className="faq-icon" aria-hidden="true">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>

                <div
                  className="faq-answer-wrap"
                  style={{
                    maxHeight: isOpen ? '320px' : '0px',
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <p className="faq-answer-text">{item.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
