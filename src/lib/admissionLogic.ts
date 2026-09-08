import { InstitutionProgram } from '@/core/types/institution';

// Computes the program's new acceptedCount for an admission-decision transaction, or null if the
// decision doesn't cross the accepted/not-accepted boundary (e.g. UNDER_REVIEW -> WAITLISTED).
// Throws if the program has no remaining seats. Pure so it can be unit-tested without a
// Firestore transaction.
export function computeCapacityUpdate(
  program: Pick<InstitutionProgram, 'capacity' | 'acceptedCount'>,
  wasAccepted: boolean,
  becomingAccepted: boolean
): number | null {
  if (wasAccepted === becomingAccepted) return null;

  if (becomingAccepted && program.capacity != null && (program.acceptedCount || 0) >= program.capacity) {
    throw new Error('This program has no remaining seats');
  }

  return Math.max(0, (program.acceptedCount || 0) + (becomingAccepted ? 1 : -1));
}
