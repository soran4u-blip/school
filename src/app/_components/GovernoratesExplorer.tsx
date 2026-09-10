'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/core/context/LanguageContext';
import { localeHref } from '@/lib/locale';
import { Governorate } from '@/core/types/masterData';

// The homepage's "browse by governorate" grid covering all 18 Iraqi governorates.
export default function GovernoratesExplorer({ governorates }: { governorates: Governorate[] }) {
  const { language, t } = useLanguage();

  return (
    <section className="bg-slate-100 py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-200">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">{t('تغطية وطنية شاملة', 'Nationwide Coverage')}</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] mt-1">
            {t('تصفح المدارس والجامعات حسب المحافظة العراقية', 'Browse by Iraqi Governorate')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('اختر محافظتك للعثور على كافة الصروح التعليمية المعتمدة والأقرب لموقعك.', 'Select your governorate to find accredited institutions nearest to you.')}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {governorates.map((gov) => (
            <Link
              key={gov.id}
              href={`${localeHref('/explore', language)}?governorate=${gov.id}`}
              className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 shadow-xs transition-all flex items-center justify-between group"
            >
              <div>
                <div className="font-extrabold text-xs text-slate-800 group-hover:text-blue-700 transition-colors">
                  {language === 'en' ? gov.name.en : gov.name.ar}
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {gov.institutionsCount || 0} {t('مؤسسة', 'listings')}
                </span>
              </div>
              <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                {gov.code}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
