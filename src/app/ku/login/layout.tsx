import { buildLocaleMetadata } from '@/lib/seo';

export const metadata = buildLocaleMetadata('ku', '/login', { title: 'چوونەژوورەوە' });

export default function LoginKuLayout({ children }: { children: React.ReactNode }) {
  return children;
}
