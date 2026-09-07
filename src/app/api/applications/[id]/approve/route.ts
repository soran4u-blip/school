import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import { Application } from '@/core/types/application';
import { Tutor } from '@/core/types/tutor';
import { Institution } from '@/core/types/institution';
import { Employer } from '@/core/types/employer';

function randomPassword(): string {
  return Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
}

function slugify(name: string, uniqueSuffix: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60);
  return `${base || 'institution'}-${uniqueSuffix}`;
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
    try {
      const instRef = adminDb.collection('institutions').doc();
      const authUser = await adminAuth.createUser({
        email: application.email,
        password: randomPassword(),
        displayName: application.fullName,
      });
      await adminAuth.setCustomUserClaims(authUser.uid, { role: 'institution', institutionId: instRef.id });

      const institution: Institution = {
        id: instRef.id,
        userId: authUser.uid,
        slug: slugify(application.fullName, instRef.id.slice(-6)),
        name: { ar: application.fullName, en: application.fullName },
        categoryId: application.categoryId || '',
        governorateId: application.governorateId,
        logoUrl: '',
        coverImageUrl: '',
        tagline: { ar: '', en: '' },
        description: { ar: application.message, en: application.message },
        address: { ar: '', en: '' },
        contact: {
          phonePrimary: application.phone,
          whatsappNumber: application.whatsappNumber || application.phone,
          email: application.email,
        },
        establishedYear: new Date().getFullYear(),
        genderPolicy: 'CO_ED',
        languagesOfInstruction: ['AR'],
        tuition: { min: 0, max: 0, currency: 'USD', period: 'YEAR' },
        taxonomyIds: [],
        isVerified: false,
        verificationBadgeLabel: { ar: 'قيد المراجعة', en: 'Under Review' },
        status: 'PENDING',
        isFeatured: false,
        metrics: { ratingAvg: 0, reviewCount: 0 },
        createdAt: now,
        updatedAt: now,
      };
      await instRef.set(institution);

      const resetLink = await adminAuth.generatePasswordResetLink(application.email);
      await appSnap.ref.update({ status: 'APPROVED', reviewedAt: now, resultInstitutionId: instRef.id });

      return NextResponse.json({ success: true, institutionId: instRef.id, resetLink });
    } catch (error: any) {
      if (error?.code === 'auth/email-already-exists') {
        return NextResponse.json({ success: false, error: 'An account with this email already exists' }, { status: 409 });
      }
      console.error('Application approval failed:', error);
      return NextResponse.json({ success: false, error: 'Approval failed' }, { status: 500 });
    }
  }

  if (application.type === 'EMPLOYER') {
    try {
      const employerRef = adminDb.collection('employers').doc();
      const authUser = await adminAuth.createUser({
        email: application.email,
        password: randomPassword(),
        displayName: application.fullName,
      });
      await adminAuth.setCustomUserClaims(authUser.uid, { role: 'employer', employerId: employerRef.id });

      const employer: Employer = {
        id: employerRef.id,
        userId: authUser.uid,
        name: application.fullName,
        type: application.employerType || 'COMPANY',
        description: application.message,
        governorateId: application.governorateId,
        contact: {
          phone: application.phone,
          whatsappNumber: application.whatsappNumber || application.phone,
          email: application.email,
        },
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      };
      await employerRef.set(employer);

      const resetLink = await adminAuth.generatePasswordResetLink(application.email);
      await appSnap.ref.update({ status: 'APPROVED', reviewedAt: now, resultEmployerId: employerRef.id });

      return NextResponse.json({ success: true, employerId: employerRef.id, resetLink });
    } catch (error: any) {
      if (error?.code === 'auth/email-already-exists') {
        return NextResponse.json({ success: false, error: 'An account with this email already exists' }, { status: 409 });
      }
      console.error('Application approval failed:', error);
      return NextResponse.json({ success: false, error: 'Approval failed' }, { status: 500 });
    }
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
