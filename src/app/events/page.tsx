import EventsList from './EventsList';
import { getActiveEvents } from '@/core/server/data/events';
import { getPublicGovernorates } from '@/core/server/data/masterData';

// Server-rendered — see the note on /institutions/[slug]/page.tsx.
export const dynamic = 'force-dynamic';

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ governorate?: string | string[] }> }) {
  const [events, governorates] = await Promise.all([
    getActiveEvents(),
    getPublicGovernorates(),
  ]);
  const params = await searchParams;
  const initialGovernorate = typeof params.governorate === 'string' ? params.governorate : undefined;

  return <EventsList events={events} governorates={governorates} initialGovernorate={initialGovernorate} />;
}
