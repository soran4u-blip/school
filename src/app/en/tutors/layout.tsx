import type { Metadata } from 'next';
import { siteUrl } from '@/lib/siteUrl';

export const metadata: Metadata = {
  title: 'Find Private Tutors in Iraq',
  alternates: {
    canonical: '/en/tutors',
    languages: { 'ar-IQ': `${siteUrl}/tutors`, en: `${siteUrl}/en/tutors` },
  },
};

export default function TutorsEnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
