'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useLanguage } from '@/core/context/LanguageContext';
import { Search, Briefcase, MessageSquare } from 'lucide-react';

interface LookupApplication {
  id: string;
  jobId: string;
  jobTitle: { ar: string; en: string } | null;
  institutionId: string;
  institutionName: { ar: string; en: string } | null;
  institutionWhatsapp: string | null;
  status: 'SUBMITTED' | 'REVIEWING' | 'SHORTLISTED' | 'REJECTED' | 'HIRED';
  createdAt: string;
}

const STATUS_STYLES: Record<LookupApplication['status'], string> = {
  SUBMITTED: 'bg-blue-50 text-blue-700',
  REVIEWING: 'bg-amber-50 text-amber-700',
  SHORTLISTED: 'bg-purple-50 text-purple-700',
  REJECTED: 'bg-rose-50 text-rose-700',
  HIRED: 'bg-emerald-50 text-emerald-700',
};

export default function MyApplicationsPage() {
  const { language, t } = useLanguage();
  const [phone, setPhone] = useState('');
  const [applications, setApplications] = useState<LookupApplication[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/job-applications/lookup?phone=${encodeURIComponent(phone.trim())}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || t('تعذر البحث', 'Failed to look up your applications'));
        return;
      }
      setApplications(data.applications);
    } catch {
      setError(t('تعذر البحث', 'Failed to look up your applications'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-[#0B192C]">{t('طلبات التوظيف الخاصة بي', 'My Job Applications')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('أدخل رقم هاتفك لعرض حالة طلبات التوظيف الخاصة بك.', 'Enter your phone number to view the status of your job applications.')}</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            type="text"
            required
            placeholder={t('رقم الهاتف', 'Phone number')}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1 px-4 py-2.5 text-sm border border-[#E8E6DE] rounded-xl font-mono bg-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#123D35] hover:bg-[#28675A] text-white rounded-xl text-sm font-bold disabled:opacity-60"
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
            <div className="text-center text-sm text-slate-400 py-12">{t('لا توجد طلبات بهذا الرقم', 'No applications found for this number')}</div>
          ) : (
            <div className="space-y-3">
              {applications.map((a) => (
                <div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                        <Link href={`/jobs/${a.jobId}`} className="font-bold text-sm text-slate-900 hover:text-blue-700">
                          {a.jobTitle ? (language === 'en' ? a.jobTitle.en : a.jobTitle.ar) : a.jobId}
                        </Link>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[a.status]}`}>
                          {a.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-semibold">
                        {a.institutionName ? (language === 'en' ? a.institutionName.en : a.institutionName.ar) : a.institutionId}
                      </div>
                    </div>

                    {a.institutionWhatsapp && (
                      <a
                        href={`https://wa.me/${a.institutionWhatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg"
                        title={t('واتساب', 'WhatsApp')}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <Footer />
    </div>
  );
}
