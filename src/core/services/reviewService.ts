import { Review, Inquiry } from '../types/review';
import { db } from '../firebase/config';
import {
  collection, getDocs, getCountFromServer, doc, setDoc, updateDoc, query, where, orderBy, limit, startAfter,
  QueryDocumentSnapshot, DocumentData,
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

export async function updateReviewStatus(id: string, status: Review['status'], review: Review): Promise<void> {
  await updateDoc(doc(db, 'reviews', id), { status });
  if (status !== 'APPROVED') return;

  if (review.institutionId) {
    const approved = await getApprovedReviews(review.institutionId);
    const ratingAvg = approved.length
      ? Number((approved.reduce((sum, r) => sum + r.rating, 0) / approved.length).toFixed(1))
      : 0;
    await updateDoc(doc(db, 'institutions', review.institutionId), {
      'metrics.ratingAvg': ratingAvg,
      'metrics.reviewCount': approved.length,
    });
  } else if (review.tutorId) {
    const approved = await getApprovedTutorReviews(review.tutorId);
    const ratingAvg = approved.length
      ? Number((approved.reduce((sum, r) => sum + r.rating, 0) / approved.length).toFixed(1))
      : 0;
    await updateDoc(doc(db, 'tutors', review.tutorId), {
      ratingAvg,
      reviewCount: approved.length,
    });
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
  await updateDoc(doc(db, 'inquiries', id), { status });
}

// An institution's own inquiries (isOwnerInstitution rule scopes this to their own docs only).
export async function getInstitutionInquiries(institutionId: string): Promise<Inquiry[]> {
  const q = query(collection(db, 'inquiries'), where('institutionId', '==', institutionId));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Inquiry))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function replyToInquiry(inquiryId: string, text: string): Promise<void> {
  await updateDoc(doc(db, 'inquiries', inquiryId), {
    reply: { text, createdAt: new Date().toISOString() },
  });
}
