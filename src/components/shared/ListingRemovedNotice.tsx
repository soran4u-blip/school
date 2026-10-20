'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useT } from '@/lib/useT';
import { LISTING_REMOVED_COPY } from './SharedPanels.i18n';

// Shown on an owner's dashboard when their listing has been deleted by an admin (status DELETED)
// or no longer exists at all. Both used to fall through to "Failed to load — try refreshing",
// which sent owners round in circles refreshing a page that could never load; this tells them
// what actually happened and who can fix it. See core/types/softDelete.ts.

const SUBJECT_KEY = {
  institution: 'subjectInstitution',
  tutor: 'subjectTutor',
  employer: 'subjectEmployer',
} as const;

export default function ListingRemovedNotice({ kind }: { kind: keyof typeof SUBJECT_KEY }) {
  const t = useT(LISTING_REMOVED_COPY);
  const subject = t(SUBJECT_KEY[kind]);

  return (
    <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="space-y-1">
        <p className="text-sm font-bold">
          {t('removed', { subject })}
        </p>
        <p className="text-xs">
          {t('mistake')}
        </p>
      </div>
    </div>
  );
}
