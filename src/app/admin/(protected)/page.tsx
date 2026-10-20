'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getGovernorates, getCategories } from '@/core/services/masterDataService';
import { getInstitutions } from '@/core/services/institutionService';
import { getTutors } from '@/core/services/tutorService';
import { 
  Building2, 
  MapPin, 
  FolderTree, 
  UserCheck, 
  Plus, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';
import { useT } from '@/lib/useT';
import { ADMIN_HOME_COPY } from './AdminHome.i18n';

export default function AdminDashboardPage() {
  const t = useT(ADMIN_HOME_COPY);
  const [stats, setStats] = useState({
    governoratesCount: 0,
    categoriesCount: 0,
    institutionsCount: 0,
    activeInstitutionsCount: 0,
    verifiedInstitutionsCount: 0,
    tutorsCount: 0,
  });

  useEffect(() => {
    async function loadStats() {
      const [govs, cats, insts, tutors] = await Promise.all([
        getGovernorates(false),
        getCategories(false),
        getInstitutions({ status: 'ALL' }),
        getTutors({ status: 'ALL' })
      ]);

      setStats({
        governoratesCount: govs.length,
        categoriesCount: cats.length,
        institutionsCount: insts.length,
        activeInstitutionsCount: insts.filter((inst) => inst.status === 'ACTIVE').length,
        verifiedInstitutionsCount: insts.filter((inst) => inst.isVerified).length,
        tutorsCount: tutors.length,
      });
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B192C]">
            {t('title')}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t('subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/locations"
            className="flex items-center gap-2 px-4 py-2 bg-[#0B192C] text-white rounded-xl text-xs font-bold hover:bg-[#1E3E62] transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#F1C40F]" />
            <span>{t('addLocation')}</span>
          </Link>
          <Link
            href="/admin/institutions"
            className="flex items-center gap-2 px-4 py-2 bg-[#F1C40F] text-[#0B192C] rounded-xl text-xs font-bold hover:bg-[#D4AC0D] transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addInstitution')}</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('governorates')}</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900">{stats.governoratesCount}</span>
            <span className="text-xs text-emerald-600 font-semibold ms-2">100% {t('iraqCovered')}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('categories')}</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FolderTree className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900">{stats.categoriesCount}</span>
            <span className="text-xs text-slate-500 font-semibold ms-2">{t('dynamic')}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('institutions')}</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900">{stats.institutionsCount}</span>
            <span className="text-xs text-slate-500 font-semibold ms-2">{stats.activeInstitutionsCount} {t('active')} · {stats.verifiedInstitutionsCount} {t('verified')}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('privateTutors')}</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900">{stats.tutorsCount}</span>
            <span className="text-xs text-slate-500 font-semibold ms-2">{t('vettedTutors')}</span>
          </div>
        </div>
      </div>

      {/* Zero Hardcoding Policy Banner */}
      <div className="p-6 bg-linear-to-r from-[#0B192C] to-[#1E3E62] text-white rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t('zeroHardcoding')}</span>
          </div>
          <h2 className="text-lg font-bold">
            {t('totalControl')}
          </h2>
          <p className="text-xs text-slate-300 max-w-xl">
            {t('bannerBody')}
          </p>
        </div>

        <Link
          href="/admin/locations"
          className="px-5 py-2.5 bg-white text-[#0B192C] hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors shrink-0"
        >
          {t('manageData')}
        </Link>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          href="/admin/locations"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-400 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <MapPin className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
            {t('govCities')}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {t('govCitiesHint')}
          </p>
        </Link>

        <Link
          href="/admin/categories"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-400 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <FolderTree className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
            {t('catSub')}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {t('catSubHint')}
          </p>
        </Link>

        <Link
          href="/admin/taxonomies"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-400 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
            {t('accCurricula')}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {t('accCurriculaHint')}
          </p>
        </Link>
      </div>
    </div>
  );
}
