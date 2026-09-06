'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { MasterDataService } from '@/core/services/masterDataService';
import { Tutor } from '@/core/types/tutor';
import { Governorate } from '@/core/types/masterData';
import { UserCheck, ShieldCheck, ShieldQuestion, Star, MapPin, Phone, MessageSquare, Plus, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { formatCurrencyIQD, deriveVerificationBadge } from '@/lib/utils';

export default function AdminTutorsPage() {
  const { language, t } = useLanguage();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);

  const loadData = async () => {
    const [tutList, govs] = await Promise.all([
      MasterDataService.getTutors({ status: 'ALL' }),
      MasterDataService.getGovernorates(false),
    ]);
    setTutors(tutList);
    setGovernorates(govs);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (tutor: Tutor) => {
    const name = language === 'en' ? tutor.fullName.en : tutor.fullName.ar;
    if (!confirm(t(`هل أنت متأكد من حذف "${name}"؟ لا يمكن التراجع عن هذا الإجراء.`, `Delete "${name}"? This cannot be undone.`))) {
      return;
    }
    await MasterDataService.deleteTutor(tutor.id);
    await loadData();
  };

  const handleToggleStatus = async (tutor: Tutor) => {
    const status = tutor.status === 'ACTIVE' ? 'PENDING' : 'ACTIVE';
    await MasterDataService.saveTutor({ ...tutor, status });
    await loadData();
  };

  const handleToggleVerified = async (tutor: Tutor) => {
    const isVerified = !tutor.isVerified;
    await MasterDataService.saveTutor({
      ...tutor,
      isVerified,
      verificationBadgeLabel: deriveVerificationBadge(isVerified, tutor.verificationBadgeLabel),
    });
    await loadData();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B192C] flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-emerald-600" />
            <span>{t('إدارة الأساتذة والمدرسين الخصوصيين', 'Private Tutors Directory')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t(
              'اعتماد وتوثيق مدرسي مرحلة السادس الإعدادي (الوزاري) والمراحل الجامعية مع التحقق من الهويات.',
              'Vet and verify Baccalaureate wazari subject masters and academic tutors.'
            )}
          </p>
        </div>
        <Link
          href="/admin/tutors/add"
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-xl text-xs font-bold transition-colors shadow-xs self-start"
        >
          <Plus className="w-4 h-4 text-[#F1C40F]" />
          <span>{t('إضافة أستاذ', 'Add Tutor')}</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-xs text-start">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="p-3 text-start">{t('الأستاذ / المعلم', 'Tutor')}</th>
              <th className="p-3 text-start">{t('التخصص والمحافظة', 'Subject & Governorate')}</th>
              <th className="p-3 text-center">{t('سعر الساعة', 'Hourly Rate')}</th>
              <th className="p-3 text-center">{t('التقييم', 'Rating')}</th>
              <th className="p-3 text-center">{t('النشر', 'Status')}</th>
              <th className="p-3 text-center">{t('حالة التوثيق', 'Verification')}</th>
              <th className="p-3 text-end">{t('إجراءات', 'Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tutors.map((tutor) => {
              const gov = governorates.find(g => g.id === tutor.governorateId);

              return (
                <tr key={tutor.id} className="hover:bg-slate-50/50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={tutor.photoUrl}
                        alt={tutor.fullName.en}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{language === 'en' ? tutor.fullName.en : tutor.fullName.ar}</div>
                        <div className="text-[11px] text-slate-500">{language === 'en' ? tutor.title.en : tutor.title.ar}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-800">{gov ? (language === 'en' ? gov.name.en : gov.name.ar) : tutor.governorateId}</div>
                    <div className="text-[10px] text-slate-500">{tutor.deliveryMode.join(' • ')}</div>
                  </td>
                  <td className="p-3 text-center font-bold text-slate-800">
                    {formatCurrencyIQD(tutor.hourlyRate.iqd)}
                  </td>
                  <td className="p-3 text-center">
                    <div className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>{tutor.ratingAvg}</span>
                      <span className="text-slate-400 font-normal">({tutor.reviewCount})</span>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleToggleStatus(tutor)}
                      title={t('اضغط للتبديل', 'Click to toggle')}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                        tutor.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                      }`}
                    >
                      {tutor.status === 'ACTIVE' ? t('نشط', 'Active') : t('قيد المراجعة', 'Pending')}
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleToggleVerified(tutor)}
                      title={t('اضغط للتبديل', 'Click to toggle')}
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                        tutor.isVerified
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {tutor.isVerified ? <ShieldCheck className="w-3 h-3" /> : <ShieldQuestion className="w-3 h-3" />}
                      <span>{language === 'en' ? tutor.verificationBadgeLabel.en : tutor.verificationBadgeLabel.ar}</span>
                    </button>
                  </td>
                  <td className="p-3 text-end">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/tutors/add?edit=${tutor.id}`}
                        className="p-1.5 text-slate-500 hover:text-blue-700 inline-block"
                        title={t('تعديل', 'Edit')}
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <a
                        href={`https://wa.me/${tutor.whatsappNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                      <button
                        onClick={() => handleDelete(tutor)}
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
