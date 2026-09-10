'use client';

import React from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { Search } from 'lucide-react';

// The explore feed's no-results state, shown when every filter combined excludes all institutions.
export default function EmptyResults({ onClearFilters }: { onClearFilters: () => void }) {
  const { t } = useLanguage();

  return (
    <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
      <Search className="w-12 h-12 text-slate-300 mx-auto" />
      <h3 className="font-extrabold text-base text-slate-800">
        {t('لا توجد نتائج مطابقة لبحثك', 'No Matching Institutions Found')}
      </h3>
      <p className="text-xs text-slate-500 max-w-sm mx-auto">
        {t('جرّب تقليل الفلاتر أو البحث باسم محافظة أخرى في العراق.', 'Try broadening your filters or resetting the governorate selector.')}
      </p>
      <button
        onClick={onClearFilters}
        className="px-4 py-2 bg-[#0B192C] text-white rounded-xl text-xs font-bold"
      >
        {t('إعادة ضبط كافة الفلاتر', 'Reset All Filters')}
      </button>
    </div>
  );
}
