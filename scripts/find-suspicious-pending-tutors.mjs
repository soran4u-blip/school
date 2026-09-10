// Read-only report: tutors currently `PENDING` who show signs of prior approval
// (isVerified, reviews, or ratings) — likely victims of the pre-SUSPENDED bug where
// "pause my listing" wrote PENDING instead of a distinct paused state. See the
// 2026-09-09 review notes for context. This script makes no writes; a human should
// look at each hit before flipping anything to SUSPENDED.
//
// Usage:
//   node --env-file=.env.local scripts/find-suspicious-pending-tutors.mjs
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);

const snap = await db.collection('tutors').where('status', '==', 'PENDING').get();

if (snap.empty) {
  console.log('No PENDING tutors at all.');
  process.exit(0);
}

const suspicious = [];
for (const doc of snap.docs) {
  const t = doc.data();
  const reasons = [];
  if (t.isVerified) reasons.push('isVerified=true');
  if ((t.reviewCount ?? 0) > 0) reasons.push(`reviewCount=${t.reviewCount}`);
  if ((t.ratingSum ?? 0) > 0) reasons.push(`ratingSum=${t.ratingSum}`);
  if (reasons.length) {
    suspicious.push({
      id: doc.id,
      name: t.name ?? '(no name)',
      updatedAt: t.updatedAt,
      reasons: reasons.join(', '),
    });
  }
}

console.log(`${snap.size} tutor(s) currently PENDING.`);
console.log(`${suspicious.length} look like they were previously approved (likely paused pre-migration):\n`);
for (const s of suspicious) {
  console.log(`- ${s.id}  "${s.name}"  updatedAt=${s.updatedAt}  [${s.reasons}]`);
}
if (suspicious.length === 0) {
  console.log('(none — all current PENDING tutors look like genuine first-time approvals)');
}
