'use client';

import React from 'react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useLanguage } from '@/core/context/LanguageContext';

const CONTENT = {
  ar: {
    title: 'شروط الاستخدام',
    updated: 'آخر تحديث: سبتمبر 2026',
    sections: [
      {
        h: 'طبيعة المنصة',
        p: 'Eduraq هي منصة عراقية لاكتشاف ومقارنة المدارس والجامعات والمعاهد والأساتذة الخصوصيين. نحن لسنا طرفاً في أي اتفاق تعليمي أو مالي بين الطالب والأستاذ أو المؤسسة؛ دورنا هو تسهيل الاكتشاف والتواصل والحجز فقط.',
      },
      {
        h: 'حسابات المستخدمين',
        p: 'يتطلب حجز درس خصوصي أو التقديم على برنامج أكاديمي إنشاء حساب طالب بمعلومات صحيحة. أنت مسؤول عن الحفاظ على سرية بيانات دخولك وعن أي نشاط يتم عبر حسابك. يجوز لنا تعليق أو حذف أي حساب يُستخدم بشكل مخالف لهذه الشروط.',
      },
      {
        h: 'الحجوزات وطلبات القبول',
        p: 'الحجز أو التقديم عبر المنصة هو طلب تنسيق فقط. تأكيد الموعد أو قبول الطلب النهائي يعود لتقدير الأستاذ أو المؤسسة المعنية. الأسعار المعروضة إرشادية وقد تخضع للتغيير أو التفاوض المباشر بين الطرفين.',
      },
      {
        h: 'المحتوى المنشور من المستخدمين',
        p: 'التقييمات ومنشورات المجتمع تعكس آراء أصحابها فقط ولا تمثل رأي المنصة. نحتفظ بحق مراجعة أو حذف أي محتوى يخالف هذه الشروط أو يحتوي إساءة أو معلومات مضللة، دون إشعار مسبق.',
      },
      {
        h: 'حدود المسؤولية',
        p: 'نبذل جهدنا للتحقق من دقة بيانات الأساتذة والمؤسسات المدرجة، لكننا لا نضمن دقة أو اكتمال أي معلومة معروضة. لا تتحمل المنصة مسؤولية أي نزاع مالي أو تعليمي ينشأ مباشرة بين الطالب والأستاذ أو المؤسسة.',
      },
      {
        h: 'التعديلات على الشروط',
        p: 'قد نحدّث هذه الشروط من وقت لآخر. استمرار استخدامك للمنصة بعد أي تعديل يُعد موافقة على الشروط المحدثة.',
      },
      {
        h: 'التواصل',
        p: 'لأي استفسار بخصوص هذه الشروط، راسلنا على support@eduraq.iq.',
      },
    ],
  },
  en: {
    title: 'Terms of Use',
    updated: 'Last updated: September 2026',
    sections: [
      {
        h: 'What Eduraq Is',
        p: "Eduraq is an Iraqi platform for discovering and comparing schools, universities, institutes, and private tutors. We are not a party to any educational or financial agreement between a student and a tutor or institution — our role is limited to discovery, communication, and booking facilitation.",
      },
      {
        h: 'User Accounts',
        p: 'Booking a tutoring session or applying to an academic program requires a student account with accurate information. You are responsible for keeping your login credentials confidential and for activity on your account. We may suspend or remove any account used in violation of these terms.',
      },
      {
        h: 'Bookings & Admission Applications',
        p: 'A booking or application submitted through the platform is a coordination request only. Final confirmation or acceptance is at the sole discretion of the relevant tutor or institution. Displayed prices are indicative and may be subject to change or direct negotiation between the parties.',
      },
      {
        h: 'User-Submitted Content',
        p: 'Reviews and community posts reflect the views of their authors only and do not represent the platform\'s opinion. We reserve the right to review or remove any content that violates these terms or contains abuse or misleading information, without prior notice.',
      },
      {
        h: 'Limitation of Liability',
        p: 'We make reasonable efforts to verify the accuracy of listed tutor and institution information, but we do not guarantee the accuracy or completeness of any information displayed. The platform is not responsible for any financial or educational dispute arising directly between a student and a tutor or institution.',
      },
      {
        h: 'Changes to These Terms',
        p: 'We may update these terms from time to time. Continued use of the platform after any change constitutes acceptance of the updated terms.',
      },
      {
        h: 'Contact',
        p: 'For any questions about these terms, reach us at support@eduraq.iq.',
      },
    ],
  },
};

export default function TermsOfUsePage() {
  const { language } = useLanguage();
  const c = language === 'en' ? CONTENT.en : CONTENT.ar;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1">
        <h1 className="text-2xl font-extrabold text-[#0B192C] mb-1">{c.title}</h1>
        <p className="text-xs text-slate-400 mb-8">{c.updated}</p>
        <div className="space-y-6">
          {c.sections.map((s, i) => (
            <div key={i}>
              <h2 className="text-sm font-extrabold text-[#0B192C] mb-2">{s.h}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{s.p}</p>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
