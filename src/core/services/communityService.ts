import { CommunityPost, CommunityReply } from '../types/community';
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';

/* =========================================================
   COMMUNITY DISCUSSION BOARDS (governorate-scoped Q&A)
========================================================= */
export async function createCommunityPost(post: Omit<CommunityPost, 'id' | 'createdAt' | 'status' | 'replyCount'>): Promise<CommunityPost> {
  const ref = doc(collection(db, 'communityPosts'));
  const newPost: CommunityPost = { ...post, id: ref.id, status: 'PENDING', replyCount: 0, createdAt: new Date().toISOString() };
  await setDoc(ref, newPost);
  return newPost;
}

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

export async function getAllCommunityPosts(): Promise<CommunityPost[]> {
  const snap = await getDocs(collection(db, 'communityPosts'));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as CommunityPost))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
