'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useLanguage } from '@/core/context/LanguageContext';
import { MasterDataService } from '@/core/services/masterDataService';
import { Tutor } from '@/core/types/tutor';
import { Governorate, TaxonomyItem } from '@/core/types/masterData';
import { Star, MapPin, ShieldCheck } from 'lucide-react';
import { formatCurrencyIQD } from '@/lib/utils';

export default function TutorsListPage() {
  const { language, t } = useLanguage();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [subjects, setSubjects] = useState<TaxonomyItem[]>([]);
  const [filterGov, setFilterGov] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterMode, setFilterMode] = useState('all');
  const [sortBy, setSortBy] = useState<'rating' | 'price_asc'>('rating');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [tutorList, govs, taxes] = await Promise.all([
        MasterDataService.getTutors({}),
        MasterDataService.getGovernorates(),
        MasterDataService.getTaxonomies('SUBJECT', false),
      ]);
      setTutors(tutorList);
      setGovernorates(govs);
      setSubjects(taxes);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = tutors
    .filter((t) => filterGov === 'all' || t.governorateId === filterGov)
    .filter((t) => filterSubject === 'all' || t.subjectIds.includes(filterSubject))
    .filter((t) => filterMode === 'all' || t.deliveryMode.includes(filterMode as any))
    .sort((a, b) => (sortBy === 'rating' ? b.ratingAvg - a.ratingAvg : a.hourlyRate.iqd - b.hourlyRate.iqd));

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-[#0B192C]">{t('نخبة أساتذة التدريس الخصوصي', 'Private Tutors Directory')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('تواصل مباشر واحجز جلسات فردية أو جماعية مع أفضل الأساتذة المعتمدين.', 'Connect and book individual or group sessions with vetted tutors.')}</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
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
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="all">{t('كل طرق التدريس', 'All Delivery Modes')}</option>
            <option value="ONLINE">{t('عن بعد', 'Online')}</option>
            <option value="IN_PERSON">{t('حضوري', 'In Person')}</option>
            <option value="HYBRID">{t('مختلط', 'Hybrid')}</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'rating' | 'price_asc')}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="rating">{t('الأعلى تقييماً', 'Highest Rated')}</option>
            <option value="price_asc">{t('الأقل سعراً', 'Lowest Price')}</option>
          </select>
        </div>

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
