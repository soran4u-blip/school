'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { getAllEmployers, updateEmployerStatus, deleteEmployer } from '@/core/services/employerService';
import { getGovernorates } from '@/core/services/masterDataService';
import { Employer } from '@/core/types/employer';
import { Governorate } from '@/core/types/masterData';
import { Briefcase, MapPin, Mail, Phone, Trash2 } from 'lucide-react';

export default function AdminEmployersPage() {
  const { language, t } = useLanguage();
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
      setError(t('تعذر تحميل البيانات. تأكد من تسجيل الدخول كسوبر أدمن.', 'Failed to load data. Make sure you are signed in as superadmin.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const governorateName = (id: string) => {
    const gov = governorates.find((g) => g.id === id);
    return gov ? (language === 'en' ? gov.name.en : gov.name.ar) : id;
  };

  const handleToggleStatus = async (employer: Employer) => {
    const status = employer.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await updateEmployerStatus(employer.id, status);
    await loadData();
  };

  const handleDelete = async (employer: Employer) => {
    if (!confirm(t(`هل تريد حذف "${employer.name}"؟ لا يمكن التراجع عن هذا الإجراء.`, `Delete "${employer.name}"? This cannot be undone.`))) return;
    await deleteEmployer(employer.id);
    await loadData();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B192C] flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-orange-600" />
          <span>{t('الشركات والمنظمات', 'Companies & NGOs')}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {t('حسابات الشركات والمنظمات غير الحكومية — يمكنها فقط نشر وإدارة الوظائف.', 'Employer accounts — can only post and manage job listings.')}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">{error}</div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-xs text-start">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="p-3 text-start">{t('الاسم', 'Name')}</th>
              <th className="p-3 text-start">{t('النوع والمحافظة', 'Type & Governorate')}</th>
              <th className="p-3 text-start">{t('التواصل', 'Contact')}</th>
              <th className="p-3 text-center">{t('الحالة', 'Status')}</th>
              <th className="p-3 text-end">{t('إجراءات', 'Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">{t('جاري التحميل...', 'Loading...')}</td></tr>
            ) : employers.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">{t('لا توجد حسابات بعد', 'No employer accounts yet')}</td></tr>
            ) : (
              employers.map((employer) => (
                <tr key={employer.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-slate-900">{employer.name}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${employer.type === 'COMPANY' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                        {employer.type === 'COMPANY' ? t('شركة', 'Company') : t('منظمة', 'NGO')}
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
                      {employer.status === 'ACTIVE' ? t('نشط', 'Active') : t('موقوف', 'Suspended')}
                    </button>
                  </td>
                  <td className="p-3 text-end">
                    <button
                      onClick={() => handleDelete(employer)}
                      className="p-1.5 text-slate-500 hover:text-rose-700"
                      title={t('حذف', 'Delete')}
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
    </div>
  );
}
