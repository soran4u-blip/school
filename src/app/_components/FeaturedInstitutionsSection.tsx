'use client';

import React from 'react';
import Link from 'next/link';
import Thumbnail from '@/components/shared/Thumbnail';
import { useLanguage } from '@/core/context/LanguageContext';
import { localeHref } from '@/lib/locale';
import { Governorate, Category } from '@/core/types/masterData';
import { Institution } from '@/core/types/institution';
import { MapPin, ShieldCheck, Star, ArrowRight, MessageSquare } from 'lucide-react';

// The homepage's featured-institutions showcase grid.
export default function FeaturedInstitutionsSection({
  featuredInstitutions,
  governorates,
  categories,
}: {
  featuredInstitutions: Institution[];
  governorates: Governorate[];
  categories: Category[];
}) {
  const { language, t } = useLanguage();

  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-blue-700 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{t('مؤسسات تعليمية معتمدة وموثقة', 'Vetted & Accredited Institutions')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C]">
            {t('أبرز الصروح التعليمية في العراق', 'Featured Iraqi Educational Institutions')}
          </h2>
        </div>

        <Link
          href={localeHref('/explore', language)}
          className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 group self-start"
        >
          <span>{t('عرض جميع المؤسسات في الدليل', 'View All Listings')}</span>
          <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredInstitutions.map((inst) => {
          const gov = governorates.find(g => g.id === inst.governorateId);
          const cat = categories.find(c => c.id === inst.categoryId);

          return (
            <div
              key={inst.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg hover:border-slate-300 transition-all flex flex-col group"
            >
              {/* Cover Image & Badges */}
              <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                <Thumbnail
                  src={inst.coverImageUrl}
                  alt={inst.name.en}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  fallbackClassName="absolute inset-0"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent"></div>

                {/* Category Pill */}
                <div className="absolute top-3 start-3">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-[#0B192C]/90 text-white backdrop-blur-xs">
                    {cat ? (language === 'en' ? cat.name.en : cat.name.ar) : inst.categoryId}
                  </span>
                </div>

                {/* Rating */}
                <div className="absolute top-3 end-3 bg-white/95 px-2 py-0.5 rounded-md flex items-center gap-1 text-xs font-bold text-slate-800 shadow-xs">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{inst.metrics.ratingAvg}</span>
                </div>

                {/* Logo overlay */}
                <div className="absolute -bottom-4 start-5">
                  <Thumbnail
                    src={inst.logoUrl}
                    alt={inst.name.en}
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-md bg-white"
                  />
                </div>
              </div>

              {/* Body Content */}
              <div className="pt-6 p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{gov ? (language === 'en' ? gov.name.en : gov.name.ar) : inst.governorateId}</span>
                  </div>

                  <Link href={localeHref(`/institutions/${inst.slug}`, language)}>
                    <h3 className="font-extrabold text-base text-slate-900 hover:text-blue-700 transition-colors leading-snug">
                      {language === 'en' ? inst.name.en : inst.name.ar}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-600 line-clamp-2 mt-1.5 leading-relaxed">
                    {language === 'en' ? inst.tagline.en : inst.tagline.ar}
                  </p>
                </div>

                {/* Badges and CTAs */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>{language === 'en' ? inst.verificationBadgeLabel.en : inst.verificationBadgeLabel.ar}</span>
                    </span>

                    <span className="text-[11px] font-bold text-slate-700">
                      {inst.tuition.min === 0 ? t('مجاني 100%', '100% Free') : `$${inst.tuition.min.toLocaleString()} / ${t('سنوياً', 'yr')}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={localeHref(`/institutions/${inst.slug}`, language)}
                      className="flex-1 text-center py-2 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                    >
                      {t('التفاصيل والقبول', 'View Profile')}
                    </Link>

                    <a
                      href={`https://wa.me/${inst.contact.whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
                      title="WhatsApp Contact"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>واتساب</span>
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
