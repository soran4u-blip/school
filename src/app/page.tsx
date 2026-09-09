import HomeContent from './HomeContent';
import { getActiveInstitutions } from '@/core/server/data/institutions';
import { getActiveTutors } from '@/core/server/data/tutors';
import {
  getPublicCategories,
  getPublicGovernorates,
  getPublicQuickSearchTags,
  getPublicSystemSettings,
  getPublicTaxonomies,
} from '@/core/server/data/masterData';

// Server-rendered — see the note on /institutions/[slug]/page.tsx for why this is force-dynamic
// rather than prerendered, and ./core/server/data/cache.ts for why request-time rendering here
// does not mean a Firestore read per visitor.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [categories, governorates, quickTags, institutions, tutors, settings, taxonomies] = await Promise.all([
    getPublicCategories(),
    getPublicGovernorates(),
    getPublicQuickSearchTags(),
    getActiveInstitutions(),
    getActiveTutors(),
    getPublicSystemSettings(),
    getPublicTaxonomies(),
  ]);

  return (
    <HomeContent
      categories={categories}
      governorates={governorates}
      quickTags={quickTags}
      featuredInstitutions={institutions}
      featuredTutors={tutors}
      subjects={taxonomies.filter((tx) => tx.type === 'SUBJECT')}
      settings={settings}
    />
  );
}
