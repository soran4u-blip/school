'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/core/context/LanguageContext';
import { useT } from '@/lib/useT';
import { Building2, CheckCircle2, ChevronRight, Flame, GraduationCap, Plus, ShieldCheck } from 'lucide-react';
import { COMMUNITY_COPY } from '../Community.i18n';

// Search terms stay Arabic: posts are mostly written in Arabic, so the chip's label is translated
// but the query it fills in has to match the posts' own text.
const POPULAR_TOPICS = [
  { label: 'topicIntl', query: 'دولية' },
  { label: 'topicFees', query: 'أقساط' },
  { label: 'topicTransport', query: 'نقل' },
  { label: 'topicKg', query: 'رياض الأطفال' },
  { label: 'topicExams', query: 'متوسط' },
] as const;

// Guidelines, trending topics and the link back to the directory.
export default function CommunitySidebar({ setSearchQuery }: { setSearchQuery: (value: string) => void }) {
  const { language } = useLanguage();
  const t = useT(COMMUNITY_COPY);
  const isRtl = language !== 'en';

  return (
    <div className="lg:col-span-4 space-y-6">
      {/* Widget 1: Community Guidelines & Safe Space */}
      <div className="bg-white rounded-2xl border border-[#E8E6DE] p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">
              {t('safeTitle')}
            </h3>
            <p className="text-[11px] text-slate-400">{t('rulesTitle')}</p>
          </div>
        </div>

        <div className="space-y-2.5 text-xs text-slate-600 font-medium leading-relaxed">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>{t('rule1')}</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>{t('rule2')}</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>{t('rule3')}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <Link
            href="/community/new"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-[#123D35] rounded-xl text-xs font-bold border border-[#E8E6DE] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('startDiscussion')}</span>
          </Link>
        </div>
      </div>

      {/* Widget 2: Popular Community Topics */}
      <div className="bg-white rounded-2xl border border-[#E8E6DE] p-4 sm:p-5 shadow-sm space-y-3.5">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>{t('trending')}</span>
        </h3>

        <div className="flex flex-wrap gap-1.5">
          {POPULAR_TOPICS.map((topic, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSearchQuery(topic.query)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-[#28675A] border border-[#E8E6DE] transition-colors"
            >
              #{t(topic.label)}
            </button>
          ))}
        </div>
      </div>

      {/* Widget 3: Directory Bridge CTA */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
          <Building2 className="w-4 h-4 text-amber-600" />
          <span>{t('bridgeTitle')}</span>
        </div>
        <p className="text-xs text-amber-800 leading-relaxed">
          {t('bridgeBody')}
        </p>
        <div className="pt-1 flex items-center gap-2">
          <Link
            href="/explore"
            className="inline-flex items-center gap-1 text-xs font-black text-amber-950 hover:underline"
          >
            <span>{t('exploreDirectory')}</span>
            {isRtl ? <ChevronRight className="w-3.5 h-3.5 rotate-180" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </Link>
          <span className="text-amber-400">|</span>
          <Link
            href="/tutors"
            className="inline-flex items-center gap-1 text-xs font-black text-amber-950 hover:underline"
          >
            <GraduationCap className="w-3.5 h-3.5 text-amber-700" />
            <span>{t('privateTutors')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
