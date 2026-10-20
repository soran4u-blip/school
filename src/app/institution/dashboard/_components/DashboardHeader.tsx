'use client';

import React from 'react';
import { useT } from '@/lib/useT';
import { INSTITUTION_COPY } from '../Institution.i18n';

export type DashboardTab = 'profile' | 'programs' | 'jobs' | 'events' | 'inquiries' | 'reviews';

const TAB_LABELS = {
  profile: 'tabProfile',
  programs: 'tabPrograms',
  jobs: 'tabJobs',
  events: 'tabEvents',
  inquiries: 'tabInquiries',
  reviews: 'tabReviews',
} as const satisfies Record<DashboardTab, keyof typeof INSTITUTION_COPY>;

const TABS = Object.keys(TAB_LABELS) as DashboardTab[];

// The amber "needs attention" banner and the tab bar under the dashboard title, with the page's
// save/error notice slotted between them.
export default function DashboardHeader({
  tab,
  setTab,
  pendingInquiries,
  unreadReplies,
  pendingReviewReplies,
  children,
}: {
  tab: DashboardTab;
  setTab: (tab: DashboardTab) => void;
  pendingInquiries: number;
  unreadReplies: number;
  pendingReviewReplies: number;
  /** Rendered between the banner and the tab bar (the save/error notice). */
  children?: React.ReactNode;
}) {
  const t = useT(INSTITUTION_COPY);
  const inquiriesFirst = pendingInquiries > 0 || unreadReplies > 0;

  const newReplies = (n: number) => t(n === 1 ? 'newReplies1' : 'newRepliesN', { n });
  const noReply = (n: number) => t(n === 1 ? 'reviewsNoReply1' : 'reviewsNoReplyN', { n });
  const toAnswer = (n: number) => t(n === 1 ? 'reviewsToAnswer1' : 'reviewsToAnswerN', { n });

  return (
    <>
      {(pendingInquiries > 0 || unreadReplies > 0 || pendingReviewReplies > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold text-amber-900">
              {pendingInquiries > 0
                ? t(pendingInquiries === 1 ? 'inquiriesAwaiting1' : 'inquiriesAwaitingN', { n: pendingInquiries })
                : unreadReplies > 0
                ? newReplies(unreadReplies)
                : noReply(pendingReviewReplies)}
            </p>
            {(pendingInquiries > 0 && (unreadReplies > 0 || pendingReviewReplies > 0)) && (
              <p className="text-xs text-amber-800 mt-1">
                {[
                  unreadReplies > 0 ? newReplies(unreadReplies) : null,
                  pendingReviewReplies > 0 ? toAnswer(pendingReviewReplies) : null,
                ].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <button
            onClick={() => setTab(inquiriesFirst ? 'inquiries' : 'reviews')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0"
          >
            {inquiriesFirst ? t('openInquiries') : t('openReviews')}
          </button>
        </div>
      )}

      {children}

      <div className="bg-white rounded-xl p-1.5 border border-slate-200 shadow-xs flex gap-1 max-w-lg">
        {TABS.map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${tab === key ? 'bg-[#0B192C] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            {t(TAB_LABELS[key])}
            {key === 'inquiries' && pendingInquiries > 0 && <span className="ms-1 text-amber-400">({pendingInquiries})</span>}
            {key === 'reviews' && pendingReviewReplies > 0 && <span className="ms-1 text-amber-400">({pendingReviewReplies})</span>}
          </button>
        ))}
      </div>
    </>
  );
}
