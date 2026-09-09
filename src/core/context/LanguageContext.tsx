'use client';

import React, { createContext, useContext, useCallback, useEffect, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { SupportedLanguage } from '../types/masterData';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  dir: 'rtl' | 'ltr';
  t: (arText: string, enText: string, kuText?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'eduraq_lang';

function isSupported(value: string | null): value is SupportedLanguage {
  return value === 'ar' || value === 'en' || value === 'ku';
}

/* =========================================================
   The saved language preference, as an external store
========================================================= */
// localStorage is an external mutable store, so it's read through useSyncExternalStore rather
// than copied into state by an effect. The previous version did the latter — an effect that
// called setState synchronously on every pathname change — which meant an extra render pass on
// every navigation and, on the first paint, a flash of the wrong language before the effect ran.
//
// The `storage` event covers the same preference being changed in another tab; the local
// notifier covers setLanguage() in this one, since `storage` doesn't fire in the tab that wrote.
const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

function getStoredLanguage(): SupportedLanguage | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return isSupported(saved) ? saved : null;
  } catch {
    // Private mode / blocked site data — fall back to the default rather than crashing render.
    return null;
  }
}

// The server has no preference to read, so it renders the default and hydration matches.
function getServerLanguage(): SupportedLanguage | null {
  return null;
}

function storeLanguage(lang: SupportedLanguage): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Preference just won't persist; the in-tab value below still updates.
  }
  listeners.forEach((notify) => notify());
}

// There is only ever ONE LanguageProvider, mounted once at the root — a second, nested instance
// for the /en route tree was tried and reverted: both instances' `document.documentElement`
// sync effects would fire on mount (child effects before parent effects in React), so the outer
// (Arabic) provider always won the race and silently overwrote the inner one's lang/dir. Instead,
// this single provider derives its language from the URL itself: any route under /en pins English
// (matching what a crawler sees, since /en is exactly the route tree that exists for that
// purpose) and ignores the saved preference, which only applies to Arabic (unprefixed) routes.
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEnglishRoute = pathname === '/en' || pathname.startsWith('/en/');
  const stored = useSyncExternalStore(subscribe, getStoredLanguage, getServerLanguage);

  // Derived during render rather than mirrored into state, so crossing the /en boundary on a
  // client-side navigation needs no re-sync pass.
  const language: SupportedLanguage = isEnglishRoute ? 'en' : (stored ?? 'ar');

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    storeLanguage(lang);
  }, []);

  // Genuinely an external system: the <html> element is outside React's tree.
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
