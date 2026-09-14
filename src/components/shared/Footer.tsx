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
    <footer className="bg-[#0B192C] text-slate-300 pt-16 pb-12 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          
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
                'المنصة الوطنية الموحدة لاكتشاف ومقارنة المدارس والجامعات والمعاهد المعتمدة في العراق. مدعومة ببيانات الاعتماد الرسمية والمراجعات الموثقة.',
                'The unified national discovery platform for verified schools, universities, institutes, and private tutors across all Iraqi governorates.'
              )}
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-2 rounded-lg max-w-sm">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                {t('متوافق مع معايير وزارة التعليم العالي ووزارة التربية العراقية', 'Aligned with Iraqi Ministry of Education & MoHESR standards')}
              </span>
            </div>
          </div>

          {/* Col 2: Educational Categories (Dynamic) */}
          <div>
            <h3 className="text-white font-bold text-sm mb-4 tracking-wider uppercase">
              {t('الفئات التعليمية', 'Directory Categories')}
            </h3>
            <ul className="space-y-2.5 text-sm">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`${localeHref('/explore', language)}?category=${cat.slug}`}
                    className="hover:text-white transition-colors"
                  >
                    {language === 'en' ? cat.name.en : cat.name.ar}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Key Governorates (Dynamic) */}
          <div>
            <h3 className="text-white font-bold text-sm mb-4 tracking-wider uppercase">
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
            <h3 className="text-white font-bold text-sm mb-4 tracking-wider uppercase">
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
                <Link href="/my-applications" className="hover:text-white transition-colors">
                  {t('طلبات التوظيف الخاصة بي', 'My Job Applications')}
                </Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-white transition-colors">
                  {t('مجتمع الأهالي', 'Community')}
                </Link>
              </li>
              <li className="pt-2 text-xs text-slate-400 space-y-1">
                {systemSettings.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{systemSettings.contactEmail}</span>
                  </div>
                )}
                {systemSettings.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" />
                    <span dir="ltr">{systemSettings.contactPhone}</span>
                  </div>
                )}
                {systemSettings.contactWhatsApp && (
                  <a
                    href={`https://wa.me/${systemSettings.contactWhatsApp}`}
                    target="_blank"
                    rel="noopener noreferrer"
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
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Eduraq. {t('جميع الحقوق محفوظة لجمهورية العراق.', 'All rights reserved. Republic of Iraq.')}</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">{t('سياسة الخصوصية', 'Privacy Policy')}</Link>
            <Link href="/terms" className="hover:text-white transition-colors">{t('شروط الاستخدام', 'Terms of Use')}</Link>
            <span>{t('تحديث فوري وقاعدة بيانات ديناميكية', 'Real-time & Zero Hardcoding Engine')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
