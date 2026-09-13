import { NextRequest, NextResponse } from 'next/server';
import { Firestore } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import { getSessionUser, SessionUser } from '@/core/server/session';
import { parseJsonBody } from '@/core/validation/apiValidation';
import { createConversationSchema } from '@/core/validation/schemas';
import { Conversation } from '@/core/types/conversation';

// The current user's real name for the conversation's participant list. Firebase Auth's
// displayName is only ever set for tutor/institution/employer accounts (provisioned via
// /api/applications/[id]/approve) — students self-register without one — so falling back to it
// alone shows every student as the literal string "student". Look the name up from the same
// collection each role's own profile lives in instead.
async function resolveDisplayName(db: Firestore, user: SessionUser): Promise<string> {
  if (user.role === 'student') {
    const snap = await db.collection('students').doc(user.uid).get();
    const fullName = snap.data()?.fullName;
    if (fullName) return fullName;
  } else if (user.role === 'tutor' && user.tutorId) {
    const snap = await db.collection('tutors').doc(user.tutorId).get();
    const fullName = snap.data()?.fullName;
    if (fullName?.en || fullName?.ar) return fullName.en || fullName.ar;
  } else if (user.role === 'institution' && user.institutionId) {
    const snap = await db.collection('institutions').doc(user.institutionId).get();
    const name = snap.data()?.name;
    if (name?.en || name?.ar) return name.en || name.ar;
  } else if (user.role === 'employer' && user.employerId) {
    const snap = await db.collection('employers').doc(user.employerId).get();
    const name = snap.data()?.name;
    if (name) return name;
  }

  const userRecord = adminAuth ? await adminAuth.getUser(user.uid).catch(() => null) : null;
  return userRecord?.displayName || user.role || 'User';
}

// GET /api/conversations — get all active conversations for current user
export async function GET(request: NextRequest) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const snap = await adminDb
    .collection('conversations')
    .where('participantIds', 'array-contains', user.uid)
    .orderBy('updatedAt', 'desc')
    .limit(50)
    .get();

  const conversations = snap.docs.map((d) => d.data() as Conversation);
  return NextResponse.json({ success: true, conversations });
}

// POST /api/conversations — start or fetch an existing conversation
export async function POST(request: NextRequest) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = await parseJsonBody(request, createConversationSchema);
  if (parsed.error) return parsed.error;
  const { recipientId, recipientRole, recipientName, recipientPhone, context } = parsed.data;

  if (recipientId === user.uid) {
    return NextResponse.json({ success: false, error: 'Cannot message self' }, { status: 400 });
  }

  // Deterministic 1:1 conversation ID
  const convId = ['conv', ...[user.uid, recipientId].sort()].join('_');
  const convRef = adminDb.collection('conversations').doc(convId);
  const existing = await convRef.get();

  if (existing.exists) {
    return NextResponse.json({ success: true, conversation: existing.data() as Conversation });
  }

  const currentUserName = await resolveDisplayName(adminDb, user);

  const now = new Date().toISOString();
  const newConv: Conversation = {
    id: convId,
    participantIds: [user.uid, recipientId],
    participants: [
      {
        id: user.uid,
        role: (user.role || 'student') as Conversation['participants'][number]['role'],
        name: currentUserName,
      },
      {
        id: recipientId,
        role: recipientRole,
        name: recipientName,
        ...(recipientPhone ? { phone: recipientPhone } : {}),
      },
    ],
    unreadCounts: {
      [user.uid]: 0,
      [recipientId]: 0,
    },
    createdAt: now,
    updatedAt: now,
    ...(context ? { context } : {}),
  };

  await convRef.set(newConv);
  return NextResponse.json({ success: true, conversation: newConv });
}
