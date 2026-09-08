import { describe, it, expect } from 'vitest';
import { computeCapacityUpdate } from './admissionLogic';

describe('computeCapacityUpdate', () => {
  it('returns null when the decision does not cross the accepted boundary', () => {
    expect(computeCapacityUpdate({ capacity: 10, acceptedCount: 3 }, false, false)).toBeNull();
  });

  it('increments acceptedCount when a decision newly accepts the applicant', () => {
    expect(computeCapacityUpdate({ capacity: 10, acceptedCount: 3 }, false, true)).toBe(4);
  });

  it('decrements acceptedCount when reversing a prior acceptance', () => {
    expect(computeCapacityUpdate({ capacity: 10, acceptedCount: 3 }, true, false)).toBe(2);
  });

  it('never decrements below zero', () => {
    expect(computeCapacityUpdate({ capacity: 10, acceptedCount: 0 }, true, false)).toBe(0);
  });

  it('throws when accepting would exceed capacity', () => {
    expect(() => computeCapacityUpdate({ capacity: 5, acceptedCount: 5 }, false, true)).toThrow(
      'This program has no remaining seats'
    );
  });

  it('allows accepting when there is no capacity limit', () => {
    expect(computeCapacityUpdate({ capacity: undefined, acceptedCount: 100 }, false, true)).toBe(101);
  });

  it('allows accepting when exactly at the last remaining seat', () => {
    expect(computeCapacityUpdate({ capacity: 5, acceptedCount: 4 }, false, true)).toBe(5);
  });
});
