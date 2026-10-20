import { buildLocaleMetadata } from '@/lib/seo';

export const metadata = buildLocaleMetadata('en', '/login', { title: 'Log In' });

export default function LoginEnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
