import React from 'react';
import PageBanner from '@/components/PageBanner';
import ContactSection from '@/components/ContactSection';
import FaqSection from '@/components/FaqSection';

export default function ContactPage() {
  const companyDetails = [
    { label: 'Company Name', value: 'Bimondo Travels' },
    { label: 'Founder', value: 'I.M. Bimsara Illangasinghe' },
    { label: 'Year Established', value: '2022' },
    {
      label: 'Address',
      value: 'No. 596/1, Thalangama South, Battaramulla, Sri Lanka',
    },
    { label: 'Phone / WhatsApp', value: '+94 76 223 2054' },
    { label: 'Email', value: 'tours@bimondo.com' },
    { label: 'Website', value: 'www.bimondotours.com' },
    { label: 'Facebook', value: 'Bimondo tours' },
    { label: 'Instagram', value: '@Bimondo.tours' },
    {
      label: 'Primary Markets',
      value: 'United Kingdom and Europe · India · Australia',
    },
  ];

  return (
    <main>
      <PageBanner
        eyebrow="BIMONDO TRAVELS  /  CONTACT & COMPANY DETAILS"
        title="Plan your private journey across Sri Lanka."
      />
      <ContactSection />

      {/* Section 19: Official Company Details Reference Table */}
      <section className="section wrap" style={{ paddingTop: '10px' }}>
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              19 / OFFICIAL COMPANY PROFILE DETAILS
            </div>
            <h2 className="serif">
              Direct contact &amp;{' '}
              <em style={{ color: 'var(--terracotta)' }}>office information.</em>
            </h2>
          </div>
          <p>
            Reach our team in Thalangama South, Battaramulla directly by
            WhatsApp, phone, or email—with 24-hour on-call support for guests
            travelling in Sri Lanka.
          </p>
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
              key={item.label}
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
