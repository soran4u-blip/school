import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import { AdmissionApplication } from '@/core/types/admission';
import { Institution } from '@/core/types/institution';

const SESSION_COOKIE_NAME = 'session';

// GET /api/account/admission-applications — a logged-in student's own applications, looked up
// by their account uid (verified server-side from the session), never a client-supplied value.
export async function GET(request: NextRequest) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (decoded.role !== 'student') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const snap = await adminDb.collection('admissionApplications').where('studentId', '==', decoded.uid).get();
    const institutionIds = [...new Set(snap.docs.map((d) => (d.data() as AdmissionApplication).institutionId))];
    const institutions = new Map<string, Institution>();
    await Promise.all(
      institutionIds.map(async (id) => {
        const inst = await adminDb!.collection('institutions').doc(id).get();
        if (inst.exists) institutions.set(id, inst.data() as Institution);
      })
    );

    const applications = snap.docs
      .map((d) => d.data() as AdmissionApplication)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((app) => {
        const inst = institutions.get(app.institutionId);
        return {
          id: app.id,
          institutionId: app.institutionId,
          institutionName: inst?.name || null,
          institutionSlug: inst?.slug || null,
          programId: app.programId,
          programName: app.programName,
          status: app.status,
          message: app.message || null,
          decisionNote: app.decisionNote || null,
          createdAt: app.createdAt,
          decidedAt: app.decidedAt || null,
        };
      });

    return NextResponse.json({ success: true, applications });
  } catch (error) {
    console.error('Account admission applications lookup failed:', error);
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
}
