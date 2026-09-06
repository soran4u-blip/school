'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { MasterDataService } from '@/core/services/masterDataService';
import { Review, Inquiry } from '@/core/types/review';
import { Institution } from '@/core/types/institution';
import { Tutor } from '@/core/types/tutor';
import { MessageSquareText, Star, Check, X, Phone, Mail, Inbox, AlertCircle } from 'lucide-react';

export default function AdminReviewsPage() {
  const { language, t } = useLanguage();
  const [tab, setTab] = useState<'reviews' | 'inquiries'>('reviews');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [revs, inqs, insts, tuts] = await Promise.all([
        MasterDataService.getAllReviews(),
        MasterDataService.getAllInquiries(),
        MasterDataService.getInstitutions({ status: 'ALL' }),
        MasterDataService.getTutors({ status: 'ALL' }),
      ]);
      setReviews(revs);
      setInquiries(inqs);
      setInstitutions(insts);
      setTutors(tuts);
    } catch {
      setError(t('تعذر تحميل البيانات. تأكد من تسجيل الدخول كسوبر أدمن.', 'Failed to load data. Make sure you are signed in as superadmin.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const institutionName = (id: string) => {
    const inst = institutions.find(i => i.id === id);
    return inst ? (language === 'en' ? inst.name.en : inst.name.ar) : id;
  };

  const tutorName = (id: string) => {
    const tutor = tutors.find(t => t.id === id);
    return tutor ? (language === 'en' ? tutor.fullName.en : tutor.fullName.ar) : id;
  };

  const reviewTargetName = (rev: Review) =>
    rev.institutionId ? institutionName(rev.institutionId) : rev.tutorId ? tutorName(rev.tutorId) : '';

  const handleReviewDecision = async (review: Review, status: 'APPROVED' | 'REJECTED') => {
    await MasterDataService.updateReviewStatus(review.id, status, review);
    await loadData();
  };

  const handleInquiryStatus = async (inquiry: Inquiry, status: Inquiry['status']) => {
    await MasterDataService.updateInquiryStatus(inquiry.id, status);
    await loadData();
  };

  const pendingReviews = reviews.filter(r => r.status === 'PENDING');
  const resolvedReviews = reviews.filter(r => r.status !== 'PENDING');

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B192C] flex items-center gap-2">
          <MessageSquareText className="w-6 h-6 text-blue-600" />
          <span>{t('التقييمات والاستفسارات', 'Reviews & Inquiries')}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {t('راجع التقييمات الواردة من الزوار ورد على استفسارات القبول.', 'Moderate visitor reviews and follow up on admissions inquiries.')}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-xl p-1.5 border border-slate-200 shadow-xs flex gap-1 max-w-sm">
        <button
          onClick={() => setTab('reviews')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${tab === 'reviews' ? 'bg-[#0B192C] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          {t('التقييمات', 'Reviews')} {pendingReviews.length > 0 && <span className="ms-1 text-amber-400">({pendingReviews.length})</span>}
        </button>
        <button
          onClick={() => setTab('inquiries')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${tab === 'inquiries' ? 'bg-[#0B192C] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          {t('الاستفسارات', 'Inquiries')} {inquiries.filter(i => i.status === 'NEW').length > 0 && <span className="ms-1 text-amber-400">({inquiries.filter(i => i.status === 'NEW').length})</span>}
        </button>
      </div>

      {tab === 'reviews' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">{t('جاري التحميل...', 'Loading...')}</div>
          ) : reviews.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">{t('لا توجد تقييمات بعد', 'No reviews yet')}</div>
          ) : (
            [...pendingReviews, ...resolvedReviews].map(rev => (
              <div key={rev.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{rev.reviewerName}</span>
                    <span className="text-[10px] text-slate-400">→ {reviewTargetName(rev)}</span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600">{rev.comment}</p>
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    rev.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                    rev.status === 'REJECTED' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {rev.status}
                  </span>
                  {rev.reply && (
                    <div className="ms-4 ps-3 border-s-2 border-emerald-200 mt-1">
                      <span className="text-[10px] font-bold text-emerald-700">{t('رد صاحب الملف', 'Owner reply')}</span>
                      <p className="text-xs text-slate-600">{rev.reply.text}</p>
                    </div>
                  )}
                </div>

                {rev.status === 'PENDING' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleReviewDecision(rev, 'APPROVED')}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg"
                      title={t('قبول', 'Approve')}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReviewDecision(rev, 'REJECTED')}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg"
                      title={t('رفض', 'Reject')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'inquiries' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">{t('جاري التحميل...', 'Loading...')}</div>
          ) : inquiries.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <Inbox className="w-6 h-6 text-slate-300" />
              {t('لا توجد استفسارات بعد', 'No inquiries yet')}
            </div>
          ) : (
            inquiries.map(inq => (
              <div key={inq.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{inq.fullName}</span>
                    <span className="text-[10px] text-slate-400">→ {inq.institutionName || institutionName(inq.institutionId)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{inq.phone}</span>
                    {inq.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{inq.email}</span>}
                  </div>
                  {inq.message && <p className="text-xs text-slate-600">{inq.message}</p>}
                </div>

                <select
                  value={inq.status}
                  onChange={(e) => handleInquiryStatus(inq, e.target.value as Inquiry['status'])}
                  className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border shrink-0 ${
                    inq.status === 'NEW' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    inq.status === 'CONTACTED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <option value="NEW">{t('جديد', 'New')}</option>
                  <option value="CONTACTED">{t('تم التواصل', 'Contacted')}</option>
                  <option value="CLOSED">{t('مغلق', 'Closed')}</option>
                </select>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
