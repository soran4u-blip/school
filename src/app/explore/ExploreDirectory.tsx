'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useLanguage } from '@/core/context/LanguageContext';
import { localeHref } from '@/lib/locale';
import { saveSearch } from '@/core/services/savedSearchService';
import { Category, Governorate, TaxonomyItem } from '@/core/types/masterData';
import { Institution } from '@/core/types/institution';
import { Tutor } from '@/core/types/tutor';
import { haversineDistanceKm, resolveCoordinates } from '@/core/utils/geo';
import { auth } from '@/core/firebase/config';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { SlidersHorizontal } from 'lucide-react';
import FilterSidebar from './_components/FilterSidebar';
import ResultsHeader, { SortOption } from './_components/ResultsHeader';
import InstitutionCard from './_components/InstitutionCard';
import EmptyResults from './_components/EmptyResults';

interface ExploreDirectoryProps {
  institutions: Institution[];
  // Only for the search box's suggestions — the directory listing itself is institutions.
  tutors: Tutor[];
  subjects: TaxonomyItem[];
  categories: Category[];
  governorates: Governorate[];
  accreditations: TaxonomyItem[];
  curricula: TaxonomyItem[];
}

function ExploreContent({ institutions, tutors, categories, governorates, accreditations, curricula, subjects }: ExploreDirectoryProps) {
  const { language, t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [searchSaved, setSearchSaved] = useState(false);
  const [savingSearch, setSavingSearch] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsub();
  }, []);

  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedGov, setSelectedGov] = useState(searchParams.get('governorate') || 'all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedAccreditations, setSelectedAccreditations] = useState<string[]>([]);
  const [selectedCurricula, setSelectedCurricula] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Price range (currency-scoped — no FX conversion, entries in the other currency are excluded
  // while a range is active)
  const [priceCurrency, setPriceCurrency] = useState<'IQD' | 'USD'>('IQD');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

  // Rating threshold
  const [minRating, setMinRating] = useState(0);

  // Near me — no map, just a browser-geolocation distance filter
  const [nearMeCoords, setNearMeCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearMeError, setNearMeError] = useState('');
  const [radiusKm, setRadiusKm] = useState(25);

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
    if (minRating > 0 && inst.metrics.ratingAvg < minRating) {
      return false;
    }
    if (priceMin || priceMax) {
      if (inst.tuition.currency !== priceCurrency) return false;
      const min = priceMin ? Number(priceMin) : 0;
      const max = priceMax ? Number(priceMax) : Infinity;
      if (inst.tuition.max < min || inst.tuition.min > max) return false;
    }
    if (nearMeCoords) {
      const gov = governorates.find(g => g.id === inst.governorateId);
      const coords = resolveCoordinates(inst, gov ? { lat: gov.lat, lng: gov.lng } : undefined);
      if (!coords || haversineDistanceKm(nearMeCoords, coords) > radiusKm) return false;
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
    if (sortBy === 'reviews_desc') {
      return b.metrics.reviewCount - a.metrics.reviewCount;
    }
    if (sortBy === 'distance_asc' && nearMeCoords) {
      const govA = governorates.find(g => g.id === a.governorateId);
      const govB = governorates.find(g => g.id === b.governorateId);
      const coordsA = resolveCoordinates(a, govA ? { lat: govA.lat, lng: govA.lng } : undefined);
      const coordsB = resolveCoordinates(b, govB ? { lat: govB.lat, lng: govB.lng } : undefined);
      const distA = coordsA ? haversineDistanceKm(nearMeCoords, coordsA) : Infinity;
      const distB = coordsB ? haversineDistanceKm(nearMeCoords, coordsB) : Infinity;
      return distA - distB;
    }
    return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
  });

  const toggleNearMe = () => {
    if (nearMeCoords) {
      setNearMeCoords(null);
      setNearMeError('');
      return;
    }
    if (!navigator.geolocation) {
      setNearMeError(t('المتصفح لا يدعم تحديد الموقع', 'Location not supported by this browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNearMeCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setNearMeError('');
        setSortBy('distance_asc');
      },
      () => setNearMeError(t('تعذر الوصول إلى الموقع', 'Could not access your location'))
    );
  };

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
    setPriceMin('');
    setPriceMax('');
    setMinRating(0);
    setNearMeCoords(null);
    setNearMeError('');
  };

  const handleSaveSearch = async () => {
    if (!currentUser) {
      router.push(`/login?redirect=${encodeURIComponent(localeHref('/explore', language))}`);
      return;
    }
    setSavingSearch(true);
    try {
      const label = [
        selectedCategory !== 'all' && categories.find((c) => c.slug === selectedCategory)?.name[language === 'en' ? 'en' : 'ar'],
        selectedGov !== 'all' && governorates.find((g) => g.id === selectedGov)?.name[language === 'en' ? 'en' : 'ar'],
        searchQuery.trim(),
      ].filter(Boolean).join(' • ') || t('بحث بدون فلاتر', 'Unfiltered search');
      // The filter state, not window.location — the explore page never writes
      // its filters back to the URL, so the location would have lost them.
      await saveSearch(currentUser.uid, label, {
        q: searchQuery.trim() || undefined,
        categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
        governorateId: selectedGov !== 'all' ? selectedGov : undefined,
      });
      setSearchSaved(true);
    } finally {
      setSavingSearch(false);
    }
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

          <FilterSidebar
            institutions={institutions}
            tutors={tutors}
            subjects={subjects}
            categories={categories}
            governorates={governorates}
            accreditations={accreditations}
            curricula={curricula}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            priceCurrency={priceCurrency}
            setPriceCurrency={setPriceCurrency}
            priceMin={priceMin}
            setPriceMin={setPriceMin}
            priceMax={priceMax}
            setPriceMax={setPriceMax}
            minRating={minRating}
            setMinRating={setMinRating}
            nearMeCoords={nearMeCoords}
            nearMeError={nearMeError}
            radiusKm={radiusKm}
            setRadiusKm={setRadiusKm}
            toggleNearMe={toggleNearMe}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedGov={selectedGov}
            setSelectedGov={setSelectedGov}
            selectedAccreditations={selectedAccreditations}
            toggleAccreditation={toggleAccreditation}
            selectedCurricula={selectedCurricula}
            toggleCurriculum={toggleCurriculum}
            verifiedOnly={verifiedOnly}
            setVerifiedOnly={setVerifiedOnly}
            mobileFilterOpen={mobileFilterOpen}
            setMobileFilterOpen={setMobileFilterOpen}
            clearFilters={clearFilters}
          />

          {/* Right Column: Search Feed & Cards */}
          <main className="lg:col-span-8 space-y-6">

            <ResultsHeader
              resultCount={sorted.length}
              onSaveSearch={handleSaveSearch}
              savingSearch={savingSearch}
              searchSaved={searchSaved}
              sortBy={sortBy}
              setSortBy={setSortBy}
              nearMeActive={!!nearMeCoords}
            />

            {/* Institutions Feed Cards */}
            {sorted.length > 0 ? (
              <div className="space-y-5">
                {sorted.map((inst) => {
                  const gov = governorates.find(g => g.id === inst.governorateId);
                  const cat = categories.find(c => c.id === inst.categoryId);

                  return (
                    <InstitutionCard key={inst.id} institution={inst} governorate={gov} category={cat} />
                  );
                })}
              </div>
            ) : (
              <EmptyResults onClearFilters={clearFilters} />
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// Every filter here — category, governorate, accreditation, curriculum, price range, rating
// threshold, keyword, distance — runs in the browser over the server-rendered snapshot. That is a
// deliberate choice, not an oversight: Firestore would need a composite index per filter
// combination and still could not do the keyword substring match or the haversine distance sort.
// The snapshot is read once on the server per revalidate window rather than once per visitor, so
// the cost this used to carry is gone; the size ceiling is documented in core/server/data/cache.ts.
//
// The Suspense boundary is for useSearchParams (the ?q=/?category= deep links), not for data.
export default function ExploreDirectory(props: ExploreDirectoryProps) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-slate-600">Loading Directory...</div>}>
      <ExploreContent {...props} />
    </Suspense>
  );
}
