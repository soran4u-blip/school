import HomeContent from './HomeContent';
import { getActiveInstitutions } from '@/core/server/data/institutions';
import { getActiveTutors } from '@/core/server/data/tutors';
import { getActiveEvents } from '@/core/server/data/events';
import { todayLocalDate } from '@/lib/utils';
import {
  getPublicCategories,
  getPublicGovernorates,
  getPublicQuickSearchTags,
  getPublicSystemSettings,
  getPublicTaxonomies,
  getPublicActiveBanners,
} from '@/core/server/data/masterData';

// Server-rendered — see the note on /institutions/[slug]/page.tsx for why this is force-dynamic
// rather than prerendered, and ./core/server/data/cache.ts for why request-time rendering here
// does not mean a Firestore read per visitor.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [categories, governorates, quickTags, institutions, tutors, settings, taxonomies, banners, events] = await Promise.all([
    getPublicCategories(),
    getPublicGovernorates(),
    getPublicQuickSearchTags(),
    getActiveInstitutions(),
    getActiveTutors(),
    getPublicSystemSettings(),
    getPublicTaxonomies(),
    getPublicActiveBanners(),
    getActiveEvents(),
  ]);

  const today = todayLocalDate();
  // Keep the homepage showcase curated and bounded without hiding active listings from search,
  // counts, or the full directory when no records have been featured yet.
  const curatedInstitutions = institutions.filter((institution) => institution.isFeatured).slice(0, 6);
  const homepageInstitutions = (curatedInstitutions.length > 0 ? curatedInstitutions : institutions).slice(0, 6);
  const curatedTutors = tutors.filter((tutor) => tutor.isVerified).sort((a, b) => b.ratingAvg - a.ratingAvg);
  const homepageTutors = (curatedTutors.length > 0 ? curatedTutors : tutors).slice(0, 6);
  const upcomingEvents = events
    .filter((ev) => ev.startDate >= today)
    .slice(0, 3);

  return (
    <HomeContent
      categories={categories}
      governorates={governorates}
      quickTags={quickTags}
      featuredInstitutions={homepageInstitutions}
      directoryInstitutions={institutions}
      featuredTutors={homepageTutors}
      directoryTutors={tutors}
      subjects={taxonomies.filter((tx) => tx.type === 'SUBJECT')}
      settings={settings}
      banners={banners}
      upcomingEvents={upcomingEvents}
    />
  );
}
