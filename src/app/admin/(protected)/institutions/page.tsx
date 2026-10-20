'use client';

import React, { useState } from 'react';
import Thumbnail from '@/components/shared/Thumbnail';
import { useLoadOnMount } from '@/lib/useLoadOnMount';
import Link from 'next/link';
import { useLanguage } from '@/core/context/LanguageContext';
import { getInstitutions } from '@/core/services/institutionService';
import { updateListing, deleteListing } from '@/core/services/adminListingService';
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
  Edit,
  Trash2
} from 'lucide-react';
import ListingStatusControl, { ListingStatus } from '@/components/shared/ListingStatusControl';
import DeletedListingsPanel from '@/components/shared/DeletedListingsPanel';
import { DELETED_LISTING_RETENTION_DAYS, isDeleted, isNotDeleted } from '@/lib/listingLifecycle';
import { useT } from '@/lib/useT';
import { ADMIN_INSTITUTIONS_COPY } from './Institutions.i18n';
import { pickLocalized } from '@/lib/localized';

export default function AdminInstitutionsPage() {
  const { language } = useLanguage();
  const t = useT(ADMIN_INSTITUTIONS_COPY);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
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

  useLoadOnMount(loadData);

  // These four go through /api/admin/listings so they land in the audit trail — approving,
  // verifying, featuring and deleting are the admin actions most worth being able to attribute.
  const run = async (action: () => Promise<void>) => {
    setError('');
    try {
      await action();
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('actionFailed'));
    }
  };

  // The only place a PENDING institution can be approved into the public directory. Institution
  // owners could previously do this themselves from their dashboard's "Publish Now" button; that
  // is now an admin decision, so this page has to offer it.
  const handleSetStatus = (inst: Institution, status: ListingStatus) =>
    run(() => updateListing('institutions', inst.id, { status }));

  const toggleVerification = (inst: Institution) =>
    run(() => updateListing('institutions', inst.id, { isVerified: !inst.isVerified }));

  const toggleFeatured = (inst: Institution) =>
    run(() => updateListing('institutions', inst.id, { isFeatured: !inst.isFeatured }));

  const handleDelete = async (inst: Institution) => {
    const name = pickLocalized(inst.name, language);
    if (!confirm(t('confirmDelete', { name, days: DELETED_LISTING_RETENTION_DAYS }))) {
      return;
    }
    await run(() => deleteListing('institutions', inst.id));
  };

  const deleted = institutions.filter(isDeleted).map((inst) => ({
    id: inst.id,
    name: pickLocalized(inst.name, language),
    deletedAt: inst.deletedAt,
  }));

  const filtered = institutions.filter(isNotDeleted).filter(inst => {
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
            <span>{t('title')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <Link
            href="/explore"
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>{t('viewPublic')}</span>
          </Link>
          <Link
            href="/admin/institutions/add"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#F1C40F]" />
            <span>{t('addInstitution')}</span>
          </Link>
        </div>

      {error && (
        <div className="p-4 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">{error}</div>
      )}
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="all">{t('allCategories')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{pickLocalized(c.name, language)}</option>
            ))}
          </select>

          <select
            value={filterGov}
            onChange={(e) => setFilterGov(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="all">{t('allGovernorates')}</option>
            {governorates.map((g) => (
              <option key={g.id} value={g.id}>{pickLocalized(g.name, language)}</option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-500 font-bold">
          {t('results')} <span className="text-slate-900 font-black">{filtered.length}</span>
        </span>
      </div>

      {/* Institutions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full min-w-[900px] text-xs text-start">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="p-3 text-start">{t('colInstitution')}</th>
              <th className="p-3 text-start">{t('colCategoryLocation')}</th>
              <th className="p-3 text-center">{t('colRating')}</th>
              <th className="p-3 text-center">{t('colStatus')}</th>
              <th className="p-3 text-center">{t('colVerified')}</th>
              <th className="p-3 text-center">{t('colFeatured')}</th>
              <th className="p-3 text-end">{t('colActions')}</th>
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
                      <Thumbnail
                        src={inst.logoUrl}
                        alt={inst.name.en}
                        width={36}
                        height={36}
                        className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{pickLocalized(inst.name, language)}</div>
                        <div className="text-[11px] text-slate-500">{language === 'en' ? inst.name.ar : inst.name.en}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-800">{cat ? pickLocalized(cat.name, language) : inst.categoryId}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{gov ? pickLocalized(gov.name, language) : inst.governorateId}</span>
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
                    <ListingStatusControl
                      status={inst.status}
                      onChange={(next) => handleSetStatus(inst, next)}
                    />
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
                      <span>{inst.isVerified ? t('verified') : t('unverified')}</span>
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
                      {inst.isFeatured ? '★ ' + t('featured') : t('standard')}
                    </button>
                  </td>
                  <td className="p-3 text-end">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/institutions/add?edit=${inst.id}`}
                        className="p-1.5 text-slate-500 hover:text-blue-700 inline-block"
                        title={t('edit')}
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/institutions/${inst.slug}`}
                        className="p-1.5 text-blue-600 hover:text-blue-800 inline-block font-bold"
                        title={t('viewProfile')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(inst)}
                        className="p-1.5 text-slate-500 hover:text-rose-700"
                        title={t('delete')}
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

      <DeletedListingsPanel type="institutions" items={deleted} onChanged={loadData} />
    </div>
  );
}
