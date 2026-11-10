'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BookingProviderId, SupportedCurrency } from '@/lib/booking-types';

interface ProviderWidgetEmbedProps {
  provider: BookingProviderId;
  itemName: string;
  /** NightsBridge BBID, Bókun Experience ID, or Viator Product Code */
  externalId: string;
  /** Bókun Booking Channel UUID */
  bokunChannelUuid?: string;
  /** Official Bókun script loader URL */
  bokunScriptUrl?: string;
  /** Computed checkout or iframe URL from the server */
  checkoutUrl: string | null;
  /** Optional custom official embed snippet from admin settings */
  customEmbedCode?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  childrenCount?: number;
  rooms?: number;
  currency?: SupportedCurrency;
}

export default function ProviderWidgetEmbed({
  provider,
  itemName,
  externalId,
  bokunChannelUuid = '',
  bokunScriptUrl = 'https://widgets.bokun.io/assets/javascripts/apps/build/BokunWidgetsLoader.js',
  checkoutUrl,
  customEmbedCode,
  checkIn,
  checkOut,
  adults = 2,
  childrenCount = 0,
  rooms = 1,
  currency = 'USD',
}: ProviderWidgetEmbedProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const bokunContainerRef = useRef<HTMLDivElement | null>(null);

  // Load official Bókun widget script when Bókun channel UUID and experienceId are configured
  useEffect(() => {
    if (provider !== 'bokun' || !bokunChannelUuid || !externalId) return;

    const scriptId = `bokun-widgets-loader-${bokunChannelUuid}`;
    let existingScript = document.getElementById(
      scriptId
    ) as HTMLScriptElement | null;

    if (!existingScript) {
      existingScript = document.createElement('script');
      existingScript.id = scriptId;
      existingScript.type = 'text/javascript';
      existingScript.src = `${bokunScriptUrl}?bookingChannelUUID=${encodeURIComponent(
        bokunChannelUuid
      )}`;
      existingScript.async = true;
      document.body.appendChild(existingScript);
    }
  }, [provider, bokunChannelUuid, externalId, bokunScriptUrl]);

  // 1. Unconfigured Safe State (when official IDs/URLs are missing)
  const isConfigured =
    (provider === 'nightsbridge' && Boolean(externalId && checkoutUrl)) ||
    (provider === 'bokun' &&
      Boolean((bokunChannelUuid && externalId) || customEmbedCode)) ||
    (provider === 'viator' &&
      Boolean(checkoutUrl || externalId || customEmbedCode));

  if (!isConfigured) {
    return (
      <div className="provider-unconfigured-card">
        <span className="eyebrow" style={{ color: 'var(--terracotta)' }}>
          PROVIDER CONFIGURATION REQUIRED · {provider.toUpperCase()}
        </span>
        <h4 className="serif" style={{ fontSize: '24px', margin: '8px 0' }}>
          Official {provider === 'nightsbridge' ? 'NightsBridge' : provider === 'bokun' ? 'Bókun' : 'Viator'} Credentials Not Connected Yet
        </h4>
        <p style={{ color: 'var(--muted)', fontSize: '13.5px', lineHeight: 1.68, margin: '0 0 16px' }}>
          To prevent fake availability or unverified bookings, live checkout for{' '}
          <strong>{itemName}</strong> is paused until an official{' '}
          {provider === 'nightsbridge'
            ? 'NightsBridge Establishment ID (BBID)'
            : provider === 'bokun'
            ? 'Bókun Booking Channel UUID and Experience ID'
            : 'Viator Partner URL or Product Code'}{' '}
          is configured.
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link href="/admin/booking" prefetch={false} className="pill dark">
            CONFIGURE IN ADMIN SETTINGS ↗
          </Link>
          <Link href="/contact" prefetch={false} className="pill">
            ENQUIRE DIRECTLY WITH CONCIERGE
          </Link>
        </div>
      </div>
    );
  }

  // 2. If operator provided an official HTML embed snippet in Admin Settings
  if (customEmbedCode && customEmbedCode.trim()) {
    return (
      <div className="provider-widget-shell">
        <div
          className="provider-custom-embed"
          dangerouslySetInnerHTML={{ __html: customEmbedCode }}
        />
      </div>
    );
  }

  // 3. Official NightsBridge Accommodation Booking Engine Integration
  if (provider === 'nightsbridge' && checkoutUrl) {
    return (
      <div className="provider-widget-shell">
        <div className="provider-widget-bar">
          <div>
            <strong>NightsBridge Official Booking Engine</strong>
            <span>
              BBID: {externalId}
              {checkIn ? ` · Check-in: ${checkIn}` : ''}
              {checkOut ? ` · Check-out: ${checkOut}` : ''} · {adults} Adult
              {adults > 1 ? 's' : ''}, {rooms} Room{rooms > 1 ? 's' : ''}
            </span>
          </div>
          <a
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="pill dark"
            style={{ padding: '8px 14px', minHeight: '36px', fontSize: '11px' }}
          >
            OPEN IN NEW WINDOW ↗
          </a>
        </div>
        <div className="provider-iframe-wrap">
          {!iframeLoaded && (
            <div className="provider-iframe-loader">
              Loading official NightsBridge real-time availability &amp; rates…
            </div>
          )}
          <iframe
            src={checkoutUrl}
            title={`NightsBridge Booking — ${itemName}`}
            className="provider-iframe"
            onLoad={() => setIframeLoaded(true)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation"
          />
        </div>
      </div>
    );
  }

  // 4. Official Bókun Tours & Activities Widget Integration
  if (provider === 'bokun' && bokunChannelUuid && externalId) {
    const bokunWidgetDataSrc = `https://widgets.bokun.io/online-sales/${encodeURIComponent(
      bokunChannelUuid
    )}/experience-calendar/${encodeURIComponent(externalId)}`;

    return (
      <div className="provider-widget-shell" ref={bokunContainerRef}>
        <div className="provider-widget-bar">
          <div>
            <strong>Bókun Official Experience Checkout</strong>
            <span>
              Experience ID: {externalId} · Currency: {currency} · {adults}{' '}
              Adult{adults > 1 ? 's' : ''}
              {childrenCount > 0 ? `, ${childrenCount} Children` : ''}
            </span>
          </div>
          {checkoutUrl && (
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pill dark"
              style={{
                padding: '8px 14px',
                minHeight: '36px',
                fontSize: '11px',
              }}
            >
              OPEN BÓKUN CHECKOUT ↗
            </a>
          )}
        </div>

        {/* Official Bókun Widget Mount Node */}
        <div
          className="bokunWidget"
          data-src={bokunWidgetDataSrc}
          style={{ minHeight: '80px', padding: '12px' }}
        />

        {/* Official Bókun Direct Calendar Iframe Fallback */}
        {checkoutUrl && (
          <div className="provider-iframe-wrap">
            {!iframeLoaded && (
              <div className="provider-iframe-loader">
                Loading official Bókun departure calendar &amp; checkout…
              </div>
            )}
            <iframe
              src={checkoutUrl}
              title={`Bókun Booking — ${itemName}`}
              className="provider-iframe"
              onLoad={() => setIframeLoaded(true)}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation"
            />
          </div>
        )}
      </div>
    );
  }

  // 5. Official Viator Booking Checkout Redirect / Partner Link Card
  return (
    <div className="provider-unconfigured-card" style={{ background: '#f7fbfc' }}>
      <span className="eyebrow" style={{ color: 'var(--terracotta)' }}>
        OFFICIAL VIATOR EXPERIENCE CHECKOUT
      </span>
      <h4 className="serif" style={{ fontSize: '24px', margin: '8px 0' }}>
        Proceed to Viator to Verify Dates &amp; Complete Booking
      </h4>
      <p style={{ color: 'var(--muted)', fontSize: '13.5px', lineHeight: 1.68, margin: '0 0 18px' }}>
        Selected preferences for <strong>{itemName}</strong>:{' '}
        {checkIn ? `Departure ${checkIn} · ` : ''}
        {adults} Adult{adults > 1 ? 's' : ''}
        {childrenCount > 0 ? `, ${childrenCount} Children` : ''} ({currency}).
        Viator handles live slot verification, secure payment processing, and
        instant voucher issuance on their official checkout page.
      </p>
      {checkoutUrl && (
        <a
          href={checkoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="pill dark"
        >
          CONTINUE TO OFFICIAL VIATOR CHECKOUT ↗
        </a>
      )}
    </div>
  );
}
