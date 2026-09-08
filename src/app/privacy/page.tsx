'use client';

import React from 'react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useLanguage } from '@/core/context/LanguageContext';

const CONTENT = {
  ar: {
    title: 'سياسة الخصوصية',
    updated: 'آخر تحديث: سبتمبر 2026',
    sections: [
      {
        h: 'المعلومات التي نجمعها',
        p: 'عند إنشاء حساب طالب، نجمع اسمك الكامل ورقم هاتفك وبريدك الإلكتروني، وبشكل اختياري مدرستك وصفك الدراسي والمواد التي تهمك. عند حجز درس خصوصي أو التقديم على برنامج أكاديمي، نجمع بيانات الحجز أو الطلب (التاريخ والوقت والمستمسكات المرفقة إن وجدت). كما نجمع تقييمات وأسئلة تنشرها بشكل علني (المجتمع، التقييمات)، وبيانات تسجيل الدخول للأساتذة والمؤسسات وأصحاب العمل.',
      },
      {
        h: 'كيف نستخدم بياناتك',
        p: 'نستخدم بياناتك لتشغيل حجوزاتك وطلبات القبول، وتوصيلك بالأساتذة والمؤسسات التي تتفاعل معها، وعرض حالة طلباتك في حسابك، وتحسين الدليل التعليمي. لا نبيع بياناتك الشخصية لأطراف ثالثة.',
      },
      {
        h: 'من يرى بياناتك',
        p: 'عند حجز درس أو التقديم على برنامج، يرى الأستاذ أو المؤسسة المعنية اسمك ورقم هاتفك وبريدك الإلكتروني والمستندات التي ترفقها، وذلك فقط لغرض التواصل معك بخصوص طلبك. تقييماتك ومشاركاتك في المجتمع تكون علنية إذا اعتمدها فريق الإشراف.',
      },
      {
        h: 'التخزين والخدمات الخارجية',
        p: 'نخزّن بياناتك باستخدام خدمات Google Firebase (المصادقة، قاعدة البيانات، والتخزين السحابي)، والتي تخضع لسياسات الخصوصية والأمان الخاصة بجوجل. نستخدم واتساب كقناة اختيارية للتواصل المباشر بناءً على اختيارك.',
      },
      {
        h: 'ملفات تعريف الارتباط والتخزين المحلي',
        p: 'نستخدم التخزين المحلي في متصفحك (localStorage) لتذكر تفضيل اللغة، ولمنع إرسال طلبات متكررة من نفس الجهاز خلال فترة قصيرة (منع الإزعاج/السبام). لا نستخدم إعلانات تتبع من أطراف ثالثة.',
      },
      {
        h: 'حقوقك',
        p: 'يمكنك تعديل بيانات ملفك الشخصي في أي وقت من صفحة حسابي. يمكنك أيضاً طلب حذف حسابك وبياناتك بالتواصل معنا عبر البريد الإلكتروني أدناه، وسنقوم بحذف بياناتك خلال مدة معقولة إلا ما يلزم الاحتفاظ به لأغراض قانونية أو نزاعات قائمة.',
      },
      {
        h: 'التواصل',
        p: 'لأي استفسار بخصوص خصوصيتك، راسلنا على support@eduraq.iq.',
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    updated: 'Last updated: September 2026',
    sections: [
      {
        h: 'Information We Collect',
        p: "When you create a student account, we collect your full name, phone number, and email, and optionally your school, grade level, and subjects of interest. When you book a tutoring session or apply to an academic program, we collect the related booking or application details (date, time, and any attached documents). We also collect content you post publicly (community posts, reviews), and login credentials for tutors, institutions, and employers.",
      },
      {
        h: 'How We Use Your Data',
        p: 'We use your data to operate your bookings and admission applications, connect you with the tutors and institutions you interact with, show you the status of your requests in your account, and improve the directory. We do not sell your personal data to third parties.',
      },
      {
        h: 'Who Can See Your Data',
        p: "When you book a session or apply to a program, the relevant tutor or institution sees your name, phone number, email, and any documents you attach — solely to contact you about your request. Your reviews and community posts are public once approved by our moderation team.",
      },
      {
        h: 'Storage & Third-Party Services',
        p: 'We store your data using Google Firebase (Authentication, Firestore database, and Cloud Storage), which is subject to Google\'s own security and privacy practices. WhatsApp is offered as an optional direct-contact channel at your choice.',
      },
      {
        h: 'Cookies & Local Storage',
        p: 'We use your browser\'s local storage to remember your language preference and to prevent repeated submissions from the same device within a short window (spam prevention). We do not use third-party advertising trackers.',
      },
      {
        h: 'Your Rights',
        p: 'You can update your profile information at any time from your account page. You may also request deletion of your account and data by emailing us below; we will delete your data within a reasonable period except where retention is required for legal or dispute-resolution purposes.',
      },
      {
        h: 'Contact',
        p: 'For any privacy questions, reach us at support@eduraq.iq.',
      },
    ],
  },
};

export default function PrivacyPolicyPage() {
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
