import { describe, expect, it } from 'vitest';
import { isNotDeleted, isPurgeDue, purgeDate, restoredStatus, softDeletePatch } from './listingLifecycle';

const NOW = new Date('2026-09-29T12:00:00.000Z');
const ALLOWED = ['DRAFT', 'ACTIVE', 'PENDING', 'SUSPENDED'];

describe('softDeletePatch', () => {
  it('marks the listing DELETED and remembers what it was', () => {
    expect(softDeletePatch({ status: 'ACTIVE' }, 'admin-1', NOW)).toEqual({
      status: 'DELETED',
      statusBeforeDelete: 'ACTIVE',
      deletedAt: NOW.toISOString(),
      deletedBy: 'admin-1',
      updatedAt: NOW.toISOString(),
    });
  });

  it('falls back to PENDING when the listing had no status', () => {
    expect(softDeletePatch({}, 'admin-1', NOW).statusBeforeDelete).toBe('PENDING');
  });
});

describe('restoredStatus', () => {
  it('returns the listing to its previous status', () => {
    expect(restoredStatus({ statusBeforeDelete: 'ACTIVE' }, ALLOWED)).toBe('ACTIVE');
    expect(restoredStatus({ statusBeforeDelete: 'SUSPENDED' }, ALLOWED)).toBe('SUSPENDED');
  });

  it('comes back as PENDING when the previous status is unknown or not valid for the type', () => {
    expect(restoredStatus({}, ALLOWED)).toBe('PENDING');
    expect(restoredStatus({ statusBeforeDelete: 'DELETED' }, ALLOWED)).toBe('PENDING');
    // Employers/tutors have no DRAFT.
    expect(restoredStatus({ statusBeforeDelete: 'DRAFT' }, ['ACTIVE', 'PENDING', 'SUSPENDED'])).toBe('PENDING');
  });
});

describe('isPurgeDue', () => {
  it('is due once the retention window has passed', () => {
    const deletedAt = '2026-08-29T12:00:00.000Z'; // exactly 31 days before NOW
    expect(isPurgeDue({ status: 'DELETED', deletedAt }, NOW)).toBe(true);
  });

  it('is not due inside the retention window', () => {
    const deletedAt = '2026-09-20T12:00:00.000Z';
    expect(isPurgeDue({ status: 'DELETED', deletedAt }, NOW)).toBe(false);
  });

  it('never purges a listing that is not DELETED, even with an old deletedAt', () => {
    expect(isPurgeDue({ status: 'ACTIVE', deletedAt: '2020-01-01T00:00:00.000Z' }, NOW)).toBe(false);
  });

  it('never purges a DELETED listing it cannot date', () => {
    expect(isPurgeDue({ status: 'DELETED' }, NOW)).toBe(false);
    expect(isPurgeDue({ status: 'DELETED', deletedAt: 'not-a-date' }, NOW)).toBe(false);
  });

  it('honours a custom retention window', () => {
    expect(isPurgeDue({ status: 'DELETED', deletedAt: '2026-09-27T12:00:00.000Z' }, NOW, 1)).toBe(true);
  });
});

describe('purgeDate', () => {
  it('is deletedAt plus the retention window', () => {
    expect(purgeDate('2026-09-01T00:00:00.000Z', 30).toISOString()).toBe('2026-10-01T00:00:00.000Z');
  });
});

describe('isNotDeleted', () => {
  it('drops DELETED rows from a list', () => {
    const rows = [{ id: 'a', status: 'ACTIVE' }, { id: 'b', status: 'DELETED' }, { id: 'c', status: 'PENDING' }];
    expect(rows.filter(isNotDeleted).map((r) => r.id)).toEqual(['a', 'c']);
  });
});
