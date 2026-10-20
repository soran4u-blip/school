'use client';

import React from 'react';
import type { LocalizedString } from '@/core/types/masterData';

const LANGUAGES = ['ar', 'en', 'ku'] as const;
type FieldLanguage = (typeof LANGUAGES)[number];

// One input (or textarea) per language for a LocalizedString — Arabic, English and Sorani —
// replacing the hand-rolled ar/en pairs in the owner dashboards. Writing one language spreads the
// existing value, so editing `ar` never drops a Sorani `ku` that was already saved.
//
// `compact` is the placeholder-only layout used inside editor cards; the default is labelled
// fields like the profile forms. The Latin-script input is left-to-right, the other two right-to-left.
export default function LocalizedField({
  value,
  onChange,
  labels,
  placeholders,
  multiline = false,
  rows = 3,
  required = false,
  compact = false,
  inputClassName = 'w-full px-3 py-2 text-xs border border-slate-200 rounded-lg',
}: {
  value: Partial<LocalizedString> | undefined;
  onChange: (next: LocalizedString) => void;
  labels: Record<FieldLanguage, string>;
  placeholders?: Partial<Record<FieldLanguage, string>>;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
  compact?: boolean;
  inputClassName?: string;
}) {
  const current: LocalizedString = { ar: value?.ar ?? '', en: value?.en ?? '', ku: value?.ku ?? '' };
  const set = (language: FieldLanguage, text: string) => onChange({ ...current, [language]: text });

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 ${compact ? 'gap-2' : 'gap-4'}`}>
      {LANGUAGES.map((language) => {
        const common = {
          value: current[language] ?? '',
          placeholder: placeholders?.[language] ?? (compact ? labels[language] : undefined),
          dir: language === 'en' ? ('ltr' as const) : ('rtl' as const),
          className: inputClassName,
        };
        return (
          <div key={language}>
            {!compact && <label className="block text-xs font-bold text-slate-700 mb-1">{labels[language]}</label>}
            {multiline ? (
              <textarea rows={rows} {...common} onChange={(e) => set(language, e.target.value)} />
            ) : (
              <input type="text" required={required && language !== 'ku'} {...common} onChange={(e) => set(language, e.target.value)} />
            )}
          </div>
        );
      })}
    </div>
  );
}
