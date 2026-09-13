import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LocalizedString } from '@/core/types/masterData';
import { Institution } from '@/core/types/institution';
import { Tutor } from '@/core/types/tutor';

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

// Money follows the reader's language, like every other formatted value on the page. These used
// to hardcode a locale each — IQD always ar-IQ — so an English visitor was shown Arabic-Indic
// digits (١٬٨٠٠٬٠٠٠ د.ع.) instead of "IQD 1,800,000". `language` is required rather than
// defaulted so a new call site can't quietly reintroduce that.
function currencyFormatter(language: string, currency: 'IQD' | 'USD'): Intl.NumberFormat {
  return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'ar-IQ', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });
}

export function formatCurrencyIQD(amount: number, language: string): string {
  return currencyFormatter(language, 'IQD').format(amount);
}

export function formatCurrencyUSD(amount: number, language: string): string {
  return currencyFormatter(language, 'USD').format(amount);
}

/**
 * Today as 'YYYY-MM-DD' in the viewer's own timezone. `new Date().toISOString().slice(0, 10)` is
 * UTC, which in Iraq (UTC+3) still reads as yesterday until 3am — long enough to keep a passed
 * application deadline looking open.
 */
export function todayLocalDate(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

/**
 * A plain 'YYYY-MM-DD' (or ISO timestamp) rendered in the reader's language.
 *
 * Anchored at noon so the calendar day can't shift under a timezone offset the way midnight can —
 * that anchoring and the locale choice are the parts that kept getting re-implemented (and
 * getting the timezone wrong), so they live here once. Callers pass their own field set.
 */
export function formatDate(date: string, language: string, options?: Intl.DateTimeFormatOptions): string {
  const dayOnly = date.slice(0, 10);
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-IQ' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(new Date(`${dayOnly}T12:00:00`));
}

// Institutions price in either dinars or dollars (Institution.tuition.currency,
// InstitutionProgram.tuitionAnnual.currency). The public profile used to hardcode a '$' regardless,
// so an institution that priced in IQD had its fees published as dollars.
export function formatCurrency(amount: number, currency: 'IQD' | 'USD', language: string): string {
  return currencyFormatter(language, currency).format(amount);
}

export interface ProfileCompleteness {
  complete: boolean;
  missingFields: LocalizedString[];
}

// Minimum bar for a profile to go public: enough that a visitor lands on something real, not an
// empty shell. Checked before letting an owner self-publish (PENDING -> ACTIVE).
export function getInstitutionCompleteness(inst: Institution): ProfileCompleteness {
  const checks: [boolean, LocalizedString][] = [
    [!!inst.logoUrl, { ar: 'شعار المؤسسة', en: 'Logo' }],
    [!!inst.coverImageUrl, { ar: 'صورة الغلاف', en: 'Cover image' }],
    [!!inst.tagline.ar && !!inst.tagline.en, { ar: 'الوصف المختصر', en: 'Tagline' }],
    [!!inst.description.ar && !!inst.description.en, { ar: 'الوصف التفصيلي', en: 'Description' }],
    [!!inst.address.ar && !!inst.address.en, { ar: 'العنوان', en: 'Address' }],
    [!!inst.contact.phonePrimary, { ar: 'رقم الهاتف', en: 'Phone number' }],
  ];
  const missingFields = checks.filter(([ok]) => !ok).map(([, label]) => label);
  return { complete: missingFields.length === 0, missingFields };
}

export function getTutorCompleteness(tutor: Tutor): ProfileCompleteness {
  const checks: [boolean, LocalizedString][] = [
    [!!tutor.photoUrl, { ar: 'الصورة الشخصية', en: 'Photo' }],
    [!!tutor.bio.ar && !!tutor.bio.en, { ar: 'نبذة تعريفية', en: 'Bio' }],
    [tutor.hourlyRate.iqd > 0 || tutor.hourlyRate.usd > 0, { ar: 'سعر الساعة', en: 'Hourly rate' }],
    [tutor.subjectIds.length > 0, { ar: 'المواد التي تدرّسها', en: 'Subjects taught' }],
    [tutor.studentLevelIds.length > 0, { ar: 'الصفوف التي تدرّسها', en: 'Grade levels taught' }],
  ];
  const missingFields = checks.filter(([ok]) => !ok).map(([, label]) => label);
  return { complete: missingFields.length === 0, missingFields };
}
