import type { Metadata, Viewport } from 'next';
import { Manrope, Space_Grotesk, Space_Mono } from 'next/font/google';
import { Providers } from '@/lib/providers';
import './globals.css';

const grotesk = Space_Grotesk({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-space-grotesk', display: 'swap' });
const manrope = Manrope({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-manrope', display: 'swap' });
const mono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-space-mono', display: 'swap' });

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gobrandtoday.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: 'GoBrandToday — Your idea deserves a brand', template: '%s · GoBrandToday' },
  description:
    'Tell us what you’re building. We’ll find the name, check the domain and social handles, score it, and build the brand identity to launch it. India-first, free to start.',
  applicationName: 'GoBrandToday',
  keywords: ['brand name generator', 'startup name generator', 'domain name generator', 'AI brand kit', 'business name generator India'],
  openGraph: {
    type: 'website',
    siteName: 'GoBrandToday',
    title: 'GoBrandToday — Your idea deserves a brand',
    description: 'Name, domain, handles, score and identity — in minutes.',
    url: SITE,
    locale: 'en_IN',
  },
  twitter: { card: 'summary_large_image', title: 'GoBrandToday — Your idea deserves a brand', description: 'Name, domain, handles, score and identity — in minutes.' },
  alternates: { canonical: '/' },
};

export const viewport: Viewport = {
  themeColor: '#FAFAF7',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${grotesk.variable} ${manrope.variable} ${mono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
