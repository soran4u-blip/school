'use client';

import React, { useEffect, useState, useSyncExternalStore, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useLanguage } from '@/core/context/LanguageContext';
import { localeHref } from '@/lib/locale';
import { saveSearch } from '@/core/services/savedSearchService';
import { SavedSearchFilters } from '@/core/types/savedSearch';
import { Category, Governorate, TaxonomyItem } from '@/core/types/masterData';
import { Institution } from '@/core/types/institution';
import { Tutor } from '@/core/types/tutor';
import { haversineDistanceKm, resolveCoordinates } from '@/core/utils/geo';
import { auth } from '@/core/firebase/config';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { SlidersHorizontal, X } from 'lucide-react';
import FilterSidebar from './_components/FilterSidebar';
import ResultsHeader, { SortOption } from './_components/ResultsHeader';
import InstitutionCard from './_components/InstitutionCard';
import EmptyResults from './_components/EmptyResults';
import CompareTray from './_components/CompareTray';
import ShortlistTray from './_components/ShortlistTray';
import DirectorySkeleton from './_components/DirectorySkeleton';
import { readShortlist, subscribeToShortlist, writeShortlist } from '@/lib/shortlist';
import { isInstitutionEvidenceFresh } from '@/lib/publishingGuardrails';

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

const listFromParam = (value: string | null) => value?.split(',').filter(Boolean) ?? [];

function ExploreContent({ institutions, tutors, categories, governorates, accreditations, curricula, subjects }: ExploreDirectoryProps) {
  const { language, t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [savedSearchSignature, setSavedSearchSignature] = useState<string | null>(null);
  const [savingSearch, setSavingSearch] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const shortlistIds = useSyncExternalStore(subscribeToShortlist, readShortlist, () => []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (searchParams.get('category') === 'tutors') {
      router.replace(localeHref('/tutors', language));
    }
  }, [language, router, searchParams]);

  // Filter states start from the URL so a copied directory link opens in the same state.
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedGov, setSelectedGov] = useState(searchParams.get('governorate') || 'all');
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get('verified') === '1');
  const [selectedAccreditations, setSelectedAccreditations] = useState<string[]>(listFromParam(searchParams.get('accreditations')));
  const [selectedCurricula, setSelectedCurricula] = useState<string[]>(listFromParam(searchParams.get('curricula')));
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'recommended');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [priceCurrency, setPriceCurrency] = useState<'IQD' | 'USD'>(searchParams.get('currency') === 'USD' ? 'USD' : 'IQD');
  const [priceMin, setPriceMin] = useState(searchParams.get('min') || '');
  const [priceMax, setPriceMax] = useState(searchParams.get('max') || '');
  const [minRating, setMinRating] = useState(Number(searchParams.get('rating')) || 0);

  const searchSignature = JSON.stringify([
    searchQuery, selectedCategory, selectedGov, verifiedOnly, selectedAccreditations,
    selectedCurricula, priceCurrency, priceMin, priceMax, minRating,
  ]);
  const searchSaved = savedSearchSignature === searchSignature;

  const [nearMeCoords, setNearMeCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearMeError, setNearMeError] = useState('');
  const [radiusKm, setRadiusKm] = useState(25);

  // Keep the current search useful as a shared link without navigating or scrolling the page.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (selectedGov !== 'all') params.set('governorate', selectedGov);
      if (verifiedOnly) params.set('verified', '1');
      if (selectedAccreditations.length > 0) params.set('accreditations', selectedAccreditations.join(','));
      if (selectedCurricula.length > 0) params.set('curricula', selectedCurricula.join(','));
      if (priceMin) params.set('min', priceMin);
      if (priceMax) params.set('max', priceMax);
      if (priceMin || priceMax) params.set('currency', priceCurrency);
      if (minRating > 0) params.set('rating', String(minRating));
      if (sortBy !== 'recommended' && sortBy !== 'distance_asc') params.set('sort', sortBy);

      const query = params.toString();
      router.replace(`${localeHref('/explore', language)}${query ? `?${query}` : ''}`, { scroll: false });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [language, router, searchQuery, selectedCategory, selectedGov, verifiedOnly, selectedAccreditations, selectedCurricula, priceCurrency, priceMin, priceMax, minRating, sortBy]);

  const filtered = institutions.filter((inst) => {
    if (selectedCategory !== 'all' && inst.categoryId !== selectedCategory) return false;
    if (selectedGov !== 'all' && inst.governorateId !== selectedGov) return false;
    if (verifiedOnly && !(inst.isVerified && isInstitutionEvidenceFresh(inst))) return false;
    if (selectedAccreditations.length > 0 && !selectedAccreditations.some((id) => inst.taxonomyIds?.includes(id))) return false;
    if (selectedCurricula.length > 0 && !selectedCurricula.some((id) => inst.taxonomyIds?.includes(id))) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = inst.name.ar.toLowerCase().includes(q) || inst.name.en.toLowerCase().includes(q);
      const matchDesc = inst.description.ar.toLowerCase().includes(q) || inst.description.en.toLowerCase().includes(q);
      const matchTag = inst.tagline.ar.toLowerCase().includes(q) || inst.tagline.en.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchTag) return false;
    }
    if (minRating > 0 && inst.metrics.ratingAvg < minRating) return false;
    if (priceMin || priceMax) {
      if (inst.tuition.currency !== priceCurrency) return false;
      const min = priceMin ? Number(priceMin) : 0;
      const max = priceMax ? Number(priceMax) : Infinity;
      if (inst.tuition.max < min || inst.tuition.min > max) return false;
    }
    if (nearMeCoords) {
      const gov = governorates.find((g) => g.id === inst.governorateId);
      const coords = resolveCoordinates(inst, gov ? { lat: gov.lat, lng: gov.lng } : undefined);
      if (!coords || haversineDistanceKm(nearMeCoords, coords) > radiusKm) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'rating') return b.metrics.ratingAvg - a.metrics.ratingAvg;
    if (sortBy === 'tuition_asc') return a.tuition.min - b.tuition.min;
    if (sortBy === 'reviews_desc') return b.metrics.reviewCount - a.metrics.reviewCount;
    if (sortBy === 'distance_asc' && nearMeCoords) {
      const govA = governorates.find((g) => g.id === a.governorateId);
      const govB = governorates.find((g) => g.id === b.governorateId);
      const coordsA = resolveCoordinates(a, govA ? { lat: govA.lat, lng: govA.lng } : undefined);
      const coordsB = resolveCoordinates(b, govB ? { lat: govB.lat, lng: govB.lng } : undefined);
      return (coordsA ? haversineDistanceKm(nearMeCoords, coordsA) : Infinity) - (coordsB ? haversineDistanceKm(nearMeCoords, coordsB) : Infinity);
    }
    return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
  });

  const toggleNearMe = () => {
    if (nearMeCoords) {
      setNearMeCoords(null);
      setNearMeError('');
      setSortBy('recommended');
      return;
    }
    if (!navigator.geolocation) {
      setNearMeError(t('المتصفح لا يدعم تحديد الموقع', 'Location is not supported by this browser'));
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
    setSelectedAccreditations((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const toggleCurriculum = (id: string) => {
    setSelectedCurricula((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedGov('all');
    setVerifiedOnly(false);
    setSelectedAccreditations([]);
    setSelectedCurricula([]);
    setPriceCurrency('IQD');
    setPriceMin('');
    setPriceMax('');
    setMinRating(0);
    setNearMeCoords(null);
    setNearMeError('');
    setSortBy('recommended');
  };

  const toggleCompare = (institution: Institution) => {
    setCompareIds((current) => {
      if (current.includes(institution.id)) return current.filter((id) => id !== institution.id);
      if (current.length >= 3) return current;
      return [...current, institution.id];
    });
  };

  const toggleShortlist = (institution: Institution) => {
    writeShortlist(shortlistIds.includes(institution.id)
      ? shortlistIds.filter((id) => id !== institution.id)
      : [...shortlistIds, institution.id]);
  };

  const comparedInstitutions = compareIds
    .map((id) => institutions.find((institution) => institution.id === id))
    .filter((institution): institution is Institution => Boolean(institution));
  const shortlistedInstitutions = shortlistIds
    .map((id) => institutions.find((institution) => institution.id === id))
    .filter((institution): institution is Institution => Boolean(institution));

  const activeFilters: { key: string; label: string; clear: () => void }[] = [];
  if (searchQuery.trim()) activeFilters.push({ key: 'q', label: `"${searchQuery.trim()}"`, clear: () => setSearchQuery('') });
  if (selectedCategory !== 'all') {
    const category = categories.find((item) => item.slug === selectedCategory);
    activeFilters.push({ key: 'category', label: category ? (language === 'en' ? category.name.en : category.name.ar) : selectedCategory, clear: () => setSelectedCategory('all') });
  }
  if (selectedGov !== 'all') {
    const governorate = governorates.find((item) => item.id === selectedGov);
    activeFilters.push({ key: 'governorate', label: governorate ? (language === 'en' ? governorate.name.en : governorate.name.ar) : selectedGov, clear: () => setSelectedGov('all') });
  }
  if (verifiedOnly) activeFilters.push({ key: 'verified', label: t('موثق فقط', 'Verified only'), clear: () => setVerifiedOnly(false) });
  if (selectedAccreditations.length > 0) activeFilters.push({ key: 'accreditations', label: `${t('اعتمادات', 'Accreditations')}: ${selectedAccreditations.length}`, clear: () => setSelectedAccreditations([]) });
  if (selectedCurricula.length > 0) activeFilters.push({ key: 'curricula', label: `${t('مناهج', 'Curricula')}: ${selectedCurricula.length}`, clear: () => setSelectedCurricula([]) });
  if (priceMin || priceMax) activeFilters.push({ key: 'price', label: `${priceMin || '0'} - ${priceMax || '∞'} ${priceCurrency}`, clear: () => { setPriceMin(''); setPriceMax(''); } });
  if (minRating > 0) activeFilters.push({ key: 'rating', label: `${t('تقييم', 'Rating')} ${minRating}+`, clear: () => setMinRating(0) });

  const handleSaveSearch = async () => {
    if (!currentUser) {
      router.push(`${localeHref('/login', language)}?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    setSavingSearch(true);
    try {
      const label = [
        selectedCategory !== 'all' && categories.find((c) => c.slug === selectedCategory)?.name[language === 'en' ? 'en' : 'ar'],
        selectedGov !== 'all' && governorates.find((g) => g.id === selectedGov)?.name[language === 'en' ? 'en' : 'ar'],
        searchQuery.trim(),
      ].filter(Boolean).join(' • ') || t('بحث بدون فلاتر', 'Unfiltered search');
      const filters: SavedSearchFilters = {};
      if (searchQuery.trim()) filters.q = searchQuery.trim();
      if (selectedCategory !== 'all') filters.categoryId = selectedCategory;
      if (selectedGov !== 'all') filters.governorateId = selectedGov;
      await saveSearch(currentUser.uid, label, filters);
      setSavedSearchSignature(searchSignature);
    } finally {
      setSavingSearch(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <div className="bg-[#0B192C] text-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex items-center gap-2 text-xs text-amber-300 font-bold">
            <span>{t('دليل العراق التعليمي', 'Eduraq Directory')}</span><span>/</span><span>{t('استكشاف وتصفية المؤسسات', 'Explore & Facets')}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black">{t('دليل المدارس والجامعات والمعاهد في العراق', 'Iraq education directory')}</h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal">{t('تصفح وقارن بين المؤسسات التعليمية المدرجة في كافة المحافظات، مع تفاصيل الأقساط ومعايير القبول.', 'Filter and compare education listings across Iraq, with tuition and admissions details.')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="lg:hidden mb-4 flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <button onClick={() => setMobileFilterOpen(true)} className="flex items-center gap-2 text-xs font-extrabold text-[#0B192C]">
            <SlidersHorizontal className="w-4 h-4" />
            <span>{t('تصفية النتائج والفلاتر', 'Filter Results')}</span>
          </button>
          <span className="text-xs text-slate-500 font-bold">{sorted.length} {t('مؤسسة', 'listings')}</span>
        </div>

        {activeFilters.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2" aria-label={t('الفلاتر النشطة', 'Active filters')}>
            <span className="me-1 text-xs font-extrabold text-slate-500">{t('تصفية حسب:', 'Filtered by:')}</span>
            {activeFilters.map((filter) => (
              <button key={filter.key} type="button" onClick={filter.clear} className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-800 hover:bg-blue-100">
                {filter.label}<X className="h-3 w-3" aria-hidden="true" />
              </button>
            ))}
            <button type="button" onClick={clearFilters} className="text-[11px] font-bold text-slate-500 underline-offset-4 hover:text-[#0B192C] hover:underline">
              {t('مسح الكل', 'Clear all')}
            </button>
          </div>
        )}

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

            {sorted.length > 0 ? (
              <div className="space-y-5">
                {sorted.map((inst) => {
                  const gov = governorates.find((g) => g.id === inst.governorateId);
                  const cat = categories.find((c) => c.id === inst.categoryId);
                  const isCompared = compareIds.includes(inst.id);
                  return (
                    <InstitutionCard
                      key={inst.id}
                      institution={inst}
                      governorate={gov}
                      category={cat}
                      compareSelected={isCompared}
                       compareDisabled={compareIds.length >= 3 && !isCompared}
                       onCompare={() => toggleCompare(inst)}
                       shortlistSelected={shortlistIds.includes(inst.id)}
                       onShortlist={() => toggleShortlist(inst)}
                    />
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
      <CompareTray
        institutions={comparedInstitutions}
        onRemove={(id) => setCompareIds((current) => current.filter((item) => item !== id))}
        onClear={() => setCompareIds([])}
      />
      <ShortlistTray
        institutions={shortlistedInstitutions}
        onRemove={(id) => writeShortlist(shortlistIds.filter((item) => item !== id))}
        onClear={() => writeShortlist([])}
      />
    </div>
  );
}

export default function ExploreDirectory(props: ExploreDirectoryProps) {
  return (
    <Suspense fallback={<DirectorySkeleton />}>
      <ExploreContent {...props} />
    </Suspense>
  );
}
