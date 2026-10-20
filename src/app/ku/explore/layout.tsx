import { buildLocaleMetadata } from '@/lib/seo';

export const metadata = buildLocaleMetadata('ku', '/explore', { title: 'قوتابخانە، زانکۆ و پەیمانگاکان بپشکنە' });

export default function ExploreKuLayout({ children }: { children: React.ReactNode }) {
  return children;
}
