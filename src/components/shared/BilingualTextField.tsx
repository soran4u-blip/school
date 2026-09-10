'use client';

import React from 'react';

// A side-by-side Arabic/English text input pair, matching the label+input block repeated
// throughout the institution and tutor profile forms (name, tagline, title, etc).
export default function BilingualTextField({
  labelAr,
  labelEn,
  valueAr,
  valueEn,
  onChangeAr,
  onChangeEn,
  placeholderAr,
  placeholderEn,
  required = false,
}: {
  labelAr: string;
  labelEn: string;
  valueAr: string;
  valueEn: string;
  onChangeAr: (value: string) => void;
  onChangeEn: (value: string) => void;
  placeholderAr?: string;
  placeholderEn?: string;
  required?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">{labelAr}</label>
        <input
          type="text"
          required={required}
          placeholder={placeholderAr}
          value={valueAr}
          onChange={(e) => onChangeAr(e.target.value)}
          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">{labelEn}</label>
        <input
          type="text"
          required={required}
          placeholder={placeholderEn}
          value={valueEn}
          onChange={(e) => onChangeEn(e.target.value)}
          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
        />
      </div>
    </div>
  );
}
