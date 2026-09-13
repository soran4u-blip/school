import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import { getSessionUser } from '@/core/server/session';
import { NotificationItem } from '@/core/types/notification';

// GET /api/notifications — fetch notifications for current user
export async function GET(request: NextRequest) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const snap = await adminDb
    .collection('notifications')
    .where('recipientId', '==', user.uid)
    .orderBy('createdAt', 'desc')
    .limit(30)
    .get();

  const notifications = snap.docs.map((d) => d.data() as NotificationItem);
  return NextResponse.json({ success: true, notifications });
}

// POST /api/notifications — mark all notifications as read
export async function POST(request: NextRequest) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const unreadSnap = await adminDb
    .collection('notifications')
    .where('recipientId', '==', user.uid)
    .where('read', '==', false)
    .limit(50)
    .get();

  if (!unreadSnap.empty) {
    const batch = adminDb.batch();
    unreadSnap.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });
    await batch.commit();
  }

  return NextResponse.json({ success: true });
}
