import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

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
