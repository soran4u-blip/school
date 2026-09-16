import { describe, it, expect } from 'vitest';
import { reviewSchema, bookingSchema, communityPostSchema, inquiryAdminUpdateSchema } from './schemas';

describe('reviewSchema', () => {
  it('accepts exactly one of tutorId/institutionId', () => {
    expect(reviewSchema.safeParse({ tutorId: 't1', rating: 5, comment: 'Great' }).success).toBe(true);
    expect(reviewSchema.safeParse({ institutionId: 'i1', rating: 5, comment: 'Great' }).success).toBe(true);
  });

  it('rejects neither tutorId nor institutionId', () => {
    expect(reviewSchema.safeParse({ rating: 5, comment: 'Great' }).success).toBe(false);
  });

  it('rejects both tutorId and institutionId', () => {
    expect(reviewSchema.safeParse({ tutorId: 't1', institutionId: 'i1', rating: 5, comment: 'Great' }).success).toBe(false);
  });

  it('rejects a rating outside 1-5', () => {
    expect(reviewSchema.safeParse({ tutorId: 't1', rating: 6, comment: 'Great' }).success).toBe(false);
    expect(reviewSchema.safeParse({ tutorId: 't1', rating: 0, comment: 'Great' }).success).toBe(false);
  });

  it('rejects an empty comment', () => {
    expect(reviewSchema.safeParse({ tutorId: 't1', rating: 5, comment: '  ' }).success).toBe(false);
  });
});

describe('bookingSchema', () => {
  it('accepts a well-formed booking request', () => {
    const result = bookingSchema.safeParse({ tutorId: 't1', date: '2026-09-10', startTime: '09:00', endTime: '10:00' });
    expect(result.success).toBe(true);
  });

  it('rejects a malformed date', () => {
    expect(bookingSchema.safeParse({ tutorId: 't1', date: '09-10-2026', startTime: '09:00', endTime: '10:00' }).success).toBe(false);
  });

  it('rejects a missing tutorId', () => {
    expect(bookingSchema.safeParse({ date: '2026-09-10', startTime: '09:00', endTime: '10:00' }).success).toBe(false);
  });
});

describe('communityPostSchema', () => {
  it('trims whitespace-only fields to empty and rejects them', () => {
    const result = communityPostSchema.safeParse({
      governorateId: 'baghdad',
      authorName: '   ',
      title: 'A question',
      body: 'Some text',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an over-length title', () => {
    const result = communityPostSchema.safeParse({
      governorateId: 'baghdad',
      authorName: 'Ali',
      title: 'x'.repeat(151),
      body: 'Some text',
    });
    expect(result.success).toBe(false);
  });
});

describe('inquiryAdminUpdateSchema', () => {
  it('accepts the admissions pipeline fields', () => {
    expect(inquiryAdminUpdateSchema.safeParse({
      status: 'QUALIFIED',
      assignedTo: 'admin-1',
      notes: 'Needs a call tomorrow',
      tags: ['urgent', 'school-tour'],
      nextFollowUpAt: '2026-09-20',
    }).success).toBe(true);
  });

  it('rejects an empty update and overlong notes', () => {
    expect(inquiryAdminUpdateSchema.safeParse({}).success).toBe(false);
    expect(inquiryAdminUpdateSchema.safeParse({ notes: 'x'.repeat(5001) }).success).toBe(false);
  });
});
