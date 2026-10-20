'use client';

import React from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { Tutor } from '@/core/types/tutor';
import { Review } from '@/core/types/review';
import { ShieldCheck, Star } from 'lucide-react';
import { pickLocalized } from '@/lib/localized';
import { useT } from '@/lib/useT';
import { TUTOR_PROFILE_COPY } from '../TutorProfile.i18n';

type ReviewForm = { reviewerName: string; rating: number; comment: string; hp: string };

// The approved review list plus the inline review-submission form.
export default function ReviewsSection({
  tutor,
  reviews,
  reviewForm,
  setReviewForm,
  reviewSubmitting,
  reviewSubmitted,
  reviewError,
  onSubmitReview,
}: {
  tutor: Tutor;
  reviews: Review[];
  reviewForm: ReviewForm;
  setReviewForm: (form: ReviewForm) => void;
  reviewSubmitting: boolean;
  reviewSubmitted: boolean;
  reviewError: string;
  onSubmitReview: (e: React.FormEvent) => void;
}) {
  const { language } = useLanguage();
  const t = useT(TUTOR_PROFILE_COPY);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-sm text-slate-900">{t('reviewsHeading')}</h2>
        <span className="text-xs text-slate-400 font-semibold">{t('approvedCount', { n: reviews.length })}</span>
      </div>

      <div className="divide-y divide-slate-100">
        {reviews.length > 0 ? (
          reviews.map((rev) => (
            <div key={rev.id} className="py-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-slate-900">{rev.reviewerName}</span>
                  {rev.verified && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700" title={t('verifiedStudentHint')}>
                      <ShieldCheck className="w-2.5 h-2.5" />
                      {t('verifiedStudent')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
              {rev.reply && (
                <div className="ms-4 ps-3 border-s-2 border-emerald-200 mt-2">
                  <span className="text-[10px] font-bold text-emerald-700">
                    {t('reply', { name: pickLocalized(tutor.fullName, language) })}
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">{rev.reply.text}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            {t('noApprovedReviews')}
          </div>
        )}
      </div>

      <div className="pt-5 border-t border-slate-100">
        <h3 className="font-bold text-sm text-slate-900 mb-3">{t('writeReview')}</h3>

        {reviewSubmitted ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
            {t('reviewThanks')}
          </div>
        ) : (
          <form onSubmit={onSubmitReview} className="space-y-3">
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={reviewForm.hp}
              onChange={(e) => setReviewForm({ ...reviewForm, hp: e.target.value })}
              className="absolute -left-[9999px] w-px h-px overflow-hidden"
              aria-hidden="true"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder={t('yourName')}
                value={reviewForm.reviewerName}
                onChange={(e) => setReviewForm({ ...reviewForm, reviewerName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
              <div className="flex items-center gap-1 px-3 py-2 border border-slate-200 rounded-lg">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button type="button" key={i} onClick={() => setReviewForm({ ...reviewForm, rating: i + 1 })}>
                    <Star className={`w-4 h-4 ${i < reviewForm.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              placeholder={t('commentPlaceholder')}
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
            {reviewError && <p className="text-[11px] font-bold text-rose-600">{reviewError}</p>}
            <button
              type="submit"
              disabled={reviewSubmitting}
              className="px-5 py-2.5 bg-[#123D35] hover:bg-[#28675A] text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-60"
            >
              {reviewSubmitting ? t('submitting') : t('submitReview')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
