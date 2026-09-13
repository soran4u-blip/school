import webpush from 'web-push';
import { Firestore } from 'firebase-admin/firestore';

let configured = false;
function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return;
  webpush.setVapidDetails('mailto:support@eduraq.iq', publicKey, privateKey);
  configured = true;
}

async function sendPushToSubscribers(
  adminDb: Firestore,
  collectionPath: string,
  ownerId: string,
  payload: { title: string; body: string; url?: string }
): Promise<void> {
  ensureConfigured();
  if (!configured) return;

  const snap = await adminDb.collection(collectionPath).doc(ownerId).collection('pushSubscriptions').get();
  if (snap.empty) return;

  await Promise.all(
    snap.docs.map(async (doc) => {
      const subscription = doc.data().subscription;
      try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
      } catch (err: unknown) {
        // 404/410 from the push service means the browser dropped this subscription — prune it
        // rather than retrying it forever.
        const statusCode = (err as { statusCode?: number } | null)?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await doc.ref.delete().catch(() => {});
        }
      }
    })
  );
}

// Sends a push notification to every browser/device the student has subscribed from. Best-effort
// and silent: a student with no subscriptions (the common case — this is opt-in) or an expired
// one is not an error condition. Dead subscriptions (410 Gone / 404) are pruned automatically.
export async function sendPushToStudent(
  adminDb: Firestore,
  studentId: string,
  payload: { title: string; body: string; url?: string }
): Promise<void> {
  return sendPushToSubscribers(adminDb, 'students', studentId, payload);
}

// Same as sendPushToStudent, for a tutor's own subscriptions (new booking requests, new student
// messages) — see /api/push/subscribe for how a tutor registers one.
export async function sendPushToTutor(
  adminDb: Firestore,
  tutorId: string,
  payload: { title: string; body: string; url?: string }
): Promise<void> {
  return sendPushToSubscribers(adminDb, 'tutors', tutorId, payload);
}

// Universal push dispatch for any role (student, tutor, institution, employer, admin)
export async function sendPushToUser(
  adminDb: Firestore,
  role: string,
  userId: string,
  payload: { title: string; body: string; url?: string }
): Promise<void> {
  const collectionName =
    role === 'student' ? 'students' :
    role === 'tutor' ? 'tutors' :
    role === 'institution' ? 'institutions' :
    role === 'employer' ? 'employers' : 'users';

  return sendPushToSubscribers(adminDb, collectionName, userId, payload);
}

