'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Languages } from 'lucide-react';
import { useLanguage } from '@/core/context/LanguageContext';
import { localizedPathFor } from '@/lib/locale';
import { LOCALES, SUPPORTED_LANGUAGES } from '@/lib/locales';
import type { SupportedLanguage } from '@/core/types/masterData';

// Switching saves the preference (which unprefixed pages follow) and, when the current page has a
// URL in the target language's route tree, moves there too so the address, the crawler-visible
// language and the on-screen language stay the same thing.
function useSwitchLanguage() {
  const { language, setLanguage } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();

  return (target: SupportedLanguage) => {
    if (target === language) return;
    setLanguage(target);
    const nextPath = localizedPathFor(pathname, target);
    if (nextPath) {
      router.push(`${nextPath}${window.location.search}`);
      router.refresh();
    }
  };
}

export default function LanguageSwitcher({ variant }: { variant: 'bar' | 'compact' | 'dark' }) {
  const { language } = useLanguage();
  const switchLanguage = useSwitchLanguage();

  if (variant === 'compact') {
    return (
      <select
        value={language}
        onChange={(e) => switchLanguage(e.target.value as SupportedLanguage)}
        aria-label="Language"
        className="px-2 py-1 text-xs font-bold border border-slate-200 rounded bg-white text-slate-700"
      >
        {SUPPORTED_LANGUAGES.map((code) => (
          <option key={code} value={code}>{LOCALES[code].shortName}</option>
        ))}
      </select>
    );
  }

  const idle = variant === 'dark' ? 'text-slate-300 hover:text-white' : 'hover:text-white';
  const active = variant === 'dark' ? 'text-white' : 'text-white';
  return (
    <div className="flex items-center gap-2" role="group" aria-label="Language">
      <Languages className="w-3 h-3" aria-hidden="true" />
      {SUPPORTED_LANGUAGES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => switchLanguage(code)}
          aria-pressed={language === code}
          lang={LOCALES[code].htmlLang}
          className={`transition-colors ${language === code ? `${active} font-bold` : idle}`}
        >
          {LOCALES[code].nativeName}
        </button>
      ))}
    </div>
  );
}
