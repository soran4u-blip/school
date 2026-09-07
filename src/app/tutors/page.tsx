'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useLanguage } from '@/core/context/LanguageContext';
import { getGovernorates, getTaxonomies } from '@/core/services/masterDataService';
import { getTutors } from '@/core/services/tutorService';
import { Tutor } from '@/core/types/tutor';
import { Governorate, TaxonomyItem } from '@/core/types/masterData';
import { Star, MapPin, ShieldCheck, Navigation } from 'lucide-react';
import { formatCurrencyIQD } from '@/lib/utils';
import { haversineDistanceKm, resolveCoordinates } from '@/core/utils/geo';
import SearchAutocomplete from '@/components/shared/SearchAutocomplete';

export default function TutorsListPage() {
  const { language, t } = useLanguage();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [subjects, setSubjects] = useState<TaxonomyItem[]>([]);
  const [studentLevels, setStudentLevels] = useState<TaxonomyItem[]>([]);
  const [filterGov, setFilterGov] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterMode, setFilterMode] = useState('all');
  const [sortBy, setSortBy] = useState<'rating' | 'price_asc' | 'distance_asc'>('rating');
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    async function load() {
      const [tutorList, govs, taxes, levels] = await Promise.all([
        getTutors({}),
        getGovernorates(),
        getTaxonomies('SUBJECT', false),
        getTaxonomies('STUDENT_LEVEL', false),
      ]);
      setTutors(tutorList);
      setGovernorates(govs);
      setSubjects(taxes);
      setStudentLevels(levels);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = tutors
    .filter((t) => filterGov === 'all' || t.governorateId === filterGov)
    .filter((t) => filterSubject === 'all' || t.subjectIds.includes(filterSubject))
    .filter((t) => filterLevel === 'all' || t.studentLevelIds.includes(filterLevel))
    .filter((t) => filterMode === 'all' || t.deliveryMode.includes(filterMode as any))
    .filter((t) => {
      if (!keyword.trim()) return true;
      const kw = keyword.toLowerCase().trim();
      return (
        t.fullName.ar.toLowerCase().includes(kw) ||
        t.fullName.en.toLowerCase().includes(kw) ||
        t.title.ar.toLowerCase().includes(kw) ||
        t.title.en.toLowerCase().includes(kw)
      );
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
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-[#0B192C]">{t('نخبة أساتذة التدريس الخصوصي', 'Private Tutors Directory')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('تواصل مباشر واحجز جلسات فردية أو جماعية مع أفضل الأساتذة المعتمدين.', 'Connect and book individual or group sessions with vetted tutors.')}</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <SearchAutocomplete
            value={keyword}
            onChange={setKeyword}
            onSubmit={() => {}}
            placeholder={t('ابحث باسم الأستاذ أو التخصص...', 'Search tutor name or title...')}
            className="w-full sm:w-56"
            inputClassName="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-700"
            preloadedTutors={tutors}
          />

          <select
            value={filterGov}
            onChange={(e) => setFilterGov(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="all">{t('كافة المحافظات', 'All Governorates')}</option>
            {governorates.map((g) => (
              <option key={g.id} value={g.id}>{language === 'en' ? g.name.en : g.name.ar}</option>
            ))}
          </select>

          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="all">{t('كافة المواد', 'All Subjects')}</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{language === 'en' ? s.name.en : s.name.ar}</option>
            ))}
          </select>

          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="all">{t('كافة الصفوف', 'All Grades')}</option>
            {studentLevels.map((lvl) => (
              <option key={lvl.id} value={lvl.id}>{language === 'en' ? lvl.name.en : lvl.name.ar}</option>
            ))}
          </select>

          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="all">{t('كل طرق التدريس', 'All Delivery Modes')}</option>
            <option value="ONLINE">{t('عن بعد', 'Online')}</option>
            <option value="IN_PERSON">{t('حضوري', 'In Person')}</option>
            <option value="HYBRID">{t('مختلط', 'Hybrid')}</option>
          </select>

          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder={t('السعر الأقصى', 'Max price')}
              className="w-24 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono text-slate-700"
            />
            <select
              value={maxPriceCurrency}
              onChange={(e) => setMaxPriceCurrency(e.target.value as 'iqd' | 'usd')}
              className="px-2 py-2 text-xs bg-white border border-slate-200 rounded-lg font-bold text-slate-700"
            >
              <option value="iqd">{t('د.ع', 'IQD')}</option>
              <option value="usd">{t('$', 'USD')}</option>
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
                {r === 0 ? t('الكل', 'Any') : (<><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{r}+</>)}
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
            {nearMeCoords ? t('القريب مني مفعّل', 'Near Me is on') : t('البحث بالقرب مني', 'Near Me')}
          </button>
          {nearMeCoords && (
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-700"
            >
              {[5, 10, 25, 50, 100].map((km) => (
                <option key={km} value={km}>{t(`ضمن ${km} كم`, `Within ${km} km`)}</option>
              ))}
            </select>
          )}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'rating' | 'price_asc' | 'distance_asc')}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="rating">{t('الأعلى تقييماً', 'Highest Rated')}</option>
            <option value="price_asc">{t('الأقل سعراً', 'Lowest Price')}</option>
            {nearMeCoords && <option value="distance_asc">{t('الأقرب مسافة', 'Nearest Distance')}</option>}
          </select>
        </div>
        {nearMeError && <p className="text-xs text-rose-600 -mt-3 mb-4">{nearMeError}</p>}

        {loading ? (
          <div className="text-sm text-slate-500">{t('جاري التحميل...', 'Loading...')}</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-slate-400">{t('لا يوجد أساتذة في هذه المحافظة حالياً', 'No tutors in this governorate yet')}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {filtered.map((tutor) => {
              const gov = governorates.find((g) => g.id === tutor.governorateId);
              return (
                <Link
                  key={tutor.id}
                  href={`/tutors/${tutor.id}`}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex gap-4 items-start"
                >
                  <Image
                    src={tutor.photoUrl}
                    alt={tutor.fullName.en}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-sm text-slate-900">{language === 'en' ? tutor.fullName.en : tutor.fullName.ar}</h3>
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-700">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {tutor.ratingAvg}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{language === 'en' ? tutor.title.en : tutor.title.ar}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{gov ? (language === 'en' ? gov.name.en : gov.name.ar) : tutor.governorateId}</span>
                      {tutor.isVerified && <span className="flex items-center gap-1 text-emerald-600"><ShieldCheck className="w-3 h-3" />{t('موثّق', 'Verified')}</span>}
                    </div>
                    <div className="text-xs font-bold text-slate-800 pt-1">{formatCurrencyIQD(tutor.hourlyRate.iqd)} <span className="font-normal text-slate-400">/ {t('فردي', 'individual')}</span></div>
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
