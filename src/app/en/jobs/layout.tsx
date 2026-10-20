import { buildLocaleMetadata } from '@/lib/seo';

export const metadata = buildLocaleMetadata('en', '/jobs', { title: 'Education Jobs in Iraq' });

export default function JobsEnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
