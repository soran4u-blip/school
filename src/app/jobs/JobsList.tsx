'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useLanguage } from '@/core/context/LanguageContext';
import { useT } from '@/lib/useT';
import { pickLocalized } from '@/lib/localized';
import { JOBS_COPY } from './Jobs.i18n';
import { localeHref } from '@/lib/locale';
import { Governorate, TaxonomyItem } from '@/core/types/masterData';
import { Job } from '@/core/types/job';
import {
  Briefcase,
  MapPin,
  SlidersHorizontal,
  X,
  RotateCcw,
  Building2,
  Globe,
  Clock,
} from 'lucide-react';

interface JobsListProps {
  jobs: Job[];
  governorates: Governorate[];
  subjects: TaxonomyItem[];
  initialGovernorate?: string;
}

const EMPLOYMENT_LABELS: Record<Job['employmentType'], { ar: string; en: string }> = {
  FULL_TIME: { ar: 'دوام كامل', en: 'Full-time' },
  PART_TIME: { ar: 'دوام جزئي', en: 'Part-time' },
  CONTRACT: { ar: 'عقد', en: 'Contract' },
  INTERNSHIP: { ar: 'تدريب', en: 'Internship' },
};

function JobsContent({ jobs, governorates, subjects, initialGovernorate }: JobsListProps) {
  const { language } = useLanguage();
  const t = useT(JOBS_COPY);

  const [selectedGov, setSelectedGov] = useState(initialGovernorate || 'all');
  const [selectedType, setSelectedType] = useState<Job['employmentType'] | 'all'>('all');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'deadline'>('newest');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const filtered = jobs.filter((j) => {
    if (selectedGov !== 'all' && j.governorateId !== selectedGov) return false;
    if (selectedType !== 'all' && j.employmentType !== selectedType) return false;
    if (remoteOnly && !j.isRemote) return false;
    if (selectedSubject !== 'all' && !j.subjectIds?.includes(selectedSubject)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'deadline') {
      if (!a.applicationDeadline) return 1;
      if (!b.applicationDeadline) return -1;
      return a.applicationDeadline.localeCompare(b.applicationDeadline);
    }
    return b.createdAt.localeCompare(a.createdAt);
  });

  const clearFilters = () => {
    setSelectedGov('all');
    setSelectedType('all');
    setRemoteOnly(false);
    setSelectedSubject('all');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <Navbar />

      <div className="bg-[#123D35] text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center gap-2 text-xs text-[#D9F27C] font-bold">
            <span>{t('crumbDirectory')}</span>
            <span>/</span>
            <span>{t('crumbJobs')}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            {t('heroTitle')}
          </h1>
          <p className="text-sm sm:text-base text-white/75 max-w-2xl leading-7 font-normal">
            {t('heroIntro')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        <div className="lg:hidden mb-4 flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="flex items-center gap-2 text-xs font-extrabold text-[#0B192C]"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>{t('filterResults')}</span>
          </button>
          <span className="text-xs text-slate-500 font-bold">{sorted.length} {t('jobsUnit')}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className={`lg:col-span-4 space-y-6 ${mobileFilterOpen ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto block' : 'hidden lg:block'}`}>
            {mobileFilterOpen && (
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                <h3 className="font-extrabold text-slate-900 text-sm">{t('filtersTitle')}</h3>
                <button onClick={() => setMobileFilterOpen(false)} className="p-1 text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="bg-white p-6 rounded-2xl border border-[#E8E6DE] shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-blue-700" />
                  <span className="font-extrabold text-sm text-[#0B192C]">{t('filterBy')}</span>
                </div>
                <button
                  onClick={clearFilters}
                  className="text-xs font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t('reset')}</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">{t('governorate')}</label>
                <select
                  value={selectedGov}
                  onChange={(e) => setSelectedGov(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 cursor-pointer focus:outline-blue-600"
                >
                  <option value="all">{t('allGovernorates')}</option>
                  {governorates.map((gov) => (
                    <option key={gov.id} value={gov.id}>
                      {pickLocalized(gov.name, language)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">{t('employmentType')}</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as Job['employmentType'] | 'all')}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 cursor-pointer focus:outline-blue-600"
                >
                  <option value="all">{t('allTypes')}</option>
                  {(Object.keys(EMPLOYMENT_LABELS) as Job['employmentType'][]).map((key) => (
                    <option key={key} value={key}>
                      {pickLocalized(EMPLOYMENT_LABELS[key], language)}
                    </option>
                  ))}
                </select>
              </div>

              {subjects.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">{t('subject')}</label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 cursor-pointer focus:outline-blue-600"
                  >
                    <option value="all">{t('allSubjects')}</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {pickLocalized(s.name, language)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">{t('remoteOnly')}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={remoteOnly}
                    onChange={(e) => setRemoteOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </label>
              </div>

              {mobileFilterOpen && (
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-full py-3 bg-[#0B192C] text-white rounded-xl text-xs font-bold mt-4"
                >
                  {t('applyFilters')}
                </button>
              )}
            </div>
          </aside>

          <main className="lg:col-span-8 space-y-6">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs font-bold text-slate-700">
                {t('found')}{' '}
                <span className="text-blue-700 font-black text-sm">{sorted.length}</span>{' '}
                {t('openPositions')}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-semibold">{t('sortBy')}</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'deadline')}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 text-xs cursor-pointer focus:outline-blue-600"
                >
                  <option value="newest">{t('newest')}</option>
                  <option value="deadline">{t('deadlineSoon')}</option>
                </select>
              </div>
            </div>

            {sorted.length > 0 ? (
              <div className="space-y-4">
                {sorted.map((job) => {
                  const gov = governorates.find((g) => g.id === job.governorateId);
                  return (
                    <Link
                      key={job.id}
                      href={localeHref(`/jobs/${job.slug || job.id}`, language)}
                      className="block bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all p-5"
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <h2 className="font-extrabold text-base text-slate-900">
                            {pickLocalized(job.title, language)}
                          </h2>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mt-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{job.posterName || job.institutionId || job.employerId}</span>
                            {job.employerId && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-700">
                                {job.posterType === 'NGO' ? t('ngo') : t('company')}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
                          {pickLocalized(EMPLOYMENT_LABELS[job.employmentType], language)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mt-3">
                        {pickLocalized(job.description, language)}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 font-semibold">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {job.isRemote ? t('remote') : (gov ? (pickLocalized(gov.name, language)) : job.governorateId)}
                        </span>
                        {job.applicationDeadline && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {t('deadline')}: {job.applicationDeadline}
                          </span>
                        )}
                        {job.salaryMin && (
                          <span className="flex items-center gap-1 font-bold text-slate-700">
                            {job.salaryMin.toLocaleString()}{job.salaryMax ? `–${job.salaryMax.toLocaleString()}` : ''} {job.salaryCurrency}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-[#E8E6DE] text-center space-y-4 shadow-sm">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-extrabold text-base text-slate-800">
                  {t('emptyTitle')}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {t('emptyHint')}
                </p>
                <button onClick={clearFilters} className="px-4 py-2 bg-[#123D35] hover:bg-[#28675A] text-white rounded-xl text-xs font-bold transition-colors">
                  {t('resetAll')}
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

export default function JobsList(props: JobsListProps) {
  return <JobsContent {...props} />;
}
