import { buildLocaleMetadata } from '@/lib/seo';

export const metadata = buildLocaleMetadata('ku', '/my-applications', { title: 'داواکارییەکانی کارم' });

export default function MyApplicationsKuLayout({ children }: { children: React.ReactNode }) {
  return children;
}
