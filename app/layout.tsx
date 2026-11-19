import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import MomentumScroll from '@/components/MomentumScroll';
import SiteGsapAnimations from '@/components/SiteGsapAnimations';
import InstantRouteManager from '@/components/InstantRouteManager';
import AnalyticsProvider from '@/components/AnalyticsProvider';
import {
  SITE_URL,
  SITE_NAME,
  buildRootGraphJsonLd,
} from '@/lib/seo';

export const viewport: Viewport = {
  themeColor: '#eaf3f6',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Bimondo Travels | Private Sri Lanka Tours & Tailor-Made Journeys',
  description:
    'Bimondo Travels creates private, tailor-made Sri Lankan journeys through heritage, wildlife, hill country, adventure, and coastal destinations.',
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [{ url: '/favicon.jpg?v=2', type: 'image/jpeg' }],
    shortcut: ['/favicon.jpg?v=2'],
    apple: [{ url: '/favicon.jpg?v=2', type: 'image/jpeg' }],
  },
  openGraph: {
    title: 'Bimondo Travels | Private Sri Lanka Tours & Tailor-Made Journeys',
    description:
      'Bimondo Travels creates private, tailor-made Sri Lankan journeys through heritage, wildlife, hill country, adventure, and coastal destinations.',
    url: SITE_URL,
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_US',
    images: [{ url: '/favicon.jpg?v=2', alt: 'Bimondo Travels Sri Lanka' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bimondo Travels | Private Sri Lanka Tours & Tailor-Made Journeys',
    description:
      'Bimondo Travels creates private, tailor-made Sri Lankan journeys through heritage, wildlife, hill country, adventure, and coastal destinations.',
    images: ['/favicon.jpg?v=2'],
  },
};

const rootJsonLd = buildRootGraphJsonLd();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.jpg?v=2" type="image/jpeg" />
        <link rel="shortcut icon" href="/favicon.jpg?v=2" type="image/jpeg" />
        <link rel="apple-touch-icon" href="/favicon.jpg?v=2" />
        <link
          rel="preconnect"
          href="https://cdn.bimondotours.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://cdn.bimondotours.com" />
        <link
          rel="preconnect"
          href="https://firestore.googleapis.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(rootJsonLd),
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <AnalyticsProvider />
        <MomentumScroll />
        <SiteGsapAnimations />
        <Header />
        <InstantRouteManager>{children}</InstantRouteManager>
        <Footer />
        <FloatingWhatsApp />
      </body>
    </html>
  );
}

