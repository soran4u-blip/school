'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Award, BookOpen, GraduationCap, HeartHandshake, School, UserCheck } from 'lucide-react';
import { useLanguage } from '@/core/context/LanguageContext';
import { localeHref } from '@/lib/locale';
import { Category } from '@/core/types/masterData';

function getCategoryIcon(iconName: string) {
  switch (iconName) {
    case 'GraduationCap': return <GraduationCap className="h-5 w-5" />;
    case 'School': return <School className="h-5 w-5" />;
    case 'BookOpen': return <BookOpen className="h-5 w-5" />;
    case 'Award': return <Award className="h-5 w-5" />;
    case 'HeartHandshake': return <HeartHandshake className="h-5 w-5" />;
    case 'UserCheck': return <UserCheck className="h-5 w-5" />;
    default: return <GraduationCap className="h-5 w-5" />;
  }
}

const ACCENT_STYLES = [
  'bg-blue-50 text-blue-700 group-hover:bg-blue-600',
  'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600',
  'bg-amber-50 text-amber-700 group-hover:bg-amber-500',
  'bg-violet-50 text-violet-700 group-hover:bg-violet-600',
  'bg-rose-50 text-rose-700 group-hover:bg-rose-600',
  'bg-cyan-50 text-cyan-700 group-hover:bg-cyan-600',
];

// The first destination after the hero. It is deliberately a compact navigator rather than a
// floating card stack, so the page moves naturally from "search" to "browse" to real listings.
export default function CategoriesGrid({ categories }: { categories: Category[] }) {
  const { language, t } = useLanguage();

  return (
    <section className="border-b border-slate-200 bg-white px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-blue-700">
              {t('ابدأ من المسار المناسب', 'Start with the right path')}
            </p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-[#0B192C] sm:text-2xl">
              {t('استكشف خيارات التعليم في العراق', 'Explore education options in Iraq')}
            </h2>
          </div>
          <Link
            href={localeHref('/explore', language)}
            className="group inline-flex items-center gap-1.5 self-start text-xs font-bold text-blue-700 transition-colors hover:text-blue-900 sm:self-auto"
          >
            {t('عرض جميع الخيارات', 'Browse all options')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((cat, index) => (
            <Link
              key={cat.id}
              href={`${localeHref('/explore', language)}?category=${cat.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-[0_14px_28px_-20px_rgba(15,23,42,0.6)] sm:p-[1.125rem]"
            >
              <div className={`mb-5 flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-300 group-hover:text-white ${ACCENT_STYLES[index % ACCENT_STYLES.length]}`}>
                {getCategoryIcon(cat.iconName)}
              </div>
              <h3 className="min-h-10 text-xs font-extrabold leading-5 text-slate-900 transition-colors group-hover:text-blue-700 sm:text-sm">
                {language === 'en' ? cat.name.en : cat.name.ar}
              </h3>
              <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300 group-hover:bg-[#F1C40F]" />
                {cat.institutionsCount || 0} {t('مؤسسة', 'listings')}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
