import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import { getSessionUser } from '@/core/server/session';
import { Inquiry } from '@/core/types/review';
import { Institution } from '@/core/types/institution';


// GET /api/account/inquiries — a logged-in student's own inquiries, looked up by uid (attached
// at submission time) with a fallback match on the phone on their account (custom claim), for
// inquiries submitted before that uid was recorded.
export async function GET(request: NextRequest) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const user = await getSessionUser(request);
  if (user?.role !== 'student') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Match by uid (attached at submission time for signed-in submitters, see /api/inquiries)
    // and, for older inquiries or ones submitted with a different account phone typed into the
    // form, fall back to matching the phone on the account's claim. Merge and de-dupe by id.
    const [byStudentId, byPhone] = await Promise.all([
      adminDb.collection('inquiries').where('studentId', '==', user.uid).get(),
      user.phone ? adminDb.collection('inquiries').where('phone', '==', user.phone).get() : null,
    ]);
    const docsById = new Map<string, Inquiry>();
    for (const d of byStudentId.docs) docsById.set(d.id, d.data() as Inquiry);
    for (const d of byPhone?.docs || []) docsById.set(d.id, d.data() as Inquiry);

    const institutionIds = [...new Set([...docsById.values()].map((i) => i.institutionId))];
    const institutions = new Map<string, Institution>();
    await Promise.all(
      institutionIds.map(async (id) => {
        const inst = await adminDb!.collection('institutions').doc(id).get();
        if (inst.exists) institutions.set(id, inst.data() as Institution);
      })
    );

    const inquiries = [...docsById.values()]
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
