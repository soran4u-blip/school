// Link a Firebase Auth user to a Tutor directory entry and grant them the 'tutor' role,
// so they can sign in at /tutor/login and manage their own availability/pricing/bookings.
// Usage: node --env-file=.env.local scripts/set-tutor-claim.mjs <email> <tutorId>
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const [email, tutorId] = process.argv.slice(2);
if (!email || !tutorId) {
  console.error('Usage: node --env-file=.env.local scripts/set-tutor-claim.mjs <email> <tutorId>');
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
const auth = getAuth(app);
const db = getFirestore(app, process.env.NEXT_PUBLIC_FIREBASE_DATABASE_NAME || 'schooldb');

const tutorDoc = await db.collection('tutors').doc(tutorId).get();
if (!tutorDoc.exists) {
  console.error(`No tutor found with id "${tutorId}". Create the tutor listing first (via the admin panel).`);
  process.exit(1);
}

const user = await auth.getUserByEmail(email);
await auth.setCustomUserClaims(user.uid, { role: 'tutor', tutorId });
await db.collection('tutors').doc(tutorId).set({ userId: user.uid }, { merge: true });

console.log(`Granted role: tutor to ${email} (uid: ${user.uid}), linked to tutor "${tutorId}"`);
console.log('The user must sign out and back in for the new claim to take effect.');
