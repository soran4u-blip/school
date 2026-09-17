import { Institution } from '@/core/types/institution';
import { LocalizedString } from '@/core/types/masterData';

const FRESHNESS_DAYS = 365;

export interface PublicationAssessment {
  publishable: boolean;
  score: number;
  missingFields: string[];
  warnings: string[];
}

function hasLocalized(value: { ar?: string; en?: string } | undefined): boolean {
  return Boolean(value?.ar?.trim() && value?.en?.trim());
}

function isPlaceholderUrl(value: string | undefined): boolean {
  return !value || /placehold\.co|via\.placeholder\.com|example\.com/i.test(value);
}

function isFresh(date: string | undefined, now: Date): boolean {
  if (!date) return false;
  const verifiedAt = new Date(date);
  if (Number.isNaN(verifiedAt.getTime())) return false;
  return now.getTime() - verifiedAt.getTime() <= FRESHNESS_DAYS * 86_400_000;
}

export function isInstitutionEvidenceFresh(institution: Institution, now = new Date()): boolean {
  const accreditation = institution.accreditation;
  if (!institution.isVerified || !accreditation?.sourceUrl || !isFresh(accreditation.verifiedAt, now)) return false;
  if (accreditation.expiresAt) {
    const expiresAt = new Date(`${accreditation.expiresAt.slice(0, 10)}T23:59:59`);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < now.getTime()) return false;
  }
  return true;
}

export function assessInstitutionPublication(institution: Institution, now = new Date()): PublicationAssessment {
  const checks: Array<[boolean, string]> = [
    [!isPlaceholderUrl(institution.logoUrl), 'Logo'],
    [!isPlaceholderUrl(institution.coverImageUrl), 'Cover image'],
    [hasLocalized(institution.tagline), 'Bilingual tagline'],
    [hasLocalized(institution.description), 'Bilingual description'],
    [hasLocalized(institution.address), 'Bilingual address'],
    [Boolean(institution.contact?.phonePrimary?.trim()), 'Primary phone'],
    [Boolean(institution.contact?.whatsappNumber?.trim()), 'WhatsApp number'],
    [Boolean(institution.contact?.email?.trim()), 'Contact email'],
  ];
  const missingFields = checks.filter(([valid]) => !valid).map(([, label]) => label);
  const warnings: string[] = [];

  if (institution.isVerified) {
    if (!hasLocalized(institution.accreditation?.authority)) missingFields.push('Accrediting authority');
    if (!hasLocalized(institution.accreditation?.details)) missingFields.push('Accreditation details');
    if (!institution.accreditation?.sourceUrl) missingFields.push('Evidence source URL');
    if (!isInstitutionEvidenceFresh(institution, now)) missingFields.push('Fresh verification evidence');
  } else {
    warnings.push('This profile is not verified and will not show verified claims.');
  }

  const totalChecks = checks.length + (institution.isVerified ? 4 : 0);
  const score = Math.round(((totalChecks - missingFields.length) / totalChecks) * 100);
  return { publishable: missingFields.length === 0, score, missingFields, warnings };
}

export function canPublishInstitution(institution: Institution, now = new Date()): PublicationAssessment {
  return assessInstitutionPublication(institution, now);
}

// Bilingual labels for assessInstitutionPublication's (English-only) missingFields, so the owner
// dashboard's completeness banner can show the same real gate the server enforces on submit
// (src/app/api/admin/listings/[type]/[id]/route.ts, src/app/api/admin/institutions/route.ts)
// instead of the narrower, out-of-sync getInstitutionCompleteness() in src/lib/utils.ts.
const MISSING_FIELD_LABELS: Record<string, LocalizedString> = {
  'Logo': { ar: 'شعار المؤسسة', en: 'Logo' },
  'Cover image': { ar: 'صورة الغلاف', en: 'Cover image' },
  'Bilingual tagline': { ar: 'الوصف المختصر (باللغتين)', en: 'Bilingual tagline' },
  'Bilingual description': { ar: 'الوصف التفصيلي (باللغتين)', en: 'Bilingual description' },
  'Bilingual address': { ar: 'العنوان (باللغتين)', en: 'Bilingual address' },
  'Primary phone': { ar: 'رقم الهاتف الأساسي', en: 'Primary phone' },
  'WhatsApp number': { ar: 'رقم واتساب', en: 'WhatsApp number' },
  'Contact email': { ar: 'البريد الإلكتروني للتواصل', en: 'Contact email' },
  'Accrediting authority': { ar: 'جهة الاعتماد (باللغتين)', en: 'Accrediting authority' },
  'Accreditation details': { ar: 'تفاصيل الاعتماد (باللغتين)', en: 'Accreditation details' },
  'Evidence source URL': { ar: 'رابط مصدر إثبات الاعتماد', en: 'Evidence source URL' },
  'Fresh verification evidence': { ar: 'إثبات اعتماد حديث (خلال آخر سنة)', en: 'Fresh verification evidence' },
};

export interface InstitutionCompleteness {
  complete: boolean;
  missingFields: LocalizedString[];
  score: number;
}

// Same shape as src/lib/utils.ts' getInstitutionCompleteness(), but backed by the real publishing
// gate so the dashboard's "complete, waiting for review" banner never promises something the
// server-side check then rejects.
export function getInstitutionCompletenessFromGuardrails(institution: Institution, now = new Date()): InstitutionCompleteness {
  const assessment = assessInstitutionPublication(institution, now);
  return {
    complete: assessment.publishable,
    missingFields: assessment.missingFields.map((label) => MISSING_FIELD_LABELS[label] || { ar: label, en: label }),
    score: assessment.score,
  };
}
