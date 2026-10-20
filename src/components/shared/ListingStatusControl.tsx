'use client';

import React from 'react';
import { useT } from '@/lib/useT';
import { LISTING_STATUS_COPY } from './SharedPanels.i18n';
import { CheckCircle2, PauseCircle, PlayCircle, Clock } from 'lucide-react';

export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'PENDING' | 'SUSPENDED';

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

const NEXT_ACTION: Record<ListingStatus, { next: ListingStatus; key: keyof typeof LISTING_STATUS_COPY }> = {
  DRAFT: { next: 'PENDING', key: 'submitForReview' },
  PENDING: { next: 'ACTIVE', key: 'approve' },
  ACTIVE: { next: 'SUSPENDED', key: 'suspend' },
  SUSPENDED: { next: 'ACTIVE', key: 'activate' },
};

const LABEL: Record<ListingStatus, { key: keyof typeof LISTING_STATUS_COPY; className: string; Icon: typeof Clock }> = {
  DRAFT: {
    key: 'draft',
    className: 'bg-slate-50 text-slate-600 border-slate-300',
    Icon: Clock,
  },
  PENDING: {
    key: 'pending',
    className: 'bg-amber-50 text-amber-800 border-amber-300',
    Icon: Clock,
  },
  ACTIVE: {
    key: 'active',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    Icon: CheckCircle2,
  },
  SUSPENDED: {
    key: 'suspended',
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
  const t = useT(LISTING_STATUS_COPY);
  const label = LABEL[status] ?? LABEL.PENDING;
  const action = NEXT_ACTION[status] ?? NEXT_ACTION.PENDING;
  const ActionIcon = action.next === 'ACTIVE' ? PlayCircle : PauseCircle;

  return (
    <div className="inline-flex items-center gap-1.5">
      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${label.className}`}>
        <label.Icon className="w-3 h-3" />
        <span>{t(label.key)}</span>
      </span>
      <button
        type="button"
        onClick={() => onChange(action.next)}
        disabled={disabled}
        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
      >
        <ActionIcon className="w-3 h-3" />
        <span>{t(action.key)}</span>
      </button>
    </div>
  );
}
