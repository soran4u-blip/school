import { buildLocaleMetadata } from '@/lib/seo';

export const metadata = buildLocaleMetadata('ku', '/tutors', { title: 'مامۆستای تایبەت لە عێراق بدۆزەرەوە' });

export default function TutorsKuLayout({ children }: { children: React.ReactNode }) {
  return children;
}
