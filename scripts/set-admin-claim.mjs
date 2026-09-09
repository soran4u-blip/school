// Grant an admin role to a user by email.
//
// Usage:
//   node --env-file=.env.local scripts/set-admin-claim.mjs someone@example.com [role]
//
// role defaults to `superadmin`. See src/core/permissions.ts for what each one can reach:
//   superadmin  everything, including settings and re-seeding
//   moderator   join applications, reviews, inquiries, community, audit log
//   editor      institutions, tutors, employers, jobs, locations, categories, taxonomies
//
// Passing `none` removes the admin claim.
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const ROLES = ['superadmin', 'moderator', 'editor'];

const email = process.argv[2];
const role = process.argv[3] || 'superadmin';

if (!email || (!ROLES.includes(role) && role !== 'none')) {
  console.error('Usage: node --env-file=.env.local scripts/set-admin-claim.mjs <email> [superadmin|moderator|editor|none]');
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
const auth = getAuth(app);

const user = await auth.getUserByEmail(email);

// Claims are replaced wholesale, so preserve anything already on the account (a tutorId or
// institutionId from an approved application) instead of silently dropping it.
const existing = user.customClaims || {};
const claims = { ...existing };
if (role === 'none') delete claims.role;
else claims.role = role;

await auth.setCustomUserClaims(user.uid, claims);

console.log(
  role === 'none'
    ? `Removed the admin role from ${email} (uid: ${user.uid})`
    : `Granted role: ${role} to ${email} (uid: ${user.uid})`
);
console.log('The user must sign out and back in for the new claim to take effect.');
