import { Firestore } from 'firebase-admin/firestore';
import { NotificationItem, NotificationType } from '@/core/types/notification';
import { sendPushToUser } from '@/core/server/push';

export interface DispatchNotificationParams {
  recipientId: string;
  recipientRole: 'student' | 'tutor' | 'institution' | 'employer' | 'admin';
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
  sendPushToUser(adminDb, params.recipientRole, params.recipientId, {
    title: params.title.ar || params.title.en,
    body: params.body.ar || params.body.en,
    url: params.linkUrl,
  }).catch(() => {
    // Non-blocking, best-effort
  });

  return item;
}
