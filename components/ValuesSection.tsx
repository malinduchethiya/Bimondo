import React from 'react';

export default function ValuesSection() {
  const values = [
    {
      num: '01 / PERSONALLY YOURS',
      title: 'Private by nature.',
      desc: 'No fixed crowds or rushed checklists. Your interests, pace and budget shape the route.',
    },
    {
      num: '02 / HERE WHEN YOU NEED US',
      title: '24-hour support.',
      desc: 'Our on-call Sri Lankan team is available throughout your journey.',
    },
    {
      num: '03 / CARE FOR OUR HOME',
      title: 'Travel thoughtfully.',
      desc: 'We value local partners, cultural respect and responsible wildlife experiences.',
    },
  ];

  return (
    <section className="section values leaf-green-section" id="why">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow values-eyebrow">
              05 / TRAVEL WITH GOOD PEOPLE
            </div>
            <h2 className="serif values-title">
              The Bimondo
              <br />
              <em>difference.</em>
            </h2>
          </div>
          <p className="values-lead">
            Personal care, honest local knowledge and thoughtful planning — from
            your first message to your flight home.
          </p>
        </div>

        <div className="values-grid">
          {values.map((v) => (
            <div key={v.num} className="value">
              <span className="number values-num">{v.num}</span>
              <h3 className="values-card-title">{v.title}</h3>
              <p className="values-card-desc">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
