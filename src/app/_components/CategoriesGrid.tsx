'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/core/context/LanguageContext';
import { localeHref } from '@/lib/locale';
import { Category } from '@/core/types/masterData';
import { GraduationCap, School, BookOpen, Award, HeartHandshake, UserCheck } from 'lucide-react';

function getCategoryIcon(iconName: string) {
  switch (iconName) {
    case 'GraduationCap': return <GraduationCap className="w-6 h-6" />;
    case 'School': return <School className="w-6 h-6" />;
    case 'BookOpen': return <BookOpen className="w-6 h-6" />;
    case 'Award': return <Award className="w-6 h-6" />;
    case 'HeartHandshake': return <HeartHandshake className="w-6 h-6" />;
    case 'UserCheck': return <UserCheck className="w-6 h-6" />;
    default: return <GraduationCap className="w-6 h-6" />;
  }
}

// The homepage's dynamic educational categories grid, linking each category to its pre-filtered
// explore page.
export default function CategoriesGrid({ categories }: { categories: Category[] }) {
  const { language, t } = useLanguage();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`${localeHref('/explore', language)}?category=${cat.slug}`}
            className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-md hover:shadow-xl hover:border-blue-400 hover:-translate-y-1 transition-all duration-200 flex flex-col items-center text-center group"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-50 text-[#0B192C] group-hover:bg-[#0B192C] group-hover:text-[#F1C40F] transition-colors flex items-center justify-center mb-3 shadow-xs">
              {getCategoryIcon(cat.iconName)}
            </div>
            <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-blue-700 transition-colors">
              {language === 'en' ? cat.name.en : cat.name.ar}
            </h3>
            <span className="text-[11px] font-semibold text-slate-400 mt-1">
              {cat.institutionsCount || 0}+ {t('مؤسسة', 'listings')}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
