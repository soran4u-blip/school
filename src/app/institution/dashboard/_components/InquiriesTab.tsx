'use client';

import React from 'react';
import { Mail, Phone, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/core/context/LanguageContext';
import { useT } from '@/lib/useT';
import { MessageThreads } from '@/lib/useMessageThreads';
import { formatDate } from '@/lib/utils';
import { Inquiry } from '@/core/types/review';
import MessageThreadPanel from '@/components/shared/MessageThreadPanel';
import { INSTITUTION_COPY } from '../Institution.i18n';

// The institution dashboard's Inquiries tab: the live inquiry queue with a status dropdown and an
// expandable message thread per inquiry.
export default function InquiriesTab({
  inquiries,
  threads,
  isThreadUnread,
  handleInquiryStatus,
}: {
  inquiries: Inquiry[];
  threads: MessageThreads;
  isThreadUnread: (inquiryId: string) => boolean;
  handleInquiryStatus: (inquiryId: string, status: Inquiry['status']) => void;
}) {
  const { language } = useLanguage();
  const t = useT(INSTITUTION_COPY);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
      {inquiries.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400">{t('noInquiries')}</div>
      ) : (
        inquiries.map((inq) => (
          <div key={inq.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-slate-900">{inq.fullName}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  inq.status === 'NEW' ? 'bg-blue-50 text-blue-700' : inq.status === 'CONTACTED' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {inq.status}
                </span>
                {isThreadUnread(inq.id) && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    <MessageCircle className="w-2.5 h-2.5" />
                    {t('newReply')}
                  </span>
                )}
              </div>
              <button
                onClick={() => threads.toggle(inq.id)}
                className={`relative p-2 rounded-lg ${threads.expandedId === inq.id ? 'bg-[#0B192C] text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                title={t('messageTitle')}
              >
                <MessageCircle className="w-4 h-4" />
                {isThreadUnread(inq.id) && (
                  <span className="absolute -top-0.5 -end-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1" dir="ltr"><Phone className="w-3 h-3" />{inq.phone}</span>
              {inq.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{inq.email}</span>}
              {/* The list showed no date at all, so a three-month-old inquiry looked identical
                  to one that arrived this morning. */}
              <span className="text-slate-400">{formatDate(inq.createdAt, language)}</span>
            </div>
            {inq.message && <p className="text-xs text-slate-600">{inq.message}</p>}

            <select
              value={inq.status}
              onChange={(e) => handleInquiryStatus(inq.id, e.target.value as Inquiry['status'])}
              className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border ${
                inq.status === 'NEW' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                inq.status === 'CONTACTED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              <option value="NEW">{t('inquiryNew')}</option>
              <option value="CONTACTED">{t('inquiryContacted')}</option>
              <option value="CLOSED">{t('inquiryClosed')}</option>
            </select>

            {threads.expandedId === inq.id && (
              <MessageThreadPanel threadId={inq.id} threads={threads} ownRole="institution" />
            )}
          </div>
        ))
      )}
    </div>
  );
}
