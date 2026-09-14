// Client-side wrappers for the tutor verification workflow's API routes.
//
// The private tutors/{id}/private/verification doc's `documents` field is still a direct
// client-SDK write (see tutorService.saveTutorVerificationDocuments) since that's just the
// tutor managing their own upload list. But moving from "editing" to "please review me" — and
// the admin's approve/reject decision — go through the server so they're attributable
// (recordAuditEvent) and so firestore.rules doesn't have to arbitrate a status state machine.

async function send(url: string, body?: unknown): Promise<void> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'The action could not be completed');
  }
}

export async function submitTutorVerification(documents: string[]): Promise<void> {
  await send('/api/tutor/verification/submit', { documents });
}

export async function approveTutorVerification(tutorId: string): Promise<void> {
  await send(`/api/admin/tutors/${tutorId}/verification/approve`);
}

export async function rejectTutorVerification(tutorId: string, rejectionReason?: string): Promise<void> {
  await send(`/api/admin/tutors/${tutorId}/verification/reject`, { rejectionReason });
}
