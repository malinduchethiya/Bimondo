import React from 'react';

export default function HeroTransitionSection() {
  const features = [
    {
      num: '01',
      badge: 'TAILOR-MADE PACE',
      title: 'Private and Personal',
      desc: 'Every journey is planned around your interests, pace, preferences, and budget—for solo travellers, couples, families, and small private groups.',
    },
    {
      num: '02',
      badge: 'LOCAL INTEGRITY',
      title: 'Authentic and Responsible',
      desc: 'Real local experiences, respect for Sri Lanka’s heritage, responsible wildlife practices, and direct support for local communities.',
    },
    {
      num: '03',
      badge: '24-HOUR CARE',
      title: 'Reliable Local Support',
      desc: 'Professional drivers and licensed guides, clear written arrangements, and our Battaramulla team available on call 24 hours a day.',
    },
  ];

  return (
    <section
      className="hero-transition-section"
      aria-label="Bimondo Signature Pillars"
    >
      <div className="hero-transition-container">
        <div className="hero-transition-grid">
          {features.map((f, idx) => (
            <div
              key={f.num}
              className={`transition-card ${
                idx === 1 ? 'middle-card middle-subsection' : ''
              }`}
            >
              <div className="transition-card-top">
                <span className="transition-num">{f.num}</span>
                <span className="transition-badge">{f.badge}</span>
              </div>
              <h3 className="serif transition-title">{f.title}</h3>
              <p className="transition-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
