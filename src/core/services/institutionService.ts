import initialSeed from '../seed/seedData.json';
import { Institution } from '../types/institution';
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, query, where } from 'firebase/firestore';

const inMemoryInstitutions: Institution[] = (initialSeed.institutions as unknown) as Institution[];

/* =========================================================
   INSTITUTIONS DIRECTORY
========================================================= */
async function getMergedInstitutions(): Promise<Institution[]> {
  let list = inMemoryInstitutions;
  try {
    if (process.env.NEXT_PUBLIC_USE_FIRESTORE === 'true') {
      // Unfiltered list is only permitted by the rules for an authenticated superadmin
      // (whose access doesn't depend on resource.data). Unauthenticated/public callers
      // must filter on `status` to match the rule's data-dependent branch, or Firestore
      // denies the list outright — fall back to that filtered query in that case.
      let snap;
      try {
        snap = await getDocs(collection(db, 'institutions'));
      } catch {
        snap = await getDocs(query(collection(db, 'institutions'), where('status', '==', 'ACTIVE')));
      }
      if (!snap.empty) {
        const merged = new Map(list.map(i => [i.id, i]));
        snap.docs.forEach(d => merged.set(d.id, { id: d.id, ...d.data() } as Institution));
        list = Array.from(merged.values());
      }
    }
  } catch (e) {
    console.warn('Firestore fallback to in-memory store for institutions');
  }
  return list;
}

export async function getInstitutions(filter?: {
  categoryId?: string;
  governorateId?: string;
  keyword?: string;
  isVerified?: boolean;
  status?: string; // pass 'ALL' (admin use only) to include every status, not just ACTIVE
}): Promise<Institution[]> {
  let list = await getMergedInstitutions();
  if (filter?.status === 'ALL') {
    // no status filtering — admin needs to see PENDING/INACTIVE listings too
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
  // A direct single-doc read (not the collection-wide getMergedInstitutions scan) — same fix
  // as getTutorById, for the same reason: an unfiltered collection query gets denied entirely
  // for a signed-in owner whose own doc is still 'PENDING' (e.g. right after approval, before
  // an admin activates it), even though isOwnerInstitution() already permits reading that doc
  // directly.
  try {
    if (process.env.NEXT_PUBLIC_USE_FIRESTORE === 'true') {
      const snap = await getDoc(doc(db, 'institutions', id));
      if (snap.exists()) return { id: snap.id, ...snap.data() } as Institution;
    }
  } catch (e) {
    console.warn('Firestore fallback to in-memory store for institution', id);
  }
  return inMemoryInstitutions.find(i => i.id === id) || null;
}

export async function getInstitutionBySlug(slug: string): Promise<Institution | null> {
  const list = await getMergedInstitutions();
  return list.find(i => i.slug === slug || i.id === slug) || null;
}

export async function saveInstitution(inst: Institution): Promise<Institution> {
  const now = new Date().toISOString();
  const toSave: Institution = { ...inst, createdAt: inst.createdAt || now, updatedAt: now };

  try {
    if (process.env.NEXT_PUBLIC_USE_FIRESTORE === 'true') {
      await setDoc(doc(db, 'institutions', toSave.id), toSave, { merge: true });
    }
  } catch (e) {
    console.warn('Error persisting institution to Firestore:', e);
  }

  const idx = inMemoryInstitutions.findIndex(i => i.id === toSave.id);
  if (idx >= 0) {
    inMemoryInstitutions[idx] = toSave;
  } else {
    inMemoryInstitutions.push(toSave);
  }
  return toSave;
}

export async function deleteInstitution(id: string): Promise<void> {
  try {
    if (process.env.NEXT_PUBLIC_USE_FIRESTORE === 'true') {
      // Firestore doesn't cascade-delete subcollections when their parent doc goes.
      await deleteDoc(doc(db, 'institutions', id, 'private', 'verification')).catch(() => {});
      await deleteDoc(doc(db, 'institutions', id));
    }
  } catch (e) {
    console.warn('Error deleting institution from Firestore:', e);
  }
  const idx = inMemoryInstitutions.findIndex(i => i.id === id);
  if (idx >= 0) inMemoryInstitutions.splice(idx, 1);
}

// Accreditation/verification documents live in a private subcollection, same reasoning as
// the tutor equivalent — the institution doc is world-readable once status is 'ACTIVE'.
export async function getInstitutionVerificationDocuments(institutionId: string): Promise<string[]> {
  const snap = await getDoc(doc(db, 'institutions', institutionId, 'private', 'verification'));
  return snap.exists() ? (snap.data().documents as string[]) || [] : [];
}

export async function saveInstitutionVerificationDocuments(institutionId: string, documents: string[]): Promise<void> {
  await setDoc(doc(db, 'institutions', institutionId, 'private', 'verification'), { documents });
}
