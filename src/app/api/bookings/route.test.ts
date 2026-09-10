import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { dayOfWeekFromDate, addDaysToDateString } from '@/lib/bookingLogic';
import type { Firestore } from 'firebase-admin/firestore';

// Regression test for the double-booking race fixed in route.ts's `createIfNoConflict`: the
// "is this slot taken" query and the booking write used to be two separate round trips, which let
// two concurrent requests for the same tutor/date/startTime both see no conflict and both write a
// booking. The fix reads the conflict query and writes the new booking inside one Firestore
// transaction — Firestore serializes transactions on their reads, so of two transactions racing
// for the same slot, one aborts and retries (and on retry, sees the other's write and backs off).
//
// This drives the ACTUAL exported POST handler (not a reimplementation of its transaction logic)
// against the Firestore emulator, with only the session-cookie lookup swapped out — verifying a
// session cookie is a separate concern from the race this test targets, and doing it for real
// would mean standing up the Auth emulator too.
//
// Needs the Firestore emulator, same as src/core/security/firestoreRules.test.ts. `npm run
// test:rules` starts it; a plain `npm test` skips this suite when the emulator isn't reachable
// rather than failing, so it stays an opt-in dependency for contributors who aren't touching
// bookings.

const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
const [host, portText] = EMULATOR_HOST.split(':');
const port = Number(portText);
const PROJECT_ID = 'eduraq-rules-test';

async function emulatorIsRunning(): Promise<boolean> {
  try {
    const res = await fetch(`http://${host}:${port}/`);
    return res.status < 500;
  } catch {
    return false;
  }
}

const available = await emulatorIsRunning();

// Fake session lookup: the route only cares about `{ uid, role }`, and this test isn't the place
// to prove session-cookie verification works. A studentId travels in a custom header instead of a
// real cookie so each concurrent request can act as a different signed-in student.
vi.mock('@/core/server/session', () => ({
  getSessionUser: async (request: NextRequest) => {
    const uid = request.headers.get('x-test-student-id');
    return uid ? { uid, role: 'student' as const } : null;
  },
}));

describe.skipIf(!available)('POST /api/bookings — concurrent conflict race', () => {
  const TUTOR_ID = 'race-tutor-1';
  const STUDENT_IDS = ['race-student-0', 'race-student-1', 'race-student-2', 'race-student-3', 'race-student-4'];

  const today = new Date().toISOString().slice(0, 10);
  const DATE = addDaysToDateString(today, 14);
  const DAY_OF_WEEK = dayOfWeekFromDate(DATE);
  const START_TIME = '16:00';
  const END_TIME = '17:00';

  let adminDb: Firestore;
  let POST: typeof import('./route').POST;
  const previousEnv = {
    FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  };

  beforeAll(async () => {
    process.env.FIRESTORE_EMULATOR_HOST = `${host}:${port}`;
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = PROJECT_ID;

    // Imported only now, after the emulator env vars are set and the session module is mocked, so
    // the Admin SDK singleton in @/core/firebase/admin talks to the emulator instead of prod.
    ({ POST } = await import('./route'));
    ({ adminDb } = (await import('@/core/firebase/admin')) as { adminDb: Firestore });

    for (const studentId of STUDENT_IDS) {
      await adminDb.collection('students').doc(studentId).set({
        id: studentId,
        userId: studentId,
        fullName: `Race Student ${studentId}`,
        phone: '07700000000',
        email: `${studentId}@example.com`,
        subjectIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  });

  afterAll(async () => {
    if (adminDb) await adminDb.terminate().catch(() => {});
    process.env.FIRESTORE_EMULATOR_HOST = previousEnv.FIRESTORE_EMULATOR_HOST;
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = previousEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  });

  beforeEach(async () => {
    const existing = await adminDb.collection('bookings').where('tutorId', '==', TUTOR_ID).get();
    await Promise.all(existing.docs.map((d) => d.ref.delete()));

    await adminDb.collection('tutors').doc(TUTOR_ID).set({
      id: TUTOR_ID,
      fullName: { ar: 'مدرس', en: 'Tutor' },
      title: { ar: '', en: '' },
      bio: { ar: '', en: '' },
      photoUrl: '',
      governorateId: 'baghdad',
      hourlyRate: { iqd: 25000, usd: 18 },
      groupRate: { iqd: 40000, usd: 28 },
      groupMaxSize: 4,
      availability: [{ dayOfWeek: DAY_OF_WEEK, startTime: '00:00', endTime: '23:59' }],
      unavailableDates: [],
      deliveryMode: ['ONLINE'],
      subjectIds: [],
      studentLevelIds: [],
      whatsappNumber: '',
      phone: '',
      yearsOfExperience: 1,
      isVerified: false,
      verificationBadgeLabel: { ar: '', en: '' },
      status: 'ACTIVE',
      ratingAvg: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  function bookingRequest(studentId: string) {
    return new NextRequest('http://localhost/api/bookings', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-test-student-id': studentId },
      body: JSON.stringify({ tutorId: TUTOR_ID, date: DATE, startTime: START_TIME, endTime: END_TIME }),
    });
  }

  it('lets exactly one of several concurrent bookings for the same slot succeed', async () => {
    const responses = await Promise.all(STUDENT_IDS.map((studentId) => POST(bookingRequest(studentId))));
    const bodies = await Promise.all(responses.map((r) => r.json()));

    const successes = bodies.filter((b) => b.success === true);
    const conflicts = bodies.filter((b) => b.success === false);
    expect(successes).toHaveLength(1);
    expect(conflicts).toHaveLength(STUDENT_IDS.length - 1);
    for (const c of conflicts) {
      expect(c.error).toMatch(/no longer available/i);
    }

    const snap = await adminDb
      .collection('bookings')
      .where('tutorId', '==', TUTOR_ID)
      .where('date', '==', DATE)
      .where('startTime', '==', START_TIME)
      .get();
    expect(snap.size).toBe(1);
    expect(snap.docs[0].data().participantStudentIds).toEqual([successes[0].booking.participantStudentIds[0]]);
  });
});
