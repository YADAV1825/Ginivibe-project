'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/app/core/components/Card';
import { Button } from '@/app/core/components/Button';
import { Calendar } from 'lucide-react';
import { EventsApi, type ServiceEvent } from '@/app/(dashboard)/events/api/events';
import { CreateEventForm } from './CreateEventForm';
import { EventsExpandableList } from './EventsExpandableList';

const EVENT_TABS = [
  { id: 'all', label: 'All Events' },
  { id: 'live', label: 'Live Now' },
  { id: 'future', label: 'Upcoming' },
  { id: 'online', label: 'Online' },
  { id: 'offline', label: 'In-Person' },
  { id: 'personalized', label: 'Personalized' },
  { id: 'organized', label: 'Organized' },
  { id: 'attending', label: 'Attending' },
];

export function EventsDashboard() {
  const [activeTab, setActiveTab] = useState('all');
  const [events, setEvents] = useState<ServiceEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rsvpEventId, setRsvpEventId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const nextEvents = activeTab === 'organized'
        ? await EventsApi.organized()
        : activeTab === 'attending'
          ? await EventsApi.attending()
          : await EventsApi.list({
        status: activeTab === 'live' ? 'LIVE' : activeTab === 'future' ? 'FUTURE' : undefined,
        mode: activeTab === 'online' ? 'ONLINE' : activeTab === 'offline' ? 'OFFLINE' : undefined,
        personalized: activeTab === 'personalized',
      });
      setEvents(nextEvents);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load events');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadEvents(), 0);
    return () => window.clearTimeout(timer);
  }, [loadEvents]);

  // Explicit join only: RSVP state changes here, never from opening a link.
  const handleRsvp = async (eventId: string) => {
    setRsvpEventId(eventId);
    setError(null);
    try {
      await EventsApi.rsvp(eventId, 'GOING');
      await loadEvents();
    } catch (rsvpError) {
      setError(rsvpError instanceof Error ? rsvpError.message : 'Unable to update RSVP');
    } finally {
      setRsvpEventId(null);
    }
  };

  const handleCancelRsvp = async (eventId: string) => {
    setRsvpEventId(eventId);
    setError(null);
    try {
      await EventsApi.cancelRsvp(eventId);
      await loadEvents();
    } catch (rsvpError) {
      setError(rsvpError instanceof Error ? rsvpError.message : 'Unable to cancel RSVP');
    } finally {
      setRsvpEventId(null);
    }
  };

  const openDetails = (eventId: string) => {
    router.push(`/events/${eventId}`);
  };

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 'var(--space-1)' }}>Events & Gatherings</h1>
            <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
              {!isLoading && events.length > 0
                ? `${events.length} ${events.length === 1 ? 'event' : 'events'} to explore`
                : 'Find your people, online or around you.'}
            </p>
          </div>
          <Button onClick={() => setIsCreating(true)} style={{ flexShrink: 0 }}>Create Event</Button>
        </div>
      </header>

      {isCreating && <Card style={{ marginBottom: 'var(--space-6)' }}><CardContent style={{ padding: 'var(--space-5)' }}><CreateEventForm onCancel={() => setIsCreating(false)} onCreated={() => { setIsCreating(false); void loadEvents(); }} /></CardContent></Card>}

      <div style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', paddingBottom: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        {EVENT_TABS.map(tab => (
          <Button 
            key={tab.id}
            variant={activeTab === tab.id ? 'primary' : 'secondary'}
            onClick={() => setActiveTab(tab.id)}
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {error && (
        <Card style={{ marginBottom: 'var(--space-4)' }}>
          <CardContent style={{ padding: 'var(--space-4)', color: 'var(--color-error)' }}>
            {error} <Button variant="ghost" onClick={() => void loadEvents()}>Try again</Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card>
          <CardContent style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Loading events...
          </CardContent>
        </Card>
      ) : events.length === 0 ? (
        <Card>
          <CardContent style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <Calendar size={48} style={{ margin: '0 auto var(--space-4) auto', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>No events found</h3>
            <p>There are no events matching this category right now.</p>
          </CardContent>
        </Card>
      ) : (
        <EventsExpandableList
          events={events}
          rsvpId={rsvpEventId}
          onJoin={(eventId) => void handleRsvp(eventId)}
          onLeave={(eventId) => void handleCancelRsvp(eventId)}
          onOpenFull={openDetails}
        />
      )}
    </div>
  );
}