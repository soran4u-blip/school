'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useLanguage } from '@/core/context/LanguageContext';
import { localeHref } from '@/lib/locale';
import {
  Governorate,
  Category,
  QuickSearchTag,
  SystemSettings,
  TaxonomyItem,
  CMSBanner
} from '@/core/types/masterData';
import { Institution } from '@/core/types/institution';
import { Tutor } from '@/core/types/tutor';
import { Megaphone } from 'lucide-react';
import HeroSearchSection from './_components/HeroSearchSection';
import CategoriesGrid from './_components/CategoriesGrid';
import FeaturedInstitutionsSection from './_components/FeaturedInstitutionsSection';
import AdBannerSection from './_components/AdBannerSection';
import GovernoratesExplorer from './_components/GovernoratesExplorer';
import FeaturedTutorsSection from './_components/FeaturedTutorsSection';

// The homepage's directory content is fetched on the server (./page.tsx) and handed in, so the
// featured institutions and tutors are in the initial HTML. Only the hero search stays stateful.
export default function HomeContent({
  categories,
  governorates,
  quickTags,
  featuredInstitutions,
  featuredTutors,
  subjects,
  settings,
  banners,
}: {
  categories: Category[];
  governorates: Governorate[];
  quickTags: QuickSearchTag[];
  featuredInstitutions: Institution[];
  featuredTutors: Tutor[];
  subjects: TaxonomyItem[];
  settings: SystemSettings;
  banners: CMSBanner[];
}) {
  const { language, t } = useLanguage();
  const router = useRouter();

  // Search hero states
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [searchGovernorate, setSearchGovernorate] = useState('');

  const submitHeroSearch = () => {
    const params = new URLSearchParams();
    if (searchKeyword.trim()) params.append('q', searchKeyword.trim());
    if (searchCategory) params.append('category', searchCategory);
    if (searchGovernorate) params.append('governorate', searchGovernorate);
    router.push(`${localeHref('/explore', language)}?${params.toString()}`);
  };

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    submitHeroSearch();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Top Emergency Announcement Ticker (Managed from Superadmin Dashboard) */}
      {settings.emergencyAnnouncement?.enabled && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-xs">
          <Megaphone className="w-4 h-4 shrink-0 animate-bounce" />
          <span>
            {language === 'en'
              ? settings.emergencyAnnouncement.text.en
              : settings.emergencyAnnouncement.text.ar}
          </span>
        </div>
      )}

      <HeroSearchSection
        categories={categories}
        governorates={governorates}
        quickTags={quickTags}
        featuredInstitutions={featuredInstitutions}
        featuredTutors={featuredTutors}
        subjects={subjects}
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
        searchCategory={searchCategory}
        setSearchCategory={setSearchCategory}
        searchGovernorate={searchGovernorate}
        setSearchGovernorate={setSearchGovernorate}
        submitHeroSearch={submitHeroSearch}
        handleHeroSearch={handleHeroSearch}
      />

      <CategoriesGrid categories={categories} />

      <FeaturedInstitutionsSection
        featuredInstitutions={featuredInstitutions}
        governorates={governorates}
        categories={categories}
      />

      <AdBannerSection banners={banners} />

      <GovernoratesExplorer governorates={governorates} />

      <FeaturedTutorsSection featuredTutors={featuredTutors} />

      {/* Dual CTA Banner */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="bg-linear-to-r from-[#0B192C] to-[#1E3E62] text-white p-8 sm:p-12 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-start max-w-xl">
            <span className="text-xs font-bold text-[#F1C40F] uppercase tracking-wider">{t('لأصحاب المؤسسات والمدارس', 'For School & University Owners')}</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              {t('هل تمثل مدرسة أو جامعة أو مركز تدريب في العراق؟', 'Are you representing an educational institution in Iraq?')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t(
                'انضم إلى أكبر دليل تعليمي وطني موحد للوصول إلى آلاف الطلبة وأولياء الأمور الباحثين عن التسجيل للعام الدراسي الجديد.',
                'Register your institution on Eduraq to reach thousands of students and parents actively seeking enrollment.'
              )}
            </p>
          </div>

          <Link
            href="/apply"
            className="px-8 py-3.5 bg-[#F1C40F] hover:bg-[#D4AC0D] text-[#0B192C] font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-all active:scale-95 shrink-0"
          >
            {t('سجل مؤسستك التعليمية الآن', '+ Register Your Institution')}
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
