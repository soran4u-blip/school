import { Review, Inquiry } from '../types/review';
import { db } from '../firebase/config';
import {
  collection, getDocs, getCountFromServer, doc, setDoc, updateDoc, query, where, orderBy, limit, startAfter,
  onSnapshot, Unsubscribe, QueryDocumentSnapshot, DocumentData,
} from 'firebase/firestore';

/* =========================================================
   REVIEWS
========================================================= */
// Review creation now goes exclusively through the Admin SDK (/api/reviews) — see
// firestore.rules' `reviews` match block — since it needs to rate-limit submissions and check
// real proof of interaction before granting the "Verified Student" badge.

export async function getApprovedReviews(institutionId: string): Promise<Review[]> {
  const q = query(
    collection(db, 'reviews'),
    where('institutionId', '==', institutionId),
    where('status', '==', 'APPROVED')
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Review))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getApprovedTutorReviews(tutorId: string): Promise<Review[]> {
  const q = query(
    collection(db, 'reviews'),
    where('tutorId', '==', tutorId),
    where('status', '==', 'APPROVED')
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Review))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getAllReviews(): Promise<Review[]> {
  const snap = await getDocs(collection(db, 'reviews'));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Review))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// See getPendingApplicationsCount — same reasoning, same sidebar-badge call site.
export async function getPendingReviewsCount(): Promise<number> {
  const snap = await getCountFromServer(query(collection(db, 'reviews'), where('status', '==', 'PENDING')));
  return snap.data().count;
}

// See getPendingApplications — same reasoning: the admin's actionable moderation queue, kept
// full since it's small in practice, versus the paginated history below.
export async function getPendingReviews(): Promise<Review[]> {
  const snap = await getDocs(query(collection(db, 'reviews'), where('status', '==', 'PENDING')));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Review))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// See getApplicationsPage — same pagination approach.
export async function getReviewsPage(
  pageSize: number,
  cursor?: QueryDocumentSnapshot<DocumentData>
): Promise<{ items: Review[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null; hasMore: boolean }> {
  const constraints = [orderBy('createdAt', 'desc'), ...(cursor ? [startAfter(cursor)] : []), limit(pageSize + 1)];
  const snap = await getDocs(query(collection(db, 'reviews'), ...constraints));
  const docs = snap.docs.slice(0, pageSize);
  return {
    items: docs.map(d => ({ id: d.id, ...d.data() } as Review)),
    lastDoc: docs.length ? docs[docs.length - 1] : null,
    hasMore: snap.docs.length > pageSize,
  };
}

// Moderation goes through the Admin SDK route rather than a client-SDK write: approving or
// un-approving a review has to move the reviewed party's rating aggregates in the same
// transaction (see src/core/server/ratings.ts), and firestore.rules now denies the direct write
// that used to make drift possible. The old version of this function updated the aggregates only
// on the way *in* to APPROVED, so rejecting or deleting an approved review left them inflated.
export async function updateReviewStatus(id: string, status: Review['status']): Promise<void> {
  const res = await fetch(`/api/admin/reviews/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Could not update the review');
  }
}

export async function deleteReview(id: string): Promise<void> {
  const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Could not delete the review');
  }
}

// Tutor replying to their own approved review — firestore.rules restricts this update to
// touching only the `reply` field, so it must be the *only* key in this call's payload.
export async function replyToReview(reviewId: string, text: string): Promise<void> {
  await updateDoc(doc(db, 'reviews', reviewId), {
    reply: { text, createdAt: new Date().toISOString() },
  });
}

/* =========================================================
   INQUIRIES & LEADS
========================================================= */
export async function createInquiry(inquiry: Omit<Inquiry, 'id' | 'createdAt' | 'status'>): Promise<Inquiry> {
  const ref = doc(collection(db, 'inquiries'));
  const newInquiry: Inquiry = { ...inquiry, id: ref.id, status: 'NEW', createdAt: new Date().toISOString() };
  await setDoc(ref, newInquiry);
  return newInquiry;
}

export async function getAllInquiries(): Promise<Inquiry[]> {
  const snap = await getDocs(collection(db, 'inquiries'));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Inquiry))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getNewInquiriesCount(): Promise<number> {
  const snap = await getCountFromServer(query(collection(db, 'inquiries'), where('status', '==', 'NEW')));
  return snap.data().count;
}

// See getApplicationsPage — same pagination approach.
export async function getInquiriesPage(
  pageSize: number,
  cursor?: QueryDocumentSnapshot<DocumentData>
): Promise<{ items: Inquiry[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null; hasMore: boolean }> {
  const constraints = [orderBy('createdAt', 'desc'), ...(cursor ? [startAfter(cursor)] : []), limit(pageSize + 1)];
  const snap = await getDocs(query(collection(db, 'inquiries'), ...constraints));
  const docs = snap.docs.slice(0, pageSize);
  return {
    items: docs.map(d => ({ id: d.id, ...d.data() } as Inquiry)),
    lastDoc: docs.length ? docs[docs.length - 1] : null,
    hasMore: snap.docs.length > pageSize,
  };
}

export async function updateInquiryStatus(id: string, status: Inquiry['status']): Promise<void> {
  await updateInquiry(id, { status });
}

type InquiryUpdate = Partial<Pick<Inquiry, 'status' | 'tags'>> & {
  assignedTo?: string | null;
  assignedToName?: string | null;
  notes?: string | null;
  nextFollowUpAt?: string | null;
};

export async function updateInquiry(id: string, patch: InquiryUpdate): Promise<Inquiry> {
  const res = await fetch(`/api/inquiries/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'Could not update the inquiry');
  return body.inquiry as Inquiry;
}

// An institution's own inquiries (isOwnerInstitution rule scopes this to their own docs only).
export async function getInstitutionInquiries(institutionId: string): Promise<Inquiry[]> {
  const q = query(collection(db, 'inquiries'), where('institutionId', '==', institutionId));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Inquiry))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Live equivalent of getInstitutionInquiries — a new inquiry (or a status change made from
// another device) reaches the dashboard without a refresh, the same way the tutor dashboard
// already watches its bookings. Inquiries are created by a direct client write from the public
// profile, so there's no server hook to push from; this subscription is what makes them visible.
export function subscribeToInstitutionInquiries(institutionId: string, cb: (inquiries: Inquiry[]) => void): Unsubscribe {
  const q = query(collection(db, 'inquiries'), where('institutionId', '==', institutionId));
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Inquiry))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    );
  });
}
