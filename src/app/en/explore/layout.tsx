import { buildLocaleMetadata } from '@/lib/seo';

export const metadata = buildLocaleMetadata('en', '/explore', { title: 'Explore Schools, Universities & Institutes' });

export default function ExploreEnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
