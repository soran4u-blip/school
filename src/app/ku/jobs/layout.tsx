import { buildLocaleMetadata } from '@/lib/seo';

export const metadata = buildLocaleMetadata('ku', '/jobs', { title: 'هەلی کاری پەروەردەیی لە عێراق' });

export default function JobsKuLayout({ children }: { children: React.ReactNode }) {
  return children;
}
