'use client';

import React from 'react';
import Link from 'next/link';
import Thumbnail from '@/components/shared/Thumbnail';
import { useLanguage } from '@/core/context/LanguageContext';
import { localeHref } from '@/lib/locale';
import { Tutor } from '@/core/types/tutor';
import { formatCurrencyIQD } from '@/lib/utils';
import { Star, ArrowRight, MessageSquare } from 'lucide-react';

// The homepage's certified-tutors showcase grid.
export default function FeaturedTutorsSection({ featuredTutors }: { featuredTutors: Tutor[] }) {
  const { language, t } = useLanguage();

  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">{t('نخبة الكوادر التعليمية', 'Top Certified Mentors')}</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] mt-1">
            {t('أساتذة التدريس الخصوصي والبكالوريا المعتمدين', 'Vetted Private & Baccalaureate Tutors')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('تواصل مباشر مع أفضل مدرسي مواد السادس الإعدادي واللغات الأجنبية مع مراجعات أولياء الأمور.', 'Connect directly with verified wazari exam masters and language coaches.')}
          </p>
        </div>

        <Link
          href={localeHref('/tutors', language)}
          className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 group self-start"
        >
          <span>{t('عرض جميع الأساتذة الخصوصيين', 'Explore All Tutors')}</span>
          <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {featuredTutors.map((tutor) => {
          return (
            <div
              key={tutor.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row gap-5 items-start"
            >
              <Thumbnail
                src={tutor.photoUrl}
                alt={tutor.fullName.en}
                width={80}
                height={80}
                className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shrink-0"
              />

              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <Link href={localeHref(`/tutors/${tutor.slug || tutor.id}`, language)} className="font-extrabold text-base text-slate-900 hover:text-blue-700 transition-colors">
                      {language === 'en' ? tutor.fullName.en : tutor.fullName.ar}
                    </Link>
                    <p className="text-xs font-semibold text-blue-700">
                      {language === 'en' ? tutor.title.en : tutor.title.ar}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded text-xs font-bold text-amber-800">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{tutor.ratingAvg}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {language === 'en' ? tutor.bio.en : tutor.bio.ar}
                </p>

                <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 gap-3">
                  <div className="text-xs">
                    <span className="text-slate-500">{t('سعر الساعة:', 'Rate:')} </span>
                    <span className="font-extrabold text-slate-900">{formatCurrencyIQD(tutor.hourlyRate.iqd)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={localeHref(`/tutors/${tutor.slug || tutor.id}`, language)}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      <span>{t('احجز موعداً', 'Book Now')}</span>
                    </Link>
                    <a
                      href={`https://wa.me/${tutor.whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{t('واتساب', 'WhatsApp')}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
