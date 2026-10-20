import { buildLocaleMetadata } from '@/lib/seo';

export const metadata = buildLocaleMetadata('ku', '/events', { title: 'چالاکییە پەروەردەییەکان لە عێراق' });

export default function EventsKuLayout({ children }: { children: React.ReactNode }) {
  return children;
}
