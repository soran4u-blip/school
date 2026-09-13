import { Firestore } from 'firebase-admin/firestore';
import { NotificationItem, NotificationType } from '@/core/types/notification';
import { sendPushToUser } from '@/core/server/push';

/**
 * Looks up the pair of ids a directory owner is addressed by — see `pushOwnerId` below for why
 * there are two. Returns null when the directory doc is gone, so callers can skip notifying
 * rather than writing a notification nobody can read.
 */
export async function resolveOwnerRecipient(
  adminDb: Firestore,
  collectionName: 'institutions' | 'employers' | 'tutors',
  directoryId: string
): Promise<{ recipientId: string; pushOwnerId: string } | null> {
  const snap = await adminDb.collection(collectionName).doc(directoryId).get();
  if (!snap.exists) return null;
  const userId = (snap.data() as { userId?: string }).userId;
  return { recipientId: userId || directoryId, pushOwnerId: directoryId };
}

export interface DispatchNotificationParams {
  // The recipient's Auth uid. The in-app notification is keyed by this, because
  // firestore.rules matches notifications against request.auth.uid and useNotifications
  // queries `where('recipientId', '==', user.uid)`.
  recipientId: string;
  recipientRole: 'student' | 'tutor' | 'institution' | 'employer' | 'admin';
  // Where this owner's web-push subscriptions live: /api/push/subscribe files them under the
  // role-scoped directory id (tutorId/institutionId/employerId), which equals the uid for
  // accounts created by the approval flow but NOT for ones linked manually afterwards
  // (set-tutor-claim.mjs keeps the existing directory doc and records the uid as `userId`).
  // Defaults to recipientId, which is correct whenever the two coincide.
  pushOwnerId?: string;
  type: NotificationType;
  title: { ar: string; en: string };
  body: { ar: string; en: string };
  linkUrl: string;
  metadata?: NotificationItem['metadata'];
}

/**
 * Creates an in-app notification doc and attempts to send a web push notification.
 */
export async function dispatchNotification(
  adminDb: Firestore,
  params: DispatchNotificationParams
): Promise<NotificationItem> {
  const notifRef = adminDb.collection('notifications').doc();
  const now = new Date().toISOString();

  const item: NotificationItem = {
    id: notifRef.id,
    recipientId: params.recipientId,
    recipientRole: params.recipientRole,
    type: params.type,
    title: params.title,
    body: params.body,
    linkUrl: params.linkUrl,
    read: false,
    createdAt: now,
    ...(params.metadata ? { metadata: params.metadata } : {}),
  };

  await notifRef.set(item);

  // Send Web Push best-effort
  sendPushToUser(adminDb, params.recipientRole, params.pushOwnerId ?? params.recipientId, {
    title: params.title.ar || params.title.en,
    body: params.body.ar || params.body.en,
    url: params.linkUrl,
  }).catch(() => {
    // Non-blocking, best-effort
  });

  return item;
}

/**
 * Tells an institution that someone replied on one of its inquiry threads. Shared by the guest
 * (phone-verified) and logged-in-student reply routes, which are otherwise identical here.
 * Best-effort: a failure must never cost the sender their message.
 */
export async function notifyInstitutionOfInquiryReply(
  adminDb: Firestore,
  institutionId: string,
  inquiryId: string,
  senderName: string,
  text: string
): Promise<void> {
  const owner = await resolveOwnerRecipient(adminDb, 'institutions', institutionId).catch(() => null);
  if (!owner) return;

  const preview = text.length > 80 ? `${text.slice(0, 77)}...` : text;
  await dispatchNotification(adminDb, {
    ...owner,
    recipientRole: 'institution',
    type: 'INQUIRY',
    title: { ar: `رد جديد من ${senderName}`, en: `New reply from ${senderName}` },
    body: { ar: preview, en: preview },
    linkUrl: '/institution/dashboard',
    metadata: { inquiryId, senderName },
  }).catch(() => {});
}
