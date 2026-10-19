'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useLanguage } from '@/core/context/LanguageContext';
import { getGovernorates } from '@/core/services/masterDataService';
import { getCommunityPostBySlug, getCommunityReplies, createCommunityReply } from '@/core/services/communityService';
import { CommunityPost, CommunityReply } from '@/core/types/community';
import { Governorate } from '@/core/types/masterData';
import { auth } from '@/core/firebase/config';
import { signInAnonymously } from 'firebase/auth';
import { isCooldownActive, markSubmitted } from '@/lib/spamGuard';
import { MapPin, MessageCircle, CalendarDays, CheckCircle2 } from 'lucide-react';

export default function CommunityPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { language, t } = useLanguage();

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [governorate, setGovernorate] = useState<Governorate | null>(null);
  const [replies, setReplies] = useState<CommunityReply[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ authorName: '', body: '', hp: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [replyPosted, setReplyPosted] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const p = await getCommunityPostBySlug(slug);
      if (p && p.status === 'APPROVED') {
        setPost(p);
        const [govs, repliesList] = await Promise.all([
          getGovernorates(),
          getCommunityReplies(p.id),
        ]);
        setGovernorate(govs.find((g) => g.id === p.governorateId) || null);
        setReplies(repliesList);
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;
    setError('');
    setReplyPosted(false);

    if (form.hp) return; // honeypot tripped — silently drop

    if (!form.authorName.trim() || !form.body.trim()) {
      setError(t('يرجى إدخال الاسم والرد', 'Please enter your name and a reply'));
      return;
    }

    if (form.authorName.trim().length > 80 || form.body.trim().length > 2000) {
      setError(t('الاسم بحد أقصى 80 حرفاً والرد بحد أقصى 2000 حرف', 'Name must be 80 characters or fewer and reply must be 2,000 characters or fewer'));
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
      setReplyPosted(true);
      setForm({ authorName: '', body: '', hp: '' });
    } catch {
      setError(t('تعذر إرسال ردك، حاول مرة أخرى', 'Failed to post your reply, please try again'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-sm text-slate-400 font-bold">{t('جاري التحميل...', 'Loading...')}</div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
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
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-6">
        <div className="bg-white rounded-2xl border border-[#E8E6DE] shadow-sm p-6 space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <h1 className="text-xl font-extrabold text-slate-900">{post.title}</h1>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
              <MapPin className="w-3.5 h-3.5" />
              {governorate ? (language === 'en' ? governorate.name.en : governorate.name.ar) : post.governorateId}
            </span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{post.body}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 font-semibold pt-3 border-t border-slate-100">
            <span>{post.authorName}</span>
            <span className="inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{new Date(post.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'ar-IQ', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-slate-700">
            <MessageCircle className="w-4 h-4" />
            {replies.length} {t('ردود', 'replies')}
          </h2>
          {replies.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#D8DED6] bg-white/70 px-5 py-6 text-center">
              <MessageCircle className="w-6 h-6 text-[#28675A] mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">{t('كن أول من يشارك برأيه', 'Be the first to share your thoughts')}</p>
              <p className="text-xs text-slate-500 mt-1">{t('قد تساعد تجربتك ولي أمر أو طالباً آخر.', 'Your experience could help another parent or student.')}</p>
            </div>
          )}
          {replies.map((reply) => (
            <div key={reply.id} className="bg-white p-4 rounded-2xl border border-[#E8E6DE] shadow-sm">
              <p className="text-sm text-slate-700 whitespace-pre-line">{reply.body}</p>
              <div className="text-xs text-slate-500 font-semibold mt-2">{reply.authorName}</div>
            </div>
          ))}
        </div>

        <form onSubmit={handleReply} className="bg-white p-5 rounded-2xl border border-[#E8E6DE] shadow-sm space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{t('أضف رداً', 'Add a reply')}</h3>
            <p className="text-xs text-slate-500 mt-1">{t('شارك تجربة مفيدة واحترم آراء الآخرين.', 'Share a helpful experience and respect other perspectives.')}</p>
          </div>
          <input type="text" value={form.hp} onChange={(e) => setForm({ ...form, hp: e.target.value })} className="hidden" tabIndex={-1} autoComplete="off" />
          <input
            type="text"
            required
            placeholder={t('اسمك', 'Your name')}
            maxLength={80}
            value={form.authorName}
            onChange={(e) => setForm({ ...form, authorName: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-[#E8E6DE] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#28675A]/30 focus:border-[#28675A]"
          />
          <textarea
            required
            rows={4}
            maxLength={2000}
            placeholder={t('اكتب ردك...', 'Write your reply...')}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-[#E8E6DE] rounded-xl font-medium resize-y focus:outline-none focus:ring-2 focus:ring-[#28675A]/30 focus:border-[#28675A]"
          />
          <div className="flex items-center justify-between gap-3 text-[11px] text-slate-400">
            <span>{t('لا تشارك معلومات شخصية حساسة.', 'Avoid sharing sensitive personal information.')}</span>
            <span className={form.body.length > 1800 ? 'text-amber-700 font-bold' : ''}>{form.body.length}/2000</span>
          </div>
          {replyPosted && <p role="status" aria-live="polite" className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><CheckCircle2 className="w-4 h-4" />{t('تم نشر ردك بنجاح.', 'Your reply was posted successfully.')}</p>}
          {error && <p role="alert" className="text-sm font-semibold text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !form.authorName.trim() || !form.body.trim()}
            className="px-5 py-2.5 bg-[#123D35] hover:bg-[#28675A] text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-60"
          >
            {submitting ? t('جاري الإرسال...', 'Posting...') : t('إرسال الرد', 'Post reply')}
          </button>
        </form>
      </div>

      <Footer />
    </div>
  );
}
