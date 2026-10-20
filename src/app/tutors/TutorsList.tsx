'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Thumbnail from '@/components/shared/Thumbnail';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useLanguage } from '@/core/context/LanguageContext';
import { localeHref } from '@/lib/locale';
import { matchesLocalized, pickLocalized } from '@/lib/localized';
import { normalizeSearchText } from '@/lib/textNormalize';
import { Tutor } from '@/core/types/tutor';
import { Institution } from '@/core/types/institution';
import { Governorate, TaxonomyItem } from '@/core/types/masterData';
import { Star, MapPin, ShieldCheck, Navigation } from 'lucide-react';
import { formatCurrencyIQD } from '@/lib/utils';
import { haversineDistanceKm, resolveCoordinates } from '@/core/utils/geo';
import SearchAutocomplete from '@/components/shared/SearchAutocomplete';
import { useT } from '@/lib/useT';
import { TUTORS_LIST_COPY } from './TutorsList.i18n';

// Filtering and sorting stay on the client — they're instant, and the directory is small enough
// to hold in one server-rendered snapshot (see core/server/data/cache.ts for where that stops
// being true). What changed is where the snapshot comes from: ./page.tsx reads it once on the
// server for everyone, instead of every visitor's browser reading the whole collection itself.
export default function TutorsList({
  tutors,
  institutions,
  governorates,
  subjects,
  studentLevels,
}: {
  tutors: Tutor[];
  // Only for the search box's suggestions — the listing itself is tutors.
  institutions: Institution[];
  governorates: Governorate[];
  subjects: TaxonomyItem[];
  studentLevels: TaxonomyItem[];
}) {
  const { language } = useLanguage();
  const t = useT(TUTORS_LIST_COPY);
  const [filterGov, setFilterGov] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterMode, setFilterMode] = useState('all');
  const [sortBy, setSortBy] = useState<'rating' | 'price_asc' | 'distance_asc'>('rating');
  const [keyword, setKeyword] = useState('');
  const [maxPriceCurrency, setMaxPriceCurrency] = useState<'iqd' | 'usd'>('iqd');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [nearMeCoords, setNearMeCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearMeError, setNearMeError] = useState('');
  const [radiusKm, setRadiusKm] = useState(25);

  const toggleNearMe = () => {
    if (nearMeCoords) {
      setNearMeCoords(null);
      setNearMeError('');
      return;
    }
    if (!navigator.geolocation) {
      setNearMeError(t('locationUnsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNearMeCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setNearMeError('');
        setSortBy('distance_asc');
      },
      () => setNearMeError(t('locationDenied'))
    );
  };

  const filtered = tutors
    .filter((t) => filterGov === 'all' || t.governorateId === filterGov)
    .filter((t) => filterSubject === 'all' || t.subjectIds.includes(filterSubject))
    .filter((t) => filterLevel === 'all' || t.studentLevelIds.includes(filterLevel))
    .filter((t) => filterMode === 'all' || t.deliveryMode.includes(filterMode as Tutor['deliveryMode'][number]))
    .filter((t) => {
      if (!keyword.trim()) return true;
      const kw = normalizeSearchText(keyword);
      return matchesLocalized(t.fullName, kw) || matchesLocalized(t.title, kw);
    })
    .filter((t) => (minRating === 0 ? true : t.ratingAvg >= minRating))
    .filter((t) => (maxPrice ? t.hourlyRate[maxPriceCurrency] <= Number(maxPrice) : true))
    .filter((t) => {
      if (!nearMeCoords) return true;
      const gov = governorates.find((g) => g.id === t.governorateId);
      const coords = resolveCoordinates(t, gov ? { lat: gov.lat, lng: gov.lng } : undefined);
      return !!coords && haversineDistanceKm(nearMeCoords, coords) <= radiusKm;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.hourlyRate.iqd - b.hourlyRate.iqd;
      if (sortBy === 'distance_asc' && nearMeCoords) {
        const govA = governorates.find((g) => g.id === a.governorateId);
        const govB = governorates.find((g) => g.id === b.governorateId);
        const coordsA = resolveCoordinates(a, govA ? { lat: govA.lat, lng: govA.lng } : undefined);
        const coordsB = resolveCoordinates(b, govB ? { lat: govB.lat, lng: govB.lng } : undefined);
        const distA = coordsA ? haversineDistanceKm(nearMeCoords, coordsA) : Infinity;
        const distB = coordsB ? haversineDistanceKm(nearMeCoords, coordsB) : Infinity;
        return distA - distB;
      }
      return b.ratingAvg - a.ratingAvg;
    });

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        <div className="mb-8 rounded-[2rem] bg-[#123D35] px-6 py-8 text-white shadow-sm sm:px-10 sm:py-10">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#D9F27C]">{t('crumb')}</p>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t('title')}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75">{t('intro')}</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <SearchAutocomplete
            value={keyword}
            onChange={setKeyword}
            onSubmit={() => {}}
            placeholder={t('searchPlaceholder')}
            className="w-full sm:w-56"
            inputClassName="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-700"
            institutions={institutions}
            tutors={tutors}
            subjects={subjects}
          />

          <select
            value={filterGov}
            onChange={(e) => setFilterGov(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="all">{t('allGovernorates')}</option>
            {governorates.map((g) => (
              <option key={g.id} value={g.id}>{pickLocalized(g.name, language)}</option>
            ))}
          </select>

          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="all">{t('allSubjects')}</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{pickLocalized(s.name, language)}</option>
            ))}
          </select>

          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="all">{t('allGrades')}</option>
            {studentLevels.map((lvl) => (
              <option key={lvl.id} value={lvl.id}>{pickLocalized(lvl.name, language)}</option>
            ))}
          </select>

          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="all">{t('allModes')}</option>
            <option value="ONLINE">{t('modeOnline')}</option>
            <option value="IN_PERSON">{t('modeInPerson')}</option>
            <option value="HYBRID">{t('modeHybrid')}</option>
          </select>

          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder={t('maxPrice')}
              className="w-24 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono text-slate-700"
            />
            <select
              value={maxPriceCurrency}
              onChange={(e) => setMaxPriceCurrency(e.target.value as 'iqd' | 'usd')}
              className="px-2 py-2 text-xs bg-white border border-slate-200 rounded-lg font-bold text-slate-700"
            >
              <option value="iqd">{t('currencyIqd')}</option>
              <option value="usd">{t('currencyUsd')}</option>
            </select>
          </div>

          <div className="flex gap-1.5">
            {[0, 3, 4].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setMinRating(r)}
                className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-bold border transition-colors ${
                  minRating === r ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                {r === 0 ? t('any') : (<><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{r}+</>)}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={toggleNearMe}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
              nearMeCoords ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            {nearMeCoords ? t('nearMeOn') : t('nearMe')}
          </button>
          {nearMeCoords && (
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-700"
            >
              {[5, 10, 25, 50, 100].map((km) => (
                <option key={km} value={km}>{t('withinKm', { km })}</option>
              ))}
            </select>
          )}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'rating' | 'price_asc' | 'distance_asc')}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="rating">{t('sortRating')}</option>
            <option value="price_asc">{t('sortPrice')}</option>
            {nearMeCoords && <option value="distance_asc">{t('sortDistance')}</option>}
          </select>
        </div>
        {nearMeError && <p className="text-xs text-rose-600 -mt-3 mb-4">{nearMeError}</p>}

        {filtered.length === 0 ? (
          <div className="text-sm text-slate-400">{t('empty')}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {filtered.map((tutor) => {
              const gov = governorates.find((g) => g.id === tutor.governorateId);
              return (
                <Link
                  key={tutor.id}
                  href={localeHref(`/tutors/${tutor.slug || tutor.id}`, language)}
                  className="group rounded-2xl border border-[#E8E6DE] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B8CFC4] hover:shadow-lg flex gap-4 items-start"
                >
                  <Thumbnail
                    src={tutor.photoUrl}
                    alt={pickLocalized(tutor.fullName, language)}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                    objectPosition={tutor.photoFocalPoint ? `${tutor.photoFocalPoint.x}% ${tutor.photoFocalPoint.y}%` : undefined}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-sm text-[#17352F] transition-colors group-hover:text-[#28675A]">{pickLocalized(tutor.fullName, language)}</h3>
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-700">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {tutor.ratingAvg}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{pickLocalized(tutor.title, language)}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{gov ? pickLocalized(gov.name, language) : tutor.governorateId}</span>
                      {tutor.isVerified && <span className="flex items-center gap-1 text-emerald-600"><ShieldCheck className="w-3 h-3" />{t('verified')}</span>}
                    </div>
                    <div className="text-xs font-bold text-slate-800 pt-1">{formatCurrencyIQD(tutor.hourlyRate.iqd, language)} <span className="font-normal text-slate-400">/ {t('individual')}</span></div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
