import TutorsList from './TutorsList';
import { getActiveTutors } from '@/core/server/data/tutors';
import { getActiveInstitutions } from '@/core/server/data/institutions';
import { getPublicGovernorates, getPublicTaxonomies } from '@/core/server/data/masterData';

// Server-rendered — see the note on /institutions/[slug]/page.tsx.
export const dynamic = 'force-dynamic';

export default async function TutorsListPage() {
  const [tutors, institutions, governorates, taxonomies] = await Promise.all([
    getActiveTutors(),
    getActiveInstitutions(),
    getPublicGovernorates(),
    getPublicTaxonomies(),
  ]);

  return (
    <TutorsList
      tutors={tutors}
      institutions={institutions}
      governorates={governorates}
      subjects={taxonomies.filter((tx) => tx.type === 'SUBJECT')}
      studentLevels={taxonomies.filter((tx) => tx.type === 'STUDENT_LEVEL')}
    />
  );
}
