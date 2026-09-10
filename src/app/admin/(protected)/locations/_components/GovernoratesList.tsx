'use client';

import React from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { Governorate } from '@/core/types/masterData';
import { Edit, Trash2 } from 'lucide-react';

// The locations page's left-column list of registered governorates, with per-row edit/delete
// actions and click-to-select for the cities panel on the right. The parent owns the list and
// selection state.
export default function GovernoratesList({
  governorates,
  selectedGov,
  onSelect,
  onEdit,
  onDelete,
}: {
  governorates: Governorate[];
  selectedGov: Governorate | null;
  onSelect: (gov: Governorate) => void;
  onEdit: (gov: Governorate) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
          {t('المحافظات المسجلة', 'Governorates List')} ({governorates.length})
        </span>
        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
          {t('تحديث حي', 'Live Hydrated')}
        </span>
      </div>

      <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
        {governorates.map((gov) => {
          const isSelected = selectedGov?.id === gov.id;
          return (
            <div
              key={gov.id}
              onClick={() => onSelect(gov)}
              className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                isSelected ? 'bg-blue-50/80 border-s-4 border-blue-600' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-slate-700">
                  {gov.code}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{gov.name.ar}</span>
                    <span className="text-xs text-slate-500 font-medium">({gov.name.en})</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">
                    {gov.region} • {gov.institutionsCount || 0} {t('مؤسسة', 'institutions')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(gov);
                  }}
                  className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-white transition-colors"
                  title={t('تعديل', 'Edit')}
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(gov.id);
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors"
                  title={t('حذف', 'Delete')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
