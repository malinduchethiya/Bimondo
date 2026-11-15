'use client';

import React from 'react';
import PageBanner from '@/components/PageBanner';
import ContactSection from '@/components/ContactSection';
import FaqSection from '@/components/FaqSection';
import { useSiteCms } from '@/hooks/useSiteCms';

export default function ContactPage() {
  const { cms } = useSiteCms();
  const pageContent = cms.pages.contactPage;
  const companyDetails = pageContent.detailsSection.items || [];

  return (
    <main>
      <PageBanner
        eyebrow={pageContent.banner.eyebrow}
        title={pageContent.banner.title}
      />
      <ContactSection />

      {/* Section 19: Official Company Details Reference Table */}
      <section className="section wrap" style={{ paddingTop: '10px' }}>
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              {pageContent.detailsSection.eyebrow}
            </div>
            <h2 className="serif">
              {pageContent.detailsSection.headingPrefix}{' '}
              <em style={{ color: 'var(--terracotta)' }}>
                {pageContent.detailsSection.headingItalic}
              </em>
            </h2>
          </div>
          <p>{pageContent.detailsSection.description}</p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '14px',
            marginTop: '16px',
          }}
        >
          {companyDetails.map((item) => (
            <div
              key={item.id || item.label}
              style={{
                padding: '16px 20px',
                borderRadius: '14px',
                border: '1px solid var(--line)',
                background: 'rgba(255, 255, 255, 0.78)',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--terracotta)',
                  marginBottom: '6px',
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  lineHeight: 1.5,
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      <FaqSection />
    </main>
  );
}
