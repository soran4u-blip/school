import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/core/firebase/admin';
import { CommunityPost } from '@/core/types/community';
import { checkRateLimit, getClientIp } from '@/core/server/rateLimit';
import { slugify } from '@/lib/slug';

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

  const body = await request.json().catch(() => null);
  const governorateId: string | undefined = body?.governorateId;
  const authorName: string | undefined = body?.authorName?.trim();
  const title: string | undefined = body?.title?.trim();
  const postBody: string | undefined = body?.body?.trim();

  if (!governorateId || !authorName || !title || !postBody) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }
  if (authorName.length > 100 || title.length > 150 || postBody.length > 3000) {
    return NextResponse.json({ success: false, error: 'One or more fields are too long' }, { status: 400 });
  }

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
