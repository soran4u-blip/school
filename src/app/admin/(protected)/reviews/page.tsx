'use client';

import React, { useState } from 'react';
import { useLoadOnMount } from '@/lib/useLoadOnMount';
import { useLanguage } from '@/core/context/LanguageContext';
import { getPendingReviews, getReviewsPage, getInquiriesPage, getNewInquiriesCount, updateReviewStatus, updateInquiry, updateInquiryStatus } from '@/core/services/reviewService';
import { auth } from '@/core/firebase/config';
import { getInstitutions } from '@/core/services/institutionService';
import { getTutors } from '@/core/services/tutorService';
import { Review, Inquiry } from '@/core/types/review';
import { Institution } from '@/core/types/institution';
import { Tutor } from '@/core/types/tutor';
import { MessageSquareText, Star, Check, X, Phone, Mail, Inbox, AlertCircle } from 'lucide-react';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { pickLocalized } from '@/lib/localized';
import { useT } from '@/lib/useT';
import { REVIEWS_COPY } from './Reviews.i18n';

const PAGE_SIZE = 25;

export default function AdminReviewsPage() {
  const { language } = useLanguage();
  const t = useT(REVIEWS_COPY);
  const [tab, setTab] = useState<'reviews' | 'inquiries'>('reviews');
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);
  const [reviewHistory, setReviewHistory] = useState<Review[]>([]);
  const [reviewCursor, setReviewCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [newInquiriesCount, setNewInquiriesCount] = useState(0);
  const [inquiryCursor, setInquiryCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMoreInquiries, setHasMoreInquiries] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingInquiryId, setEditingInquiryId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [tagsDraft, setTagsDraft] = useState('');
  const [followUpDraft, setFollowUpDraft] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [pending, reviewPage, inquiryPage, newInquiries, insts, tuts] = await Promise.all([
        getPendingReviews(),
        getReviewsPage(PAGE_SIZE),
        getInquiriesPage(PAGE_SIZE),
        getNewInquiriesCount(),
        getInstitutions({ status: 'ALL' }),
        getTutors({ status: 'ALL' }),
      ]);
      setPendingReviews(pending);
      setReviewHistory(reviewPage.items);
      setReviewCursor(reviewPage.lastDoc);
      setHasMoreReviews(reviewPage.hasMore);
      setInquiries(inquiryPage.items);
      setInquiryCursor(inquiryPage.lastDoc);
      setHasMoreInquiries(inquiryPage.hasMore);
      setNewInquiriesCount(newInquiries);
      setInstitutions(insts);
      setTutors(tuts);
    } catch {
      setError(t('loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const loadMoreReviews = async () => {
    if (!reviewCursor) return;
    setLoadingMore(true);
    try {
      const nextPage = await getReviewsPage(PAGE_SIZE, reviewCursor);
      setReviewHistory((prev) => [...prev, ...nextPage.items]);
      setReviewCursor(nextPage.lastDoc);
      setHasMoreReviews(nextPage.hasMore);
    } finally {
      setLoadingMore(false);
    }
  };

  const loadMoreInquiries = async () => {
    if (!inquiryCursor) return;
    setLoadingMore(true);
    try {
      const nextPage = await getInquiriesPage(PAGE_SIZE, inquiryCursor);
      setInquiries((prev) => [...prev, ...nextPage.items]);
      setInquiryCursor(nextPage.lastDoc);
      setHasMoreInquiries(nextPage.hasMore);
    } finally {
      setLoadingMore(false);
    }
  };

  useLoadOnMount(loadData);

  const institutionName = (id: string) => {
    const inst = institutions.find(i => i.id === id);
    return inst ? pickLocalized(inst.name, language) : id;
  };

  const tutorName = (id: string) => {
    const tutor = tutors.find(tu => tu.id === id);
    return tutor ? pickLocalized(tutor.fullName, language) : id;
  };

  const reviewTargetName = (rev: Review) =>
    rev.institutionId ? institutionName(rev.institutionId) : rev.tutorId ? tutorName(rev.tutorId) : '';

  const handleReviewDecision = async (review: Review, status: 'APPROVED' | 'REJECTED') => {
    setError('');
    try {
      await updateReviewStatus(review.id, status);
      await loadData();
    } catch (e) {
      // The moderation route is transactional — a failure here means nothing changed, including
      // the rating aggregates, so the row stays exactly as it was and the action can be retried.
      setError(e instanceof Error ? e.message : t('reviewUpdateFailed'));
    }
  };

  const handleInquiryStatus = async (inquiry: Inquiry, status: Inquiry['status']) => {
    setError('');
    try {
      await updateInquiryStatus(inquiry.id, status);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('inquiryUpdateFailed'));
    }
  };

  const beginInquiryEdit = (inquiry: Inquiry) => {
    setEditingInquiryId(inquiry.id);
    setNotesDraft(inquiry.notes || '');
    setTagsDraft((inquiry.tags || []).join(', '));
    setFollowUpDraft(inquiry.nextFollowUpAt?.slice(0, 10) || '');
  };

  const saveInquiryDetails = async (inquiry: Inquiry) => {
    setError('');
    try {
      const updated = await updateInquiry(inquiry.id, {
        notes: notesDraft || null,
        tags: tagsDraft.split(',').map((tag) => tag.trim()).filter(Boolean),
        nextFollowUpAt: followUpDraft || null,
      });
      setInquiries((prev) => prev.map((item) => (item.id === inquiry.id ? updated : item)));
      setEditingInquiryId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('inquirySaveFailed'));
    }
  };

  const claimInquiry = async (inquiry: Inquiry) => {
    const user = auth.currentUser;
    if (!user) {
      setError(t('sessionExpired'));
      return;
    }
    try {
      const updated = await updateInquiry(inquiry.id, {
        assignedTo: user.uid,
        assignedToName: user.displayName || user.email || user.uid,
      });
      setInquiries((prev) => prev.map((item) => (item.id === inquiry.id ? updated : item)));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('claimFailed'));
    }
  };

  // reviewHistory is ordered purely by date and may include PENDING rows already shown above in
  // the always-full moderation queue — drop them here to avoid duplicates.
  const resolvedReviews = reviewHistory.filter(r => r.status !== 'PENDING');

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B192C] flex items-center gap-2">
          <MessageSquareText className="w-6 h-6 text-blue-600" />
          <span>{t('title')}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {t('intro')}
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
          {t('tabReviews')} {pendingReviews.length > 0 && <span className="ms-1 text-amber-400">({pendingReviews.length})</span>}
        </button>
        <button
          onClick={() => setTab('inquiries')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${tab === 'inquiries' ? 'bg-[#0B192C] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          {t('tabInquiries')} {newInquiriesCount > 0 && <span className="ms-1 text-amber-400">({newInquiriesCount})</span>}
        </button>
      </div>

      {tab === 'reviews' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">{t('loading')}</div>
          ) : pendingReviews.length === 0 && resolvedReviews.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">{t('noReviews')}</div>
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
                    {rev.status === 'APPROVED' ? t('statusApproved') : rev.status === 'REJECTED' ? t('statusRejected') : t('statusPending')}
                  </span>
                  {rev.reply && (
                    <div className="ms-4 ps-3 border-s-2 border-emerald-200 mt-1">
                      <span className="text-[10px] font-bold text-emerald-700">{t('ownerReply')}</span>
                      <p className="text-xs text-slate-600">{rev.reply.text}</p>
                    </div>
                  )}
                </div>

                {rev.status === 'PENDING' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleReviewDecision(rev, 'APPROVED')}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg"
                      title={t('approve')}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReviewDecision(rev, 'REJECTED')}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg"
                      title={t('reject')}
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

      {tab === 'reviews' && hasMoreReviews && (
        <div className="text-center">
          <button
            onClick={loadMoreReviews}
            disabled={loadingMore}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            {loadingMore ? t('loading') : t('loadMore')}
          </button>
        </div>
      )}

      {tab === 'inquiries' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">{t('loading')}</div>
          ) : inquiries.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <Inbox className="w-6 h-6 text-slate-300" />
              {t('noInquiries')}
            </div>
          ) : (
            inquiries.map(inq => (
              <div key={inq.id} className="p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{inq.fullName}</span>
                    <span className="text-[10px] text-slate-400">→ {inq.institutionName || institutionName(inq.institutionId)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1" dir="ltr"><Phone className="w-3 h-3" />{inq.phone}</span>
                    {inq.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{inq.email}</span>}
                  </div>
                  {inq.message && <p className="text-xs text-slate-600">{inq.message}</p>}
                  <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
                    {inq.assignedToName && <span className="px-2 py-0.5 rounded-full bg-slate-100">{t('owner', { name: inq.assignedToName })}</span>}
                    {inq.firstResponseMinutes !== undefined && <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">{t('firstResponse', { n: inq.firstResponseMinutes })}</span>}
                    {inq.nextFollowUpAt && <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{t('followUp', { date: inq.nextFollowUpAt.slice(0, 10) })}</span>}
                  </div>
                </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={inq.status}
                      onChange={(e) => handleInquiryStatus(inq, e.target.value as Inquiry['status'])}
                      className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border ${
                        inq.status === 'NEW' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        inq.status === 'CONTACTED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        inq.status === 'QUALIFIED' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                        inq.status === 'APPLICATION_STARTED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      <option value="NEW">{t('inqNew')}</option>
                      <option value="CONTACTED">{t('inqContacted')}</option>
                      <option value="QUALIFIED">{t('inqQualified')}</option>
                      <option value="APPLICATION_STARTED">{t('inqStarted')}</option>
                      <option value="CLOSED">{t('inqClosed')}</option>
                    </select>
                    <button onClick={() => claimInquiry(inq)} className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-[11px] font-bold">
                      {t('claim')}
                    </button>
                    <button onClick={() => editingInquiryId === inq.id ? setEditingInquiryId(null) : beginInquiryEdit(inq)} className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-[11px] font-bold">
                      {editingInquiryId === inq.id ? t('close') : t('details')}
                    </button>
                  </div>
                </div>
                {editingInquiryId === inq.id && (
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_180px_auto] gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <textarea value={notesDraft} onChange={(e) => setNotesDraft(e.target.value)} placeholder={t('notesPlaceholder')} rows={2} className="px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg" />
                    <input value={tagsDraft} onChange={(e) => setTagsDraft(e.target.value)} placeholder={t('tagsPlaceholder')} className="px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg" />
                    <input type="date" value={followUpDraft} onChange={(e) => setFollowUpDraft(e.target.value)} className="px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono" />
                    <button onClick={() => saveInquiryDetails(inq)} className="px-3 py-2 rounded-lg bg-[#0B192C] text-white text-[11px] font-bold">{t('save')}</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'inquiries' && hasMoreInquiries && (
        <div className="text-center">
          <button
            onClick={loadMoreInquiries}
            disabled={loadingMore}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            {loadingMore ? t('loading') : t('loadMore')}
          </button>
        </div>
      )}
    </div>
  );
}
