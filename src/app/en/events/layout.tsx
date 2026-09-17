import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Education Events in Iraq',
  alternates: {
    canonical: '/en/events',
    languages: { 'ar-IQ': `${siteUrl}/events`, en: `${siteUrl}/en/events` },
  },
};

export default function EventsEnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
