'use client';

import React from 'react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useLanguage } from '@/core/context/LanguageContext';

export interface LegalContent {
  title: string;
  updated: string;
  sections: { h: string; p: string }[];
}

// Shared layout of the privacy policy and terms of use pages; each page supplies its copy per language.
export default function LegalPage({ content }: { content: Record<'ar' | 'en' | 'ku', LegalContent> }) {
  const { language } = useLanguage();
  const c = content[language];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1">
        <h1 className="text-2xl font-extrabold text-[#0B192C] mb-1">{c.title}</h1>
        <p className="text-xs text-slate-400 mb-8">{c.updated}</p>
        <div className="space-y-6">
          {c.sections.map((s, i) => (
            <div key={i}>
              <h2 className="text-sm font-extrabold text-[#0B192C] mb-2">{s.h}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{s.p}</p>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
