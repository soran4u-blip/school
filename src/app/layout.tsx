import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { headers } from 'next/headers';
import './globals.css';
import { LanguageProvider } from '@/core/context/LanguageContext';
import { MasterDataProvider } from '@/core/context/MasterDataContext';
import { getPublicCategories, getPublicGovernorates, getPublicSystemSettings } from '@/core/server/data/masterData';
import ErrorReporter from '@/components/shared/ErrorReporter';
import ServiceWorkerRegistrar from '@/components/shared/ServiceWorkerRegistrar';
import { siteUrl } from '@/lib/siteUrl';
import { DEFAULT_LANGUAGE, LOCALES, isSupportedLanguage } from '@/lib/locales';

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

// The Admin SDK's service account is a runtime-only secret (see docs/deployment.md), so nothing
// under this layout can be prerendered at build time. The reads below are cached snapshots shared
// across visitors, so request-time rendering doesn't mean a Firestore read per request.
export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read once here for the whole app: Navbar and Footer both need these on every page and used to
  // fetch them separately from the browser.
  const [categories, governorates, systemSettings] = await Promise.all([
    getPublicCategories(),
    getPublicGovernorates(),
    getPublicSystemSettings(),
  ]);

  // src/proxy.ts forwards the language a /en or /ku URL pins; unprefixed routes carry none and
  // render as Arabic until the client applies a saved preference. A client can send this header
  // itself on unprefixed paths, which only changes <html lang> in its own response.
  const requestedLocale = (await headers()).get('x-locale');
  const { dir, htmlLang } = LOCALES[isSupportedLanguage(requestedLocale) ? requestedLocale : DEFAULT_LANGUAGE];

  return (
    <html lang={htmlLang} dir={dir} suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        {/* Google tag (gtag.js) — loaded after hydration so it doesn't compete with page interactivity. */}
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-6XJ5PFT1T3" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-6XJ5PFT1T3');`}
        </Script>
        <ErrorReporter />
        <ServiceWorkerRegistrar />
        <LanguageProvider>
          <MasterDataProvider value={{ categories, governorates, systemSettings }}>
            {children}
          </MasterDataProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
