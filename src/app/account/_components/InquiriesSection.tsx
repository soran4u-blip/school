'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/core/context/LanguageContext';
import { ThreadMessage } from '@/core/types/message';
import { MessageCircle, MessageSquare } from 'lucide-react';
import MessageThread from './MessageThread';
import type { AccountInquiry } from '../page';

// The account page's "My Inquiries" list — each card shows the inquiry summary, quick actions
// (message institution, WhatsApp), and an expandable message thread. The parent owns all
// inquiry, thread, and draft state.
export default function InquiriesSection({
  inquiries,
  expandedInquiryThreadId,
  toggleInquiryThread,
  inquiryThreadMessages,
  loadingInquiryThreadId,
  inquiryMessageDrafts,
  setInquiryMessageDrafts,
  sendingInquiryThreadId,
  handleSendInquiryMessage,
}: {
  inquiries: AccountInquiry[];
  expandedInquiryThreadId: string | null;
  toggleInquiryThread: (inquiryId: string) => void;
  inquiryThreadMessages: Record<string, ThreadMessage[]>;
  loadingInquiryThreadId: string | null;
  inquiryMessageDrafts: Record<string, string>;
  setInquiryMessageDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  sendingInquiryThreadId: string | null;
  handleSendInquiryMessage: (inquiryId: string) => void;
}) {
  const { language, t } = useLanguage();

  if (inquiries.length === 0) {
    return (
      <div className="text-center text-sm text-slate-400 py-12">
        {t('لا توجد استفسارات بعد.', 'No inquiries yet.')}{' '}
        <Link href="/institutions" className="text-emerald-700 font-bold hover:underline">{t('تصفّح المؤسسات', 'Browse institutions')}</Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {inquiries.map((inq) => (
        <div key={inq.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                {inq.institutionSlug ? (
                  <Link href={`/institutions/${inq.institutionSlug}`} className="font-bold text-sm text-slate-900 hover:text-blue-700">
                    {inq.institutionName ? (language === 'en' ? inq.institutionName.en : inq.institutionName.ar) : inq.institutionId}
                  </Link>
                ) : (
                  <span className="font-bold text-sm text-slate-900">
                    {inq.institutionName ? (language === 'en' ? inq.institutionName.en : inq.institutionName.ar) : inq.institutionId}
                  </span>
                )}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  inq.status === 'CONTACTED' ? 'bg-emerald-50 text-emerald-700' :
                  inq.status === 'CLOSED' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-700'
                }`}>
                  {inq.status}
                </span>
              </div>
              <p className="text-xs text-slate-600">{inq.message}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggleInquiryThread(inq.id)}
                className={`p-2 rounded-lg ${expandedInquiryThreadId === inq.id ? 'bg-[#0B192C] text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                title={t('مراسلة المؤسسة', 'Message institution')}
              >
                <MessageCircle className="w-4 h-4" />
              </button>
              {inq.institutionWhatsapp && (
                <a
                  href={`https://wa.me/${inq.institutionWhatsapp}`}
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

          {expandedInquiryThreadId === inq.id && (
            <MessageThread
              messages={inquiryThreadMessages[inq.id]}
              loading={loadingInquiryThreadId === inq.id}
              draft={inquiryMessageDrafts[inq.id] || ''}
              onDraftChange={(value) => setInquiryMessageDrafts((prev) => ({ ...prev, [inq.id]: value }))}
              onSend={() => handleSendInquiryMessage(inq.id)}
              sending={sendingInquiryThreadId === inq.id}
            />
          )}
        </div>
      ))}
    </div>
  );
}
