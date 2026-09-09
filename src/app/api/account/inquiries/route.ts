import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import { getSessionUser } from '@/core/server/session';
import { Inquiry } from '@/core/types/review';
import { Institution } from '@/core/types/institution';


// GET /api/account/inquiries — a logged-in student's own inquiries, looked up by the phone
// on their account (custom claim), same pattern as /api/account/bookings.
export async function GET(request: NextRequest) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const user = await getSessionUser(request);
  if (user?.role !== 'student' || !user.phone) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {

    const snap = await adminDb.collection('inquiries').where('phone', '==', user.phone).get();
    const institutionIds = [...new Set(snap.docs.map((d) => (d.data() as Inquiry).institutionId))];
    const institutions = new Map<string, Institution>();
    await Promise.all(
      institutionIds.map(async (id) => {
        const inst = await adminDb!.collection('institutions').doc(id).get();
        if (inst.exists) institutions.set(id, inst.data() as Institution);
      })
    );

    const inquiries = snap.docs
      .map((d) => d.data() as Inquiry)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((i) => {
        const inst = institutions.get(i.institutionId);
        return {
          id: i.id,
          institutionId: i.institutionId,
          institutionName: inst?.name || (i.institutionName ? { ar: i.institutionName, en: i.institutionName } : null),
          institutionSlug: inst?.slug || null,
          institutionWhatsapp: inst?.contact?.whatsappNumber || null,
          message: i.message,
          status: i.status,
          createdAt: i.createdAt,
        };
      });

    return NextResponse.json({ success: true, inquiries });
  } catch (error) {
    console.error('Account inquiries lookup failed:', error);
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
}
