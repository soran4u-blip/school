'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Award, BookOpen, GraduationCap, HeartHandshake, School, UserCheck } from 'lucide-react';
import { useLanguage } from '@/core/context/LanguageContext';
import { localeHref } from '@/lib/locale';
import { Category } from '@/core/types/masterData';

const tiles = [
  { slug: 'schools', en: 'Schools', ar: 'المدارس', descEn: 'Find the right school', descAr: 'اعثر على المدرسة المناسبة', icon: School, image: 'photo-1562774053-701939374585' },
  { slug: 'universities', en: 'Universities', ar: 'الجامعات', descEn: 'Explore higher education', descAr: 'استكشف التعليم العالي', icon: GraduationCap, image: 'photo-1564981797816-1043664bf78d' },
  { slug: 'tutors', en: 'Tutors', ar: 'المدرسون', descEn: 'Learn with expert tutors', descAr: 'تعلّم مع مدرسين متخصصين', icon: UserCheck, image: 'photo-1509062522246-3755977927d7' },
  { slug: 'training_centers', en: 'Training Centres', ar: 'مراكز التدريب', descEn: 'Build new skills', descAr: 'طوّر مهارات جديدة', icon: BookOpen, image: 'photo-1513258496099-48168024d8b6' },
  { slug: 'opportunities', en: 'Opportunities', ar: 'الفرص', descEn: 'Scholarships, programs & events', descAr: 'منح وبرامج وفعاليات', icon: Award, image: 'photo-1523050854058-8df90110c9f1' },
  { slug: 'community', en: 'Community', ar: 'المجتمع', descEn: 'Ask, share and get advice', descAr: 'اسأل وشارك واستفد', icon: HeartHandshake, image: 'photo-1529390079861-591de354faf5' },
];

export default function CategoriesGrid({ categories }: { categories: Category[] }) {
  const { language, t } = useLanguage();
  return <section className="bg-white px-4 py-3 sm:px-6 lg:px-8">
    <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
      {tiles.map((tile) => {
        const category = categories.find((item) => item.slug === tile.slug);
        const href = tile.slug === 'tutors' ? localeHref('/tutors', language) : tile.slug === 'community' ? '/community' : tile.slug === 'opportunities' ? localeHref('/events', language) : `${localeHref('/explore', language)}?category=${category?.slug || tile.slug}`;
        const Icon = tile.icon;
        return <Link key={tile.slug} href={href} className="group overflow-hidden rounded-xl border border-[#e9e7e0] bg-white transition hover:-translate-y-0.5 hover:border-[#b8d3c9] hover:shadow-lg">
          <div className="relative h-20 overflow-hidden bg-[#edf3ef] sm:h-24">
            <img src={`https://images.unsplash.com/${tile.image}?auto=format&fit=crop&w=500&q=75`} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#092e29]/40 to-transparent" />
          </div>
          <div className="flex items-start justify-between gap-1 p-2.5 sm:p-3">
            <div><h3 className="text-xs font-extrabold text-slate-900 sm:text-sm">{language === 'en' ? tile.en : tile.ar}</h3><p className="mt-1 hidden text-[10px] leading-4 text-slate-500 sm:block">{language === 'en' ? tile.descEn : tile.descAr}</p></div>
            <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#17695a] rtl:rotate-180" />
          </div>
        </Link>;
      })}
    </div>
  </section>;
}
