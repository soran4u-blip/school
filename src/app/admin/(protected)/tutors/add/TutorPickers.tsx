'use client';

import React from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { useT } from '@/lib/useT';
import { pickLocalized } from '@/lib/localized';
import { Tutor } from '@/core/types/tutor';
import { TaxonomyItem } from '@/core/types/masterData';
import { TUTORS_COPY } from '../Tutors.i18n';

type Form = Partial<Tutor>;
type SetForm = (form: Form) => void;

const CHIP_BASE = 'px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer border transition-colors';
const CHIP_OFF = 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100';

/** Delivery-mode, subject and grade checkbox chips of the tutor form. */
export function DeliveryModePicker({ form, setForm }: { form: Form; setForm: SetForm }) {
  const t = useT(TUTORS_COPY);

  const toggleDeliveryMode = (mode: 'ONLINE' | 'IN_PERSON' | 'HYBRID') => {
    const set = new Set(form.deliveryMode || []);
    if (set.has(mode)) set.delete(mode); else set.add(mode);
    setForm({ ...form, deliveryMode: Array.from(set) });
  };

  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-2">{t('deliveryMode')}</label>
      <div className="flex gap-2">
        {(['ONLINE', 'IN_PERSON', 'HYBRID'] as const).map(mode => {
          const checked = form.deliveryMode?.includes(mode) || false;
          return (
            <label
              key={mode}
              className={`${CHIP_BASE} ${checked ? 'bg-emerald-600 text-white border-emerald-600' : CHIP_OFF}`}
            >
              <input type="checkbox" className="hidden" checked={checked} onChange={() => toggleDeliveryMode(mode)} />
              {mode.replace('_', ' ')}
            </label>
          );
        })}
      </div>
    </div>
  );
}

interface TaxonomyPickerProps {
  form: Form;
  setForm: SetForm;
  field: 'subjectIds' | 'studentLevelIds';
  items: TaxonomyItem[];
  label: string;
  emptyText: string;
}

/** A wrap of checkbox chips toggling ids in `form[field]`. */
export function TaxonomyPicker({ form, setForm, field, items, label, emptyText }: TaxonomyPickerProps) {
  const { language } = useLanguage();

  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {items.map(item => {
          const checked = form[field]?.includes(item.id) || false;
          return (
            <label
              key={item.id}
              className={`${CHIP_BASE} ${checked ? 'bg-blue-600 text-white border-blue-600' : CHIP_OFF}`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={checked}
                onChange={(e) => {
                  const ids = new Set(form[field] || []);
                  if (e.target.checked) ids.add(item.id); else ids.delete(item.id);
                  setForm({ ...form, [field]: Array.from(ids) });
                }}
              />
              {pickLocalized(item.name, language)}
            </label>
          );
        })}
        {items.length === 0 && <span className="text-[11px] text-slate-400">{emptyText}</span>}
      </div>
    </div>
  );
}
