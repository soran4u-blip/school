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
import { Search, MapPin, ArrowRight } from 'lucide-react';

// Students studying together — replaces the previous flat navy hero background. The dark gradient
// overlay below keeps the headline/search bar exactly as legible as they were against the solid
// color; only the ground behind them changed.
const HERO_IMAGE_URL = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80';

// The homepage's hero section: the headline, the OmniSearch bar (keyword + category +
// governorate), and the popular-search quick tags. The parent owns the search field state and
// the submit handler.
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
    <section className="relative bg-[#0B192C] text-white pt-20 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Photo background + the same-strength navy gradient the flat color used to be, so the
          headline/search bar read exactly as they did before — only the ground changed. */}
      <Image
        src={HERO_IMAGE_URL}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_30%]"
      />
      <div className="absolute inset-0 bg-linear-to-b from-[#0B192C]/88 via-[#0B192C]/80 to-[#0B192C]/93"></div>

      {/* Subtle geometric background patterns */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#F1C40F_1px,transparent_1px)] [background-size:24px_24px]"></div>
      <div className="absolute top-0 end-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative max-w-5xl mx-auto text-center space-y-6">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
          {t(
            'اكتشف الخيار الأنسب... واتخذ القرار الصحيح',
            'Find the Right School. Make the Right Decision.'
          )}
        </h1>

        <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
          {t(
            'قارن بين المدارس، اطّلع على تقييمات حقيقية، اسأل مجتمعك المحلي، واحجز مدرّسك — كل ما تحتاجه قبل اتخاذ القرار، في جميع المحافظات الـ18.',
            'Compare schools, read real reviews, ask your community, and book a tutor — everything you need before you commit, across all 18 governorates.'
          )}
        </p>

        {/* OmniSearch Bar */}
        <form
          onSubmit={handleHeroSearch}
          className="mt-8 bg-white p-3 rounded-2xl sm:rounded-full shadow-2xl flex flex-col sm:flex-row items-center gap-2 max-w-4xl mx-auto border border-slate-200/50 text-slate-800"
        >
          {/* Input Keyword */}
          <div className="flex items-center gap-2.5 px-4 w-full sm:flex-1 py-1.5">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <SearchAutocomplete
              value={searchKeyword}
              onChange={setSearchKeyword}
              onSubmit={submitHeroSearch}
              placeholder={t('ابحث عن اسم المدرسة، الجامعة، التخصص، أو الأستاذ...', 'Search school, university, major, or tutor...')}
              className="w-full"
              inputClassName="w-full text-xs sm:text-sm bg-transparent border-none outline-hidden placeholder:text-slate-400 font-medium"
              institutions={featuredInstitutions}
              tutors={featuredTutors}
              subjects={subjects}
            />
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2 px-3 w-full sm:w-44 py-1.5">
            <select
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className="w-full text-xs font-semibold bg-transparent border-none outline-hidden cursor-pointer text-slate-700"
            >
              <option value="">{t('كافة الفئات', 'All Categories')}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {language === 'en' ? cat.name.en : cat.name.ar}
                </option>
              ))}
            </select>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

          {/* Governorate Dropdown */}
          <div className="flex items-center gap-2 px-3 w-full sm:w-44 py-1.5">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={searchGovernorate}
              onChange={(e) => setSearchGovernorate(e.target.value)}
              className="w-full text-xs font-semibold bg-transparent border-none outline-hidden cursor-pointer text-slate-700"
            >
              <option value="">{t('كافة المحافظات (18)', 'All Governorates')}</option>
              {governorates.map((gov) => (
                <option key={gov.id} value={gov.id}>
                  {language === 'en' ? gov.name.en : gov.name.ar}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full sm:w-auto px-7 py-3 bg-[#F1C40F] hover:bg-[#D4AC0D] text-[#0B192C] font-extrabold text-xs sm:text-sm rounded-xl sm:rounded-full shadow-md transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
          >
            <span>{t('ابحث الآن', 'Search Directory')}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </form>

        {/* Quick Search Tags */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">{t('أكثر عمليات البحث طلباً:', 'Popular Searches:')}</span>
          {quickTags.map((tag) => (
            <Link
              key={tag.id}
              href={`${localeHref('/explore', language)}?${tag.categoryId ? `category=${tag.categoryId}&` : ''}${tag.governorateId ? `governorate=${tag.governorateId}&` : ''}${tag.keyword ? `q=${tag.keyword}` : ''}`}
              className="px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-colors"
            >
              {language === 'en' ? tag.label.en : tag.label.ar}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
