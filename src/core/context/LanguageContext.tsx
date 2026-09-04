'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage } from '../types/masterData';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  dir: 'rtl' | 'ltr';
  t: (arText: string, enText: string, kuText?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>('ar');

  useEffect(() => {
    const saved = localStorage.getItem('eduraq_lang') as SupportedLanguage;
    if (saved && (saved === 'ar' || saved === 'en' || saved === 'ku')) {
      setLanguageState(saved);
    }
  }, []);

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
