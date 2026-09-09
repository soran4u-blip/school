'use client';

import React from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { CheckCircle2, PauseCircle, PlayCircle, Clock } from 'lucide-react';

export type ListingStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED';

// Admin-side status control for institution and tutor listings.
//
// The three states are deliberately distinct: PENDING means an admin hasn't approved the listing
// yet and only an admin can clear it, while SUSPENDED is the owner's own pause switch. They used
// to be the same state, which is what allowed an unreviewed tutor or institution to publish
// itself by "resuming" a profile that had never been approved in the first place.
//
// Rendered as an explicit label plus a named action rather than a click-to-cycle pill, because
// approving an unreviewed listing into the public directory shouldn't share an affordance with
// pausing one.

const NEXT_ACTION: Record<ListingStatus, { next: ListingStatus; ar: string; en: string }> = {
  PENDING: { next: 'ACTIVE', ar: 'اعتماد', en: 'Approve' },
  ACTIVE: { next: 'SUSPENDED', ar: 'إيقاف', en: 'Suspend' },
  SUSPENDED: { next: 'ACTIVE', ar: 'تفعيل', en: 'Activate' },
};

const LABEL: Record<ListingStatus, { ar: string; en: string; className: string; Icon: typeof Clock }> = {
  PENDING: {
    ar: 'قيد المراجعة',
    en: 'Pending review',
    className: 'bg-amber-50 text-amber-800 border-amber-300',
    Icon: Clock,
  },
  ACTIVE: {
    ar: 'نشط',
    en: 'Active',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    Icon: CheckCircle2,
  },
  SUSPENDED: {
    ar: 'متوقف',
    en: 'Suspended',
    className: 'bg-slate-100 text-slate-600 border-slate-300',
    Icon: PauseCircle,
  },
};

export default function ListingStatusControl({
  status,
  onChange,
  disabled = false,
}: {
  status: ListingStatus;
  onChange: (next: ListingStatus) => void;
  disabled?: boolean;
}) {
  const { t } = useLanguage();
  const label = LABEL[status] ?? LABEL.PENDING;
  const action = NEXT_ACTION[status] ?? NEXT_ACTION.PENDING;
  const ActionIcon = action.next === 'ACTIVE' ? PlayCircle : PauseCircle;

  return (
    <div className="inline-flex items-center gap-1.5">
      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${label.className}`}>
        <label.Icon className="w-3 h-3" />
        <span>{t(label.ar, label.en)}</span>
      </span>
      <button
        type="button"
        onClick={() => onChange(action.next)}
        disabled={disabled}
        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
      >
        <ActionIcon className="w-3 h-3" />
        <span>{t(action.ar, action.en)}</span>
      </button>
    </div>
  );
}
