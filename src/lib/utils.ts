import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LocalizedString } from '@/core/types/masterData';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const UNDER_REVIEW_LABEL: LocalizedString = { ar: 'قيد المراجعة', en: 'Under Review' };
const VERIFIED_LABEL: LocalizedString = { ar: 'موثّق', en: 'Verified' };
const KNOWN_DEFAULT_LABELS = [UNDER_REVIEW_LABEL, VERIFIED_LABEL, { ar: '', en: '' }];

// Keeps the verification badge text in sync with isVerified for the common case (no custom
// label set). If an admin has set a custom label (e.g. "Ministry Certified"), it's left alone.
export function deriveVerificationBadge(isVerified: boolean, current: LocalizedString): LocalizedString {
  const isDefault = KNOWN_DEFAULT_LABELS.some((l) => l.ar === current?.ar && l.en === current?.en);
  if (!isDefault) return current;
  return isVerified ? VERIFIED_LABEL : UNDER_REVIEW_LABEL;
}

export function formatCurrencyIQD(amount: number): string {
  return new Intl.NumberFormat('ar-IQ', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}
