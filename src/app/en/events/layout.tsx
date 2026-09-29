import type { Metadata } from 'next';
import { siteUrl } from '@/lib/siteUrl';

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
