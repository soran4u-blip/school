'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/core/context/LanguageContext';
import { AdmissionApplicationStatus } from '@/core/types/admission';
import { Building2, FileX } from 'lucide-react';
import type { AccountAdmissionApplication } from '../accountTypes';
import { pickLocalized } from '@/lib/localized';
import { useT } from '@/lib/useT';
import { ACCOUNT_COPY } from '../Account.i18n';

const ADMISSION_STATUS_LABELS: Record<AdmissionApplicationStatus, { ar: string; en: string; ku: string }> = {
  SUBMITTED: { ar: 'تم الإرسال', en: 'Submitted', ku: 'نێردرا' },
  UNDER_REVIEW: { ar: 'قيد المراجعة', en: 'Under Review', ku: 'لە ژێر پێداچوونەوەدایە' },
  WAITLISTED: { ar: 'قائمة الانتظار', en: 'Waitlisted', ku: 'لە لیستی چاوەڕوانیدایە' },
  ACCEPTED: { ar: 'مقبول', en: 'Accepted', ku: 'پەسەندکراو' },
  REJECTED: { ar: 'مرفوض', en: 'Rejected', ku: 'ڕەتکراوە' },
  WITHDRAWN: { ar: 'مسحوب', en: 'Withdrawn', ku: 'کشێنراوەتەوە' },
};

const ADMISSION_STATUS_STYLES: Record<AdmissionApplicationStatus, string> = {
  SUBMITTED: 'bg-blue-50 text-blue-700',
  UNDER_REVIEW: 'bg-amber-50 text-amber-700',
  WAITLISTED: 'bg-purple-50 text-purple-700',
  ACCEPTED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-rose-50 text-rose-700',
  WITHDRAWN: 'bg-slate-100 text-slate-500',
};

// The account page's "Admission Applications" list — each card shows the application summary,
// decision note, and a withdraw action for applications still in a withdrawable status.
export default function AdmissionApplicationsSection({
  admissionApplications,
  withdrawingId,
  onWithdraw,
}: {
  admissionApplications: AccountAdmissionApplication[];
  withdrawingId: string | null;
  onWithdraw: (applicationId: string) => void;
}) {
  const { language } = useLanguage();
  const t = useT(ACCOUNT_COPY);

  if (admissionApplications.length === 0) {
    return (
      <div className="text-center text-sm text-slate-400 py-12">
        {t('noAdmissions')}{' '}
        <Link href="/explore" className="text-emerald-700 font-bold hover:underline">{t('browseInstitutions')}</Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {admissionApplications.map((app) => (
        <div key={app.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Building2 className="w-4 h-4 text-purple-600" />
                {app.institutionSlug ? (
                  <Link href={`/institutions/${app.institutionSlug}`} className="font-bold text-sm text-slate-900 hover:text-blue-700">
                    {app.institutionName ? pickLocalized(app.institutionName, language) : app.institutionId}
                  </Link>
                ) : (
                  <span className="font-bold text-sm text-slate-900">
                    {app.institutionName ? pickLocalized(app.institutionName, language) : app.institutionId}
                  </span>
                )}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ADMISSION_STATUS_STYLES[app.status]}`}>
                  {pickLocalized(ADMISSION_STATUS_LABELS[app.status], language)}
                </span>
              </div>
              <div className="text-xs text-slate-600 font-bold">
                {pickLocalized(app.programName, language)}
              </div>
              {app.decisionNote && (
                <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mt-1">{app.decisionNote}</p>
              )}
            </div>

            {(app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW' || app.status === 'WAITLISTED' || app.status === 'ACCEPTED') && (
              <button
                onClick={() => onWithdraw(app.id)}
                disabled={withdrawingId === app.id}
                className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold disabled:opacity-60"
              >
                <FileX className="w-3.5 h-3.5" />
                <span>{t('withdraw')}</span>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
