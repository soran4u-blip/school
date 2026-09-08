import type { MetadataRoute } from 'next';
import { getInstitutions } from '@/core/services/institutionService';
import { getTutors } from '@/core/services/tutorService';
import { getActiveJobs } from '@/core/services/jobService';
import { getApprovedCommunityPosts } from '@/core/services/communityService';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/en`, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/explore`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/en/explore`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/tutors`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/en/tutors`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/jobs`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteUrl}/en/jobs`, changeFrequency: 'daily', priority: 0.8 },
    // No /en/community — posts are single-language user content with no .en field, see
    // src/app/community/layout.tsx for why that route isn't mirrored.
    { url: `${siteUrl}/community`, changeFrequency: 'daily', priority: 0.6 },
  ];

  const [institutions, tutors, jobs, communityPosts] = await Promise.all([
    getInstitutions({ status: 'ACTIVE' }),
    getTutors({ status: 'ACTIVE' }),
    getActiveJobs(),
    getApprovedCommunityPosts(),
  ]);

  const institutionRoutes: MetadataRoute.Sitemap = institutions.flatMap((inst) => [
    {
      url: `${siteUrl}/institutions/${inst.slug}`,
      lastModified: inst.updatedAt ? new Date(inst.updatedAt) : undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${siteUrl}/en/institutions/${inst.slug}`,
      lastModified: inst.updatedAt ? new Date(inst.updatedAt) : undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
  ]);

  const tutorRoutes: MetadataRoute.Sitemap = tutors.flatMap((tutor) => [
    {
      url: `${siteUrl}/tutors/${tutor.slug || tutor.id}`,
      lastModified: tutor.updatedAt ? new Date(tutor.updatedAt) : undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${siteUrl}/en/tutors/${tutor.slug || tutor.id}`,
      lastModified: tutor.updatedAt ? new Date(tutor.updatedAt) : undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
  ]);

  const jobRoutes: MetadataRoute.Sitemap = jobs.flatMap((job) => [
    {
      url: `${siteUrl}/jobs/${job.slug || job.id}`,
      lastModified: job.updatedAt ? new Date(job.updatedAt) : undefined,
      changeFrequency: 'daily' as const,
      priority: 0.6,
    },
    {
      url: `${siteUrl}/en/jobs/${job.slug || job.id}`,
      lastModified: job.updatedAt ? new Date(job.updatedAt) : undefined,
      changeFrequency: 'daily' as const,
      priority: 0.6,
    },
  ]);

  const communityRoutes: MetadataRoute.Sitemap = communityPosts.map((post) => ({
    url: `${siteUrl}/community/${post.slug || post.id}`,
    lastModified: post.createdAt ? new Date(post.createdAt) : undefined,
    changeFrequency: 'monthly',
    priority: 0.4,
  }));

  return [...staticRoutes, ...institutionRoutes, ...tutorRoutes, ...jobRoutes, ...communityRoutes];
}
