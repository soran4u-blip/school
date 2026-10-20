'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Thumbnail from '@/components/shared/Thumbnail';
import { useLanguage } from '@/core/context/LanguageContext';
import { Tutor } from '@/core/types/tutor';
import { Governorate, TaxonomyItem } from '@/core/types/masterData';
import { localeHref } from '@/lib/locale';
import { MapPin, Star, ShieldCheck, MessageSquare, Users, User, Laptop, Award, BookOpen, GraduationCap, MessageCircle } from 'lucide-react';
import { pickLocalized } from '@/lib/localized';
import { useT } from '@/lib/useT';
import { TUTOR_PROFILE_COPY } from '../TutorProfile.i18n';

// Everything above the booking calendar: identity, contact actions, teaching details and pricing.
export default function TutorHeader({
  tutor,
  governorate,
  subjects,
  studentLevels,
}: {
  tutor: Tutor;
  governorate: Governorate | null;
  subjects: TaxonomyItem[];
  studentLevels: TaxonomyItem[];
}) {
  const router = useRouter();
  const { language } = useLanguage();
  const t = useT(TUTOR_PROFILE_COPY);
  const tutorName = pickLocalized(tutor.fullName, language);

  return (
    <>
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-6">
        <Thumbnail
          src={tutor.photoUrl}
          alt={tutor.fullName.en}
          width={96}
          height={96}
          className="w-24 h-24 rounded-2xl object-cover border border-slate-200 shrink-0"
          objectPosition={tutor.photoFocalPoint ? `${tutor.photoFocalPoint.x}% ${tutor.photoFocalPoint.y}%` : undefined}
        />
        <div className="flex-1 space-y-1.5">
          <h1 className="text-xl font-extrabold text-[#0B192C]">{pickLocalized(tutor.fullName, language)}</h1>
          <p className="text-sm text-slate-600">{pickLocalized(tutor.title, language)}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" />{governorate ? pickLocalized(governorate.name, language) : tutor.governorateId}</span>
            <span className="flex items-center gap-1 font-bold text-amber-700"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />{tutor.ratingAvg} ({tutor.reviewCount})</span>
            {tutor.isVerified && (
              <span className="flex items-center gap-1 text-emerald-700 font-bold"><ShieldCheck className="w-3.5 h-3.5" />{pickLocalized(tutor.verificationBadgeLabel, language)}</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {tutor.userId && (
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/conversations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      // tutor.id is the tutor's directory-listing id (tutorId claim), not their
                      // Auth uid — conversations are keyed by uid everywhere (rules, the
                      // participant queries), so this must be tutor.userId or the tutor's own
                      // session never matches this conversation's participantIds.
                      recipientId: tutor.userId,
                      recipientRole: 'tutor',
                      recipientName: tutorName,
                      recipientPhone: tutor.phone,
                      context: {
                        type: 'tutor',
                        title: t('chatContextTitle', { name: tutorName }),
                        id: tutor.id,
                      },
                    }),
                  });
                  const data = await res.json();
                  if (data.success && data.conversation) {
                    router.push(`/messages?conversationId=${data.conversation.id}`);
                  } else {
                    router.push(localeHref('/login', language));
                  }
                } catch {
                  router.push(localeHref('/login', language));
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#123D35] hover:bg-[#28675A] text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{t('chatNow')}</span>
            </button>
          )}

          {tutor.whatsappNumber && (
            <a
              href={`https://wa.me/${tutor.whatsappNumber}?text=${encodeURIComponent(t('whatsappMessage', { name: tutorName }))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t('whatsapp')}</span>
            </a>
          )}
        </div>
      </div>

      {pickLocalized(tutor.bio, language) && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs mb-6">
          <p className="text-sm text-slate-700 leading-relaxed">{pickLocalized(tutor.bio, language)}</p>
        </div>
      )}

      {/* Teaching Details: Subjects, Grades, Delivery Mode, Experience */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tutor.yearsOfExperience > 0 && (
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Award className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-bold">{t('yearsExperience', { n: tutor.yearsOfExperience })}</span>
          </div>
        )}

        {tutor.deliveryMode?.length > 0 && (
          <div className="flex items-start gap-2">
            <Laptop className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="flex flex-wrap gap-1.5">
              {tutor.deliveryMode.map((mode) => (
                <span key={mode} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  {t(`mode${mode}` as const)}
                </span>
              ))}
            </div>
          </div>
        )}

        {subjects.length > 0 && (
          <div className="flex items-start gap-2 sm:col-span-2">
            <BookOpen className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="flex flex-wrap gap-1.5">
              {subjects.map((s) => (
                <span key={s.id} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                  {pickLocalized(s.name, language)}
                </span>
              ))}
            </div>
          </div>
        )}

        {studentLevels.length > 0 && (
          <div className="flex items-start gap-2 sm:col-span-2">
            <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex flex-wrap gap-1.5">
              {studentLevels.map((lvl) => (
                <span key={lvl.id} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                  {pickLocalized(lvl.name, language)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pricing */}
      {(() => {
        const offersGroup = tutor.availability.some((s) => s.allowsGroup);
        return (
          <div className={`grid grid-cols-1 ${offersGroup ? 'sm:grid-cols-2' : ''} gap-4 mb-6`}>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase">{t('individualSession')}</span>
                <span className="font-extrabold text-sm text-slate-900">{tutor.hourlyRate.iqd.toLocaleString()} {t('iqd')}</span>
              </div>
            </div>
            {offersGroup && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">{t('groupSession', { n: tutor.groupMaxSize })}</span>
                  <span className="font-extrabold text-sm text-slate-900">{tutor.groupRate.iqd.toLocaleString()} {t('groupTotal')}</span>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </>
  );
}
