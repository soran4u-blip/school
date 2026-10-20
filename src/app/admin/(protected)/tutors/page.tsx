'use client';

import React, { useState } from 'react';
import Thumbnail from '@/components/shared/Thumbnail';
import { useLoadOnMount } from '@/lib/useLoadOnMount';
import { useLanguage } from '@/core/context/LanguageContext';
import { useT } from '@/lib/useT';
import { pickLocalized } from '@/lib/localized';
import { TUTORS_COPY } from './Tutors.i18n';
import { getTutors, getTutorVerificationRequest } from '@/core/services/tutorService';
import { updateListing, deleteListing } from '@/core/services/adminListingService';
import { approveTutorVerification, rejectTutorVerification } from '@/core/services/tutorVerificationService';
import { getGovernorates } from '@/core/services/masterDataService';
import { Tutor, TutorVerificationRequest } from '@/core/types/tutor';
import { Governorate } from '@/core/types/masterData';
import { UserCheck, ShieldCheck, ShieldQuestion, Star, MessageSquare, Plus, Edit, Trash2, FileText, Check, X } from 'lucide-react';
import Link from 'next/link';
import { formatCurrencyIQD } from '@/lib/utils';
import ListingStatusControl, { ListingStatus } from '@/components/shared/ListingStatusControl';
import DeletedListingsPanel from '@/components/shared/DeletedListingsPanel';
import { DELETED_LISTING_RETENTION_DAYS, isDeleted, isNotDeleted } from '@/lib/listingLifecycle';

// One row of the verification queue below: the tutor plus their submitted documents, fetched
// lazily since the documents live in a private subcollection the main tutor list doesn't read.
function VerificationRequestRow({ tutor, onDecided }: { tutor: Tutor; onDecided: () => void }) {
  const { language } = useLanguage();
  const t = useT(TUTORS_COPY);
  const [request, setRequest] = useState<TutorVerificationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useLoadOnMount(async () => {
    setRequest(await getTutorVerificationRequest(tutor.id));
  });

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await action();
      onDecided();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('actionFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 border border-amber-200 bg-amber-50/50 rounded-xl space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Thumbnail src={tutor.photoUrl} alt={tutor.fullName.en} width={36} height={36} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
          <div>
            <div className="font-bold text-slate-900 text-xs">{pickLocalized(tutor.fullName, language)}</div>
            <div className="text-[11px] text-slate-500">{pickLocalized(tutor.title, language)}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => run(() => approveTutorVerification(tutor.id))}
            disabled={busy}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{t('approve')}</span>
          </button>
          <button
            onClick={() => run(() => rejectTutorVerification(tutor.id, rejectionReason || undefined))}
            disabled={busy}
            className="flex items-center gap-1 px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-[11px] font-bold disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" />
            <span>{t('reject')}</span>
          </button>
        </div>
      </div>

      {request && request.documents.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {request.documents.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 hover:text-blue-700"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{t('viewDocument')}</span>
            </a>
          ))}
        </div>
      )}

      <input
        type="text"
        value={rejectionReason}
        onChange={(e) => setRejectionReason(e.target.value)}
        placeholder={t('rejectionReason')}
        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
      />
      {error && <p className="text-[11px] font-bold text-rose-700">{error}</p>}
    </div>
  );
}

export default function AdminTutorsPage() {
  const { language } = useLanguage();
  const t = useT(TUTORS_COPY);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [error, setError] = useState('');

  const loadData = async () => {
    const [tutList, govs] = await Promise.all([
      getTutors({ status: 'ALL' }),
      getGovernorates(false),
    ]);
    setTutors(tutList);
    setGovernorates(govs);
  };

  useLoadOnMount(loadData);

  const liveTutors = tutors.filter(isNotDeleted);
  const deletedTutors = tutors.filter(isDeleted).map((tutor) => ({
    id: tutor.id,
    name: pickLocalized(tutor.fullName, language),
    deletedAt: tutor.deletedAt,
  }));
  const pendingVerification = liveTutors.filter((tutor) => tutor.verificationRequestStatus === 'PENDING');

  // These go through /api/admin/listings so they land in the audit trail.
  const run = async (action: () => Promise<void>) => {
    setError('');
    try {
      await action();
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('actionFailed'));
    }
  };

  const handleDelete = async (tutor: Tutor) => {
    const name = pickLocalized(tutor.fullName, language);
    if (!confirm(t('confirmDelete', { name, days: DELETED_LISTING_RETENTION_DAYS }))) {
      return;
    }
    await run(() => deleteListing('tutors', tutor.id));
  };

  // PENDING -> ACTIVE is the approval an owner can no longer perform for themselves, so it has to
  // be available here; ACTIVE <-> SUSPENDED mirrors the tutor's own pause switch.
  const handleSetStatus = (tutor: Tutor, status: ListingStatus) =>
    run(() => updateListing('tutors', tutor.id, { status }));

  // The badge label is derived server-side from isVerified, same as before.
  const handleToggleVerified = (tutor: Tutor) =>
    run(() => updateListing('tutors', tutor.id, { isVerified: !tutor.isVerified }));

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B192C] flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-emerald-600" />
            <span>{t('listTitle')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('listIntro')}
          </p>
        </div>
        <Link
          href="/admin/tutors/add"
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-xl text-xs font-bold transition-colors shadow-xs self-start"
        >
          <Plus className="w-4 h-4 text-[#F1C40F]" />
          <span>{t('addTutor')}</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">{error}</div>
      )}

      {pendingVerification.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <ShieldQuestion className="w-4 h-4 text-amber-600" />
            <span>{t('pendingRequests')}</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">{pendingVerification.length}</span>
          </h2>
          <div className="space-y-2">
            {pendingVerification.map((tutor) => (
              <VerificationRequestRow key={tutor.id} tutor={tutor} onDecided={loadData} />
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full min-w-[850px] text-xs text-start">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="p-3 text-start">{t('colTutor')}</th>
              <th className="p-3 text-start">{t('colSubjectGov')}</th>
              <th className="p-3 text-center">{t('colHourlyRate')}</th>
              <th className="p-3 text-center">{t('colRating')}</th>
              <th className="p-3 text-center">{t('colStatus')}</th>
              <th className="p-3 text-center">{t('colVerification')}</th>
              <th className="p-3 text-end">{t('colActions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {liveTutors.map((tutor) => {
              const gov = governorates.find(g => g.id === tutor.governorateId);

              return (
                <tr key={tutor.id} className="hover:bg-slate-50/50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <Thumbnail
                        src={tutor.photoUrl}
                        alt={tutor.fullName.en}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{pickLocalized(tutor.fullName, language)}</div>
                        <div className="text-[11px] text-slate-500">{pickLocalized(tutor.title, language)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-800">{gov ? pickLocalized(gov.name, language) : tutor.governorateId}</div>
                    <div className="text-[10px] text-slate-500">{tutor.deliveryMode.join(' • ')}</div>
                  </td>
                  <td className="p-3 text-center font-bold text-slate-800">
                    {formatCurrencyIQD(tutor.hourlyRate.iqd, language)}
                  </td>
                  <td className="p-3 text-center">
                    <div className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>{tutor.ratingAvg}</span>
                      <span className="text-slate-400 font-normal">({tutor.reviewCount})</span>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <ListingStatusControl
                      status={tutor.status}
                      onChange={(next) => handleSetStatus(tutor, next)}
                    />
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleToggleVerified(tutor)}
                      title={t('clickToToggle')}
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                        tutor.isVerified
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {tutor.isVerified ? <ShieldCheck className="w-3 h-3" /> : <ShieldQuestion className="w-3 h-3" />}
                      <span>{pickLocalized(tutor.verificationBadgeLabel, language)}</span>
                    </button>
                  </td>
                  <td className="p-3 text-end">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/tutors/add?edit=${tutor.id}`}
                        className="p-1.5 text-slate-500 hover:text-blue-700 inline-block"
                        title={t('edit')}
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <a
                        href={`https://wa.me/${tutor.whatsappNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>{t('whatsapp')}</span>
                      </a>
                      <button
                        onClick={() => handleDelete(tutor)}
                        className="p-1.5 text-slate-500 hover:text-rose-700"
                        title={t('delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <DeletedListingsPanel type="tutors" items={deletedTutors} onChanged={loadData} />
    </div>
  );
}
