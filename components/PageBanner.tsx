import React from 'react';

interface PageBannerProps {
  eyebrow?: string;
  title: string;
}

export default function PageBanner({
  eyebrow = 'BIMONDO TRAVELS  /  SRI LANKA',
  title,
}: PageBannerProps) {
  return (
    <div className="page-banner">
      <div className="eyebrow">{eyebrow}</div>
      <h1 className="serif">{title}</h1>
    </div>
  );
}
