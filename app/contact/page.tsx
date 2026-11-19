'use client';

import React from 'react';
import PageBanner from '@/components/PageBanner';
import ContactSection from '@/components/ContactSection';
import FaqSection from '@/components/FaqSection';
import { useSiteCms } from '@/hooks/useSiteCms';
import { trackWhatsAppClick } from '@/lib/analytics';

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
          {companyDetails.map((item) => {
            const labelLower = (item.label || '').toLowerCase();
            let renderedValue: React.ReactNode = item.value;
            if (labelLower.includes('phone') || labelLower.includes('whatsapp')) {
              renderedValue = (
                <span>
                  <a
                    href="tel:+94762232054"
                    style={{ textDecoration: 'underline', marginRight: '10px' }}
                  >
                    {item.value}
                  </a>
                  <a
                    href="https://wa.me/94762232054"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackWhatsAppClick('contact_page_details')}
                    style={{
                      fontSize: '12px',
                      color: 'var(--terracotta)',
                      fontWeight: 700,
                    }}
                  >
                    WhatsApp ↗
                  </a>
                </span>
              );
            } else if (labelLower.includes('email')) {
              renderedValue = (
                <a
                  href={`mailto:${item.value}`}
                  style={{ textDecoration: 'underline' }}
                >
                  {item.value}
                </a>
              );
            } else if (labelLower.includes('website')) {
              renderedValue = (
                <a
                  href="https://www.bimondotours.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'underline' }}
                >
                  {item.value}
                </a>
              );
            } else if (labelLower.includes('instagram')) {
              renderedValue = (
                <a
                  href="https://www.instagram.com/bimondo.tours/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'underline' }}
                >
                  {item.value}
                </a>
              );
            }

            return (
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
                  {renderedValue}
                </div>
              </div>
            );
          })}
        </div>

        {/* Section 12: Digital Services & Online Support */}
        <div
          style={{
            marginTop: '36px',
            padding: '24px 28px',
            borderRadius: '18px',
            border: '1px solid var(--line)',
            background: '#fff',
          }}
        >
          <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
            SECTION 14 · DIGITAL SERVICES & 24-HOUR ASSISTANCE
          </div>
          <h3
            className="serif"
            style={{ fontSize: '24px', margin: '8px 0 12px', color: 'var(--ink)' }}
          >
            Fast, personal communication across every channel.
          </h3>
          <p
            style={{
              color: '#536f7e',
              lineHeight: 1.7,
              marginBottom: '16px',
              fontSize: '0.92rem',
            }}
          >
            Whether you prefer website-based tour discovery on{' '}
            <strong>www.bimondotours.com</strong>, direct WhatsApp concierge
            support at <strong>+94 76 223 2054</strong>, email correspondence at{' '}
            <strong>tours@bimondo.com</strong>, or social media enquiries via
            Facebook (<strong>Bimondo tours</strong>) and Instagram (
            <strong>@Bimondo.tours</strong>), our Battaramulla team provides
            clear written booking summaries, online booking confirmations,
            24-hour online assistance during your stay, and post-journey feedback
            follow-up.
          </p>
        </div>
      </section>

      <FaqSection />
    </main>
  );
}

