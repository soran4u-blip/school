'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useLanguage } from '@/core/context/LanguageContext';
import { Search, Briefcase, MessageSquare, MessageCircle, Send } from 'lucide-react';
import { ThreadMessage } from '@/core/types/message';

interface LookupApplication {
  id: string;
  jobId: string;
  jobTitle: { ar: string; en: string } | null;
  institutionId: string;
  institutionName: { ar: string; en: string } | null;
  institutionWhatsapp: string | null;
  status: 'SUBMITTED' | 'REVIEWING' | 'SHORTLISTED' | 'REJECTED' | 'HIRED';
  createdAt: string;
}

const STATUS_STYLES: Record<LookupApplication['status'], string> = {
  SUBMITTED: 'bg-blue-50 text-blue-700',
  REVIEWING: 'bg-amber-50 text-amber-700',
  SHORTLISTED: 'bg-purple-50 text-purple-700',
  REJECTED: 'bg-rose-50 text-rose-700',
  HIRED: 'bg-emerald-50 text-emerald-700',
};

export default function MyApplicationsPage() {
  const { language, t } = useLanguage();
  const [phone, setPhone] = useState('');
  const [applications, setApplications] = useState<LookupApplication[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<Record<string, ThreadMessage[]>>({});
  const [loadingThreadId, setLoadingThreadId] = useState<string | null>(null);
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});
  const [sendingThreadId, setSendingThreadId] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/job-applications/lookup?phone=${encodeURIComponent(phone.trim())}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || t('تعذر البحث', 'Failed to look up your applications'));
        return;
      }
      setApplications(data.applications);
    } catch {
      setError(t('تعذر البحث', 'Failed to look up your applications'));
    } finally {
      setLoading(false);
    }
  };

  const toggleThread = async (applicationId: string) => {
    if (expandedThreadId === applicationId) {
      setExpandedThreadId(null);
      return;
    }
    setExpandedThreadId(applicationId);
    if (!threadMessages[applicationId]) {
      setLoadingThreadId(applicationId);
      try {
        const res = await fetch(`/api/job-applications/${applicationId}/messages?phone=${encodeURIComponent(phone.trim())}`);
        const data = await res.json();
        if (data.success) setThreadMessages((prev) => ({ ...prev, [applicationId]: data.messages }));
      } finally {
        setLoadingThreadId(null);
      }
    }
  };

  const handleSendMessage = async (applicationId: string) => {
    const text = messageDrafts[applicationId]?.trim();
    if (!text) return;
    setSendingThreadId(applicationId);
    try {
      const res = await fetch(`/api/job-applications/${applicationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), text, senderName: 'Applicant' }),
      });
      const data = await res.json();
      if (data.success) {
        setThreadMessages((prev) => ({ ...prev, [applicationId]: [...(prev[applicationId] || []), data.message] }));
        setMessageDrafts((prev) => ({ ...prev, [applicationId]: '' }));
      }
    } finally {
      setSendingThreadId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-[#0B192C]">{t('طلبات التوظيف الخاصة بي', 'My Job Applications')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('أدخل رقم هاتفك لعرض طلبات التوظيف الخاصة بك ومراسلة المؤسسات.', 'Enter your phone number to view your job applications and message institutions.')}</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            type="text"
            required
            placeholder={t('رقم الهاتف', 'Phone number')}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl font-mono bg-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-xl text-sm font-bold disabled:opacity-60"
          >
            <Search className="w-4 h-4" />
            {t('بحث', 'Search')}
          </button>
        </form>

        {error && (
          <div className="p-4 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800">{error}</div>
        )}

        {applications && (
          applications.length === 0 ? (
            <div className="text-center text-sm text-slate-400 py-12">{t('لا توجد طلبات بهذا الرقم', 'No applications found for this number')}</div>
          ) : (
            <div className="space-y-3">
              {applications.map((a) => (
                <div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                        <Link href={`/jobs/${a.jobId}`} className="font-bold text-sm text-slate-900 hover:text-blue-700">
                          {a.jobTitle ? (language === 'en' ? a.jobTitle.en : a.jobTitle.ar) : a.jobId}
                        </Link>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[a.status]}`}>
                          {a.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-semibold">
                        {a.institutionName ? (language === 'en' ? a.institutionName.en : a.institutionName.ar) : a.institutionId}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleThread(a.id)}
                        className={`p-2 rounded-lg ${expandedThreadId === a.id ? 'bg-[#0B192C] text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                        title={t('مراسلة المؤسسة', 'Message institution')}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      {a.institutionWhatsapp && (
                        <a
                          href={`https://wa.me/${a.institutionWhatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg"
                          title={t('واتساب', 'WhatsApp')}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>

                  {expandedThreadId === a.id && (
                    <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-200">
                      <div className="max-h-56 overflow-y-auto space-y-2">
                        {loadingThreadId === a.id ? (
                          <p className="text-xs text-slate-400 text-center py-2">{t('جاري التحميل...', 'Loading...')}</p>
                        ) : (threadMessages[a.id]?.length || 0) === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-2">{t('لا توجد رسائل بعد', 'No messages yet')}</p>
                        ) : (
                          threadMessages[a.id].map((msg) => (
                            <div key={msg.id} className={`flex ${msg.senderRole === 'student' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[75%] px-3 py-2 rounded-xl text-xs ${
                                msg.senderRole === 'student' ? 'bg-[#0B192C] text-white' : 'bg-white border border-slate-200 text-slate-700'
                              }`}>
                                <p>{msg.text}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={messageDrafts[a.id] || ''}
                          onChange={(e) => setMessageDrafts((prev) => ({ ...prev, [a.id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(a.id); }}
                          placeholder={t('اكتب رسالة...', 'Write a message...')}
                          className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg"
                        />
                        <button
                          onClick={() => handleSendMessage(a.id)}
                          disabled={sendingThreadId === a.id || !messageDrafts[a.id]?.trim()}
                          className="p-2 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-lg disabled:opacity-50"
                          title={t('إرسال', 'Send')}
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <Footer />
    </div>
  );
}
