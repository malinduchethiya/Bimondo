import React from 'react';

export default function HeroTransitionSection() {
  const features = [
    {
      num: '01',
      badge: 'BESPOKE PACE',
      title: 'Private by Nature',
      desc: 'Your own private vehicle and dedicated English-speaking chauffeur-guide moving entirely to your personal rhythm.',
    },
    {
      num: '02',
      badge: 'SIGNATURE SRI LANKA',
      title: 'Ancient & Untamed',
      desc: 'From sunrise atop Sigiriya Lion Rock and sacred Kandy to misty tea trails and ethical wildlife safaris.',
    },
    {
      num: '03',
      badge: 'LOCAL CARE',
      title: 'Warm Island Soul',
      desc: 'Handpicked boutique stays, authentic village hospitality, and 24/7 on-call support from our Colombo team.',
    },
  ];

  return (
    <div
      className="hero-transition-section"
      aria-label="Bimondo Signature Pillars"
    >
      <div className="wrap hero-transition-container">
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
    </div>
  );
}
