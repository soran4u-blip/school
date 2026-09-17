'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/core/context/LanguageContext';
import { useMasterData } from '@/core/context/MasterDataContext';
import { localeHref } from '@/lib/locale';
import { GraduationCap, ShieldCheck, Mail, Phone, MessageCircleMore } from 'lucide-react';

export default function Footer() {
  const { language, t } = useLanguage();
  // Provided by the root layout from one server-side read — see MasterDataContext.
  const { categories, governorates: allGovernorates, systemSettings } = useMasterData();
  const governorates = allGovernorates.slice(0, 8); // Top governorates for footer links

  return (
    <footer className="relative isolate mt-auto overflow-hidden border-t border-slate-800 bg-[#0B192C] pt-16 pb-12 text-slate-300">
      <div className="pointer-events-none absolute -top-32 start-[6%] -z-10 h-80 w-80 rounded-full bg-blue-400/8 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 end-[10%] -z-10 h-72 w-72 rounded-full bg-[#F1C40F]/8 blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 border-b border-slate-800 pb-12 md:grid-cols-2 lg:grid-cols-5">

          {/* Col 1: Brand & Ministry Note */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1E3E62] flex items-center justify-center text-[#F1C40F]">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="font-extrabold text-2xl text-white tracking-tight">
                Eduraq
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              {t(
                'منصة وطنية لاكتشاف ومقارنة المدارس والجامعات والمعاهد والبرامج التعليمية في العراق. تعرّف على التفاصيل وتواصل مع الجهات المدرجة مباشرةً.',
                'A national platform for discovering and comparing schools, universities, institutes, programs, and tutors across Iraq.'
              )}
            </p>
            <div className="inline-flex max-w-sm items-center gap-2 rounded-full border border-emerald-800/60 bg-emerald-950/40 px-3 py-1.5 text-[11px] font-bold text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>
                {t('مصمم للبحث والمقارنة التعليمية', 'Built for education discovery and comparison')}
              </span>
            </div>
          </div>

          {/* Col 2: Educational Categories (Dynamic) */}
          <div>
            <h3 className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white">
              {t('الفئات التعليمية', 'Directory Categories')}
            </h3>
            <ul className="space-y-2.5 text-sm">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={cat.slug === 'tutors' ? localeHref('/tutors', language) : `${localeHref('/explore', language)}?category=${cat.slug}`}
                    className="hover:text-white transition-colors"
                  >
                    {cat.slug === 'tutors'
                      ? t('أساتذة خصوصيون', 'Private tutors')
                      : (language === 'en' ? cat.name.en : cat.name.ar)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Key Governorates (Dynamic) */}
          <div>
            <h3 className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white">
              {t('أبرز المحافظات', 'Major Governorates')}
            </h3>
            <ul className="space-y-2.5 text-sm">
              {governorates.map((gov) => (
                <li key={gov.id}>
                  <Link
                    href={`${localeHref('/explore', language)}?governorate=${gov.id}`}
                    className="hover:text-white transition-colors"
                  >
                    {language === 'en' ? gov.name.en : gov.name.ar}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Platform & Admin */}
          <div>
            <h3 className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white">
              {t('روابط المنصة والإدارة', 'Platform & Admin')}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  {t('تسجيل الدخول', 'Login')}
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-white transition-colors">
                  {t('حجوزاتي', 'My Bookings')}
                </Link>
              </li>
              <li>
                <Link href={localeHref('/jobs', language)} className="hover:text-white transition-colors">
                  {t('الوظائف الشاغرة', 'Job Openings')}
                </Link>
              </li>
              <li>
                <Link href={localeHref('/events', language)} className="hover:text-white transition-colors">
                  {t('الفعاليات', 'Events')}
                </Link>
              </li>
              <li>
                <Link href="/my-applications" className="hover:text-white transition-colors">
                  {t('طلبات التوظيف الخاصة بي', 'My Job Applications')}
                </Link>
              </li>
              <li>
                <Link href="/apply/status" className="hover:text-white transition-colors">
                  {t('حالة طلب الانضمام', 'Join Application Status')}
                </Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-white transition-colors">
                  {t('مجتمع الأهالي', 'Community')}
                </Link>
              </li>
              <li>
                <Link href={localeHref('/trust', language)} className="hover:text-white transition-colors">
                  {t('مركز الثقة والتحقق', 'Trust & Verification Center')}
                </Link>
              </li>
              <li className="pt-2 text-xs text-slate-400 space-y-1">
                {systemSettings.contactEmail && (
                  <a href={`mailto:${systemSettings.contactEmail}`} className="flex items-center gap-2 hover:text-white transition-colors">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{systemSettings.contactEmail}</span>
                  </a>
                )}
                {systemSettings.contactPhone && (
                  <a href={`tel:${systemSettings.contactPhone}`} className="flex items-center gap-2 hover:text-white transition-colors">
                    <Phone className="w-3.5 h-3.5" />
                    <span dir="ltr">{systemSettings.contactPhone}</span>
                  </a>
                )}
                {systemSettings.contactWhatsApp && (
                  <a
                    href={`https://wa.me/${systemSettings.contactWhatsApp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t('التواصل عبر واتساب', 'Contact us on WhatsApp')}
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <MessageCircleMore className="w-3.5 h-3.5" />
                    <span>{t('واتساب', 'WhatsApp')}</span>
                  </a>
                )}
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-xs text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Eduraq. {t('جميع الحقوق محفوظة لجمهورية العراق.', 'All rights reserved. Republic of Iraq.')}</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-center sm:justify-end">
            <Link href="/privacy" className="hover:text-white transition-colors">{t('سياسة الخصوصية', 'Privacy Policy')}</Link>
            <Link href="/terms" className="hover:text-white transition-colors">{t('شروط الاستخدام', 'Terms of Use')}</Link>
            <span>{t('تحديث فوري وقاعدة بيانات ديناميكية', 'Real-time & Zero Hardcoding Engine')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
