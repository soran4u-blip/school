'use client';

import React, { useState } from 'react';
import { useLoadOnMount } from '@/lib/useLoadOnMount';
import { useLanguage } from '@/core/context/LanguageContext';
import { getAllEmployers } from '@/core/services/employerService';
import { updateListing, deleteListing } from '@/core/services/adminListingService';
import { getGovernorates } from '@/core/services/masterDataService';
import { Employer } from '@/core/types/employer';
import { Governorate } from '@/core/types/masterData';
import { Briefcase, MapPin, Mail, Phone, Trash2 } from 'lucide-react';
import DeletedListingsPanel from '@/components/shared/DeletedListingsPanel';
import { DELETED_LISTING_RETENTION_DAYS, isDeleted, isNotDeleted } from '@/lib/listingLifecycle';
import { useT } from '@/lib/useT';
import { EMPLOYERS_COPY } from './Employers.i18n';
import { pickLocalized } from '@/lib/localized';

export default function AdminEmployersPage() {
  const { language } = useLanguage();
  const t = useT(EMPLOYERS_COPY);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [emps, govs] = await Promise.all([
        getAllEmployers(),
        getGovernorates(false),
      ]);
      setEmployers(emps);
      setGovernorates(govs);
    } catch {
      setError(t('loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useLoadOnMount(loadData);

  const governorateName = (id: string) => {
    const gov = governorates.find((g) => g.id === id);
    return gov ? pickLocalized(gov.name, language) : id;
  };

  const handleToggleStatus = async (employer: Employer) => {
    const status = employer.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await run(() => updateListing('employers', employer.id, { status }));
  };

  // These go through /api/admin/listings so they land in the audit trail.
  const run = async (action: () => Promise<void>) => {
    setError('');
    try {
      await action();
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('actionFailed'));
    }
  };

  const liveEmployers = employers.filter(isNotDeleted);
  const deletedEmployers = employers.filter(isDeleted).map((employer) => ({
    id: employer.id,
    name: employer.name,
    deletedAt: employer.deletedAt,
  }));

  const handleDelete = async (employer: Employer) => {
    if (!confirm(t('confirmDelete', { name: employer.name, days: DELETED_LISTING_RETENTION_DAYS }))) return;
    await run(() => deleteListing('employers', employer.id));
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B192C] flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-orange-600" />
          <span>{t('title')}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {t('subtitle')}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">{error}</div>
      )}

      {error && (
        <div className="p-4 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">{error}</div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-xs text-start">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="p-3 text-start">{t('name')}</th>
              <th className="p-3 text-start">{t('typeGov')}</th>
              <th className="p-3 text-start">{t('contact')}</th>
              <th className="p-3 text-center">{t('status')}</th>
              <th className="p-3 text-end">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">{t('loading')}</td></tr>
            ) : liveEmployers.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">{t('empty')}</td></tr>
            ) : (
              liveEmployers.map((employer) => (
                <tr key={employer.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-slate-900">{employer.name}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${employer.type === 'COMPANY' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                        {employer.type === 'COMPANY' ? t('company') : t('ngo')}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3 h-3" />
                        {governorateName(employer.governorateId)}
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1 text-slate-500 mb-0.5">
                      <Mail className="w-3 h-3" />
                      {employer.contact.email}
                    </div>
                    <div className="flex items-center gap-1 text-slate-500" dir="ltr">
                      <Phone className="w-3 h-3" />
                      {employer.contact.phone}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleToggleStatus(employer)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                        employer.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                      }`}
                    >
                      {employer.status === 'ACTIVE' ? t('active') : t('suspended')}
                    </button>
                  </td>
                  <td className="p-3 text-end">
                    <button
                      onClick={() => handleDelete(employer)}
                      className="p-1.5 text-slate-500 hover:text-rose-700"
                      title={t('delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <DeletedListingsPanel type="employers" items={deletedEmployers} onChanged={loadData} />
    </div>
  );
}
