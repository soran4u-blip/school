// Bootstrap a superadmin user by email.
// Usage: node --env-file=.env.local scripts/set-admin-claim.mjs someone@example.com
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const email = process.argv[2];
if (!email) {
  console.error('Usage: node --env-file=.env.local scripts/set-admin-claim.mjs <email>');
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
const auth = getAuth(app);

const user = await auth.getUserByEmail(email);
await auth.setCustomUserClaims(user.uid, { role: 'superadmin' });

console.log(`Granted role: superadmin to ${email} (uid: ${user.uid})`);
console.log('The user must sign out and back in for the new claim to take effect.');
