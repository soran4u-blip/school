import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import { AdmissionApplication } from '@/core/types/admission';
import { Institution } from '@/core/types/institution';
import { computeCapacityUpdate } from '@/lib/admissionLogic';

const SESSION_COOKIE_NAME = 'session';

// POST /api/account/admission-applications/[id]/withdraw — a logged-in student withdraws their
// own application, identity derived from their own session (never a client-supplied value).
// If the application had been ACCEPTED, the program's denormalized acceptedCount is decremented
// in the same transaction so the freed seat becomes available again.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let studentId: string;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (decoded.role !== 'student') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    studentId = decoded.uid;
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const appRef = adminDb.collection('admissionApplications').doc(id);

  try {
    await adminDb.runTransaction(async (tx) => {
      const appSnap = await tx.get(appRef);
      if (!appSnap.exists) throw new Error('Application not found');
      const application = appSnap.data() as AdmissionApplication;

      if (application.studentId !== studentId) {
        throw new Error('This application does not belong to your account');
      }
      if (application.status === 'WITHDRAWN') {
        throw new Error('This application has already been withdrawn');
      }

      const now = new Date().toISOString();

      if (application.status === 'ACCEPTED') {
        const instRef = adminDb!.collection('institutions').doc(application.institutionId);
        const instSnap = await tx.get(instRef);
        if (instSnap.exists) {
          const institution = instSnap.data() as Institution;
          const programs = (institution.programs || []).map((p) =>
            p.id === application.programId ? { ...p, acceptedCount: computeCapacityUpdate(p, true, false)! } : p
          );
          tx.update(instRef, { programs });
        }
      }

      tx.update(appRef, { status: 'WITHDRAWN', updatedAt: now });
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Failed to withdraw application' }, { status: 400 });
  }
}
