'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, UserCheck, BookOpen } from 'lucide-react';
import { useLanguage } from '@/core/context/LanguageContext';
import { getInstitutions } from '@/core/services/institutionService';
import { getTutors } from '@/core/services/tutorService';
import { getTaxonomies } from '@/core/services/masterDataService';
import { Institution } from '@/core/types/institution';
import { Tutor } from '@/core/types/tutor';
import { TaxonomyItem } from '@/core/types/masterData';
import { getSearchSuggestions, SearchSuggestion } from '@/core/services/searchService';

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  // Optional preloaded lists (e.g. a page that already fetched institutions) — avoids a duplicate fetch.
  preloadedInstitutions?: Institution[];
  preloadedTutors?: Tutor[];
}

const ICONS: Record<SearchSuggestion['type'], React.ReactNode> = {
  institution: <Building2 className="w-4 h-4 text-blue-600" />,
  tutor: <UserCheck className="w-4 h-4 text-emerald-600" />,
  subject: <BookOpen className="w-4 h-4 text-amber-600" />,
};

export default function SearchAutocomplete({
  value,
  onChange,
  onSubmit,
  placeholder,
  className,
  inputClassName,
  preloadedInstitutions,
  preloadedTutors,
}: SearchAutocompleteProps) {
  const { language } = useLanguage();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [institutions, setInstitutions] = useState<Institution[]>(preloadedInstitutions || []);
  const [tutors, setTutors] = useState<Tutor[]>(preloadedTutors || []);
  const [subjects, setSubjects] = useState<TaxonomyItem[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (preloadedInstitutions) setInstitutions(preloadedInstitutions);
  }, [preloadedInstitutions]);

  useEffect(() => {
    if (preloadedTutors) setTutors(preloadedTutors);
  }, [preloadedTutors]);

  async function ensureDataLoaded() {
    if (dataLoaded) return;
    setDataLoaded(true); // set immediately so a second focus doesn't refetch while the first is in flight
    const [insts, tuts, subs] = await Promise.all([
      preloadedInstitutions ? Promise.resolve(preloadedInstitutions) : getInstitutions({}),
      preloadedTutors ? Promise.resolve(preloadedTutors) : getTutors({}),
      getTaxonomies('SUBJECT'),
    ]);
    setInstitutions(insts);
    setTutors(tuts);
    setSubjects(subs);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const suggestions = value.trim()
    ? getSearchSuggestions(value, { institutions, tutors, subjects }, language)
    : [];

  const selectSuggestion = (s: SearchSuggestion) => {
    setOpen(false);
    router.push(s.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className || ''}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setActiveIndex(-1);
          setOpen(true);
        }}
        onFocus={() => {
          ensureDataLoaded();
          setOpen(true);
        }}
        onKeyDown={(e) => {
          handleKeyDown(e);
          if (e.key === 'Enter' && activeIndex < 0) onSubmit();
        }}
        placeholder={placeholder}
        className={inputClassName}
      />

      {open && suggestions.length > 0 && (
        <div className="absolute z-40 top-full mt-2 start-0 w-full sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden text-start">
          {suggestions.map((s, i) => (
            <button
              key={`${s.type}-${s.id}`}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectSuggestion(s)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-start transition-colors ${
                i === activeIndex ? 'bg-slate-50' : 'hover:bg-slate-50'
              }`}
            >
              <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                {ICONS[s.type]}
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-bold text-slate-900 truncate">{s.label}</span>
                {s.sublabel && <span className="block text-[11px] text-slate-400 truncate">{s.sublabel}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
