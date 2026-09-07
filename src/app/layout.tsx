import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/core/context/LanguageContext';

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
