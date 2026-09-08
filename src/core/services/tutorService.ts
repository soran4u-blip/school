import initialSeed from '../seed/seedData.json';
import { Tutor } from '../types/tutor';
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, query, where } from 'firebase/firestore';

const inMemoryTutors: Tutor[] = (initialSeed.tutors as unknown) as Tutor[];

/* =========================================================
   PRIVATE TUTORS
========================================================= */
// `wantsAll` is true only for the admin 'ALL' case — every other caller (the overwhelming
// majority of traffic: the public /tutors listing, explore, search) only ever wants ACTIVE
// tutors. Going straight to the ACTIVE-filtered query for that common case avoids a wasted,
// guaranteed-to-fail unfiltered read on every single public page load — the previous version
// always attempted the unfiltered query first and only fell back to the filtered one once
// Firestore rejected it, doubling the round-trip latency for almost all traffic.
async function getMergedTutors(wantsAll = false): Promise<Tutor[]> {
  let list = inMemoryTutors;
  try {
    if (process.env.NEXT_PUBLIC_USE_FIRESTORE === 'true') {
      let snap;
      if (wantsAll) {
        try {
          snap = await getDocs(collection(db, 'tutors'));
        } catch {
          snap = await getDocs(query(collection(db, 'tutors'), where('status', '==', 'ACTIVE')));
        }
      } else {
        snap = await getDocs(query(collection(db, 'tutors'), where('status', '==', 'ACTIVE')));
      }
      if (!snap.empty) {
        const merged = new Map(list.map(t => [t.id, t]));
        snap.docs.forEach(d => merged.set(d.id, { id: d.id, ...d.data() } as Tutor));
        list = Array.from(merged.values());
      }
    }
  } catch (e) {
    console.warn('Firestore fallback to in-memory store for tutors');
  }
  return list;
}

export async function getTutors(filter?: {
  governorateId?: string;
  subjectId?: string;
  isVerified?: boolean;
  status?: string; // pass 'ALL' (admin use only) to include every status, not just ACTIVE
  keyword?: string;
}): Promise<Tutor[]> {
  let list = await getMergedTutors(filter?.status === 'ALL');
  if (filter?.status === 'ALL') {
    // no status filtering — admin needs to see PENDING/INACTIVE listings too
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
  // A direct single-doc read (not the collection-wide getMergedTutors scan) so Firestore's
  // per-document rules apply correctly — in particular so a tutor can read their OWN doc via
  // isOwnerTutor() even while status is still 'PENDING' (e.g. right after approval, before an
  // admin activates them), which an unfiltered collection query would otherwise deny entirely.
  try {
    if (process.env.NEXT_PUBLIC_USE_FIRESTORE === 'true') {
      const snap = await getDoc(doc(db, 'tutors', id));
      if (snap.exists()) return { id: snap.id, ...snap.data() } as Tutor;
    }
  } catch (e) {
    console.warn('Firestore fallback to in-memory store for tutor', id);
  }
  return inMemoryTutors.find(t => t.id === id) || null;
}

// Public detail-page lookup by slug, falling back to a raw id — tutors approved before the slug
// field existed (or a stale bookmark) still resolve.
export async function getTutorBySlug(slug: string): Promise<Tutor | null> {
  const list = await getMergedTutors();
  return list.find(t => t.slug === slug) || getTutorById(slug);
}

export async function saveTutor(tutor: Tutor): Promise<Tutor> {
  const now = new Date().toISOString();
  const toSave: Tutor = { ...tutor, createdAt: tutor.createdAt || now, updatedAt: now };

  try {
    if (process.env.NEXT_PUBLIC_USE_FIRESTORE === 'true') {
      await setDoc(doc(db, 'tutors', toSave.id), toSave, { merge: true });
    }
  } catch (e) {
    console.warn('Error persisting tutor to Firestore:', e);
  }

  const idx = inMemoryTutors.findIndex(t => t.id === toSave.id);
  if (idx >= 0) {
    inMemoryTutors[idx] = toSave;
  } else {
    inMemoryTutors.push(toSave);
  }
  return toSave;
}

export async function deleteTutor(id: string): Promise<void> {
  try {
    if (process.env.NEXT_PUBLIC_USE_FIRESTORE === 'true') {
      // Firestore doesn't cascade-delete subcollections when their parent doc goes —
      // clean up the private verification doc explicitly so it doesn't linger orphaned.
      await deleteDoc(doc(db, 'tutors', id, 'private', 'verification')).catch(() => {});
      await deleteDoc(doc(db, 'tutors', id));
    }
  } catch (e) {
    console.warn('Error deleting tutor from Firestore:', e);
  }
  const idx = inMemoryTutors.findIndex(t => t.id === id);
  if (idx >= 0) inMemoryTutors.splice(idx, 1);
}

// Verification documents live in a private subcollection, not on the tutor doc itself —
// that doc is world-readable once status is 'ACTIVE', which would leak these otherwise.
export async function getTutorVerificationDocuments(tutorId: string): Promise<string[]> {
  const snap = await getDoc(doc(db, 'tutors', tutorId, 'private', 'verification'));
  return snap.exists() ? (snap.data().documents as string[]) || [] : [];
}

export async function saveTutorVerificationDocuments(tutorId: string, documents: string[]): Promise<void> {
  await setDoc(doc(db, 'tutors', tutorId, 'private', 'verification'), { documents });
}
