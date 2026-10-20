'use client';

import React from 'react';
import { CalendarClock, Users } from 'lucide-react';
import { useLanguage } from '@/core/context/LanguageContext';
import { Institution, InstitutionProgram } from '@/core/types/institution';
import { AdmissionApplicationStatus } from '@/core/types/admission';
import { formatCurrency, formatDate, todayLocalDate } from '@/lib/utils';
import { pickLocalized } from '@/lib/localized';
import { useT, type CopyVars } from '@/lib/useT';
import { ADMISSION_STATUS_COPY, INSTITUTION_COPY } from '../Institution.i18n';

// "1 seat left" vs "3 seats left" is a per-language plural, so it is two dictionary entries.
const seatsLeftLabel = (t: (key: 'seatLeft' | 'seatsLeft', vars: CopyVars) => string, n: number) =>
  t(n === 1 ? 'seatLeft' : 'seatsLeft', { n });

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
  const { language } = useLanguage();
  const t = useT(INSTITUTION_COPY);
  const today = todayLocalDate();

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h2 className="text-lg font-extrabold text-[#0B192C]">
          {t('programsHeading')}
        </h2>
        <span className="text-xs text-slate-400 font-semibold">{t('programsCount', { n: institution.programs?.length || 0 })}</span>
      </div>

      <div className="divide-y divide-slate-100">
        {institution.programs && institution.programs.length > 0 ? (
          institution.programs.map((prog) => (
            <div key={prog.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  {pickLocalized(prog.name, language)}
                </h3>
                <span className="text-xs text-slate-500 font-semibold">
                  {pickLocalized(prog.facultyName, language)} • {t('programYears', { n: prog.durationYears })}
                </span>
                {prog.minBaccalaureateScore && (
                  <div className="mt-1">
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {t('minBaccalaureate', { n: prog.minBaccalaureateScore })}
                    </span>
                  </div>
                )}

                {/* Deadline and remaining seats already gated the Apply button but were never
                    shown, so an applicant couldn't see how long they had or how full it was. */}
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {prog.applicationDeadline && prog.applicationDeadline >= today && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      <CalendarClock className="w-3 h-3" />
                      {t('applicationsClose', { date: formatDate(prog.applicationDeadline, language) })}
                    </span>
                  )}
                  {typeof prog.capacity === 'number' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      <Users className="w-3 h-3" />
                      {seatsLeftLabel(t, Math.max(0, prog.capacity - (prog.acceptedCount || 0)))}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-end space-y-2">
                <div>
                  <span className="block text-sm font-black text-[#0B192C]">
                    {formatCurrency(prog.tuitionAnnual.amount, prog.tuitionAnnual.currency, language)} / {t('perYearLong')}
                  </span>
                </div>
                {myApplicationStatus[prog.id] ? (
                  <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full ${ADMISSION_STATUS_STYLES[myApplicationStatus[prog.id]]}`}>
                    {pickLocalized(ADMISSION_STATUS_COPY[myApplicationStatus[prog.id]], language)}
                  </span>
                ) : prog.isActive && prog.isAcceptingApplications !== false && (!prog.applicationDeadline || prog.applicationDeadline >= today) ? (
                  <button
                    onClick={() => openApply(prog)}
                    className="px-3.5 py-2 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    {t('applyNow')}
                  </button>
                ) : (
                  <span className="text-[11px] font-bold text-slate-400">{t('applicationsClosed')}</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            {t('noPrograms')}
          </div>
        )}
      </div>
    </div>
  );
}
