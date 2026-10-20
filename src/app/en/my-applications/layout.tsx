import { buildLocaleMetadata } from '@/lib/seo';

export const metadata = buildLocaleMetadata('en', '/my-applications', { title: 'My Job Applications' });

export default function MyApplicationsEnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
