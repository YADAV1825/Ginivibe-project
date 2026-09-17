'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/core/components/Button';
import { Card, CardContent } from '@/app/core/components/Card';
import { EventsApi, type EventMode, type ServiceEvent } from '@/app/(dashboard)/events/api/events';
import { formatCount } from '@/app/(dashboard)/events/api/events';
import { useAuth } from '@/app/core/providers/AuthProvider';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '12px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
  fontSize: '0.92rem',
};

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function EventDetailScreen({ eventId }: { eventId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<ServiceEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutationLoading, setMutationLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state (organizer only)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [mode, setMode] = useState<EventMode>('ONLINE');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [joinUrl, setJoinUrl] = useState('');
  const [platform, setPlatform] = useState('');
  const [venue, setVenue] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');

  const loadEvent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const nextEvent = await EventsApi.get(eventId);
      setEvent(nextEvent);
      setTitle(nextEvent.title);
      setDescription(nextEvent.description ?? '');
      setStartAt(toLocalInput(nextEvent.startAt));
      setEndAt(toLocalInput(nextEvent.endAt));
      setMode(nextEvent.mode);
      setMeetingUrl(nextEvent.meetingUrl ?? '');
      setJoinUrl(nextEvent.joinUrl ?? nextEvent.meetingUrl ?? '');
      setPlatform(nextEvent.platform ?? '');
      setVenue(nextEvent.venue ?? '');
      setLocation(nextEvent.location ?? '');
      setCapacity(nextEvent.capacity ? String(nextEvent.capacity) : '');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load event');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadEvent(), 0);
    return () => window.clearTimeout(timer);
  }, [loadEvent]);

  const updateRsvp = async () => {
    if (!event) return;
    setMutationLoading(true);
    setError(null);
    try {
      if (event.userAttendanceStatus === 'GOING') await EventsApi.cancelRsvp(event.id);
      else await EventsApi.rsvp(event.id, 'GOING');
      await loadEvent();
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : 'Unable to update attendance');
    } finally {
      setMutationLoading(false);
    }
  };

  const leaveWaitlist = async () => {
    if (!event) return;
    setMutationLoading(true);
    setError(null);
    try {
      await EventsApi.leaveWaitlist(event.id);
      await loadEvent();
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : 'Unable to leave waitlist');
    } finally {
      setMutationLoading(false);
    }
  };

  const saveEdit = async () => {
    if (!event || !title.trim()) return;
    const start = new Date(startAt);
    const end = new Date(endAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      setError('End time must be after start time.');
      return;
    }
    if (mode === 'ONLINE' && !meetingUrl.trim()) {
      setError('Online events need a meeting link.');
      return;
    }
    if (mode === 'OFFLINE' && (!venue.trim() || !location.trim())) {
      setError('In-person events need a venue and a location.');
      return;
    }
    const capacityValue = capacity.trim() === '' ? null : Number(capacity);
    if (capacityValue !== null && (!Number.isInteger(capacityValue) || capacityValue < 1)) {
      setError('Capacity must be a positive whole number, or empty for unlimited.');
      return;
    }
    setMutationLoading(true);
    setError(null);
    try {
      setEvent(await EventsApi.update(event.id, {
        title: title.trim(),
        description: description.trim(),
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        mode,
        meetingUrl: mode === 'ONLINE' ? meetingUrl.trim() : null,
        joinUrl: joinUrl.trim() || (mode === 'ONLINE' ? meetingUrl.trim() : null) || null,
        platform: mode === 'ONLINE' && platform.trim() ? platform.trim() : null,
        venue: mode === 'OFFLINE' ? venue.trim() : null,
        location: mode === 'OFFLINE' ? location.trim() : null,
        capacity: capacityValue,
      }));
      setIsEditing(false);
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : 'Unable to update event');
    } finally {
      setMutationLoading(false);
    }
  };

  const removeEvent = async () => {
    if (!event || !window.confirm('Delete this event?')) return;
    setMutationLoading(true);
    try {
      await EventsApi.remove(event.id);
      router.push('/events');
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : 'Unable to delete event');
      setMutationLoading(false);
    }
  };

  const isOrganizer = Boolean(user?.id && event && user.id === event.organizer.id);
  const isGoing = event?.userAttendanceStatus === 'GOING';
  const canSeeJoinDetails = isOrganizer || isGoing;

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '900px', margin: '0 auto' }}>
      <Button variant="ghost" onClick={() => router.push('/events')}>Back to events</Button>
      {loading && <Card><CardContent style={{ padding: 'var(--space-12)', textAlign: 'center' }}>Loading event...</CardContent></Card>}
      {!loading && error && <Card><CardContent style={{ padding: 'var(--space-6)', color: 'var(--color-error)' }}>{error} <Button variant="ghost" onClick={() => void loadEvent()}>Try again</Button></CardContent></Card>}
      {!loading && event && <Card style={{ marginTop: 'var(--space-4)' }}>
        {event.bannerImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.bannerImageUrl}
            alt={event.title}
            style={{ width: '100%', maxHeight: '420px', objectFit: 'cover' }}
          />
        )}
        <CardContent style={{ padding: 'var(--space-6)' }}>
        <p style={{ color: event.status === 'LIVE' ? 'var(--color-error)' : 'var(--color-accent)', fontWeight: 700 }}>
          {event.status === 'LIVE' ? '● LIVE NOW' : event.status}
          {' · '}
          {event.mode === 'ONLINE' ? 'Online' : 'In person'}
        </p>
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: 'var(--space-4)' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>Title
              <input value={title} onChange={change => setTitle(change.target.value)} aria-label="Event title" style={{ ...inputStyle, marginTop: '4px' }} />
            </label>
            <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>Description
              <textarea value={description} onChange={change => setDescription(change.target.value)} aria-label="Event description" rows={4} style={{ ...inputStyle, marginTop: '4px', resize: 'vertical' }} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>Starts
                <input type="datetime-local" value={startAt} onChange={change => setStartAt(change.target.value)} aria-label="Start time" style={{ ...inputStyle, marginTop: '4px' }} />
              </label>
              <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>Ends
                <input type="datetime-local" value={endAt} onChange={change => setEndAt(change.target.value)} aria-label="End time" style={{ ...inputStyle, marginTop: '4px' }} />
              </label>
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>
              <span>Format</span>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                {(['ONLINE', 'OFFLINE'] as EventMode[]).map((option) => (
                  <Button
                    key={option}
                    type="button"
                    size="sm"
                    variant={mode === option ? 'primary' : 'secondary'}
                    onClick={() => setMode(option)}
                  >
                    {option === 'ONLINE' ? 'Online' : 'In person'}
                  </Button>
                ))}
              </div>
            </div>
            {mode === 'ONLINE' ? (
              <>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>Meeting link *
                  <input value={meetingUrl} onChange={change => setMeetingUrl(change.target.value)} placeholder="https://…" aria-label="Meeting link" style={{ ...inputStyle, marginTop: '4px' }} />
                </label>
                <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>Platform
                  <input value={platform} onChange={change => setPlatform(change.target.value)} placeholder="Zoom, Meet…" aria-label="Platform" style={{ ...inputStyle, marginTop: '4px' }} />
                </label>
              </div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>How to join (optional — defaults to the meeting link)
                <input value={joinUrl} onChange={change => setJoinUrl(change.target.value)} placeholder="Group invite, livestream…" aria-label="How to join" style={{ ...inputStyle, marginTop: '4px' }} />
              </label>
              </>
            ) : (
              <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>Venue *
                  <input value={venue} onChange={change => setVenue(change.target.value)} aria-label="Venue" style={{ ...inputStyle, marginTop: '4px' }} />
                </label>
                <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>Location *
                  <input value={location} onChange={change => setLocation(change.target.value)} aria-label="Location" style={{ ...inputStyle, marginTop: '4px' }} />
                </label>
              </div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>How to join (optional link)
                <input value={joinUrl} onChange={change => setJoinUrl(change.target.value)} placeholder="WhatsApp group, map pin…" aria-label="How to join" style={{ ...inputStyle, marginTop: '4px' }} />
              </label>
              </>
            )}
            <label style={{ fontSize: '0.82rem', fontWeight: 700, maxWidth: '220px' }}>Capacity (empty = unlimited)
              <input type="number" min={1} value={capacity} onChange={change => setCapacity(change.target.value)} aria-label="Capacity" style={{ ...inputStyle, marginTop: '4px' }} />
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button onClick={() => void saveEdit()} disabled={mutationLoading || !title.trim()}>Save Changes</Button>
              <Button variant="secondary" onClick={() => setIsEditing(false)} disabled={mutationLoading}>Cancel</Button>
            </div>
          </div>
        ) : (
          <>
            <h1>{event.title}</h1>
            <p>{event.description ?? 'No description provided.'}</p>
          </>
        )}
        <p>Hosted by {event.organizer.firstName ?? event.organizer.username}</p>
        <p>{new Date(event.startAt).toLocaleString()} to {new Date(event.endAt).toLocaleString()}</p>

        <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
          <h3 style={{ margin: '0 0 var(--space-2)', fontSize: '1rem' }}>How to join</h3>
          {event.mode === 'ONLINE' ? (
            canSeeJoinDetails && (event.joinUrl || event.meetingUrl) ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  Online{event.platform ? ` via ${event.platform}` : ''}
                </span>
                <a href={(event.joinUrl || event.meetingUrl)!} target="_blank" rel="noreferrer">
                  <Button size="sm">Join meeting</Button>
                </a>
              </div>
            ) : (
              <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                This is an online event. {isGoing || isOrganizer ? 'The host has not added a meeting link yet.' : 'Join the event to reveal the meeting link.'}
              </p>
            )
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <p style={{ margin: 0 }}>
                {[event.venue, event.location].filter(Boolean).join(' · ') || 'Location to be announced'}
              </p>
              {event.joinUrl && (canSeeJoinDetails ? (
                <a href={event.joinUrl} target="_blank" rel="noreferrer">
                  <Button size="sm">Open joining info</Button>
                </a>
              ) : (
                <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Join the event to reveal the joining link.</p>
              ))}
            </div>
          )}
        </div>

        <p>{formatCount(event.attendeeCount)}{event.capacity ? ` / ${formatCount(event.capacity)}` : ''} attending</p>
        {event.subInterests && event.subInterests.length > 0 && <p>Interests: {event.subInterests.map(item => item.name).join(', ')}</p>}
        {event.attendees && <p>Attendees: {event.attendees.map(attendee => attendee.firstName ?? attendee.username).join(', ') || 'None'}</p>}
        {event.waitlistStatus === 'WAITLISTED' && <p>Waitlist position: {event.waitlistPosition}</p>}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)', flexWrap: 'wrap' }}>
          <Button onClick={() => void updateRsvp()} disabled={mutationLoading || event.waitlistStatus === 'WAITLISTED'}>{isGoing ? 'Leave Event' : event.isFull ? 'Join Waitlist' : 'Join Event'}</Button>
          {event.waitlistStatus === 'WAITLISTED' && <Button variant="secondary" onClick={() => void leaveWaitlist()} disabled={mutationLoading}>Leave Waitlist</Button>}
          {isOrganizer && !isEditing && <Button variant="secondary" onClick={() => setIsEditing(true)}>Edit Event</Button>}
          {isOrganizer && <Button variant="ghost" onClick={() => void removeEvent()} disabled={mutationLoading}>Delete Event</Button>}
        </div>
        </CardContent>
      </Card>}
    </div>
  );
}
