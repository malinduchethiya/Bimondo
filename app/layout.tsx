import type { Metadata, Viewport } from 'next';
import { DM_Sans, DM_Serif_Display } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import MomentumScroll from '@/components/MomentumScroll';
import SiteGsapAnimations from '@/components/SiteGsapAnimations';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-dm-serif',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#eaf3f6',
};

export const metadata: Metadata = {
  title: 'Bimondo Travels | Private Sri Lanka Tours & Tailor-Made Journeys',
  description: 'Bimondo Travels creates private, tailor-made Sri Lankan journeys through heritage, nature, wildlife and the coast.',
  openGraph: {
    title: 'Bimondo Travels | Private Sri Lanka Tours & Tailor-Made Journeys',
    description: 'Bimondo Travels creates private, tailor-made Sri Lankan journeys through heritage, nature, wildlife and the coast.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bimondo Travels | Private Sri Lanka Tours & Tailor-Made Journeys',
    description: 'Bimondo Travels creates private, tailor-made Sri Lankan journeys through heritage, nature, wildlife and the coast.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmSerifDisplay.variable}`}>
      <body suppressHydrationWarning>
        <MomentumScroll />
        <SiteGsapAnimations />
        <Header />
        {children}
        <Footer />
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
