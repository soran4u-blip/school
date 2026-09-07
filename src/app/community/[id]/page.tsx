'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useLanguage } from '@/core/context/LanguageContext';
import { getGovernorates } from '@/core/services/masterDataService';
import { getCommunityPostById, getCommunityReplies, createCommunityReply } from '@/core/services/communityService';
import { CommunityPost, CommunityReply } from '@/core/types/community';
import { Governorate } from '@/core/types/masterData';
import { auth } from '@/core/firebase/config';
import { signInAnonymously } from 'firebase/auth';
import { isCooldownActive, markSubmitted } from '@/lib/spamGuard';
import { MapPin, MessageCircle } from 'lucide-react';

export default function CommunityPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { language, t } = useLanguage();

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [governorate, setGovernorate] = useState<Governorate | null>(null);
  const [replies, setReplies] = useState<CommunityReply[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ authorName: '', body: '', hp: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const p = await getCommunityPostById(id);
      if (p && p.status === 'APPROVED') {
        setPost(p);
        const [govs, repliesList] = await Promise.all([
          getGovernorates(),
          getCommunityReplies(id),
        ]);
        setGovernorate(govs.find((g) => g.id === p.governorateId) || null);
        setReplies(repliesList);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;
    setError('');

    if (form.hp) return; // honeypot tripped — silently drop

    if (!form.authorName.trim() || !form.body.trim()) {
      setError(t('يرجى إدخال الاسم والرد', 'Please enter your name and a reply'));
      return;
    }

    if (isCooldownActive('community-reply')) {
      setError(t('يرجى الانتظار قليلاً قبل إرسال رد آخر', 'Please wait a moment before posting another reply'));
      return;
    }

    setSubmitting(true);
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      const reply = await createCommunityReply(post.id, post.replyCount, {
        authorName: form.authorName.trim(),
        body: form.body.trim(),
      });
      setReplies((prev) => [...prev, reply]);
      setPost((prev) => (prev ? { ...prev, replyCount: prev.replyCount + 1 } : prev));
      markSubmitted('community-reply');
      setForm({ authorName: '', body: '', hp: '' });
    } catch {
      setError(t('تعذر إرسال ردك، حاول مرة أخرى', 'Failed to post your reply, please try again'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-sm text-slate-400 font-bold">{t('جاري التحميل...', 'Loading...')}</div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-4">
          <h1 className="font-extrabold text-lg text-slate-800">{t('النقاش غير موجود', 'Discussion Not Found')}</h1>
          <Link href="/community" className="text-sm font-bold text-blue-700 hover:underline">{t('العودة للمجتمع', 'Back to Community')}</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <h1 className="text-xl font-extrabold text-slate-900">{post.title}</h1>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
              <MapPin className="w-3.5 h-3.5" />
              {governorate ? (language === 'en' ? governorate.name.en : governorate.name.ar) : post.governorateId}
            </span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{post.body}</p>
          <div className="text-xs text-slate-500 font-semibold pt-2 border-t border-slate-100">{post.authorName}</div>
        </div>

        <div className="space-y-3">
          <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-slate-700">
            <MessageCircle className="w-4 h-4" />
            {replies.length} {t('ردود', 'replies')}
          </h2>
          {replies.map((reply) => (
            <div key={reply.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <p className="text-sm text-slate-700 whitespace-pre-line">{reply.body}</p>
              <div className="text-xs text-slate-500 font-semibold mt-2">{reply.authorName}</div>
            </div>
          ))}
        </div>

        <form onSubmit={handleReply} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900">{t('أضف رداً', 'Add a reply')}</h3>
          <input type="text" value={form.hp} onChange={(e) => setForm({ ...form, hp: e.target.value })} className="hidden" tabIndex={-1} autoComplete="off" />
          <input
            type="text"
            required
            placeholder={t('اسمك', 'Your name')}
            value={form.authorName}
            onChange={(e) => setForm({ ...form, authorName: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl font-medium"
          />
          <textarea
            required
            rows={3}
            placeholder={t('اكتب ردك...', 'Write your reply...')}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl font-medium resize-none"
          />
          {error && <p className="text-[11px] font-bold text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-60"
          >
            {submitting ? t('جاري الإرسال...', 'Posting...') : t('إرسال الرد', 'Post reply')}
          </button>
        </form>
      </div>

      <Footer />
    </div>
  );
}
