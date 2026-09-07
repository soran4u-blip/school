export interface CommunityPost {
  id: string;
  governorateId: string;
  authorName: string;
  title: string;
  body: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  replyCount: number; // denormalized, bumped when a reply is added
  createdAt: string;
}

// Lives in communityPosts/{postId}/replies/{replyId} — public-readable version of
// src/core/types/message.ts's ThreadMessage, no senderRole since everyone here is a guest.
export interface CommunityReply {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
}
