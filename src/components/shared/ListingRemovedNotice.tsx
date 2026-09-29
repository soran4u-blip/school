'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '@/core/context/LanguageContext';

// Shown on an owner's dashboard when their listing has been deleted by an admin (status DELETED)
// or no longer exists at all. Both used to fall through to "Failed to load — try refreshing",
// which sent owners round in circles refreshing a page that could never load; this tells them
// what actually happened and who can fix it. See core/types/softDelete.ts.

const COPY = {
  institution: { ar: 'ملف مؤسستك', en: 'Your institution profile' },
  tutor: { ar: 'ملفك كأستاذ', en: 'Your tutor profile' },
  employer: { ar: 'حساب شركتك/منظمتك', en: 'Your company/organization profile' },
};

export default function ListingRemovedNotice({ kind }: { kind: keyof typeof COPY }) {
  const { t } = useLanguage();
  const subject = COPY[kind];

  return (
    <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="space-y-1">
        <p className="text-sm font-bold">
          {t(`${subject.ar} أُزيل من المنصة.`, `${subject.en} has been removed from the platform.`)}
        </p>
        <p className="text-xs">
          {t(
            'إذا كنت تعتقد أن ذلك حدث عن طريق الخطأ، تواصل مع الإدارة — يمكن استعادة الملف خلال فترة محدودة.',
            'If you think this was a mistake, contact the administrator — a removed profile can be restored for a limited time.'
          )}
        </p>
      </div>
    </div>
  );
}
