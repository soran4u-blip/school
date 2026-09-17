import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Log In',
  alternates: {
    canonical: '/en/login',
    languages: { 'ar-IQ': `${siteUrl}/login`, en: `${siteUrl}/en/login` },
  },
};

export default function LoginEnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
