'use client';

import React from 'react';
import { Send } from 'lucide-react';
import { MessageThreads } from '@/lib/useMessageThreads';
import { useT } from '@/lib/useT';
import { MESSAGE_THREAD_COPY } from './SharedPanels.i18n';

// The expanded message thread under an inquiry (institution side) or a booking (tutor side):
// scrollable bubbles plus a composer. Both dashboards rendered this identically apart from which
// `senderRole` counts as "mine".

export default function MessageThreadPanel({
  threadId,
  threads,
  ownRole,
}: {
  threadId: string;
  threads: MessageThreads;
  // Messages from this role are the owner's own, and sit on the trailing side.
  ownRole: string;
}) {
  const t = useT(MESSAGE_THREAD_COPY);
  const messages = threads.messages[threadId];
  const draft = threads.draftFor(threadId);

  return (
    <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-200">
      <div className="max-h-56 overflow-y-auto space-y-2">
        {threads.loadingId === threadId ? (
          <p className="text-xs text-slate-400 text-center py-2">{t('loading')}</p>
        ) : (messages?.length || 0) === 0 ? (
          <p className="text-xs text-slate-400 text-center py-2">{t('noMessages')}</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.senderRole === ownRole ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] px-3 py-2 rounded-xl text-xs ${
                  msg.senderRole === ownRole ? 'bg-[#0B192C] text-white' : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
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
          onChange={(e) => threads.setDraft(threadId, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') threads.send(threadId);
          }}
          placeholder={t('writeMessage')}
          className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg"
        />
        <button
          onClick={() => threads.send(threadId)}
          disabled={threads.sendingId === threadId || !draft.trim()}
          className="p-2 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-lg disabled:opacity-50"
          title={t('send')}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
