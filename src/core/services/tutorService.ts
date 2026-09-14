import { Tutor, TutorVerificationRequest } from '../types/tutor';
import { db } from '../firebase/config';
import { collection, getDocs, getDoc, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';

/* =========================================================
   PRIVATE TUTORS
========================================================= */
// Firestore-only, for the same reasons spelled out at the top of institutionService: no
// seedData.json fallback merged into reads, no module-level array standing in for the database,
// and no swallowed write errors.

const COLLECTION = 'tutors';

// Document key wins over any `id` field stored inside the document.
function toTutor(id: string, data: Record<string, unknown>): Tutor {
  return { ...data, id } as Tutor;
}

// `wantsAll` is true only for the admin 'ALL' case — every other caller (the public /tutors
// listing, explore, search) only ever wants ACTIVE tutors, and the unfiltered list is only
// permitted by the rules for an authenticated superadmin.
async function fetchTutors(wantsAll = false): Promise<Tutor[]> {
  const ref = collection(db, COLLECTION);
  const snap = wantsAll
    ? await getDocs(ref)
    : await getDocs(query(ref, where('status', '==', 'ACTIVE')));
  return snap.docs.map((d) => toTutor(d.id, d.data()));
}

export async function getTutors(filter?: {
  governorateId?: string;
  subjectId?: string;
  isVerified?: boolean;
  status?: string; // pass 'ALL' (admin use only) to include every status, not just ACTIVE
  keyword?: string;
}): Promise<Tutor[]> {
  let list = await fetchTutors(filter?.status === 'ALL');
  if (filter?.status === 'ALL') {
    // no status filtering — admin needs to see PENDING/SUSPENDED listings too
  } else if (filter?.status) {
    list = list.filter(t => t.status === filter.status);
  } else {
    list = list.filter(t => t.status === 'ACTIVE');
  }
  if (filter) {
    if (filter.governorateId && filter.governorateId !== 'all') {
      list = list.filter(t => t.governorateId === filter.governorateId);
    }
    if (filter.subjectId) {
      list = list.filter(t => t.subjectIds.includes(filter.subjectId!));
    }
    if (filter.isVerified !== undefined) {
      list = list.filter(t => t.isVerified === filter.isVerified);
    }
    if (filter.keyword) {
      const kw = filter.keyword.toLowerCase().trim();
      list = list.filter(t =>
        t.fullName.ar.toLowerCase().includes(kw) ||
        t.fullName.en.toLowerCase().includes(kw) ||
        t.title.ar.toLowerCase().includes(kw) ||
        t.title.en.toLowerCase().includes(kw)
      );
    }
  }
  return list;
}

export async function getTutorById(id: string): Promise<Tutor | null> {
  // A direct single-doc read (not the collection-wide scan) so Firestore's per-document rules
  // apply correctly — in particular so a tutor can read their OWN doc via isOwnerTutor() even
  // while status is still 'PENDING' (right after approval, before an admin activates them),
  // which an unfiltered collection query would otherwise deny entirely.
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? toTutor(snap.id, snap.data()) : null;
}

// Public detail-page lookup by slug, falling back to a raw id — tutors approved before the slug
// field existed (or a stale bookmark) still resolve.
export async function getTutorBySlug(slug: string): Promise<Tutor | null> {
  const ref = collection(db, COLLECTION);
  const bySlug = await getDocs(query(ref, where('slug', '==', slug), where('status', '==', 'ACTIVE')));
  if (!bySlug.empty) {
    const d = bySlug.docs[0];
    return toTutor(d.id, d.data());
  }
  return getTutorById(slug);
}

export async function saveTutor(tutor: Tutor): Promise<Tutor> {
  const now = new Date().toISOString();
  const toSave: Tutor = { ...tutor, createdAt: tutor.createdAt || now, updatedAt: now };
  await setDoc(doc(db, COLLECTION, toSave.id), toSave, { merge: true });
  return toSave;
}

export async function deleteTutor(id: string): Promise<void> {
  // Firestore doesn't cascade-delete subcollections when their parent doc goes — clean up the
  // private verification doc explicitly so it doesn't linger orphaned.
  await deleteDoc(doc(db, COLLECTION, id, 'private', 'verification')).catch(() => {});
  await deleteDoc(doc(db, COLLECTION, id));
}

// Verification documents live in a private subcollection, not on the tutor doc itself —
// that doc is world-readable once status is 'ACTIVE', which would leak these otherwise.
// Reads the full request (documents + review status), not just the document list — used by both
// the tutor's own dashboard and the admin verification queue (canEditDirectory() can read this
// doc directly per firestore.rules).
export async function getTutorVerificationRequest(tutorId: string): Promise<TutorVerificationRequest> {
  const snap = await getDoc(doc(db, COLLECTION, tutorId, 'private', 'verification'));
  if (!snap.exists()) return { documents: [], status: 'NONE' };
  const data = snap.data();
  return {
    documents: (data.documents as string[]) || [],
    status: (data.status as TutorVerificationRequest['status']) || 'NONE',
    submittedAt: data.submittedAt as string | undefined,
    reviewedAt: data.reviewedAt as string | undefined,
    rejectionReason: data.rejectionReason as string | undefined,
  };
}

// Saves just the document list, from the dashboard's document-upload widget. `merge: true` is
// load-bearing: without it this would blow away the `status`/`reviewedAt`/`rejectionReason`
// fields that the submit/approve/reject routes set on the same doc every time the tutor clicks
// "Save Changes".
export async function saveTutorVerificationDocuments(tutorId: string, documents: string[]): Promise<void> {
  await setDoc(doc(db, COLLECTION, tutorId, 'private', 'verification'), { documents }, { merge: true });
}
