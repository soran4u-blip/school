'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/core/context/LanguageContext';
import { localeHref } from '@/lib/locale';
import SearchAutocomplete from '@/components/shared/SearchAutocomplete';
import { Governorate, Category, QuickSearchTag, TaxonomyItem } from '@/core/types/masterData';
import { Institution } from '@/core/types/institution';
import { Tutor } from '@/core/types/tutor';
import { ArrowRight, MapPin, Search, SlidersHorizontal } from 'lucide-react';

const HERO_IMAGE_URL = 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=2200&q=85';

export default function HeroSearchSection({
  categories, governorates, quickTags, featuredInstitutions, featuredTutors, subjects,
  searchKeyword, setSearchKeyword, searchCategory, setSearchCategory, searchGovernorate,
  setSearchGovernorate, submitHeroSearch, handleHeroSearch,
}: {
  categories: Category[]; governorates: Governorate[]; quickTags: QuickSearchTag[];
  featuredInstitutions: Institution[]; featuredTutors: Tutor[]; subjects: TaxonomyItem[];
  searchKeyword: string; setSearchKeyword: (value: string) => void;
  searchCategory: string; setSearchCategory: (value: string) => void;
  searchGovernorate: string; setSearchGovernorate: (value: string) => void;
  submitHeroSearch: () => void; handleHeroSearch: (e: React.FormEvent) => void;
}) {
  const { language, t } = useLanguage();
  const tabs = [
    { value: '', en: 'All', ar: 'الكل' },
    { value: 'schools', en: 'Schools', ar: 'المدارس' },
    { value: 'universities', en: 'Universities', ar: 'الجامعات' },
    { value: 'tutors', en: 'Tutors', ar: 'المدرسون' },
    { value: 'training_centers', en: 'Training', ar: 'التدريب' },
    { value: 'opportunities', en: 'Opportunities', ar: 'الفرص' },
  ];
  return (
    <section className="relative isolate overflow-hidden bg-[#f7f4ed] px-4 pb-8 pt-10 text-slate-900 sm:px-6 sm:pb-10 sm:pt-14 lg:px-8 lg:py-16">
      <Image src={HERO_IMAGE_URL} alt="" fill priority sizes="100vw" className="absolute inset-0 -z-20 object-cover object-center" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#f8f5ee] via-[#f8f5ee]/95 to-[#f8f5ee]/20" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-20 bg-gradient-to-t from-white/80 to-transparent" />
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="inline-flex items-center rounded-full border border-[#d5e3dc] bg-white/80 px-3 py-1.5 text-[11px] font-bold text-[#155c4d] shadow-sm">
            {t('دليل العراق التعليمي', 'IRAQ EDUCATION DIRECTORY')}
          </p>
          <h1 className="mt-4 max-w-2xl text-3xl font-black leading-[1.12] tracking-tight text-[#102b3e] sm:text-5xl lg:text-[3.45rem]">
            {t('مستقبل أكثر إشراقاً لكل متعلم في العراق', 'A brighter future for every learner in Iraq')}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-700 sm:text-base">
            {t('اكتشف المدارس والجامعات والمدرسين وبرامج التدريب والفرص — كل ما تحتاجه في مكان واحد.', 'Discover schools, universities, tutors, training programs and opportunities — all in one place.')}
          </p>
          <div className="mt-5 inline-flex max-w-full flex-wrap gap-1 rounded-full border border-white/90 bg-white/90 p-1 shadow-sm">
            {tabs.map((tab) => (
              <button key={tab.value} type="button" onClick={() => setSearchCategory(tab.value)}
                className={`rounded-full px-3.5 py-2 text-[11px] font-bold transition sm:px-4 ${searchCategory === tab.value ? 'bg-[#0b594d] text-white shadow-sm' : 'text-slate-600 hover:bg-[#edf4ef] hover:text-[#0b594d]'}`}>
                {language === 'en' ? tab.en : tab.ar}
              </button>
            ))}
          </div>
          <form onSubmit={handleHeroSearch} className="mt-2 max-w-3xl rounded-2xl border border-white bg-white p-2 shadow-[0_18px_45px_-24px_rgba(10,45,39,.55)] sm:rounded-[1.25rem] sm:p-2.5">
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_11rem_auto] sm:items-center">
              <div className="flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5">
                <Search className="h-5 w-5 shrink-0 text-[#17695a]" aria-hidden="true" />
                <SearchAutocomplete value={searchKeyword} onChange={setSearchKeyword} onSubmit={submitHeroSearch}
                  placeholder={t('ابحث بالاسم أو التخصص أو الكلمات المفتاحية...', 'Search by name, subject, or keyword...')}
                  className="w-full" inputClassName="w-full bg-transparent text-sm text-slate-800 outline-hidden placeholder:text-slate-400"
                  institutions={featuredInstitutions} tutors={featuredTutors} subjects={subjects} />
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-[#17695a]" aria-hidden="true" />
                <select aria-label={t('المحافظة', 'Governorate')} value={searchGovernorate} onChange={(e) => setSearchGovernorate(e.target.value)} className="w-full bg-transparent text-xs font-semibold text-slate-700 outline-hidden">
                  <option value="">{t('كل المحافظات', 'All Governorates')}</option>
                  {governorates.map((gov) => <option key={gov.id} value={gov.id}>{language === 'en' ? gov.name.en : gov.name.ar}</option>)}
                </select>
              </div>
              <button type="submit" className="flex items-center justify-center gap-2 rounded-xl bg-[#0b594d] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#12483f]">
                {t('بحث', 'Search')} <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </button>
            </div>
          </form>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-white/90 bg-white/80 px-3 py-1.5 text-[11px] text-slate-600"><SlidersHorizontal className="h-3 w-3" />{t('المستوى التعليمي', 'Education level')}</span>
            <span className="rounded-full border border-white/90 bg-white/80 px-3 py-1.5 text-[11px] text-slate-600">{t('الميزانية', 'Budget range')}⌄</span>
            <span className="rounded-full border border-white/90 bg-white/80 px-3 py-1.5 text-[11px] text-slate-600">{t('اللغة', 'Language')}⌄</span>
            <span className="rounded-full border border-white/90 bg-white/80 px-3 py-1.5 text-[11px] text-slate-600">{t('المنهج الدراسي', 'Curriculum')}⌄</span>
          </div>
          {quickTags.length > 0 && <div className="mt-3 flex flex-wrap gap-2">
            {quickTags.slice(0, 4).map((tag) => <Link key={tag.id} href={`${localeHref('/explore', language)}?${tag.categoryId ? `category=${tag.categoryId}&` : ''}${tag.governorateId ? `governorate=${tag.governorateId}&` : ''}${tag.keyword ? `q=${encodeURIComponent(tag.keyword)}` : ''}`} className="text-[11px] font-semibold text-[#155c4d] underline-offset-4 hover:underline">{language === 'en' ? tag.label.en : tag.label.ar}</Link>)}
          </div>}
        </div>
      </div>
    </section>
  );
}
