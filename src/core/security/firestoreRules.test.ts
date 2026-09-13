import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

// Tests for firestore.rules.
//
// The rules file is the only thing standing between an owner's browser and the fields that decide
// public ranking, the verification badge and the JSON-LD aggregateRating we publish. Until now it
// had no tests at all, which is how a whole-document `setDoc` from a dashboard was able to set
// `isVerified` for years without anyone noticing.
//
// These need the Firestore emulator. `npm run test:rules` starts it; a plain `npm test` skips the
// whole suite when it isn't reachable rather than failing, so the emulator stays an opt-in
// dependency for contributors who aren't touching the rules.

const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
const [host, portText] = EMULATOR_HOST.split(':');
const port = Number(portText);

async function emulatorIsRunning(): Promise<boolean> {
  try {
    const res = await fetch(`http://${host}:${port}/`);
    return res.status < 500;
  } catch {
    return false;
  }
}

const available = await emulatorIsRunning();

describe.skipIf(!available)('firestore.rules', () => {
  let testEnv: RulesTestEnvironment;

  const INSTITUTION_ID = 'inst-1';
  const TUTOR_ID = 'tutor-1';
  const JOB_ID = 'job-1';

  // A profile in the shape the approval route actually writes, so a whole-document write from a
  // dashboard is exercised the way it happens in production.
  const institutionDoc = {
    id: INSTITUTION_ID,
    userId: INSTITUTION_ID,
    slug: 'inst-one',
    status: 'ACTIVE',
    isVerified: false,
    isFeatured: false,
    verificationBadgeLabel: { ar: '', en: '' },
    categoryId: 'universities',
    governorateId: 'baghdad',
    metrics: { ratingAvg: 0, reviewCount: 0, ratingSum: 0 },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const tutorDoc = {
    id: TUTOR_ID,
    userId: TUTOR_ID,
    slug: 'tutor-one',
    status: 'ACTIVE',
    isVerified: false,
    verificationBadgeLabel: { ar: '', en: '' },
    governorateId: 'baghdad',
    ratingAvg: 0,
    reviewCount: 0,
    ratingSum: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const jobDoc = {
    id: JOB_ID,
    institutionId: INSTITUTION_ID,
    slug: 'job-one',
    status: 'ACTIVE',
    governorateId: 'baghdad',
    employmentType: 'FULL_TIME',
    isRemote: false,
    applicantCount: 7,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const reviewDoc = {
    id: 'review-1',
    institutionId: INSTITUTION_ID,
    reviewerName: 'A Student',
    rating: 5,
    comment: 'Great',
    status: 'APPROVED',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  function institutionOwner() {
    return testEnv
      .authenticatedContext(INSTITUTION_ID, { role: 'institution', institutionId: INSTITUTION_ID })
      .firestore();
  }
  function tutorOwner() {
    return testEnv.authenticatedContext(TUTOR_ID, { role: 'tutor', tutorId: TUTOR_ID }).firestore();
  }
  function superadmin() {
    return testEnv.authenticatedContext('admin-1', { role: 'superadmin' }).firestore();
  }
  function moderator() {
    return testEnv.authenticatedContext('mod-1', { role: 'moderator' }).firestore();
  }
  function editor() {
    return testEnv.authenticatedContext('ed-1', { role: 'editor' }).firestore();
  }

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'eduraq-rules-test',
      firestore: {
        host,
        port,
        rules: fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8'),
      },
    });
  });

  afterAll(async () => {
    await testEnv?.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'institutions', INSTITUTION_ID), institutionDoc);
      await setDoc(doc(db, 'tutors', TUTOR_ID), tutorDoc);
      await setDoc(doc(db, 'jobs', JOB_ID), jobDoc);
      await setDoc(doc(db, 'reviews', 'review-1'), reviewDoc);
    });
  });

  describe('institution owner', () => {
    it('may edit their own descriptive fields', async () => {
      await assertSucceeds(
        updateDoc(doc(institutionOwner(), 'institutions', INSTITUTION_ID), {
          tagline: { ar: 'جديد', en: 'New' },
          updatedAt: new Date().toISOString(),
        })
      );
    });

    it('may write the whole document back unchanged (the dashboard does a full setDoc)', async () => {
      await assertSucceeds(
        setDoc(
          doc(institutionOwner(), 'institutions', INSTITUTION_ID),
          { ...institutionDoc, tagline: { ar: 'x', en: 'x' }, updatedAt: new Date().toISOString() },
          { merge: true }
        )
      );
    });

    it('may not grant themselves the verified badge', async () => {
      await assertFails(updateDoc(doc(institutionOwner(), 'institutions', INSTITUTION_ID), { isVerified: true }));
    });

    it('may not feature themselves on the homepage', async () => {
      await assertFails(updateDoc(doc(institutionOwner(), 'institutions', INSTITUTION_ID), { isFeatured: true }));
    });

    it('may not fabricate rating metrics', async () => {
      await assertFails(
        updateDoc(doc(institutionOwner(), 'institutions', INSTITUTION_ID), {
          'metrics.ratingAvg': 5,
          'metrics.reviewCount': 300,
        })
      );
    });

    it('may pause and resume themselves', async () => {
      await assertSucceeds(updateDoc(doc(institutionOwner(), 'institutions', INSTITUTION_ID), { status: 'SUSPENDED' }));
    });

    it('may not publish a profile an admin has not approved', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'institutions', INSTITUTION_ID), { ...institutionDoc, status: 'PENDING' });
      });
      await assertFails(updateDoc(doc(institutionOwner(), 'institutions', INSTITUTION_ID), { status: 'ACTIVE' }));
    });

    it('may not reassign ownership', async () => {
      await assertFails(updateDoc(doc(institutionOwner(), 'institutions', INSTITUTION_ID), { userId: 'someone-else' }));
    });
  });

  describe('tutor owner', () => {
    it('may edit their own bio', async () => {
      await assertSucceeds(
        updateDoc(doc(tutorOwner(), 'tutors', TUTOR_ID), { bio: { ar: 'س', en: 'Bio' }, updatedAt: new Date().toISOString() })
      );
    });

    it('may not grant themselves the verified badge', async () => {
      await assertFails(updateDoc(doc(tutorOwner(), 'tutors', TUTOR_ID), { isVerified: true }));
    });

    it('may not fabricate their rating', async () => {
      await assertFails(updateDoc(doc(tutorOwner(), 'tutors', TUTOR_ID), { ratingAvg: 5, reviewCount: 120 }));
    });

    it('may not publish a profile an admin has not approved', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'tutors', TUTOR_ID), { ...tutorDoc, status: 'PENDING' });
      });
      await assertFails(updateDoc(doc(tutorOwner(), 'tutors', TUTOR_ID), { status: 'ACTIVE' }));
    });
  });

  describe('jobs', () => {
    it('let their owner edit the posting', async () => {
      await assertSucceeds(updateDoc(doc(institutionOwner(), 'jobs', JOB_ID), { status: 'CLOSED' }));
    });

    it('do not let their owner touch the denormalized applicant count', async () => {
      await assertFails(updateDoc(doc(institutionOwner(), 'jobs', JOB_ID), { applicantCount: 999 }));
    });

    it('cannot be posted under someone else', async () => {
      await assertFails(
        setDoc(doc(tutorOwner(), 'jobs', 'job-2'), { ...jobDoc, id: 'job-2', institutionId: INSTITUTION_ID })
      );
    });
  });

  describe('reviews', () => {
    it('cannot be created from a client at all', async () => {
      await assertFails(
        setDoc(doc(institutionOwner(), 'reviews', 'review-2'), { ...reviewDoc, id: 'review-2', status: 'PENDING' })
      );
    });

    it('cannot have their status changed from a client, even by a superadmin', async () => {
      // Moderation has to move the rating aggregates in the same transaction, so it goes through
      // /api/admin/reviews/[id] with the Admin SDK. Leaving a client path open here is exactly how
      // the aggregates drifted before.
      await assertFails(updateDoc(doc(superadmin(), 'reviews', 'review-1'), { status: 'REJECTED' }));
    });

    it('cannot be deleted from a client, even by a superadmin', async () => {
      await assertFails(deleteDoc(doc(superadmin(), 'reviews', 'review-1')));
    });

    it('can still receive an owner reply', async () => {
      await assertSucceeds(
        updateDoc(doc(institutionOwner(), 'reviews', 'review-1'), {
          reply: { text: 'Thank you', createdAt: new Date().toISOString() },
        })
      );
    });
  });

  // The scoped admin roles — see src/core/permissions.ts, which these mirror. The rules file
  // can't import that table, so this is what keeps the two from drifting apart.
  describe('moderator', () => {
    it('may read the directory', async () => {
      await assertSucceeds(getDoc(doc(moderator(), 'institutions', INSTITUTION_ID)));
    });

    it('may not change a listing', async () => {
      await assertFails(updateDoc(doc(moderator(), 'institutions', INSTITUTION_ID), { isFeatured: true }));
      await assertFails(updateDoc(doc(moderator(), 'tutors', TUTOR_ID), { isVerified: true }));
    });

    it('may not delete a listing', async () => {
      await assertFails(deleteDoc(doc(moderator(), 'institutions', INSTITUTION_ID)));
    });

    it('may work the join-application queue', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'applications', 'app-1'), { id: 'app-1', type: 'TUTOR', status: 'PENDING' });
      });
      await assertSucceeds(getDoc(doc(moderator(), 'applications', 'app-1')));
      await assertSucceeds(updateDoc(doc(moderator(), 'applications', 'app-1'), { status: 'REJECTED' }));
    });

    it('may not edit master data', async () => {
      await assertFails(setDoc(doc(moderator(), 'taxonomies_master', 'tax-1'), { id: 'tax-1', isActive: true }));
    });

    it('may not change site settings', async () => {
      await assertFails(setDoc(doc(moderator(), 'system_settings', 'global'), { contactEmail: 'x@y.z' }, { merge: true }));
    });
  });

  describe('editor', () => {
    it('may verify and feature a listing', async () => {
      await assertSucceeds(updateDoc(doc(editor(), 'institutions', INSTITUTION_ID), { isVerified: true, isFeatured: true }));
    });

    it('may edit master data', async () => {
      await assertSucceeds(
        setDoc(doc(editor(), 'taxonomies_master', 'tax-1'), { id: 'tax-1', isActive: true, displayOrder: 1 })
      );
    });

    it('may not work the moderation queues', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'applications', 'app-2'), { id: 'app-2', type: 'TUTOR', status: 'PENDING' });
      });
      await assertFails(getDoc(doc(editor(), 'applications', 'app-2')));
    });

    it('may not read the audit log', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'auditLogs', 'audit-1'), { id: 'audit-1', action: 'listing.verify' });
      });
      await assertFails(getDoc(doc(editor(), 'auditLogs', 'audit-1')));
      await assertSucceeds(getDoc(doc(moderator(), 'auditLogs', 'audit-1')));
    });

    it('may not change site settings or re-seed', async () => {
      await assertFails(setDoc(doc(editor(), 'system_settings', 'global'), { contactEmail: 'x@y.z' }, { merge: true }));
    });
  });

  describe('the audit trail', () => {
    it('cannot be written or erased from a client, by anyone', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'auditLogs', 'audit-2'), { id: 'audit-2', action: 'listing.delete' });
      });
      await assertFails(setDoc(doc(superadmin(), 'auditLogs', 'audit-3'), { id: 'audit-3' }));
      await assertFails(deleteDoc(doc(superadmin(), 'auditLogs', 'audit-2')));
    });
  });

  describe('bookingViews', () => {
    const STUDENT_ID = 'student-1';
    const OTHER_STUDENT_ID = 'student-2';

    function student(id: string) {
      return testEnv.authenticatedContext(id, { role: 'student' }).firestore();
    }

    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'bookingViews', `booking-1_${STUDENT_ID}`), {
          id: `booking-1_${STUDENT_ID}`,
          bookingId: 'booking-1',
          studentId: STUDENT_ID,
          tutorId: TUTOR_ID,
          status: 'PENDING',
        });
      });
    });

    it('lets a student read their own view', async () => {
      await assertSucceeds(getDoc(doc(student(STUDENT_ID), 'bookingViews', `booking-1_${STUDENT_ID}`)));
    });

    it('does not let another student read it', async () => {
      await assertFails(getDoc(doc(student(OTHER_STUDENT_ID), 'bookingViews', `booking-1_${STUDENT_ID}`)));
    });

    it('cannot be written from a client, even by the owning student', async () => {
      await assertFails(
        setDoc(doc(student(STUDENT_ID), 'bookingViews', `booking-1_${STUDENT_ID}`), {
          id: `booking-1_${STUDENT_ID}`,
          bookingId: 'booking-1',
          studentId: STUDENT_ID,
          tutorId: TUTOR_ID,
          status: 'CONFIRMED',
        })
      );
    });
  });

  describe('booking threads — participant student access', () => {
    const STUDENT_ID = 'student-1';
    const OTHER_STUDENT_ID = 'student-2';
    const THREAD_ID = 'booking-1';

    function student(id: string) {
      return testEnv.authenticatedContext(id, { role: 'student' }).firestore();
    }

    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'threads', THREAD_ID), {
          id: THREAD_ID,
          tutorId: TUTOR_ID,
          participantPhones: ['07700000000'],
          participantStudentIds: [STUDENT_ID],
          lastMessageAt: '2026-01-01T00:00:00.000Z',
          lastMessagePreview: 'hi',
          lastMessageSenderId: TUTOR_ID,
          createdAt: '2026-01-01T00:00:00.000Z',
        });
      });
    });

    it('lets a participant student read the thread', async () => {
      await assertSucceeds(getDoc(doc(student(STUDENT_ID), 'threads', THREAD_ID)));
    });

    it('does not let a non-participant student read it', async () => {
      await assertFails(getDoc(doc(student(OTHER_STUDENT_ID), 'threads', THREAD_ID)));
    });

    it('lets a participant student mark it read', async () => {
      await assertSucceeds(
        updateDoc(doc(student(STUDENT_ID), 'threads', THREAD_ID), { [`readBy.${STUDENT_ID}`]: new Date().toISOString() })
      );
    });

    it('does not let a participant student touch anything else', async () => {
      await assertFails(updateDoc(doc(student(STUDENT_ID), 'threads', THREAD_ID), { lastMessagePreview: 'tampered' }));
    });

    it('does not let a non-participant student mark it read', async () => {
      await assertFails(
        updateDoc(doc(student(OTHER_STUDENT_ID), 'threads', THREAD_ID), { [`readBy.${OTHER_STUDENT_ID}`]: new Date().toISOString() })
      );
    });
  });

  // An inquiry thread carries no studentId — a guest can open one with only a phone number — so a
  // logged-in student is matched on their `phone` custom claim instead. This is what lets inquiry
  // threads appear in the unified inbox alongside bookings and direct conversations.
  describe('inquiry threads — student matched by phone claim', () => {
    const INQUIRY_THREAD_ID = 'inquiry-1';
    const MY_PHONE = '07701234567';

    function studentWithPhone(uid: string, phone?: string) {
      return testEnv.authenticatedContext(uid, { role: 'student', ...(phone ? { phone } : {}) }).firestore();
    }

    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'threads', INQUIRY_THREAD_ID), {
          id: INQUIRY_THREAD_ID,
          institutionId: INSTITUTION_ID,
          participantPhones: [MY_PHONE],
          lastMessageAt: '2026-01-01T00:00:00.000Z',
          lastMessagePreview: 'hello',
          lastMessageSenderId: INSTITUTION_ID,
          createdAt: '2026-01-01T00:00:00.000Z',
        });
      });
    });

    it('lets the student whose phone is on the thread read it', async () => {
      await assertSucceeds(getDoc(doc(studentWithPhone('student-9', MY_PHONE), 'threads', INQUIRY_THREAD_ID)));
    });

    it('does not let a student with a different phone read it', async () => {
      await assertFails(getDoc(doc(studentWithPhone('student-9', '07709999999'), 'threads', INQUIRY_THREAD_ID)));
    });

    it('does not let a student with no phone claim read it', async () => {
      await assertFails(getDoc(doc(studentWithPhone('student-9'), 'threads', INQUIRY_THREAD_ID)));
    });

    it('still limits that student to their own readBy entry', async () => {
      const db = studentWithPhone('student-9', MY_PHONE);
      await assertSucceeds(
        updateDoc(doc(db, 'threads', INQUIRY_THREAD_ID), { 'readBy.student-9': new Date().toISOString() })
      );
      await assertFails(updateDoc(doc(db, 'threads', INQUIRY_THREAD_ID), { lastMessagePreview: 'tampered' }));
    });
  });

  describe('public reads', () => {
    it('expose an ACTIVE institution to an anonymous visitor', async () => {
      const anon = testEnv.unauthenticatedContext().firestore();
      await assertSucceeds(getDoc(doc(anon, 'institutions', INSTITUTION_ID)));
    });

    it('hide a PENDING institution from an anonymous visitor', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'institutions', INSTITUTION_ID), { ...institutionDoc, status: 'PENDING' });
      });
      const anon = testEnv.unauthenticatedContext().firestore();
      await assertFails(getDoc(doc(anon, 'institutions', INSTITUTION_ID)));
    });

    it('keep the rate-limit collection entirely private', async () => {
      const anon = testEnv.unauthenticatedContext().firestore();
      await assertFails(getDoc(doc(anon, 'rateLimits', 'anything')));
    });
  });
});
