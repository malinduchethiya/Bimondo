'use client';

import React, { useEffect } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import {
  getGaMeasurementId,
  isAnalyticsPermitted,
} from '@/lib/analytics';

export default function AnalyticsProvider() {
  const measurementId = getGaMeasurementId();
  const pathname = usePathname();

  useEffect(() => {
    if (!measurementId) return;

    const sendPageView = (targetPath: string) => {
      if (!isAnalyticsPermitted()) return;
      if (typeof window.gtag !== 'function') return;
      if (targetPath.startsWith('/admin')) return;
      window.gtag('config', measurementId, {
        page_path: targetPath,
        anonymize_ip: true,
      });
    };

    if (pathname) {
      sendPageView(pathname);
    }

    const onCustomNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        sendPageView(customEvent.detail);
      }
    };

    window.addEventListener('bimondo:navigate', onCustomNavigate);
    return () => {
      window.removeEventListener('bimondo:navigate', onCustomNavigate);
    };
  }, [measurementId, pathname]);

  if (!measurementId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="bimondo-ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          var dnt = navigator.doNotTrack === '1' || window.doNotTrack === '1';
          var denied = false;
          try { denied = localStorage.getItem('bimondo_analytics_consent_v1') === 'denied'; } catch (e) {}
          if (!dnt && !denied) {
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              anonymize_ip: true,
              send_page_view: false
            });
          }
        `}
      </Script>
    </>
  );
}
