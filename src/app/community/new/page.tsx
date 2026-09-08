'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useLanguage } from '@/core/context/LanguageContext';
import { getGovernorates } from '@/core/services/masterDataService';
import { Governorate } from '@/core/types/masterData';
import { isCooldownActive, markSubmitted } from '@/lib/spamGuard';
import { CheckCircle2 } from 'lucide-react';

export default function NewCommunityPostPage() {
  const { language, t } = useLanguage();
  const router = useRouter();

  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [form, setForm] = useState({ authorName: '', governorateId: '', title: '', body: '', hp: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getGovernorates().then(setGovernorates);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.hp) return; // honeypot tripped — silently drop

    if (!form.authorName.trim() || !form.governorateId || !form.title.trim() || !form.body.trim()) {
      setError(t('يرجى تعبئة كل الحقول', 'Please fill in every field'));
      return;
    }

    if (isCooldownActive('community-post')) {
      setError(t('يرجى الانتظار قليلاً قبل نشر سؤال آخر', 'Please wait a moment before posting another question'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/community-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          governorateId: form.governorateId,
          authorName: form.authorName.trim(),
          title: form.title.trim(),
          body: form.body.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed');
      }
      markSubmitted('community-post');
      setSubmitted(true);
    } catch {
      setError(t('تعذر نشر سؤالك، حاول مرة أخرى', 'Failed to post your question, please try again'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-[#0B192C]">{t('ابدأ نقاشاً جديداً', 'Start a new discussion')}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {t('اطرح سؤالك على مجتمع الأهالي والطلاب. سيظهر سؤالك بعد مراجعته من الإدارة.', 'Ask your question to the parent and student community. It appears after admin review.')}
          </p>
        </div>

        {submitted ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs text-center space-y-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h2 className="font-extrabold text-lg text-slate-900">{t('تم استلام سؤالك', 'Your question was received')}</h2>
            <p className="text-sm text-slate-500">
              {t('سيظهر سؤالك في صفحة المجتمع بعد الموافقة عليه من الإدارة.', 'It will appear on the community page once approved by an admin.')}
            </p>
            <button
              onClick={() => router.push('/community')}
              className="px-5 py-2.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-xl text-sm font-bold"
            >
              {t('العودة للمجتمع', 'Back to Community')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <input type="text" value={form.hp} onChange={(e) => setForm({ ...form, hp: e.target.value })} className="hidden" tabIndex={-1} autoComplete="off" />

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('اسمك', 'Your name')}</label>
              <input
                type="text"
                required
                value={form.authorName}
                onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('المحافظة', 'Governorate')}</label>
              <select
                required
                value={form.governorateId}
                onChange={(e) => setForm({ ...form, governorateId: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl font-medium bg-white"
              >
                <option value="">{t('اختر المحافظة', 'Select governorate')}</option>
                {governorates.map((g) => (
                  <option key={g.id} value={g.id}>{language === 'en' ? g.name.en : g.name.ar}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('عنوان السؤال', 'Question title')}</label>
              <input
                type="text"
                required
                placeholder={t('مثال: أفضل مدرسة ابتدائية في الكرخ؟', 'e.g. Best primary school in Karkh?')}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('تفاصيل السؤال', 'Details')}</label>
              <textarea
                required
                rows={5}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl font-medium resize-none"
              />
            </div>

            {error && <p className="text-[11px] font-bold text-rose-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-5 py-2.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-60"
            >
              {submitting ? t('جاري النشر...', 'Posting...') : t('نشر السؤال', 'Post question')}
            </button>
          </form>
        )}
      </div>

      <Footer />
    </div>
  );
}
