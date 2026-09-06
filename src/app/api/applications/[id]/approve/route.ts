import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import { Application } from '@/core/types/application';
import { Tutor } from '@/core/types/tutor';

function randomPassword(): string {
  return Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
}

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminDb || !adminAuth) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const { id } = await params;
  const appSnap = await adminDb.collection('applications').doc(id).get();
  if (!appSnap.exists) {
    return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
  }
  const application = appSnap.data() as Application;
  if (application.status !== 'PENDING') {
    return NextResponse.json({ success: false, error: 'Application already reviewed' }, { status: 400 });
  }

  const now = new Date().toISOString();

  if (application.type === 'INSTITUTION') {
    // No institution-owner login/dashboard exists yet — just mark it reviewed so the
    // superadmin knows to create the Institution record by hand from the details given.
    await appSnap.ref.update({ status: 'APPROVED', reviewedAt: now });
    return NextResponse.json({
      success: true,
      note: 'Institution accounts are not self-service yet — create the Institution record manually from the application details.',
    });
  }

  try {
    const tutorRef = adminDb.collection('tutors').doc();
    const authUser = await adminAuth.createUser({
      email: application.email,
      password: randomPassword(),
      displayName: application.fullName,
    });
    await adminAuth.setCustomUserClaims(authUser.uid, { role: 'tutor', tutorId: tutorRef.id });

    const tutor: Tutor = {
      id: tutorRef.id,
      userId: authUser.uid,
      fullName: { ar: application.fullName, en: application.fullName },
      title: { ar: '', en: '' },
      bio: { ar: application.message, en: application.message },
      photoUrl: '',
      governorateId: application.governorateId,
      hourlyRate: { iqd: 0, usd: 0 },
      groupRate: { iqd: 0, usd: 0 },
      groupMaxSize: 4,
      availability: [],
      deliveryMode: ['IN_PERSON'],
      subjectIds: application.subjectIds || [],
      studentLevelIds: application.studentLevelIds || [],
      whatsappNumber: application.whatsappNumber || application.phone,
      phone: application.phone,
      yearsOfExperience: application.yearsOfExperience || 0,
      isVerified: false,
      verificationBadgeLabel: { ar: 'قيد المراجعة', en: 'Under Review' },
      status: 'PENDING',
      ratingAvg: 0,
      reviewCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    await tutorRef.set(tutor);

    const resetLink = await adminAuth.generatePasswordResetLink(application.email);

    await appSnap.ref.update({ status: 'APPROVED', reviewedAt: now, resultTutorId: tutorRef.id });

    return NextResponse.json({ success: true, tutorId: tutorRef.id, resetLink });
  } catch (error: any) {
    if (error?.code === 'auth/email-already-exists') {
      return NextResponse.json({ success: false, error: 'An account with this email already exists' }, { status: 409 });
    }
    console.error('Application approval failed:', error);
    return NextResponse.json({ success: false, error: 'Approval failed' }, { status: 500 });
  }
}
