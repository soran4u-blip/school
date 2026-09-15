import { notFound } from 'next/navigation';
import EventDetail from './EventDetail';
import { getPublicEventBySlug } from '@/core/server/data/events';
import { getPublicInstitutionBySlug } from '@/core/server/data/institutions';
import { getPublicGovernorates } from '@/core/server/data/masterData';

// Server-rendered — see the note on /institutions/[slug]/page.tsx.
export const dynamic = 'force-dynamic';

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getPublicEventBySlug(slug);
  if (!event) notFound();

  const [institution, governorates] = await Promise.all([
    // Institution ids are also document ids, and getPublicInstitutionBySlug falls back to an id
    // lookup, so this resolves an institution-posted event's owner without a second helper.
    event.institutionId ? getPublicInstitutionBySlug(event.institutionId) : Promise.resolve(null),
    getPublicGovernorates(),
  ]);

  return (
    <EventDetail
      event={event}
      institution={institution}
      governorate={governorates.find((g) => g.id === event.governorateId) || null}
    />
  );
}
