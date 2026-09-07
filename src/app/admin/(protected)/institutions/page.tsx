'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/core/context/LanguageContext';
import { getInstitutions, saveInstitution, deleteInstitution } from '@/core/services/institutionService';
import { getGovernorates, getCategories } from '@/core/services/masterDataService';
import { Institution } from '@/core/types/institution';
import { Governorate, Category } from '@/core/types/masterData';
import {
  Building2,
  ShieldCheck,
  Star,
  MapPin,
  Plus,
  ExternalLink,
  CheckCircle,
  XCircle,
  Edit,
  Trash2
} from 'lucide-react';

export default function AdminInstitutionsPage() {
  const { language, t } = useLanguage();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterCat, setFilterCat] = useState('all');
  const [filterGov, setFilterGov] = useState('all');

  const loadData = async () => {
    const [insts, govs, cats] = await Promise.all([
      getInstitutions({ status: 'ALL' }),
      getGovernorates(false),
      getCategories(false),
    ]);
    setInstitutions(insts);
    setGovernorates(govs);
    setCategories(cats);
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleVerification = async (inst: Institution) => {
    const updated: Institution = {
      ...inst,
      isVerified: !inst.isVerified,
    };
    await saveInstitution(updated);
    await loadData();
  };

  const toggleFeatured = async (inst: Institution) => {
    const updated: Institution = {
      ...inst,
      isFeatured: !inst.isFeatured,
    };
    await saveInstitution(updated);
    await loadData();
  };

  const handleDelete = async (inst: Institution) => {
    const name = language === 'en' ? inst.name.en : inst.name.ar;
    if (!confirm(t(`هل أنت متأكد من حذف "${name}"؟ لا يمكن التراجع عن هذا الإجراء.`, `Delete "${name}"? This cannot be undone.`))) {
      return;
    }
    await deleteInstitution(inst.id);
    await loadData();
  };

  const filtered = institutions.filter(inst => {
    if (filterCat !== 'all' && inst.categoryId !== filterCat) return false;
    if (filterGov !== 'all' && inst.governorateId !== filterGov) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B192C] flex items-center gap-2">
            <Building2 className="w-6 h-6 text-purple-600" />
            <span>{t('إدارة المؤسسات التعليمية المسجلة', 'Educational Institutions Directory')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t(
              'اعتماد وتوثيق المدارس والجامعات والمعاهد، تفعيل الشارات الرسمية، وإدارة برامج القبول.',
              'Verify institution credentials, toggle official badges, and manage listings.'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <Link
            href="/explore"
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>{t('عرض الدليل العام', 'View Public Directory')}</span>
          </Link>
          <Link
            href="/admin/institutions/add"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#F1C40F]" />
            <span>{t('إضافة مؤسسة', 'Add Institution')}</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="all">{t('كافة الفئات', 'All Categories')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{language === 'en' ? c.name.en : c.name.ar}</option>
            ))}
          </select>

          <select
            value={filterGov}
            onChange={(e) => setFilterGov(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="all">{t('كافة المحافظات', 'All Governorates')}</option>
            {governorates.map((g) => (
              <option key={g.id} value={g.id}>{language === 'en' ? g.name.en : g.name.ar}</option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-500 font-bold">
          {t('النتائج:', 'Results:')} <span className="text-slate-900 font-black">{filtered.length}</span>
        </span>
      </div>

      {/* Institutions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-xs text-start">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="p-3 text-start">{t('المؤسسة', 'Institution')}</th>
              <th className="p-3 text-start">{t('الفئة والمحافظة', 'Category & Location')}</th>
              <th className="p-3 text-center">{t('التقييم', 'Rating')}</th>
              <th className="p-3 text-center">{t('التوثيق الرسمي', 'Verified Badge')}</th>
              <th className="p-3 text-center">{t('مميز في الواجهة', 'Featured')}</th>
              <th className="p-3 text-end">{t('إجراءات', 'Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((inst) => {
              const gov = governorates.find(g => g.id === inst.governorateId);
              const cat = categories.find(c => c.id === inst.categoryId);

              return (
                <tr key={inst.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={inst.logoUrl} 
                        alt={inst.name.en} 
                        className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0" 
                      />
                      <div>
                        <div className="font-bold text-slate-900">{language === 'en' ? inst.name.en : inst.name.ar}</div>
                        <div className="text-[11px] text-slate-500">{language === 'en' ? inst.name.ar : inst.name.en}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-800">{cat ? (language === 'en' ? cat.name.en : cat.name.ar) : inst.categoryId}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{gov ? (language === 'en' ? gov.name.en : gov.name.ar) : inst.governorateId}</span>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <div className="inline-flex items-center gap-1 font-bold text-slate-800 bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>{inst.metrics.ratingAvg}</span>
                      <span className="text-slate-400 font-normal">({inst.metrics.reviewCount})</span>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => toggleVerification(inst)}
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-all ${
                        inst.isVerified 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100' 
                          : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>{inst.isVerified ? t('معتمد رسمياً', 'Verified') : t('غير موثق', 'Unverified')}</span>
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => toggleFeatured(inst)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-all ${
                        inst.isFeatured 
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 font-black' 
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {inst.isFeatured ? '★ ' + t('مميز', 'Featured') : t('عادي', 'Standard')}
                    </button>
                  </td>
                  <td className="p-3 text-end">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/institutions/add?edit=${inst.id}`}
                        className="p-1.5 text-slate-500 hover:text-blue-700 inline-block"
                        title={t('تعديل', 'Edit')}
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/institutions/${inst.slug}`}
                        className="p-1.5 text-blue-600 hover:text-blue-800 inline-block font-bold"
                        title={t('عرض الصفحة العامة', 'View Public Profile')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(inst)}
                        className="p-1.5 text-slate-500 hover:text-rose-700"
                        title={t('حذف', 'Delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
