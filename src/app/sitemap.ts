import type { MetadataRoute } from 'next';
import { getActiveInstitutions } from '@/core/server/data/institutions';
import { getActiveTutors } from '@/core/server/data/tutors';
import { getActiveJobs } from '@/core/server/data/jobs';
import { getPublicCommunityPosts } from '@/core/server/data/community';
import { SUPPORTED_LANGUAGES } from '@/lib/locales';
import { absoluteLocaleUrl, hreflangUrls } from '@/lib/seo';
import { siteUrl } from '@/lib/siteUrl';

type Entry = MetadataRoute.Sitemap[number];

// Built from the cached server-side snapshots rather than the browser SDK. It also can't be
// prerendered: the Admin SDK's service account is a runtime-only secret, and a sitemap that
// silently built empty at build time would be worse than one generated on request.
export const dynamic = 'force-dynamic';

// One entry per language version of a page (Arabic unprefixed, /en, /ku), each listing all the
// others as hreflang alternates. Driven by the locale config, so a new language needs no edit here.
function localizedEntries(path: string, extra: Omit<Entry, 'url' | 'alternates'>): Entry[] {
  const languages = hreflangUrls(path);
  return SUPPORTED_LANGUAGES.map((language) => ({
    url: absoluteLocaleUrl(path, language),
    alternates: { languages },
    ...extra,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    ...localizedEntries('/', { changeFrequency: 'daily', priority: 1 }),
    ...localizedEntries('/explore', { changeFrequency: 'daily', priority: 0.9 }),
    ...localizedEntries('/tutors', { changeFrequency: 'daily', priority: 0.9 }),
    ...localizedEntries('/jobs', { changeFrequency: 'daily', priority: 0.8 }),
    // Community is Arabic-only — posts are single-language user content, so there is no /en or /ku
    // community route; see src/app/community/layout.tsx for why that route isn't mirrored.
    { url: `${siteUrl}/community`, changeFrequency: 'daily', priority: 0.6 },
  ];

  const [institutions, tutors, jobs, communityPosts] = await Promise.all([
    getActiveInstitutions(),
    getActiveTutors(),
    getActiveJobs(),
    getPublicCommunityPosts(),
  ]);

  const institutionRoutes = institutions.flatMap((inst) =>
    localizedEntries(`/institutions/${inst.slug}`, {
      lastModified: inst.updatedAt ? new Date(inst.updatedAt) : undefined,
      changeFrequency: 'weekly',
      priority: 0.7,
    }),
  );

  const tutorRoutes = tutors.flatMap((tutor) =>
    localizedEntries(`/tutors/${tutor.slug || tutor.id}`, {
      lastModified: tutor.updatedAt ? new Date(tutor.updatedAt) : undefined,
      changeFrequency: 'weekly',
      priority: 0.7,
    }),
  );

  const jobRoutes = jobs.flatMap((job) =>
    localizedEntries(`/jobs/${job.slug || job.id}`, {
      lastModified: job.updatedAt ? new Date(job.updatedAt) : undefined,
      changeFrequency: 'daily',
      priority: 0.6,
    }),
  );

  const communityRoutes: MetadataRoute.Sitemap = communityPosts.map((post) => ({
    url: `${siteUrl}/community/${post.slug || post.id}`,
    lastModified: post.createdAt ? new Date(post.createdAt) : undefined,
    changeFrequency: 'monthly',
    priority: 0.4,
  }));

  return [...staticRoutes, ...institutionRoutes, ...tutorRoutes, ...jobRoutes, ...communityRoutes];
}
