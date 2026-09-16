'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useLanguage } from '@/core/context/LanguageContext';
import { getGovernorates } from '@/core/services/masterDataService';
import { getApprovedCommunityPosts } from '@/core/services/communityService';
import { Governorate } from '@/core/types/masterData';
import { CommunityPost } from '@/core/types/community';
import { AlertCircle, MessageCircle, MapPin, Plus, RefreshCw, Users } from 'lucide-react';

export default function CommunityContent({ initialGovernorate }: { initialGovernorate?: string }) {
  const { language, t } = useLanguage();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGov, setSelectedGov] = useState(initialGovernorate || 'all');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [govs, list] = await Promise.all([getGovernorates(), getApprovedCommunityPosts()]);
      setGovernorates(govs);
      setPosts(list);
    } catch {
      setError(t('تعذر تحميل المجتمع. حاول مرة أخرى.', 'The community could not be loaded. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const filtered = selectedGov === 'all' ? posts : posts.filter((p) => p.governorateId === selectedGov);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <div className="bg-[#0B192C] text-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-3">
          <div className="flex items-center gap-2 text-xs text-amber-300 font-bold">
            <span>{t('دليل العراق التعليمي', 'Eduraq Directory')}</span>
            <span>/</span>
            <span>{t('مجتمع الأهالي', 'Community')}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black">
            {t('اسأل مجتمع الأهالي في العراق', 'Ask the Iraq parent & student community')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal">
            {t(
              'تنتقل إلى محافظة جديدة؟ تبحث عن مدرسة مناسبة؟ اطرح سؤالك واحصل على نصائح حقيقية من أهالي وطلاب يعرفون المنطقة.',
              'Relocating to a new governorate? Looking for the right school? Ask a real question and get advice from people who actually know the area.'
            )}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <select
            value={selectedGov}
            onChange={(e) => setSelectedGov(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
          >
            <option value="all">{t('كافة المحافظات', 'All Governorates')}</option>
            {governorates.map((g) => (
              <option key={g.id} value={g.id}>{language === 'en' ? g.name.en : g.name.ar}</option>
            ))}
          </select>
          <Link
            href="/community/new"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-xl text-sm font-bold transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('ابدأ نقاشاً', 'Start a discussion')}
          </Link>
        </div>

        {loading ? (
          <div className="text-center text-sm text-slate-400 py-16">{t('جاري التحميل...', 'Loading...')}</div>
        ) : error ? (
          <div className="bg-white p-12 rounded-2xl border border-rose-200 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
            <h3 className="font-extrabold text-base text-slate-800">{t('تعذر تحميل المجتمع', 'Community unavailable')}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">{error}</p>
            <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B192C] text-white rounded-xl text-xs font-bold">
              <RefreshCw className="w-3.5 h-3.5" />{t('حاول مرة أخرى', 'Try again')}
            </button>
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((post) => {
              const gov = governorates.find((g) => g.id === post.governorateId);
              return (
                <Link
                  key={post.id}
                  href={`/community/${post.slug || post.id}`}
                  className="block bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all p-5"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <h2 className="font-extrabold text-base text-slate-900">{post.title}</h2>
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
                      <MapPin className="w-3 h-3" />
                      {gov ? (language === 'en' ? gov.name.en : gov.name.ar) : post.governorateId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mt-2">{post.body}</p>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 font-semibold">
                    <span>{post.authorName}</span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
                      {post.replyCount} {t('ردود', 'replies')}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-extrabold text-base text-slate-800">
              {t('لا توجد نقاشات بعد', 'No discussions yet')}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {t('كن أول من يطرح سؤالاً في هذه المحافظة.', 'Be the first to ask a question here.')}
            </p>
            <Link href="/community/new" className="inline-block px-4 py-2 bg-[#0B192C] text-white rounded-xl text-xs font-bold">
              {t('ابدأ نقاشاً', 'Start a discussion')}
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
