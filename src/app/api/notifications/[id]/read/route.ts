import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import { getSessionUser } from '@/core/server/session';

// POST /api/notifications/[id]/read — mark single notification as read
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const { id } = await props.params;
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const notifRef = adminDb.collection('notifications').doc(id);
  const notifDoc = await notifRef.get();

  if (!notifDoc.exists) {
    return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 });
  }

  if (notifDoc.data()?.recipientId !== user.uid) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  await notifRef.update({ read: true });
  return NextResponse.json({ success: true });
}
