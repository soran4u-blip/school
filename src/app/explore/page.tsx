import ExploreDirectory from './ExploreDirectory';
import { getActiveInstitutions } from '@/core/server/data/institutions';
import { getActiveTutors } from '@/core/server/data/tutors';
import { getPublicCategories, getPublicGovernorates, getPublicTaxonomies } from '@/core/server/data/masterData';

// Server-rendered — see the note on /institutions/[slug]/page.tsx.
export const dynamic = 'force-dynamic';

export default async function ExplorePage() {
  const [institutions, tutors, categories, governorates, taxonomies] = await Promise.all([
    getActiveInstitutions(),
    getActiveTutors(),
    getPublicCategories(),
    getPublicGovernorates(),
    getPublicTaxonomies(),
  ]);

  return (
    <ExploreDirectory
      institutions={institutions}
      tutors={tutors}
      subjects={taxonomies.filter((tx) => tx.type === 'SUBJECT')}
      categories={categories}
      governorates={governorates}
      accreditations={taxonomies.filter((tx) => tx.type === 'ACCREDITATION')}
      curricula={taxonomies.filter((tx) => tx.type === 'CURRICULUM')}
    />
  );
}
