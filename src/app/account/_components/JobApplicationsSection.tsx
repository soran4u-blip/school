'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/core/context/LanguageContext';
import { Briefcase, MessageSquare } from 'lucide-react';
import type { AccountJobApplication } from '../page';

const STATUS_STYLES: Record<AccountJobApplication['status'], string> = {
  SUBMITTED: 'bg-blue-50 text-blue-700',
  REVIEWING: 'bg-amber-50 text-amber-700',
  SHORTLISTED: 'bg-purple-50 text-purple-700',
  REJECTED: 'bg-rose-50 text-rose-700',
  HIRED: 'bg-emerald-50 text-emerald-700',
};

// The account page's "My Job Applications" list — same card shape as BookingsSection/
// InquiriesSection, but read-only (no thread/cancel actions; job applications aren't messaged
// through the account page the way bookings and inquiries are).
export default function JobApplicationsSection({ applications }: { applications: AccountJobApplication[] }) {
  const { language, t } = useLanguage();

  if (applications.length === 0) {
    return (
      <div className="text-center text-sm text-slate-400 py-12">
        {t('لا توجد طلبات توظيف بعد.', 'No job applications yet.')}{' '}
        <Link href="/jobs" className="text-emerald-700 font-bold hover:underline">{t('تصفّح الوظائف', 'Browse jobs')}</Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {applications.map((a) => (
        <div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
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
  );
}
