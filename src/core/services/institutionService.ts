import { Institution } from '../types/institution';
import { db } from '../firebase/config';
import { collection, getDocs, getDoc, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';

/* =========================================================
   INSTITUTIONS DIRECTORY
========================================================= */
// Firestore is the only source of truth here. An earlier version of this file seeded itself from
// seedData.json and merged Firestore results on top, which meant a seeded record that wasn't in
// Firestore could never be deleted (it reappeared on the next load from the bundled JSON), and
// shipped ~34KB of demo data to every visitor's browser. Writes likewise swallowed their errors
// and updated a module-level array instead, so the UI reported success while nothing persisted.
// Both are gone: reads return what Firestore returns, writes throw when they fail.

const COLLECTION = 'institutions';

// `{ ...data, id: doc.id }` and not the reverse — the document key is authoritative, so a stale
// or forged `id` field inside the document can't shadow it.
function toInstitution(id: string, data: Record<string, unknown>): Institution {
  return { ...data, id } as Institution;
}

// `wantsAll` is true only for the admin 'ALL' case — every other caller (the overwhelming
// majority of traffic: the public directory, explore, search) only ever wants ACTIVE
// institutions. Going straight to the ACTIVE-filtered query for that common case avoids a
// wasted, guaranteed-to-fail unfiltered read on every single public page load: the unfiltered
// list is only permitted by the rules for an authenticated superadmin, since public callers must
// filter on `status` to match the rule's data-dependent branch.
async function fetchInstitutions(wantsAll = false): Promise<Institution[]> {
  const ref = collection(db, COLLECTION);
  const snap = wantsAll
    ? await getDocs(ref)
    : await getDocs(query(ref, where('status', '==', 'ACTIVE')));
  return snap.docs.map((d) => toInstitution(d.id, d.data()));
}

export async function getInstitutions(filter?: {
  categoryId?: string;
  governorateId?: string;
  keyword?: string;
  isVerified?: boolean;
  status?: string; // pass 'ALL' (admin use only) to include every status, not just ACTIVE
}): Promise<Institution[]> {
  let list = await fetchInstitutions(filter?.status === 'ALL');
  if (filter?.status === 'ALL') {
    // no status filtering — admin needs to see PENDING/SUSPENDED listings too
  } else if (filter?.status) {
    list = list.filter(i => i.status === filter.status);
  } else {
    list = list.filter(i => i.status === 'ACTIVE');
  }
  if (filter) {
    if (filter.categoryId && filter.categoryId !== 'all') {
      list = list.filter(i => i.categoryId === filter.categoryId);
    }
    if (filter.governorateId && filter.governorateId !== 'all') {
      list = list.filter(i => i.governorateId === filter.governorateId);
    }
    if (filter.isVerified !== undefined) {
      list = list.filter(i => i.isVerified === filter.isVerified);
    }
    if (filter.keyword) {
      const kw = filter.keyword.toLowerCase().trim();
      list = list.filter(i =>
        i.name.ar.toLowerCase().includes(kw) ||
        i.name.en.toLowerCase().includes(kw) ||
        i.description.ar.toLowerCase().includes(kw) ||
        i.description.en.toLowerCase().includes(kw) ||
        i.address.ar.toLowerCase().includes(kw)
      );
    }
  }
  return list;
}

export async function getInstitutionById(id: string): Promise<Institution | null> {
  // A direct single-doc read (not the collection-wide scan) — an unfiltered collection query
  // gets denied entirely for a signed-in owner whose own doc is still 'PENDING' (e.g. right
  // after approval, before an admin activates it), even though isOwnerInstitution() already
  // permits reading that doc directly.
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? toInstitution(snap.id, snap.data()) : null;
}

export async function getInstitutionBySlug(slug: string): Promise<Institution | null> {
  const ref = collection(db, COLLECTION);
  const bySlug = await getDocs(query(ref, where('slug', '==', slug), where('status', '==', 'ACTIVE')));
  if (!bySlug.empty) {
    const d = bySlug.docs[0];
    return toInstitution(d.id, d.data());
  }
  // Institutions created before the slug field existed (or a stale bookmark) still resolve by id.
  return getInstitutionById(slug);
}

export async function saveInstitution(inst: Institution): Promise<Institution> {
  const now = new Date().toISOString();
  const toSave: Institution = { ...inst, createdAt: inst.createdAt || now, updatedAt: now };
  await setDoc(doc(db, COLLECTION, toSave.id), toSave, { merge: true });
  return toSave;
}

export async function saveAdminInstitution(inst: Institution): Promise<Institution> {
  const res = await fetch('/api/admin/institutions', {
    method: inst.createdAt ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inst),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'Could not save the institution');
  return body.institution as Institution;
}

export async function deleteInstitution(id: string): Promise<void> {
  // Firestore doesn't cascade-delete subcollections when their parent doc goes.
  await deleteDoc(doc(db, COLLECTION, id, 'private', 'verification')).catch(() => {});
  await deleteDoc(doc(db, COLLECTION, id));
}

// Accreditation/verification documents live in a private subcollection, same reasoning as
// the tutor equivalent — the institution doc is world-readable once status is 'ACTIVE'.
export async function getInstitutionVerificationDocuments(institutionId: string): Promise<string[]> {
  const snap = await getDoc(doc(db, COLLECTION, institutionId, 'private', 'verification'));
  return snap.exists() ? (snap.data().documents as string[]) || [] : [];
}

export async function saveInstitutionVerificationDocuments(institutionId: string, documents: string[]): Promise<void> {
  await setDoc(doc(db, COLLECTION, institutionId, 'private', 'verification'), { documents });
}
