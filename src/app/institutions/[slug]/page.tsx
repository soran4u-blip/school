import { notFound } from 'next/navigation';
import InstitutionProfile from './InstitutionProfile';
import { getPublicInstitutionBySlug } from '@/core/server/data/institutions';
import { getPublicInstitutionReviews } from '@/core/server/data/reviews';
import { getPublicGovernorates, getPublicCategories } from '@/core/server/data/masterData';

// Rendered on the server so the profile's content — name, description, programs, reviews — is in
// the HTML a crawler receives, instead of appearing only after the browser has finished its own
// round of Firestore reads. The interactive parts (apply, inquire, review, tabs) live in the
// client island this renders.
//
// force-dynamic because FIREBASE_SERVICE_ACCOUNT_KEY is a runtime-only secret (see
// docs/deployment.md), so the Admin SDK isn't available during the build and these pages can't be
// prerendered then. Cost is still bounded: the reads below are cached snapshots shared by every
// visitor, so request-time rendering doesn't mean request-time Firestore reads.
export const dynamic = 'force-dynamic';

export default async function InstitutionProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const institution = await getPublicInstitutionBySlug(slug);
  if (!institution) notFound();

  const [reviews, governorates, categories] = await Promise.all([
    getPublicInstitutionReviews(institution.id),
    getPublicGovernorates(),
    getPublicCategories(),
  ]);

  return (
    <InstitutionProfile
      institution={institution}
      governorate={governorates.find((g) => g.id === institution.governorateId) || null}
      category={categories.find((c) => c.slug === institution.categoryId) || null}
      initialReviews={reviews}
    />
  );
}
