'use client';

import { useCallback } from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import type { SupportedLanguage } from '@/core/types/masterData';

/** One UI string in every language. All three are required, so a missing translation fails tsc. */
export interface Copy {
  ar: string;
  en: string;
  ku: string;
}

export type CopyDict<K extends string = string> = Record<K, Copy>;
export type CopyVars = Record<string, string | number>;

/**
 * Looks a string up in a feature's `*.i18n.ts` dictionary. `{name}` placeholders are filled from
 * `vars`, so word order can differ per language instead of being baked into template literals.
 * Falls back like `t()` does (ku -> ar -> en) if a value is blank at runtime.
 */
export function translate<K extends string>(
  dict: CopyDict<K>,
  key: K,
  language: SupportedLanguage,
  vars?: CopyVars,
): string {
  const copy = dict[key];
  const text = (language === 'ku' ? copy.ku || copy.ar || copy.en : copy[language]) ?? '';
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

/** Typed reader for a `*.i18n.ts` dictionary: `const t = useT(COPY); t('title')`. */
export function useT<K extends string>(dict: CopyDict<K>) {
  const { language } = useLanguage();
  return useCallback((key: K, vars?: CopyVars) => translate(dict, key, language, vars), [dict, language]);
}
