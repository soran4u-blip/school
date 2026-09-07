'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useLanguage } from '@/core/context/LanguageContext';
import { getCategories, getGovernorates, getTaxonomies } from '@/core/services/masterDataService';
import { getInstitutions } from '@/core/services/institutionService';
import { Category, Governorate, TaxonomyItem } from '@/core/types/masterData';
import { Institution } from '@/core/types/institution';
import { 
  Search, 
  MapPin, 
  ShieldCheck, 
  Star, 
  SlidersHorizontal, 
  X, 
  ChevronDown, 
  Check, 
  ExternalLink,
  MessageSquare,
  ArrowUpDown,
  RotateCcw
} from 'lucide-react';

function ExploreContent() {
  const { language, t } = useLanguage();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [accreditations, setAccreditations] = useState<TaxonomyItem[]>([]);
  const [curricula, setCurricula] = useState<TaxonomyItem[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedGov, setSelectedGov] = useState(searchParams.get('governorate') || 'all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedAccreditations, setSelectedAccreditations] = useState<string[]>([]);
  const [selectedCurricula, setSelectedCurricula] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'recommended' | 'rating' | 'tuition_asc'>('recommended');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    async function loadMaster() {
      setLoading(true);
      const [cats, govs, accs, currs] = await Promise.all([
        getCategories(),
        getGovernorates(),
        getTaxonomies('ACCREDITATION'),
        getTaxonomies('CURRICULUM'),
      ]);
      setCategories(cats);
      setGovernorates(govs);
      setAccreditations(accs);
      setCurricula(currs);

      const insts = await getInstitutions({});
      setInstitutions(insts);
      setLoading(false);
    }
    loadMaster();
  }, []);

  // Compute filtered institutions
  const filtered = institutions.filter((inst) => {
    if (selectedCategory !== 'all' && inst.categoryId !== selectedCategory) {
      return false;
    }
    if (selectedGov !== 'all' && inst.governorateId !== selectedGov) {
      return false;
    }
    if (verifiedOnly && !inst.isVerified) {
      return false;
    }
    if (selectedAccreditations.length > 0) {
      const hasAcc = selectedAccreditations.some(accId => inst.taxonomyIds?.includes(accId));
      if (!hasAcc) return false;
    }
    if (selectedCurricula.length > 0) {
      const hasCurr = selectedCurricula.some(currId => inst.taxonomyIds?.includes(currId));
      if (!hasCurr) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = inst.name.ar.toLowerCase().includes(q) || inst.name.en.toLowerCase().includes(q);
      const matchDesc = inst.description.ar.toLowerCase().includes(q) || inst.description.en.toLowerCase().includes(q);
      const matchTag = inst.tagline.ar.toLowerCase().includes(q) || inst.tagline.en.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchTag) return false;
    }
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'rating') {
      return b.metrics.ratingAvg - a.metrics.ratingAvg;
    }
    if (sortBy === 'tuition_asc') {
      return a.tuition.min - b.tuition.min;
    }
    return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
  });

  const toggleAccreditation = (id: string) => {
    setSelectedAccreditations((prev) =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleCurriculum = (id: string) => {
    setSelectedCurricula((prev) =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedGov('all');
    setVerifiedOnly(false);
    setSelectedAccreditations([]);
    setSelectedCurricula([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      {/* Explore Page Header Bar */}
      <div className="bg-[#0B192C] text-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex items-center gap-2 text-xs text-amber-300 font-bold">
            <span>{t('دليل العراق التعليمي', 'Eduraq Directory')}</span>
            <span>/</span>
            <span>{t('استكشاف وتصفية المؤسسات', 'Explore & Facets')}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black">
            {t('دليل المدارس والجامعات والمعاهد في العراق', 'Accredited Iraq Education Directory')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal">
            {t(
              'تصفح وقارن بين أكثر المؤسسات التعليمية المعتمدة في كافة المحافظات، مع تفاصيل الأقساط ومعايير القبول.',
              'Filter and compare verified universities, international schools, and vocational centers.'
            )}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        
        {/* Mobile Filter Trigger */}
        <div className="lg:hidden mb-4 flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="flex items-center gap-2 text-xs font-extrabold text-[#0B192C]"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>{t('تصفية النتائج والفلاتر', 'Filter Results')}</span>
          </button>
          <span className="text-xs text-slate-500 font-bold">{sorted.length} {t('مؤسسة', 'listings')}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Faceted Filters Sidebar (Stitch Screen 2 Layout) */}
          <aside className={`lg:col-span-4 space-y-6 ${mobileFilterOpen ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto block' : 'hidden lg:block'}`}>
            {mobileFilterOpen && (
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                <h3 className="font-extrabold text-slate-900 text-sm">{t('فلاتر البحث', 'Filters')}</h3>
                <button onClick={() => setMobileFilterOpen(false)} className="p-1 text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              
              {/* Header & Reset */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-blue-700" />
                  <span className="font-extrabold text-sm text-[#0B192C]">{t('تصفية حسب', 'Filter By')}</span>
                </div>
                <button
                  onClick={clearFilters}
                  className="text-xs font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t('إعادة ضبط', 'Reset')}</span>
                </button>
              </div>

              {/* Keyword Search Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">{t('البحث بالاسم أو الكلمة المفتاحية', 'Keyword Search')}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('مثال: بغداد، طب، بريطاني...', 'e.g. Medicine, British...')}
                    className="w-full text-xs px-3 py-2.5 ps-9 bg-slate-50 border border-slate-200 rounded-xl focus:outline-blue-600 font-medium"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute top-3 start-3" />
                </div>
              </div>

              {/* Categories Filter */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">{t('الفئة التعليمية', 'Category')}</label>
                <div className="space-y-1.5">
                  <label
                    onClick={() => setSelectedCategory('all')}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                      selectedCategory === 'all' ? 'bg-blue-50 font-bold text-blue-900' : 'hover:bg-slate-50 text-slate-600 font-medium'
                    }`}
                  >
                    <span>{t('كافة الفئات', 'All Categories')}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{institutions.length}</span>
                  </label>

                  {categories.map((cat) => {
                    const count = institutions.filter(i => i.categoryId === cat.slug).length;
                    const isSelected = selectedCategory === cat.slug;

                    return (
                      <label
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.slug)}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50 font-bold text-blue-900' : 'hover:bg-slate-50 text-slate-600 font-medium'
                        }`}
                      >
                        <span>{language === 'en' ? cat.name.en : cat.name.ar}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{count}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Iraqi Governorates Filter (Dynamic - Zero Hardcoding) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">{t('المحافظة العراقية', 'Governorate (18)')}</label>
                <select
                  value={selectedGov}
                  onChange={(e) => setSelectedGov(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 cursor-pointer focus:outline-blue-600"
                >
                  <option value="all">{t('كافة محافظات العراق (18)', 'All Iraqi Governorates (18)')}</option>
                  {governorates.map((gov) => (
                    <option key={gov.id} value={gov.id}>
                      {language === 'en' ? gov.name.en : gov.name.ar} ({gov.region})
                    </option>
                  ))}
                </select>
              </div>

              {/* Accreditations (MoHESR / MoE / IB / Cambridge) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">{t('الاعتماد والترخيص الرسمي', 'Official Accreditation')}</label>
                <div className="space-y-2">
                  {accreditations.map((acc) => {
                    const isChecked = selectedAccreditations.includes(acc.id);
                    return (
                      <label
                        key={acc.id}
                        onClick={() => toggleAccreditation(acc.id)}
                        className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer"
                      >
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                          isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <span>{language === 'en' ? acc.name.en : acc.name.ar}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Curriculum (Iraqi / British / American / etc.) */}
              {curricula.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">{t('المنهج الدراسي', 'Curriculum')}</label>
                  <div className="space-y-2">
                    {curricula.map((curr) => {
                      const isChecked = selectedCurricula.includes(curr.id);
                      return (
                        <label
                          key={curr.id}
                          onClick={() => toggleCurriculum(curr.id)}
                          className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer"
                        >
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                            isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {isChecked && <Check className="w-3 h-3" />}
                          </div>
                          <span>{language === 'en' ? curr.name.en : curr.name.ar}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Verified Filter Toggle */}
              <div className="pt-3 border-t border-slate-100">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800">{t('المؤسسات الموثقة وزارياً فقط', 'Verified by Ministry Only')}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </label>
              </div>

              {mobileFilterOpen && (
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-full py-3 bg-[#0B192C] text-white rounded-xl text-xs font-bold mt-4"
                >
                  {t('تطبيق الفلاتر', 'Apply Filters')}
                </button>
              )}
            </div>
          </aside>

          {/* Right Column: Search Feed & Cards */}
          <main className="lg:col-span-8 space-y-6">
            
            {/* Sort & Count Header */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs font-bold text-slate-700">
                {t('تم العثور على', 'Found')}{' '}
                <span className="text-blue-700 font-black text-sm">{sorted.length}</span>{' '}
                {t('مؤسسة تعليمية معتمدة', 'accredited educational listings')}
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-2 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500 font-semibold">{t('الترتيب حسب:', 'Sort:')}</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 text-xs cursor-pointer focus:outline-blue-600"
                >
                  <option value="recommended">{t('الموصى به (مميز)', 'Recommended')}</option>
                  <option value="rating">{t('الأعلى تقييماً', 'Highest Rated')}</option>
                  <option value="tuition_asc">{t('الأقل قسطاً', 'Lowest Tuition')}</option>
                </select>
              </div>
            </div>

            {/* Institutions Feed Cards */}
            {sorted.length > 0 ? (
              <div className="space-y-5">
                {sorted.map((inst) => {
                  const gov = governorates.find(g => g.id === inst.governorateId);
                  const cat = categories.find(c => c.id === inst.categoryId);

                  return (
                    <div
                      key={inst.id}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col md:flex-row group"
                    >
                      {/* Image Preview */}
                      <div className="md:w-64 h-48 md:h-auto relative bg-slate-100 shrink-0 overflow-hidden">
                        <Image
                          src={inst.coverImageUrl}
                          alt={inst.name.en}
                          fill
                          sizes="(max-width: 768px) 100vw, 256px"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent md:hidden"></div>
                        
                        <div className="absolute top-3 start-3">
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-[#0B192C]/90 text-white backdrop-blur-xs">
                            {cat ? (language === 'en' ? cat.name.en : cat.name.ar) : inst.categoryId}
                          </span>
                        </div>

                        <div className="absolute bottom-3 start-3">
                          <Image
                            src={inst.logoUrl}
                            alt={inst.name.en}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-md bg-white"
                          />
                        </div>
                      </div>

                      {/* Card Information */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <Link href={`/institutions/${inst.slug}`}>
                                <h2 className="font-extrabold text-base sm:text-lg text-slate-900 hover:text-blue-700 transition-colors">
                                  {language === 'en' ? inst.name.en : inst.name.ar}
                                </h2>
                              </Link>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mt-0.5">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{gov ? (language === 'en' ? gov.name.en : gov.name.ar) : inst.governorateId}</span>
                                <span>•</span>
                                <span>{language === 'en' ? inst.address.en : inst.address.ar}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-md text-xs font-bold text-amber-900 border border-amber-200">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              <span>{inst.metrics.ratingAvg}</span>
                              <span className="text-slate-400 font-normal text-[11px]">({inst.metrics.reviewCount})</span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {language === 'en' ? inst.description.en : inst.description.ar}
                          </p>
                        </div>

                        {/* Badges & Actions */}
                        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{language === 'en' ? inst.verificationBadgeLabel.en : inst.verificationBadgeLabel.ar}</span>
                            </span>

                            <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                              {inst.tuition.min === 0 ? t('مجاني 100%', '100% Free') : `$${inst.tuition.min.toLocaleString()} / ${t('سنوياً', 'yr')}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <a
                              href={`https://wa.me/${inst.contact.whatsappNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>واتساب</span>
                            </a>

                            <Link
                              href={`/institutions/${inst.slug}`}
                              className="px-4 py-2 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                            >
                              {t('التفاصيل والقبول', 'View Profile')}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
                <Search className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-extrabold text-base text-slate-800">
                  {t('لا توجد نتائج مطابقة لبحثك', 'No Matching Institutions Found')}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {t('جرّب تقليل الفلاتر أو البحث باسم محافظة أخرى في العراق.', 'Try broadening your filters or resetting the governorate selector.')}
                </p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-[#0B192C] text-white rounded-xl text-xs font-bold"
                >
                  {t('إعادة ضبط كافة الفلاتر', 'Reset All Filters')}
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-slate-600">Loading Directory...</div>}>
      <ExploreContent />
    </Suspense>
  );
}
