import { CommunityPost, CommunityReply } from '../types/community';
import { db } from '../firebase/config';
import { collection, getDocs, getCountFromServer, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, runTransaction, increment, serverTimestamp } from 'firebase/firestore';

/* =========================================================
   COMMUNITY DISCUSSION BOARDS (governorate-scoped Q&A)
========================================================= */
// Post creation now goes exclusively through the Admin SDK (/api/community-posts) — see
// firestore.rules' `communityPosts` match block — since it needs to rate-limit by IP rather
// than trust freely-mintable anonymous Firebase Auth sessions.

// Public feed — jobs are dynamic like Jobs/Inquiries so no in-memory fallback. Filtered only by
// status in the query (the field firestore.rules' read check inspects); governorateId is
// filtered client-side, same approach as getActiveJobs().
export async function getApprovedCommunityPosts(governorateId?: string): Promise<CommunityPost[]> {
  const q = query(collection(db, 'communityPosts'), where('status', '==', 'APPROVED'));
  const snap = await getDocs(q);
  let posts = snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityPost));
  if (governorateId) posts = posts.filter(p => p.governorateId === governorateId);
  return posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Direct getDoc, bypassing the bulk-query status restriction — so a still-PENDING post is still
// reachable by whoever posted it (informational) or the admin queue, same reasoning as
// getJobById/getInstitutionById.
export async function getCommunityPostById(id: string): Promise<CommunityPost | null> {
  const snap = await getDoc(doc(db, 'communityPosts', id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as CommunityPost) : null;
}

// Public detail-page lookup by slug, falling back to a raw id — posts created before the slug
// field existed (or a stale bookmark) still resolve. The query filters on `status` alongside
// `slug` because firestore.rules' read check is keyed off resource.data.status — a query whose
// `where` doesn't include that exact field gets rejected outright for an unauthenticated reader,
// same reasoning as getInstitutionJobApplications' institutionId filter above.
export async function getCommunityPostBySlug(slug: string): Promise<CommunityPost | null> {
  try {
    const q = query(collection(db, 'communityPosts'), where('slug', '==', slug), where('status', '==', 'APPROVED'));
    const snap = await getDocs(q);
    if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() } as CommunityPost;
  } catch {
    // fall through to id-based lookup
  }
  return getCommunityPostById(slug);
}

export async function getAllCommunityPosts(): Promise<CommunityPost[]> {
  const snap = await getDocs(collection(db, 'communityPosts'));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as CommunityPost))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// See getPendingApplicationsCount — same reasoning, same sidebar-badge call site.
export async function getPendingCommunityPostsCount(): Promise<number> {
  const snap = await getCountFromServer(query(collection(db, 'communityPosts'), where('status', '==', 'PENDING')));
  return snap.data().count;
}

export async function updateCommunityPostStatus(id: string, status: CommunityPost['status']): Promise<void> {
  await updateDoc(doc(db, 'communityPosts', id), { status });
}

export async function deleteCommunityPost(id: string): Promise<void> {
  await deleteDoc(doc(db, 'communityPosts', id));
}

export async function getCommunityReplies(postId: string): Promise<CommunityReply[]> {
  const q = query(collection(db, 'communityPosts', postId, 'replies'), orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as CommunityReply);
}

export async function createCommunityReply(postId: string, currentReplyCount: number, reply: Omit<CommunityReply, 'id' | 'createdAt'>): Promise<CommunityReply> {
  const replyRef = doc(collection(db, 'communityPosts', postId, 'replies'));
  const newReply: CommunityReply = { ...reply, id: replyRef.id, createdAt: new Date().toISOString() };
  await setDoc(replyRef, newReply);
  await updateDoc(doc(db, 'communityPosts', postId), { replyCount: currentReplyCount + 1 });
  return newReply;
}

export async function deleteCommunityReply(postId: string, replyId: string): Promise<void> {
  await deleteDoc(doc(db, 'communityPosts', postId, 'replies', replyId));
}

// "Helpful" like tracking. One like per Firebase Auth identity (anonymous sessions included),
// recorded as communityPosts/{postId}/likes/{uid} so a page reload can tell whether the current
// visitor already liked a post, mirroring isGuestAddingReplyCount's guest-write pattern in
// firestore.rules but for the post's denormalized helpfulCount instead of replyCount.
export async function hasLikedCommunityPost(postId: string, uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'communityPosts', postId, 'likes', uid));
  return snap.exists();
}

export async function toggleCommunityPostLike(postId: string, uid: string): Promise<{ liked: boolean; helpfulCount: number }> {
  const postRef = doc(db, 'communityPosts', postId);
  const likeRef = doc(db, 'communityPosts', postId, 'likes', uid);

  return runTransaction(db, async (tx) => {
    const [postSnap, likeSnap] = await Promise.all([tx.get(postRef), tx.get(likeRef)]);
    const currentCount = (postSnap.data()?.helpfulCount as number | undefined) || 0;
    const alreadyLiked = likeSnap.exists();

    if (alreadyLiked) {
      tx.delete(likeRef);
      tx.update(postRef, { helpfulCount: increment(-1) });
      return { liked: false, helpfulCount: Math.max(0, currentCount - 1) };
    }

    tx.set(likeRef, { createdAt: serverTimestamp() });
    tx.update(postRef, { helpfulCount: increment(1) });
    return { liked: true, helpfulCount: currentCount + 1 };
  });
}
