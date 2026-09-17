'use client';

import React, { useState } from 'react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useLanguage } from '@/core/context/LanguageContext';
import { ApplicationStatus, ApplicationType } from '@/core/types/application';
import { Search, GraduationCap, Building2, Briefcase } from 'lucide-react';

interface LookupApplication {
  id: string;
  type: ApplicationType;
  status: ApplicationStatus;
  createdAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  APPROVING: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-rose-50 text-rose-700',
};

const STATUS_LABELS: Record<ApplicationStatus, [string, string]> = {
  PENDING: ['قيد المراجعة', 'Pending Review'],
  APPROVING: ['قيد المراجعة', 'Pending Review'],
  APPROVED: ['تمت الموافقة', 'Approved'],
  REJECTED: ['مرفوض', 'Rejected'],
};

const TYPE_ICON: Record<ApplicationType, React.ComponentType<{ className?: string }>> = {
  TUTOR: GraduationCap,
  INSTITUTION: Building2,
  EMPLOYER: Briefcase,
};

const TYPE_LABELS: Record<ApplicationType, [string, string]> = {
  TUTOR: ['أستاذ خصوصي', 'Private Tutor'],
  INSTITUTION: ['مؤسسة تعليمية', 'Institution'],
  EMPLOYER: ['شركة / منظمة', 'Company / NGO'],
};

export default function ApplicationStatusPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [applications, setApplications] = useState<LookupApplication[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/applications/lookup?email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || t('تعذر البحث', 'Failed to look up your application'));
        return;
      }
      setApplications(data.applications);
    } catch {
      setError(t('تعذر البحث', 'Failed to look up your application'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-[#0B192C]">{t('حالة طلبي', 'My Application Status')}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {t(
              'أدخل البريد الإلكتروني الذي استخدمته عند التقديم لعرض حالة طلبك.',
              'Enter the email you applied with to see your application status.'
            )}
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            type="email"
            required
            placeholder={t('البريد الإلكتروني', 'Email address')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-xl text-sm font-bold disabled:opacity-60"
          >
            <Search className="w-4 h-4" />
            {t('بحث', 'Search')}
          </button>
        </form>

        {error && (
          <div className="p-4 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800">{error}</div>
        )}

        {applications && (
          applications.length === 0 ? (
            <div className="text-center text-sm text-slate-400 py-12">
              {t('لا توجد طلبات بهذا البريد الإلكتروني', 'No applications found for this email')}
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((a) => {
                const Icon = TYPE_ICON[a.type];
                return (
                  <div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-slate-500" />
                        <span className="font-bold text-sm text-slate-900">{t(...TYPE_LABELS[a.type])}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[a.status]}`}>
                        {t(...STATUS_LABELS[a.status])}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      {t('رقم المرجع', 'Reference')}: {a.id}
                    </div>
                    {a.status === 'REJECTED' && a.rejectionReason && (
                      <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                        {a.rejectionReason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      <Footer />
    </div>
  );
}
