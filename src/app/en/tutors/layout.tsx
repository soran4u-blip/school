import { buildLocaleMetadata } from '@/lib/seo';

export const metadata = buildLocaleMetadata('en', '/tutors', { title: 'Find Private Tutors in Iraq' });

export default function TutorsEnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
