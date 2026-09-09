'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/core/context/LanguageContext';
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

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    governoratesCount: 0,
    categoriesCount: 0,
    institutionsCount: 0,
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
            {t('لوحة تحكم السوبر أدمن - إدارة دليل العراق', 'Superadmin Dashboard - Eduraq Master Control')}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t(
              'إدارة مركزية كاملة لكافة المحافظات، المدن، الفئات، والتصنيفات بدقة ودون أي كود ثابت (Zero Hardcoding).',
              'Full real-time control over all Iraqi governorates, cities, categories, and taxonomies without hardcoded data.'
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/locations"
            className="flex items-center gap-2 px-4 py-2 bg-[#0B192C] text-white rounded-xl text-xs font-bold hover:bg-[#1E3E62] transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#F1C40F]" />
            <span>{t('إضافة محافظة أو مدينة', 'Add Location')}</span>
          </Link>
          <Link
            href="/admin/institutions"
            className="flex items-center gap-2 px-4 py-2 bg-[#F1C40F] text-[#0B192C] rounded-xl text-xs font-bold hover:bg-[#D4AC0D] transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t('إضافة مؤسسة جديدة', 'Add Institution')}</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('المحافظات المسجلة', 'Governorates')}</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900">{stats.governoratesCount}</span>
            <span className="text-xs text-emerald-600 font-semibold ms-2">100% {t('مغطاة في العراق', 'Iraq Covered')}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('الفئات التعليمية', 'Categories')}</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FolderTree className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900">{stats.categoriesCount}</span>
            <span className="text-xs text-slate-500 font-semibold ms-2">{t('ديناميكية بالكامل', 'Dynamic')}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('المؤسسات المسجلة', 'Institutions')}</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900">{stats.institutionsCount}</span>
            <span className="text-xs text-emerald-600 font-semibold ms-2">100% {t('معتمدة رسمياً', 'Accredited')}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('الأساتذة الخصوصيون', 'Private Tutors')}</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900">{stats.tutorsCount}</span>
            <span className="text-xs text-slate-500 font-semibold ms-2">{t('مدرّس معتمد', 'Vetted Tutors')}</span>
          </div>
        </div>
      </div>

      {/* Zero Hardcoding Policy Banner */}
      <div className="p-6 bg-linear-to-r from-[#0B192C] to-[#1E3E62] text-white rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t('نظام إدارة البيانات الحصري بدون كود ثابت', 'Zero-Hardcoding Architecture Active')}</span>
          </div>
          <h2 className="text-lg font-bold">
            {t('تحكم كامل في جميع مدخلات الدليل من مكان واحد', 'Total Control Over Every Input, City, and Category')}
          </h2>
          <p className="text-xs text-slate-300 max-w-xl">
            {t(
              'يمكنك إضافة أي محافظة عراقية جديدة، قضاء أو ناحية، فئة تعليمية، اعتماد وزاري، أو منهاج دراسي مباشرة من لوحة التحكم، وستظهر فوراً لجميع المستخدمين في الفلاتر وقوائم البحث.',
              'Add any new Iraqi governorate, district, category, accreditation, or curriculum directly from the dashboard. Changes reflect immediately in live search facets.'
            )}
          </p>
        </div>

        <Link
          href="/admin/locations"
          className="px-5 py-2.5 bg-white text-[#0B192C] hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors shrink-0"
        >
          {t('إدارة البيانات الآن', 'Manage Master Data')}
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
            {t('المحافظات والمدن والأقضية', 'Governorates & Cities')}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {t('إضافة وتعديل وترتيب 18 محافظة وكافة المدن والمناطق في العراق.', 'Manage 18 governorates, municipal cities, and districts.')}
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
            {t('الفئات والتصنيفات الفرعية', 'Categories & Subcategories')}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {t('تخصيص الفئات (جامعات، مدارس، معاهد، منظمات) مع أيقوناتها.', 'Configure educational categories, badges, and sub-types.')}
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
            {t('الاعتمادات الوزارية والمناهج', 'Accreditations & Curricula')}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {t('إدارة اعتمادات وزارتي التربية والتعليم العالي والمناهج الدولية.', 'Define Ministry accreditations, curricula, and exam subjects.')}
          </p>
        </Link>
      </div>
    </div>
  );
}
