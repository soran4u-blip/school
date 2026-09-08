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

// Sends a push notification to every browser/device the student has subscribed from. Best-effort
// and silent: a student with no subscriptions (the common case — this is opt-in) or an expired
// one is not an error condition. Dead subscriptions (410 Gone / 404) are pruned automatically.
export async function sendPushToStudent(
  adminDb: Firestore,
  studentId: string,
  payload: { title: string; body: string; url?: string }
): Promise<void> {
  ensureConfigured();
  if (!configured) return;

  const snap = await adminDb.collection('students').doc(studentId).collection('pushSubscriptions').get();
  if (snap.empty) return;

  await Promise.all(
    snap.docs.map(async (doc) => {
      const subscription = doc.data().subscription;
      try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await doc.ref.delete().catch(() => {});
        }
      }
    })
  );
}
