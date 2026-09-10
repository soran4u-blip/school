'use client';

import React from 'react';

export interface ChipOption {
  id: string;
  label: string;
}

// The checkbox-chip multi-select group repeated across the institution and tutor profile forms
// (accreditations/taxonomies, delivery mode, subjects, student levels). Each option renders as a
// hidden checkbox behind a styled label so the whole chip is clickable.
export default function ChipMultiSelect({
  label,
  options,
  selected,
  onChange,
  activeClassName = 'bg-blue-600 text-white border-blue-600',
  emptyMessage,
}: {
  label: string;
  options: ChipOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  activeClassName?: string;
  emptyMessage?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = selected.includes(option.id);
          return (
            <label
              key={option.id}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer border transition-colors ${
                checked ? activeClassName : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={checked}
                onChange={(e) => {
                  const ids = new Set(selected);
                  if (e.target.checked) ids.add(option.id); else ids.delete(option.id);
                  onChange(Array.from(ids));
                }}
              />
              {option.label}
            </label>
          );
        })}
        {options.length === 0 && emptyMessage && (
          <span className="text-[11px] text-slate-400">{emptyMessage}</span>
        )}
      </div>
    </div>
  );
}
