import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import MomentumScroll from '@/components/MomentumScroll';
import SiteGsapAnimations from '@/components/SiteGsapAnimations';
import InstantRouteManager from '@/components/InstantRouteManager';

export const viewport: Viewport = {
  themeColor: '#eaf3f6',
};

export const metadata: Metadata = {
  title: 'Bimondo Travels | Private Sri Lanka Tours & Tailor-Made Journeys',
  description:
    'Bimondo Travels creates private, tailor-made Sri Lankan journeys through heritage, nature, wildlife and the coast.',
  icons: {
    icon: [{ url: '/favicon.jpg', type: 'image/jpeg' }],
    shortcut: ['/favicon.jpg'],
    apple: [{ url: '/favicon.jpg', type: 'image/jpeg' }],
  },
  openGraph: {
    title: 'Bimondo Travels | Private Sri Lanka Tours & Tailor-Made Journeys',
    description:
      'Bimondo Travels creates private, tailor-made Sri Lankan journeys through heritage, nature, wildlife and the coast.',
    type: 'website',
    siteName: 'Bimondo Travels',
    images: [{ url: '/favicon.jpg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bimondo Travels | Private Sri Lanka Tours & Tailor-Made Journeys',
    description:
      'Bimondo Travels creates private, tailor-made Sri Lankan journeys through heritage, nature, wildlife and the coast.',
    images: ['/favicon.jpg'],
  },
};

const travelAgencyJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TravelAgency',
  name: 'Bimondo Travels',
  alternateName: 'Bimondo Tours',
  url: 'https://www.bimondotours.com',
  logo: 'https://www.bimondotours.com/logo.png',
  image: 'https://www.bimondotours.com/favicon.jpg',
  description:
    'Destination Management Company & Tailor-Made Tour Operator in Battaramulla, Sri Lanka creating private, tailor-made Sri Lankan journeys.',
  telephone: '+94762232054',
  email: 'tours@bimondo.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'No. 596/1, Thalangama South',
    addressLocality: 'Battaramulla',
    addressCountry: 'LK',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.jpg" type="image/jpeg" />
        <link rel="shortcut icon" href="/favicon.jpg" type="image/jpeg" />
        <link rel="apple-touch-icon" href="/favicon.jpg" />
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
            __html: JSON.stringify(travelAgencyJsonLd),
          }}
        />
      </head>
      <body suppressHydrationWarning>
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
