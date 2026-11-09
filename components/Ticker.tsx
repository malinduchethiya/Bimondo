import React from 'react';

export default function Ticker() {
  const items = [
    'PRIVATE JOURNEYS',
    'ANCIENT WONDERS',
    'ISLAND HOSPITALITY',
    'LOCAL HEART',
    'PRIVATE JOURNEYS',
    'ANCIENT WONDERS',
    'ISLAND HOSPITALITY',
    'LOCAL HEART',
  ];

  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-inner">
        {items.map((item, idx) => (
          <span key={idx}>{item}</span>
        ))}
      </div>
    </div>
  );
}
