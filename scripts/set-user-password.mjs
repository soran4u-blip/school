// Set a new password for a user by email. Meant for seeded/test accounts whose email
// can't receive a reset link (e.g. @test.com).
//
// Usage:
//   node --env-file=.env.local scripts/set-user-password.mjs someone@example.com
//
// The password is prompted for (hidden) rather than passed as an argument, so it doesn't
// land in shell history.
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const email = process.argv[2];
if (!email) {
  console.error('Usage: node --env-file=.env.local scripts/set-user-password.mjs <email>');
  process.exit(1);
}

function promptHidden(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    const stdin = process.stdin;
    let value = '';
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    const onData = (ch) => {
      if (ch === '\r' || ch === '\n' || ch === '\u0004') {
        stdin.setRawMode?.(false);
        stdin.pause();
        stdin.off('data', onData);
        process.stdout.write('\n');
        resolve(value);
      } else if (ch === '\u0003') {
        process.exit(130);
      } else if (ch === '\u007f' || ch === '\b') {
        value = value.slice(0, -1);
      } else {
        value += ch;
      }
    };
    stdin.on('data', onData);
  });
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
const auth = getAuth(app);

const user = await auth.getUserByEmail(email);

const password = await promptHidden(`New password for ${email}: `);
const confirm = await promptHidden('Confirm password: ');
if (password !== confirm) {
  console.error('Passwords do not match.');
  process.exit(1);
}
if (password.length < 6) {
  console.error('Password must be at least 6 characters (Firebase minimum).');
  process.exit(1);
}

await auth.updateUser(user.uid, { password });
// Invalidate existing sessions so anyone signed in with the old password is logged out.
await auth.revokeRefreshTokens(user.uid);

console.log(`Password updated for ${email} (uid: ${user.uid}). Existing sessions were revoked.`);
