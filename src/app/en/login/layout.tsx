import type { Metadata } from 'next';
import { siteUrl } from '@/lib/siteUrl';

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
