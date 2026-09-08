'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { SupportedLanguage } from '../types/masterData';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  dir: 'rtl' | 'ltr';
  t: (arText: string, enText: string, kuText?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// There is only ever ONE LanguageProvider, mounted once at the root — a second, nested instance
// for the /en route tree was tried and reverted: both instances' `document.documentElement`
// sync effects would fire on mount (child effects before parent effects in React), so the outer
// (Arabic) provider always won the race and silently overwrote the inner one's lang/dir. Instead,
// this single provider derives its starting language from the URL itself: any route under /en
// pins English for the first render (matching what a crawler sees, since /en is exactly the
// route tree that exists for that purpose) and skips the localStorage read that would otherwise
// only apply to Arabic (unprefixed) routes. Manual toggling (setLanguage) still works and still
// persists to localStorage as before; this only affects what the very first render shows.
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEnglishRoute = pathname === '/en' || pathname.startsWith('/en/');
  const [language, setLanguageState] = useState<SupportedLanguage>(isEnglishRoute ? 'en' : 'ar');

  // Re-syncs whenever a client-side navigation crosses the /en boundary (LanguageProvider lives
  // in the root layout, so it stays mounted across every route change — this can't rely on
  // mount-only initial state once the pathname changes under it).
  useEffect(() => {
    if (isEnglishRoute) {
      setLanguageState('en');
      return;
    }
    const saved = localStorage.getItem('eduraq_lang') as SupportedLanguage;
    setLanguageState(saved && (saved === 'ar' || saved === 'en' || saved === 'ku') ? saved : 'ar');
  }, [isEnglishRoute]);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('eduraq_lang', lang);
    document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.dir = language === 'en' ? 'ltr' : 'rtl';
    document.documentElement.lang = language;
  }, [language]);

  const dir = language === 'en' ? 'ltr' : 'rtl';

  const t = (arText: string, enText: string, kuText?: string): string => {
    if (language === 'en') return enText;
    if (language === 'ku' && kuText) return kuText;
    return arText;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, dir, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
