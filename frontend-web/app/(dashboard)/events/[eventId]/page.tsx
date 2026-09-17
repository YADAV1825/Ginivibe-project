import { EventDetailScreen } from '@/app/(dashboard)/events/screens/EventDetailScreen';

export default async function EventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return <EventDetailScreen eventId={eventId} />;
}