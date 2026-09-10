'use client';

import React from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { Institution, InstitutionProgram } from '@/core/types/institution';
import { AdmissionApplicationStatus } from '@/core/types/admission';

const ADMISSION_STATUS_LABELS: Record<AdmissionApplicationStatus, { ar: string; en: string }> = {
  SUBMITTED: { ar: 'تم الإرسال', en: 'Submitted' },
  UNDER_REVIEW: { ar: 'قيد المراجعة', en: 'Under Review' },
  WAITLISTED: { ar: 'قائمة الانتظار', en: 'Waitlisted' },
  ACCEPTED: { ar: 'مقبول', en: 'Accepted' },
  REJECTED: { ar: 'مرفوض', en: 'Rejected' },
  WITHDRAWN: { ar: 'مسحوب', en: 'Withdrawn' },
};

const ADMISSION_STATUS_STYLES: Record<AdmissionApplicationStatus, string> = {
  SUBMITTED: 'bg-blue-50 text-blue-700',
  UNDER_REVIEW: 'bg-amber-50 text-amber-700',
  WAITLISTED: 'bg-purple-50 text-purple-700',
  ACCEPTED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-rose-50 text-rose-700',
  WITHDRAWN: 'bg-slate-100 text-slate-500',
};

// The public institution profile's Programs & Tuition tab.
export default function ProgramsTab({
  institution,
  myApplicationStatus,
  openApply,
}: {
  institution: Institution;
  myApplicationStatus: Record<string, AdmissionApplicationStatus>;
  openApply: (program: InstitutionProgram) => void;
}) {
  const { language, t } = useLanguage();

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h2 className="text-lg font-extrabold text-[#0B192C]">
          {t('البرامج الأكاديمية والأقساط السنوية للعام الحالي', 'Academic Programs & Annual Tuition')}
        </h2>
        <span className="text-xs text-slate-400 font-semibold">{institution.programs?.length || 0} {t('برنامج متاح', 'programs')}</span>
      </div>

      <div className="divide-y divide-slate-100">
        {institution.programs && institution.programs.length > 0 ? (
          institution.programs.map((prog) => (
            <div key={prog.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  {language === 'en' ? prog.name.en : prog.name.ar}
                </h3>
                <span className="text-xs text-slate-500 font-semibold">
                  {language === 'en' ? prog.facultyName.en : prog.facultyName.ar} • {prog.durationYears} {t('سنوات دراسية', 'years')}
                </span>
                {prog.minBaccalaureateScore && (
                  <div className="mt-1">
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {t('الحد الأدنى لمعدل السادس الإعدادي:', 'Min Baccalaureate:')} {prog.minBaccalaureateScore}%
                    </span>
                  </div>
                )}
              </div>

              <div className="text-end space-y-2">
                <div>
                  <span className="block text-sm font-black text-[#0B192C]">
                    ${prog.tuitionAnnual.amount.toLocaleString()} / {t('سنوياً', 'year')}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    {t('إمكانية التقسيط متاحة', 'Installments Available')}
                  </span>
                </div>
                {myApplicationStatus[prog.id] ? (
                  <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full ${ADMISSION_STATUS_STYLES[myApplicationStatus[prog.id]]}`}>
                    {language === 'en' ? ADMISSION_STATUS_LABELS[myApplicationStatus[prog.id]].en : ADMISSION_STATUS_LABELS[myApplicationStatus[prog.id]].ar}
                  </span>
                ) : prog.isActive && prog.isAcceptingApplications !== false && (!prog.applicationDeadline || prog.applicationDeadline >= new Date().toISOString().slice(0, 10)) ? (
                  <button
                    onClick={() => openApply(prog)}
                    className="px-3.5 py-2 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    {t('التقديم الآن', 'Apply Now')}
                  </button>
                ) : (
                  <span className="text-[11px] font-bold text-slate-400">{t('التقديم مغلق حالياً', 'Applications closed')}</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            {t('لم يتم إدراج برامج تفصيلية حتى الآن. تواصل مع قسم التسجيل لمزيد من التفاصيل.', 'No specific programs listed.')}
          </div>
        )}
      </div>
    </div>
  );
}
