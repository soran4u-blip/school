'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useLanguage } from '@/core/context/LanguageContext';
import { getCategories, getGovernorates, getQuickSearchTags, getSystemSettings } from '@/core/services/masterDataService';
import { getInstitutions } from '@/core/services/institutionService';
import { getTutors } from '@/core/services/tutorService';
import SearchAutocomplete from '@/components/shared/SearchAutocomplete';
import { 
  Governorate, 
  Category, 
  QuickSearchTag, 
  SystemSettings 
} from '@/core/types/masterData';
import { Institution } from '@/core/types/institution';
import { Tutor } from '@/core/types/tutor';
import { 
  Search, 
  MapPin, 
  GraduationCap, 
  School, 
  BookOpen, 
  Award, 
  HeartHandshake, 
  UserCheck, 
  ShieldCheck, 
  Star, 
  ArrowRight, 
  Megaphone,
  CheckCircle2,
  Sparkles,
  PhoneCall,
  MessageSquare
} from 'lucide-react';
import { formatCurrencyIQD } from '@/lib/utils';

export default function HomePage() {
  const { language, t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [quickTags, setQuickTags] = useState<QuickSearchTag[]>([]);
  const [featuredInstitutions, setFeaturedInstitutions] = useState<Institution[]>([]);
  const [featuredTutors, setFeaturedTutors] = useState<Tutor[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Search hero states
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [searchGovernorate, setSearchGovernorate] = useState('');

  useEffect(() => {
    async function loadHomeData() {
      const [cats, govs, tags, insts, tuts, sysSettings] = await Promise.all([
        getCategories(),
        getGovernorates(),
        getQuickSearchTags(),
        getInstitutions({}),
        getTutors({}),
        getSystemSettings(),
      ]);

      setCategories(cats);
      setGovernorates(govs);
      setQuickTags(tags);
      setFeaturedInstitutions(insts);
      setFeaturedTutors(tuts);
      setSettings(sysSettings);
    }
    loadHomeData();
  }, []);

  const submitHeroSearch = () => {
    const params = new URLSearchParams();
    if (searchKeyword.trim()) params.append('q', searchKeyword.trim());
    if (searchCategory) params.append('category', searchCategory);
    if (searchGovernorate) params.append('governorate', searchGovernorate);
    window.location.href = `/explore?${params.toString()}`;
  };

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    submitHeroSearch();
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'GraduationCap': return <GraduationCap className="w-6 h-6" />;
      case 'School': return <School className="w-6 h-6" />;
      case 'BookOpen': return <BookOpen className="w-6 h-6" />;
      case 'Award': return <Award className="w-6 h-6" />;
      case 'HeartHandshake': return <HeartHandshake className="w-6 h-6" />;
      case 'UserCheck': return <UserCheck className="w-6 h-6" />;
      default: return <GraduationCap className="w-6 h-6" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Top Emergency Announcement Ticker (Managed from Superadmin Dashboard) */}
      {settings?.emergencyAnnouncement?.enabled && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-xs">
          <Megaphone className="w-4 h-4 shrink-0 animate-bounce" />
          <span>
            {language === 'en' 
              ? settings.emergencyAnnouncement.text.en 
              : settings.emergencyAnnouncement.text.ar}
          </span>
        </div>
      )}

      {/* Hero Section with OmniSearch */}
      <section className="relative bg-[#0B192C] text-white pt-20 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle geometric background patterns */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#F1C40F_1px,transparent_1px)] [background-size:24px_24px]"></div>
        <div className="absolute top-0 end-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-[#1E3E62]/80 border border-slate-700/80 px-4 py-1.5 rounded-full text-xs font-bold text-amber-300 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-[#F1C40F]" />
            <span>{t('منصة العراق لاكتشاف التعليم واتخاذ القرار', 'Iraq\'s Education Discovery & Decision Platform')}</span>
          </div>

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
                preloadedInstitutions={featuredInstitutions}
                preloadedTutors={featuredTutors}
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
                href={`/explore?${tag.categoryId ? `category=${tag.categoryId}&` : ''}${tag.governorateId ? `governorate=${tag.governorateId}&` : ''}${tag.keyword ? `q=${tag.keyword}` : ''}`}
                className="px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-colors"
              >
                {language === 'en' ? tag.label.en : tag.label.ar}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic Educational Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/explore?category=${cat.slug}`}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-md hover:shadow-xl hover:border-blue-400 hover:-translate-y-1 transition-all duration-200 flex flex-col items-center text-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-50 text-[#0B192C] group-hover:bg-[#0B192C] group-hover:text-[#F1C40F] transition-colors flex items-center justify-center mb-3 shadow-xs">
                {getCategoryIcon(cat.iconName)}
              </div>
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-blue-700 transition-colors">
                {language === 'en' ? cat.name.en : cat.name.ar}
              </h3>
              <span className="text-[11px] font-semibold text-slate-400 mt-1">
                {cat.institutionsCount || 0}+ {t('مؤسسة', 'listings')}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Institutions Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold text-blue-700 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{t('مؤسسات تعليمية معتمدة وموثقة', 'Vetted & Accredited Institutions')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C]">
              {t('أبرز الصروح التعليمية في العراق', 'Featured Iraqi Educational Institutions')}
            </h2>
          </div>

          <Link
            href="/explore"
            className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 group self-start"
          >
            <span>{t('عرض جميع المؤسسات في الدليل', 'View All Listings')}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredInstitutions.map((inst) => {
            const gov = governorates.find(g => g.id === inst.governorateId);
            const cat = categories.find(c => c.id === inst.categoryId);

            return (
              <div
                key={inst.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg hover:border-slate-300 transition-all flex flex-col group"
              >
                {/* Cover Image & Badges */}
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                  <Image
                    src={inst.coverImageUrl}
                    alt={inst.name.en}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent"></div>

                  {/* Category Pill */}
                  <div className="absolute top-3 start-3">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-[#0B192C]/90 text-white backdrop-blur-xs">
                      {cat ? (language === 'en' ? cat.name.en : cat.name.ar) : inst.categoryId}
                    </span>
                  </div>

                  {/* Rating */}
                  <div className="absolute top-3 end-3 bg-white/95 px-2 py-0.5 rounded-md flex items-center gap-1 text-xs font-bold text-slate-800 shadow-xs">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{inst.metrics.ratingAvg}</span>
                  </div>

                  {/* Logo overlay */}
                  <div className="absolute -bottom-4 start-5">
                    <Image
                      src={inst.logoUrl}
                      alt={inst.name.en}
                      width={56}
                      height={56}
                      className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-md bg-white"
                    />
                  </div>
                </div>

                {/* Body Content */}
                <div className="pt-6 p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{gov ? (language === 'en' ? gov.name.en : gov.name.ar) : inst.governorateId}</span>
                    </div>

                    <Link href={`/institutions/${inst.slug}`}>
                      <h3 className="font-extrabold text-base text-slate-900 hover:text-blue-700 transition-colors leading-snug">
                        {language === 'en' ? inst.name.en : inst.name.ar}
                      </h3>
                    </Link>

                    <p className="text-xs text-slate-600 line-clamp-2 mt-1.5 leading-relaxed">
                      {language === 'en' ? inst.tagline.en : inst.tagline.ar}
                    </p>
                  </div>

                  {/* Badges and CTAs */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>{language === 'en' ? inst.verificationBadgeLabel.en : inst.verificationBadgeLabel.ar}</span>
                      </span>

                      <span className="text-[11px] font-bold text-slate-700">
                        {inst.tuition.min === 0 ? t('مجاني 100%', '100% Free') : `$${inst.tuition.min.toLocaleString()} / ${t('سنوياً', 'yr')}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/institutions/${inst.slug}`}
                        className="flex-1 text-center py-2 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                      >
                        {t('التفاصيل والقبول', 'View Profile')}
                      </Link>

                      <a
                        href={`https://wa.me/${inst.contact.whatsappNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
                        title="WhatsApp Contact"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>واتساب</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* All 18 Iraqi Governorates Explorer */}
      <section className="bg-slate-100 py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-200">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">{t('تغطية وطنية شاملة', 'Nationwide Coverage')}</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] mt-1">
              {t('تصفح المدارس والجامعات حسب المحافظة العراقية', 'Browse by Iraqi Governorate')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {t('اختر محافظتك للعثور على كافة الصروح التعليمية المعتمدة والأقرب لموقعك.', 'Select your governorate to find accredited institutions nearest to you.')}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {governorates.map((gov) => (
              <Link
                key={gov.id}
                href={`/explore?governorate=${gov.id}`}
                className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 shadow-xs transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="font-extrabold text-xs text-slate-800 group-hover:text-blue-700 transition-colors">
                    {language === 'en' ? gov.name.en : gov.name.ar}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {gov.institutionsCount || 0} {t('مؤسسة', 'listings')}
                  </span>
                </div>
                <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {gov.code}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Certified Private Tutors Showcase */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">{t('نخبة الكوادر التعليمية', 'Top Certified Mentors')}</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] mt-1">
              {t('أساتذة التدريس الخصوصي والبكالوريا المعتمدين', 'Vetted Private & Baccalaureate Tutors')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {t('تواصل مباشر مع أفضل مدرسي مواد السادس الإعدادي واللغات الأجنبية مع مراجعات أولياء الأمور.', 'Connect directly with verified wazari exam masters and language coaches.')}
            </p>
          </div>

          <Link
            href="/tutors"
            className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 group self-start"
          >
            <span>{t('عرض جميع الأساتذة الخصوصيين', 'Explore All Tutors')}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredTutors.map((tutor) => {
            const gov = governorates.find(g => g.id === tutor.governorateId);

            return (
              <div
                key={tutor.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row gap-5 items-start"
              >
                <Image
                  src={tutor.photoUrl}
                  alt={tutor.fullName.en}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shrink-0"
                />

                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link href={`/tutors/${tutor.id}`} className="font-extrabold text-base text-slate-900 hover:text-blue-700 transition-colors">
                        {language === 'en' ? tutor.fullName.en : tutor.fullName.ar}
                      </Link>
                      <p className="text-xs font-semibold text-blue-700">
                        {language === 'en' ? tutor.title.en : tutor.title.ar}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded text-xs font-bold text-amber-800">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{tutor.ratingAvg}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {language === 'en' ? tutor.bio.en : tutor.bio.ar}
                  </p>

                  <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 gap-3">
                    <div className="text-xs">
                      <span className="text-slate-500">{t('سعر الساعة:', 'Rate:')} </span>
                      <span className="font-extrabold text-slate-900">{formatCurrencyIQD(tutor.hourlyRate.iqd)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/tutors/${tutor.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                      >
                        <span>{t('احجز موعداً', 'Book Now')}</span>
                      </Link>
                      <a
                        href={`https://wa.me/${tutor.whatsappNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{t('واتساب', 'WhatsApp')}</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

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
