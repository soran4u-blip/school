import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LanguageProvider } from '@/core/context/LanguageContext';
import ErrorReporter from '@/components/shared/ErrorReporter';
import ServiceWorkerRegistrar from '@/components/shared/ServiceWorkerRegistrar';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const title = 'Eduraq | دليل العراق التعليمي - المدارس، الجامعات، والأساتذة';
const description = 'منصة العراق لاكتشاف التعليم واتخاذ القرار: قارن المدارس والجامعات، اقرأ التقييمات، واسأل مجتمعك — قبل أن تقرر.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: '%s | Eduraq',
  },
  description,
  robots: { index: true, follow: true },
  openGraph: {
    title,
    description,
    siteName: 'Eduraq',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#0B192C',
};

// Unlocks Google's sitelinks search box (a search field shown directly under the site's result).
const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Eduraq',
  url: siteUrl,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${siteUrl}/explore?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <ErrorReporter />
        <ServiceWorkerRegistrar />
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
