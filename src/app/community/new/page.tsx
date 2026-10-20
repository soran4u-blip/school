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
import { pickLocalized } from '@/lib/localized';
import { useT } from '@/lib/useT';
import { COMMUNITY_COPY } from '../Community.i18n';

export default function NewCommunityPostPage() {
  const { language } = useLanguage();
  const t = useT(COMMUNITY_COPY);
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
      setError(t('fillAll'));
      return;
    }

    if (form.authorName.trim().length > 80 || form.title.trim().length > 120 || form.body.trim().length > 2000) {
      setError(t('newLimits'));
      return;
    }

    if (isCooldownActive('community-post')) {
      setError(t('postWait'));
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
      setError(t('postFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <Navbar />

      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-[#123D35]">{t('newTitle')}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {t('newIntro')}
          </p>
        </div>

        {submitted ? (
          <div className="bg-white p-8 rounded-2xl border border-[#E8E6DE] shadow-sm text-center space-y-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h2 className="font-extrabold text-lg text-slate-900">{t('received')}</h2>
            <p className="text-sm text-slate-500">
              {t('receivedNote')}
            </p>
            <button
              onClick={() => router.push('/community')}
              className="px-5 py-2.5 bg-[#123D35] hover:bg-[#28675A] text-white rounded-xl text-sm font-bold"
            >
              {t('backToCommunity')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-[#E8E6DE] shadow-sm space-y-4">
            <input type="text" value={form.hp} onChange={(e) => setForm({ ...form, hp: e.target.value })} className="hidden" tabIndex={-1} autoComplete="off" />

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('yourName')}</label>
              <input
                type="text"
                required
                maxLength={80}
                autoComplete="name"
                value={form.authorName}
                onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-[#E8E6DE] rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('governorate')}</label>
              <select
                required
                value={form.governorateId}
                onChange={(e) => setForm({ ...form, governorateId: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-[#E8E6DE] rounded-xl font-medium bg-white"
              >
                <option value="">{t('selectGovernorate')}</option>
                {governorates.map((g) => (
                  <option key={g.id} value={g.id}>{pickLocalized(g.name, language)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('questionTitle')}</label>
              <input
                type="text"
                required
                maxLength={120}
                placeholder={t('titlePlaceholder')}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-[#E8E6DE] rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('details')}</label>
              <textarea
                required
                rows={5}
                maxLength={2000}
                placeholder={t('detailsPlaceholder')}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-[#E8E6DE] rounded-xl font-medium resize-y focus:outline-none focus:ring-2 focus:ring-[#28675A]/30 focus:border-[#28675A]"
              />
              <p className="text-[11px] text-slate-400 text-end mt-1">{form.body.length}/2000</p>
            </div>

            <p className="text-xs text-slate-500">{t('privacyNote')}</p>
            {error && <p role="alert" className="text-sm font-semibold text-rose-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting || !form.authorName.trim() || !form.governorateId || !form.title.trim() || !form.body.trim()}
              className="w-full px-5 py-2.5 bg-[#123D35] hover:bg-[#28675A] text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-60"
            >
              {submitting ? t('publishing') : t('postQuestion')}
            </button>
          </form>
        )}
      </div>

      <Footer />
    </div>
  );
}
