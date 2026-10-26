// Asosiy karkas va shriftlar
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Manrope, Playfair_Display } from 'next/font/google';
import TelegramProvider from '@/providers/TelegramProvider';
import ShopChrome from '@/components/layout/ShopChrome';
import { Toaster } from '@/components/ui';
import '@/styles/globals.css';

const manrope = Manrope({ subsets: ['latin', 'cyrillic'], variable: '--font-manrope', display: 'swap' });
const playfair = Playfair_Display({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-playfair',
  style: ['normal', 'italic'],
  display: 'swap',
});

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: 'MIRA Cosmetics — Koreyadan original kosmetika', template: '%s · MIRA Cosmetics' },
  description: "Koreya kosmetikasi, vitamin va kollagenlar — optom va dona narxlarda. Karta orqali to'lov, tez yetkazib berish.",
  openGraph: {
    type: 'website',
    siteName: 'MIRA Cosmetics',
    title: 'MIRA Cosmetics — Koreyadan original kosmetika',
    description: 'Optom va dona narxlarda Koreya kosmetikasi 🌸',
    images: [{ url: '/images/og-cover.jpg', width: 1200, height: 630, alt: 'MIRA Cosmetics' }],
    locale: 'uz_UZ',
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#FFF5FB',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={`${manrope.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <TelegramProvider>
          <ShopChrome>{children}</ShopChrome>
        </TelegramProvider>
        <Toaster />
      </body>
    </html>
  );
}
