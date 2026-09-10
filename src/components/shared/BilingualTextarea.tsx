'use client';

import React from 'react';

// The textarea counterpart to BilingualTextField — a side-by-side Arabic/English textarea pair.
export default function BilingualTextarea({
  labelAr,
  labelEn,
  valueAr,
  valueEn,
  onChangeAr,
  onChangeEn,
  rows = 3,
}: {
  labelAr: string;
  labelEn: string;
  valueAr: string;
  valueEn: string;
  onChangeAr: (value: string) => void;
  onChangeEn: (value: string) => void;
  rows?: number;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">{labelAr}</label>
        <textarea
          rows={rows}
          value={valueAr}
          onChange={(e) => onChangeAr(e.target.value)}
          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">{labelEn}</label>
        <textarea
          rows={rows}
          value={valueEn}
          onChange={(e) => onChangeEn(e.target.value)}
          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
        />
      </div>
    </div>
  );
}
