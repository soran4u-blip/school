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
import { ArrowRight, CheckCircle2, MapPin, Search, ShieldCheck } from 'lucide-react';

const HERO_IMAGE_URL = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80';

// Search remains the hero's only interaction. The calmer background and raised search card make
// that action the clear visual focal point without changing the directory query it produces.
export default function HeroSearchSection({
  categories,
  governorates,
  quickTags,
  featuredInstitutions,
  featuredTutors,
  subjects,
  searchKeyword,
  setSearchKeyword,
  searchCategory,
  setSearchCategory,
  searchGovernorate,
  setSearchGovernorate,
  submitHeroSearch,
  handleHeroSearch,
}: {
  categories: Category[];
  governorates: Governorate[];
  quickTags: QuickSearchTag[];
  featuredInstitutions: Institution[];
  featuredTutors: Tutor[];
  subjects: TaxonomyItem[];
  searchKeyword: string;
  setSearchKeyword: (value: string) => void;
  searchCategory: string;
  setSearchCategory: (value: string) => void;
  searchGovernorate: string;
  setSearchGovernorate: (value: string) => void;
  submitHeroSearch: () => void;
  handleHeroSearch: (e: React.FormEvent) => void;
}) {
  const { language, t } = useLanguage();

  return (
    <section className="relative isolate overflow-hidden bg-[#123D35] px-4 py-14 text-white sm:px-6 sm:py-18 lg:px-8 lg:py-22">
      <Image
        src={HERO_IMAGE_URL}
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-[center_30%] opacity-35"
      />
      <div className="absolute inset-0 -z-10 bg-linear-to-b from-[#123D35]/70 via-[#123D35]/82 to-[#071220]/96" />
      <div className="pointer-events-none absolute -top-40 start-[8%] -z-10 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 end-[8%] -z-10 h-96 w-96 rounded-full bg-[#D9F27C]/10 blur-3xl" />

      <div className="relative mx-auto max-w-5xl text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-[10px] font-bold tracking-wide text-slate-200 backdrop-blur-sm sm:text-[11px]">
          <ShieldCheck className="h-3.5 w-3.5 text-[#D9F27C]" aria-hidden="true" />
          {t('دليل التعليم في العراق', 'Iraq education directory')}
        </div>

        <h1 className="mx-auto mt-5 max-w-4xl text-3xl font-extrabold leading-[1.22] tracking-tight text-balance sm:mt-6 sm:text-5xl lg:text-6xl">
          {t('مستقبل أفضل يبدأ باختيار التعليم المناسب', 'A better future starts with the right education.')}
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:mt-5 sm:text-base sm:leading-8">
          {t(
            'اكتشف المدارس، قارن الخيارات، تعرّف على المدرّسين، واتخذ قرارك بثقة — كل ما تحتاجه للتعليم في العراق.',
            'Explore trusted schools, compare your options, discover tutors, and make confident education decisions across Iraq.'
          )}
        </p>

        <form
          onSubmit={handleHeroSearch}
          className="relative mx-auto mt-8 max-w-5xl rounded-2xl border border-white/40 bg-white p-2 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.72)] sm:mt-10 sm:rounded-3xl sm:p-3"
        >
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_11rem_12.5rem_auto] sm:items-center sm:gap-0">
            <div className="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-3 text-slate-800 sm:bg-transparent sm:px-4">
              <Search className="h-5 w-5 shrink-0 text-[#28675A]" aria-hidden="true" />
              <SearchAutocomplete
                value={searchKeyword}
                onChange={setSearchKeyword}
                onSubmit={submitHeroSearch}
                placeholder={t('ابحث عن مدرسة، جامعة، تخصص، أو أستاذ...', 'Search a school, university, major, or tutor...')}
                className="w-full"
                inputClassName="w-full bg-transparent text-xs font-semibold text-slate-800 outline-hidden placeholder:text-slate-400 sm:text-sm"
                institutions={featuredInstitutions}
                tutors={featuredTutors}
                subjects={subjects}
              />
            </div>

            <div className="border-t border-slate-100 pt-2 sm:border-t-0 sm:border-s sm:px-3 sm:pt-0">
              <label className="sr-only" htmlFor="hero-category">{t('الفئة', 'Category')}</label>
              <select
                id="hero-category"
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className="w-full cursor-pointer rounded-xl bg-slate-50 px-3 py-3 text-xs font-bold text-slate-700 outline-hidden sm:bg-transparent sm:px-1"
              >
                <option value="">{t('كافة الفئات', 'All Categories')}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>{language === 'en' ? cat.name.en : cat.name.ar}</option>
                ))}
              </select>
            </div>

            <div className="border-t border-slate-100 pt-2 sm:border-t-0 sm:border-s sm:px-3 sm:pt-0">
              <label className="sr-only" htmlFor="hero-governorate">{t('المحافظة', 'Governorate')}</label>
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 sm:bg-transparent sm:px-1">
                <MapPin className="h-4 w-4 shrink-0 text-[#28675A]" aria-hidden="true" />
                <select
                  id="hero-governorate"
                  value={searchGovernorate}
                  onChange={(e) => setSearchGovernorate(e.target.value)}
                  className="w-full cursor-pointer bg-transparent text-xs font-bold text-slate-700 outline-hidden"
                >
                  <option value="">{t(`كافة المحافظات (${governorates.length})`, `All ${governorates.length} Governorates`)}</option>
                  {governorates.map((gov) => (
                    <option key={gov.id} value={gov.id}>{language === 'en' ? gov.name.en : gov.name.ar}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-[#D9F27C] px-6 py-3.5 text-xs font-extrabold text-[#123D35] shadow-sm transition-all hover:bg-[#C2DF65] active:scale-[0.98] sm:ms-3 sm:rounded-2xl sm:px-5"
            >
              <span>{t('ابحث الآن', 'Search')}</span>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </button>
          </div>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-slate-300 sm:mt-6 sm:text-xs">
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#D9F27C]" aria-hidden="true" />{t('مؤسسات مدرجة', 'Directory listings')}</span>
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#D9F27C]" aria-hidden="true" />{t(`${governorates.length} محافظة`, `${governorates.length} governorates`)}</span>
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#D9F27C]" aria-hidden="true" />{t('قرارات أوضح للأهالي', 'Clearer choices for families')}</span>
        </div>

        {quickTags.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:mt-6">
            <span className="me-1 text-[11px] font-medium text-slate-400">{t('عمليات بحث شائعة', 'Popular searches')}</span>
            {quickTags.map((tag) => (
              <Link
                key={tag.id}
                href={`${localeHref('/explore', language)}?${tag.categoryId ? `category=${tag.categoryId}&` : ''}${tag.governorateId ? `governorate=${tag.governorateId}&` : ''}${tag.keyword ? `q=${tag.keyword}` : ''}`}
                className="rounded-full border border-white/12 bg-white/7 px-3 py-1.5 text-[11px] font-semibold text-slate-200 transition-colors hover:border-white/25 hover:bg-white/14 hover:text-white"
              >
                {language === 'en' ? tag.label.en : tag.label.ar}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
