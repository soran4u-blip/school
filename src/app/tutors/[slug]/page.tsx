import { notFound } from 'next/navigation';
import TutorProfile from './TutorProfile';
import { getPublicTutorBySlug } from '@/core/server/data/tutors';
import { getPublicTutorReviews } from '@/core/server/data/reviews';
import { getPublicGovernorates, getPublicTaxonomies } from '@/core/server/data/masterData';

// Server-rendered for the same reasons as /institutions/[slug] — see the note there, including
// why this route is force-dynamic rather than prerendered.
export const dynamic = 'force-dynamic';

export default async function TutorProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tutor = await getPublicTutorBySlug(slug);
  if (!tutor) notFound();

  const [reviews, governorates, taxonomies] = await Promise.all([
    getPublicTutorReviews(tutor.id),
    getPublicGovernorates(),
    getPublicTaxonomies(),
  ]);

  return (
    <TutorProfile
      tutor={tutor}
      governorate={governorates.find((g) => g.id === tutor.governorateId) || null}
      subjects={taxonomies.filter((tx) => tx.type === 'SUBJECT' && tutor.subjectIds.includes(tx.id))}
      studentLevels={taxonomies.filter((tx) => tx.type === 'STUDENT_LEVEL' && tutor.studentLevelIds.includes(tx.id))}
      initialReviews={reviews}
    />
  );
}
