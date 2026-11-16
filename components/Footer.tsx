'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { normalizeRoutePath } from '@/components/InstantRouteManager';
import { useSiteCms } from '@/hooks/useSiteCms';

export default function Footer() {
  const { cms } = useSiteCms();
  const pathname = usePathname();

  if (normalizeRoutePath(pathname).startsWith('/admin')) {
    return null;
  }

  const footer = cms.pages.shared.footer;
  const year = new Date().getFullYear();

  const visibleExploreLinks = [...(footer.exploreLinks || [])]
    .filter((link) => link.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const visibleBookingsLinks = [...(footer.bookingsLinks || [])]
    .filter((link) => link.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <footer>
      <div className="wrap">
        <div className="footer-top">
          <div>
            <Link className="brand" href="/" prefetch={false}>
              <span className="brand-mark">{footer.brandMonogram}</span>
              {footer.brandName}
            </Link>
            <p>{footer.tagline}</p>
            <p>{footer.addressLine}</p>
            <p style={{ fontSize: '0.82rem', opacity: 0.78, marginTop: '4px' }}>
              {footer.founderMarketsLine}
            </p>
          </div>
          <div className="footer-links">
            <div>
              <b>{footer.exploreHeading}</b>
              {visibleExploreLinks.map((link) => (
                <Link key={link.id} href={link.href || '/'} prefetch={false}>
                  {link.label}
                </Link>
              ))}
            </div>
            <div>
              <b>{footer.bookingsHeading}</b>
              {visibleBookingsLinks.map((link) => (
                <Link key={link.id} href={link.href || '/'} prefetch={false}>
                  {link.label}
                </Link>
              ))}
            </div>
            <div>
              <b>{footer.contactHeading}</b>
              <a href={`mailto:${footer.email}`}>{footer.email}</a>
              <a
                href={footer.whatsappUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                {footer.whatsappDisplay}
              </a>
              <a
                href={footer.instagramUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                {footer.instagramDisplay}
              </a>
              <span style={{ fontSize: '0.88rem', opacity: 0.8 }}>
                {footer.facebookDisplay}
              </span>
              <span style={{ fontSize: '0.88rem', opacity: 0.8 }}>
                {footer.websiteDisplay}
              </span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {year} {footer.copyrightAddress}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span>{footer.bottomRightNote}</span>
            <a href="/admin" style={{ opacity: 0.78, textDecoration: 'underline', textUnderlineOffset: '3px' }}>
              Admin Sign In
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
