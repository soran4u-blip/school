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
