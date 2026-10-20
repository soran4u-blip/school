import { buildLocaleMetadata } from '@/lib/seo';

export const metadata = buildLocaleMetadata('en', '/events', { title: 'Education Events in Iraq' });

export default function EventsEnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
