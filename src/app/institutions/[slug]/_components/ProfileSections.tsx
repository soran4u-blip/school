'use client';

import React from 'react';
import Thumbnail from '@/components/shared/Thumbnail';
import { useLanguage } from '@/core/context/LanguageContext';
import { Institution } from '@/core/types/institution';
import { intlLocale } from '@/lib/locales';
import { pickLocalized } from '@/lib/localized';
import { isInstitutionEvidenceFresh } from '@/lib/publishingGuardrails';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { useT } from '@/lib/useT';
import { INSTITUTION_COPY } from '../Institution.i18n';

// The profile's static tabs. Programs and Reviews are bigger and live in ./_components.
export function OverviewTab({ institution }: { institution: Institution }) {
  const { language } = useLanguage();
  const t = useT(INSTITUTION_COPY);
  const evidenceFresh = isInstitutionEvidenceFresh(institution);

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-[#0B192C] mb-3">
          {t('about')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          {pickLocalized(institution.description, language)}
        </p>
      </div>

       {/* Accreditation Details Card */}
       <div className={`p-5 rounded-2xl border space-y-2 ${evidenceFresh ? 'bg-emerald-50/70 border-emerald-200' : 'bg-amber-50/70 border-amber-200'}`}>
         <div className={`flex items-center gap-2 font-extrabold text-sm ${evidenceFresh ? 'text-emerald-900' : 'text-amber-900'}`}>
           <ShieldCheck className={`w-5 h-5 ${evidenceFresh ? 'text-emerald-600' : 'text-amber-600'}`} />
           <span>
             {evidenceFresh
                ? t('accreditationStatus')
                : t('accreditationUnverified')}
           </span>
         </div>
          {evidenceFresh && institution.accreditation?.authority && (
            <p className="text-xs font-bold text-slate-700">
              {pickLocalized(institution.accreditation.authority, language)}
            </p>
          )}
          <p className={`text-xs leading-relaxed ${institution.isVerified && evidenceFresh ? 'text-emerald-800' : 'text-amber-800'}`}>
            {evidenceFresh && pickLocalized(institution.accreditation?.details, language) || t('accreditationNone')}
          </p>
          {evidenceFresh && institution.accreditation?.verifiedAt && (
           <p className="text-[11px] text-slate-500">
             {t('lastVerified')} {institution.accreditation.verifiedAt}
           </p>
         )}
       </div>

       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
         <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
           <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
             {t('languagesOfInstruction')}
           </span>
           <span className="text-xs font-extrabold text-slate-800">
             {institution.languagesOfInstruction?.length
               ? institution.languagesOfInstruction.map((code) => t(`lang${code}` as const)).join('، ')
               : t('notSpecified')}
           </span>
         </div>
         <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
           <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
             {t('profileUpdated')}
           </span>
           <span className="text-xs font-extrabold text-slate-800">
             {new Intl.DateTimeFormat(intlLocale(language), { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(institution.updatedAt))}
           </span>
         </div>
       </div>

       {institution.galleryUrls && institution.galleryUrls.length > 0 && (
         <div>
           <h3 className="text-sm font-extrabold text-[#0B192C] mb-3">
             {t('gallery')}
           </h3>
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
             {institution.galleryUrls.slice(0, 4).map((url, index) => (
               <div key={`${url}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
                 <Thumbnail
                   src={url}
                   alt={`${pickLocalized(institution.name, language)} ${index + 1}`}
                   fill
                   sizes="(max-width: 640px) 50vw, 25vw"
                   className="object-cover"
                 />
               </div>
             ))}
           </div>
         </div>
       )}
     </div>
  );
}

export function FacilitiesTab({ institution }: { institution: Institution }) {
  const t = useT(INSTITUTION_COPY);

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
      <h2 className="text-lg font-extrabold text-[#0B192C]">
        {t('facilitiesTitle')}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {institution.facilities?.map((f, i) => (
          <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-slate-800">{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdmissionsTab({ institution, openInquiry }: { institution: Institution; openInquiry: () => void }) {
  const { language } = useLanguage();
  const t = useT(INSTITUTION_COPY);

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
      <h2 className="text-lg font-extrabold text-[#0B192C]">
        {t('admissionsTitle')}
      </h2>

      <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
        {pickLocalized(institution.admissions?.overview, language) && (
          <p className="p-4 bg-blue-50/60 rounded-xl border border-blue-200">
            {pickLocalized(institution.admissions?.overview, language)}
          </p>
        )}

        {institution.admissions?.requiredDocuments?.some((document) => document.ar || document.en) ? (
          <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200">
            <h3 className="font-bold text-blue-900 mb-2">{t('requiredDocuments')}</h3>
            <ul className="list-disc list-inside space-y-1 text-xs text-blue-800">
              {institution.admissions?.requiredDocuments
                ?.filter((document) => document.ar || document.en)
                .map((document, index) => (
                  <li key={index}>{pickLocalized(document, language)}</li>
                ))}
            </ul>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-600">
            {t('noDocuments')}
          </div>
        )}

        {pickLocalized(institution.admissions?.notes, language) && (
          <p className="text-xs text-slate-600">
            {pickLocalized(institution.admissions?.notes, language)}
          </p>
        )}

        <button
          type="button"
          onClick={openInquiry}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-[#123D35] hover:bg-[#28675A] text-white rounded-xl text-xs font-bold transition-colors"
        >
          {t('askAdmissions')}
        </button>
      </div>
    </div>
  );
}
