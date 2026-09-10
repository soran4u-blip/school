'use client';

import React from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { ThreadMessage } from '@/core/types/message';
import { Send } from 'lucide-react';

// The expandable message thread shown under a booking or an inquiry card — identical markup in
// both places in the original page, parameterized here by the messages/draft/sending state for
// whichever thread id the parent has expanded.
export default function MessageThread({
  messages,
  loading,
  draft,
  onDraftChange,
  onSend,
  sending,
}: {
  messages: ThreadMessage[] | undefined;
  loading: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  sending: boolean;
}) {
  const { t } = useLanguage();

  return (
    <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-200">
      <div className="max-h-56 overflow-y-auto space-y-2">
        {loading ? (
          <p className="text-xs text-slate-400 text-center py-2">{t('جاري التحميل...', 'Loading...')}</p>
        ) : (messages?.length || 0) === 0 ? (
          <p className="text-xs text-slate-400 text-center py-2">{t('لا توجد رسائل بعد', 'No messages yet')}</p>
        ) : (
          messages!.map((msg) => (
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
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSend(); }}
          placeholder={t('اكتب رسالة...', 'Write a message...')}
          className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg"
        />
        <button
          onClick={onSend}
          disabled={sending || !draft.trim()}
          className="p-2 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-lg disabled:opacity-50"
          title={t('إرسال', 'Send')}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
