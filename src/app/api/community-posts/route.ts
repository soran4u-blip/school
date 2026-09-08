import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/core/firebase/admin';
import { CommunityPost } from '@/core/types/community';
import { checkRateLimit, getClientIp } from '@/core/server/rateLimit';
import { slugify } from '@/lib/slug';
import { parseJsonBody } from '@/core/validation/apiValidation';
import { communityPostSchema } from '@/core/validation/schemas';

// POST /api/community-posts — Admin SDK only now (firestore.rules denies client creates), so a
// guest posting a question is rate-limited by IP rather than relying on freely-mintable
// anonymous Firebase Auth sessions, which had no real abuse protection.
export async function POST(request: NextRequest) {
  if (!adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(adminDb, `community-post:ip:${ip}`, { max: 3, windowMinutes: 60 });
  if (!rateLimit.allowed) {
    return NextResponse.json({ success: false, error: 'Too many posts submitted recently. Please try again later.' }, { status: 429 });
  }

  const parsed = await parseJsonBody(request, communityPostSchema);
  if (parsed.error) return parsed.error;
  const { governorateId, authorName, title, body: postBody } = parsed.data;

  const govSnap = await adminDb.collection('locations_governorates').doc(governorateId).get();
  if (!govSnap.exists) {
    return NextResponse.json({ success: false, error: 'Invalid governorate' }, { status: 400 });
  }

  const ref = adminDb.collection('communityPosts').doc();
  const now = new Date().toISOString();
  const post: CommunityPost = {
    id: ref.id,
    slug: slugify(title, ref.id.slice(-6), 'post'),
    governorateId,
    authorName,
    title,
    body: postBody,
    status: 'PENDING',
    replyCount: 0,
    createdAt: now,
  };
  await ref.set(post);

  return NextResponse.json({ success: true, post });
}
