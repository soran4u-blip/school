'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
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
import { EduEvent } from '@/core/types/event';
import { Megaphone } from 'lucide-react';
import HeroSearchSection from './_components/HeroSearchSection';
import CategoriesGrid from './_components/CategoriesGrid';
import FeaturedInstitutionsSection from './_components/FeaturedInstitutionsSection';
import GovernoratesExplorer from './_components/GovernoratesExplorer';
import FeaturedTutorsSection from './_components/FeaturedTutorsSection';
import UpcomingEventsSection from './_components/UpcomingEventsSection';

// The banner it picks is decided by Math.random() — server-rendering that content would have the
// server's random pick baked into the HTML, but hydration re-runs the same random draw on the
// client and (being random) gets a different answer, which React treats as a hydration mismatch
// and throws away/re-renders the whole subtree on every single page load. Skipping SSR for this
// one component sidesteps the mismatch entirely: nothing is rendered until the client picks once.
const AdBannerSection = dynamic(() => import('./_components/AdBannerSection'), { ssr: false });

// The homepage's directory content is fetched on the server (./page.tsx) and handed in, so the
// featured institutions and tutors are in the initial HTML. Only the hero search stays stateful.
export default function HomeContent({
  categories,
  governorates,
  quickTags,
  featuredInstitutions,
  directoryInstitutions,
  featuredTutors,
  subjects,
  settings,
  banners,
  upcomingEvents,
}: {
  categories: Category[];
  governorates: Governorate[];
  quickTags: QuickSearchTag[];
  featuredInstitutions: Institution[];
  directoryInstitutions: Institution[];
  featuredTutors: Tutor[];
  subjects: TaxonomyItem[];
  settings: SystemSettings;
  banners: CMSBanner[];
  upcomingEvents: EduEvent[];
}) {
  const { language, t } = useLanguage();
  const router = useRouter();

  // Search hero states
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [searchGovernorate, setSearchGovernorate] = useState('');

  const submitHeroSearch = () => {
    if (searchCategory === 'tutors') {
      router.push(localeHref('/tutors', language));
      return;
    }

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

  const liveCategories = categories.map((category) => ({
    ...category,
    institutionsCount:
      category.slug === 'tutors'
        ? featuredTutors.length
        : directoryInstitutions.filter((institution) => institution.categoryId === category.id).length,
  }));
  const liveGovernorates = governorates.map((governorate) => ({
    ...governorate,
    institutionsCount: directoryInstitutions.filter(
      (institution) => institution.governorateId === governorate.id
    ).length,
  }));
  const emergencyAnnouncement = settings.emergencyAnnouncement;
  const announcementText = `${emergencyAnnouncement?.text.ar ?? ''} ${emergencyAnnouncement?.text.en ?? ''}`;
  const announcementYearRange = announcementText.match(/\b20\d{2}[-/]20\d{2}\b/);
  const announcementEndYear = announcementYearRange ? Number(announcementYearRange[0].slice(-4)) : null;
  const showEmergencyAnnouncement = Boolean(
    emergencyAnnouncement?.enabled &&
      (announcementEndYear === null || announcementEndYear >= new Date().getFullYear())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Top Emergency Announcement Ticker (Managed from Superadmin Dashboard) */}
      {showEmergencyAnnouncement && emergencyAnnouncement && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-xs">
          <Megaphone className="w-4 h-4 shrink-0 animate-bounce" />
          <span>
            {language === 'en'
              ? emergencyAnnouncement.text.en
              : emergencyAnnouncement.text.ar}
          </span>
        </div>
      )}

      <HeroSearchSection
        categories={liveCategories}
        governorates={liveGovernorates}
        quickTags={quickTags}
         featuredInstitutions={directoryInstitutions}
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

      <CategoriesGrid categories={liveCategories} />

      <FeaturedInstitutionsSection
        featuredInstitutions={featuredInstitutions}
        governorates={liveGovernorates}
        categories={liveCategories}
      />

      <AdBannerSection banners={banners} />

      <GovernoratesExplorer governorates={liveGovernorates} />

      <FeaturedTutorsSection featuredTutors={featuredTutors} />

      <UpcomingEventsSection events={upcomingEvents} />

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
