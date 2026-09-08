import type { Metadata } from 'next';
import { getCommunityPostBySlug } from '@/core/services/communityService';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getCommunityPostBySlug(slug);

  if (!post || post.status !== 'APPROVED') {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.title,
    description: post.body.slice(0, 160),
    openGraph: {
      title: post.title,
      description: post.body.slice(0, 160),
      type: 'article',
    },
    alternates: {
      canonical: `/community/${post.slug || post.id}`,
    },
  };
}

export default async function CommunityPostLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getCommunityPostBySlug(slug);

  if (!post || post.status !== 'APPROVED') {
    return children;
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: post.title,
    text: post.body,
    datePublished: post.createdAt,
    author: { '@type': 'Person', name: post.authorName },
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/CommentAction',
      userInteractionCount: post.replyCount,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  );
}
