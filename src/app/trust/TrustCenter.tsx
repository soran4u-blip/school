'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useLanguage } from '@/core/context/LanguageContext';
import { CheckCircle2, Clock3, FileCheck2, ShieldCheck, TriangleAlert } from 'lucide-react';

export default function TrustCenter() {
  const { t } = useLanguage();
  const levels = [
    { icon: ShieldCheck, title: t('موثق ومحدث', 'Verified and current'), body: t('تمت مراجعة بيانات الاعتماد مع وجود مصدر وتاريخ تحقق صالح.', 'The listing has reviewed evidence with a valid source and verification date.'), tone: 'emerald' },
    { icon: Clock3, title: t('يحتاج تحديث الأدلة', 'Evidence refresh needed'), body: t('كان الملف موثقاً، لكن مصدر التحقق يحتاج إلى تحديث قبل عرض الادعاء الرسمي.', 'The profile was verified, but its evidence needs refreshing before the official claim is shown.'), tone: 'amber' },
    { icon: TriangleAlert, title: t('غير موثق', 'Not verified'), body: t('المعلومات مقدمة للتعريف فقط. تواصل مباشرة مع الجهة للتحقق من المتطلبات الحالية.', 'The information is for discovery only. Contact the provider directly to confirm current requirements.'), tone: 'slate' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />
      <header className="bg-[#0B192C] px-4 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-4">
          <div className="text-xs font-bold text-amber-300">{t('دليل العراق التعليمي / مركز الثقة', 'Eduraq Directory / Trust Center')}</div>
          <h1 className="text-3xl font-black sm:text-5xl">{t('اعرف ماذا تعني كل شارة', 'Know what every badge means')}</h1>
          <p className="max-w-2xl text-sm leading-7 text-slate-300">{t('نوضح كيف نراجع الملفات، ومتى نعرض الاعتماد، وما الذي يجب أن تتحقق منه قبل اتخاذ قرار تعليمي.', 'We explain how profiles are reviewed, when accreditation is shown, and what you should confirm before making an education decision.')}</p>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-3">
          {levels.map(({ icon: Icon, title, body, tone }) => (
            <article key={title} className={`rounded-2xl border p-6 ${tone === 'emerald' ? 'border-emerald-200 bg-emerald-50/70' : tone === 'amber' ? 'border-amber-200 bg-amber-50/70' : 'border-slate-200 bg-white'}`}>
              <Icon className={`mb-4 h-7 w-7 ${tone === 'emerald' ? 'text-emerald-600' : tone === 'amber' ? 'text-amber-600' : 'text-slate-500'}`} />
              <h2 className="font-extrabold text-slate-900">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
            </article>
          ))}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="flex items-center gap-2 text-xl font-extrabold text-[#0B192C]"><FileCheck2 className="h-5 w-5 text-blue-600" />{t('ما الذي نراجعه؟', 'What we review')}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[t('الجهة المصدرة للاعتماد ورابط الدليل', 'Accreditation authority and evidence URL'), t('تاريخ التحقق وتاريخ انتهاء الدليل', 'Verification date and evidence expiry'), t('بيانات التواصل والعنوان واللغة', 'Contact details, address, and language'), t('وضوح الرسوم والقبول والبرامج', 'Tuition, admissions, and program clarity')].map((item) => <div key={item} className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{item}</div>)}
          </div>
        </section>
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
          <h2 className="font-extrabold text-amber-950">{t('تنبيه مهم', 'Important note')}</h2>
          <p className="mt-2 text-sm leading-7 text-amber-900">{t('لا تضمن Eduraq القبول أو جودة النتيجة أو ثبات الرسوم. استخدم الملف كبداية، ثم تواصل مع الجهة مباشرة لتأكيد المعلومات قبل الدفع أو التقديم.', 'Eduraq does not guarantee admission, outcomes, or unchanged pricing. Use a profile as a starting point, then contact the provider directly before paying or applying.')}</p>
        </section>
        <Link href="/explore" className="inline-flex rounded-xl bg-[#0B192C] px-5 py-3 text-sm font-bold text-white hover:bg-[#1E3E62]">{t('استكشف الملفات الموثقة', 'Explore verified profiles')}</Link>
      </main>
      <Footer />
    </div>
  );
}
