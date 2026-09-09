'use client';

import React, { useState } from 'react';
import { Star, Send } from 'lucide-react';
import { useLanguage } from '@/core/context/LanguageContext';
import { Review } from '@/core/types/review';
import { replyToReview } from '@/core/services/reviewService';

// The "my approved reviews, with a public reply box" panel.
//
// The institution dashboard and the tutor dashboard had this same markup and the same reply
// handler, character for character, with only the local state variables renamed. Both are review
// subjects with one owner reply per review, so there was never anything to diverge on — and
// firestore.rules enforces exactly that shape (isOwnerReplyingToOwnApprovedReview permits a write
// touching only `reply`, which is why replyToReview sends that key alone).
//
// The reply drafts and in-flight id are internal: no caller ever read them.
export default function OwnerReviewsPanel({
  reviews,
  onReplied,
}: {
  reviews: Review[];
  // Lets the parent keep its own copy of the list in step, since it owns the data.
  onReplied: (reviewId: string, reply: { text: string; createdAt: string }) => void;
}) {
  const { t } = useLanguage();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);

  const handleReply = async (reviewId: string) => {
    const text = drafts[reviewId]?.trim();
    if (!text) return;
    setReplyingId(reviewId);
    try {
      await replyToReview(reviewId, text);
      onReplied(reviewId, { text, createdAt: new Date().toISOString() });
      setDrafts((prev) => ({ ...prev, [reviewId]: '' }));
    } finally {
      setReplyingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
      {reviews.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400">{t('لا توجد تقييمات معتمدة بعد', 'No approved reviews yet')}</div>
      ) : (
        reviews.map((review) => (
          <div key={review.id} className="p-4 space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">{review.reviewerName}</span>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-600">{review.comment}</p>
            </div>

            {review.reply ? (
              <div className="ms-4 ps-3 border-s-2 border-emerald-200 space-y-1">
                <span className="text-[10px] font-bold text-emerald-700">{t('ردّك', 'Your reply')}</span>
                <p className="text-xs text-slate-600">{review.reply.text}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={drafts[review.id] || ''}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [review.id]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleReply(review.id); }}
                  placeholder={t('اكتب رداً علنياً...', 'Write a public reply...')}
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
                <button
                  onClick={() => handleReply(review.id)}
                  disabled={replyingId === review.id || !drafts[review.id]?.trim()}
                  className="p-2 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-lg disabled:opacity-50"
                  title={t('نشر الرد', 'Post reply')}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
