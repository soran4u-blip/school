import { Application } from '../types/application';
import { db } from '../firebase/config';
import {
  collection, getDocs, getCountFromServer, doc, setDoc, query, where, orderBy, limit, startAfter,
  QueryDocumentSnapshot, DocumentData,
} from 'firebase/firestore';

/* =========================================================
   JOIN APPLICATIONS (Tutor / Institution / Employer)
========================================================= */
export async function createApplication(app: Omit<Application, 'id' | 'createdAt' | 'status'>): Promise<Application> {
  const ref = doc(collection(db, 'applications'));
  const newApp: Application = { ...app, id: ref.id, status: 'PENDING', createdAt: new Date().toISOString() };
  // Firestore's client SDK rejects explicit `undefined` field values — drop optional fields the caller left unset.
  const payload = Object.fromEntries(Object.entries(newApp).filter(([, v]) => v !== undefined));
  await setDoc(ref, payload);
  return newApp;
}

export async function getAllApplications(): Promise<Application[]> {
  const snap = await getDocs(collection(db, 'applications'));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Application))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// The admin's actual working queue — applications still needing a decision. Kept as a full,
// unpaginated fetch deliberately: it's a queue that gets cleared by triage, not an ever-growing
// archive, so it should stay small in practice (unlike the full history below). Two single-field
// equality queries (no orderBy) so no composite index is required.
export async function getPendingApplications(): Promise<Application[]> {
  const [pendingSnap, approvingSnap] = await Promise.all([
    getDocs(query(collection(db, 'applications'), where('status', '==', 'PENDING'))),
    getDocs(query(collection(db, 'applications'), where('status', '==', 'APPROVING'))),
  ]);
  return [...pendingSnap.docs, ...approvingSnap.docs]
    .map(d => ({ id: d.id, ...d.data() } as Application))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Paginated full history (all statuses) for the admin applications list, which otherwise
// downloads the whole (unbounded, ever-growing) collection on every page load. orderBy on a
// single field needs no composite index.
export async function getApplicationsPage(
  pageSize: number,
  cursor?: QueryDocumentSnapshot<DocumentData>
): Promise<{ items: Application[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null; hasMore: boolean }> {
  const constraints = [orderBy('createdAt', 'desc'), ...(cursor ? [startAfter(cursor)] : []), limit(pageSize + 1)];
  const snap = await getDocs(query(collection(db, 'applications'), ...constraints));
  const docs = snap.docs.slice(0, pageSize);
  return {
    items: docs.map(d => ({ id: d.id, ...d.data() } as Application)),
    lastDoc: docs.length ? docs[docs.length - 1] : null,
    hasMore: snap.docs.length > pageSize,
  };
}

// Aggregation count (no document downloads) for the sidebar badge, which reloads on every admin
// nav click — fetching every application just to filter+count it client-side doesn't scale.
export async function getPendingApplicationsCount(): Promise<number> {
  const snap = await getCountFromServer(query(collection(db, 'applications'), where('status', '==', 'PENDING')));
  return snap.data().count;
}

// Goes through the server so the decision is attributable, same as approval — see
// core/server/auditLog.ts.
export async function rejectApplication(id: string, rejectionReason?: string): Promise<void> {
  const res = await fetch(`/api/admin/applications/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rejectionReason }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Rejection failed');
  }
}

// Approval provisions a real login (tutors/institutions/employers) via the Admin SDK, so it
// goes through an API route.
export async function approveApplication(id: string): Promise<{ tutorId?: string; resetLink?: string; note?: string }> {
  const res = await fetch(`/api/applications/${id}/approve`, { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Approval failed');
  return data;
}
