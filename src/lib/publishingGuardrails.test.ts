import { describe, expect, it } from 'vitest';
import { Institution } from '@/core/types/institution';
import { assessInstitutionPublication } from './publishingGuardrails';

function institution(overrides: Partial<Institution> = {}): Institution {
  return {
    id: 'school-1',
    slug: 'school-1',
    name: { ar: 'مدرسة', en: 'School' },
    categoryId: 'schools',
    governorateId: 'baghdad',
    logoUrl: 'https://cdn.example.org/logo.png',
    coverImageUrl: 'https://cdn.example.org/cover.png',
    tagline: { ar: 'تعليم', en: 'Education' },
    description: { ar: 'وصف', en: 'Description' },
    address: { ar: 'بغداد', en: 'Baghdad' },
    contact: { phonePrimary: '07700000000', whatsappNumber: '9647700000000', email: 'school@example.org' },
    genderPolicy: 'CO_ED',
    languagesOfInstruction: ['AR'],
    tuition: { min: 0, max: 0, currency: 'IQD', period: 'YEAR' },
    taxonomyIds: [],
    isVerified: false,
    verificationBadgeLabel: { ar: '', en: '' },
    status: 'DRAFT',
    isFeatured: false,
    metrics: { ratingAvg: 0, reviewCount: 0 },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('assessInstitutionPublication', () => {
  it('rejects placeholder media and incomplete contact details', () => {
    const result = assessInstitutionPublication(institution({ logoUrl: 'https://placehold.co/200', contact: { phonePrimary: '', whatsappNumber: '', email: '' } }));
    expect(result.publishable).toBe(false);
    expect(result.missingFields).toEqual(expect.arrayContaining(['Logo', 'Primary phone', 'WhatsApp number', 'Contact email']));
  });

  it('requires fresh evidence before a verified profile can publish', () => {
    const result = assessInstitutionPublication(institution({
      isVerified: true,
      accreditation: {
        authority: { ar: 'وزارة', en: 'Ministry' },
        details: { ar: 'معتمد', en: 'Accredited' },
        sourceUrl: 'https://ministry.example.org/school-1',
        verifiedAt: '2024-01-01',
      },
    }), new Date('2026-01-01T12:00:00.000Z'));
    expect(result.publishable).toBe(false);
    expect(result.missingFields).toContain('Fresh verification evidence');
  });

  it('allows a complete unverified profile to publish without making unsupported claims', () => {
    const result = assessInstitutionPublication(institution(), new Date('2026-01-01T12:00:00.000Z'));
    expect(result.publishable).toBe(true);
    expect(result.score).toBe(100);
    expect(result.warnings).toHaveLength(1);
  });
});
