import { useState, useEffect, useCallback } from 'react';
import { getMyOrganizedEvents, getMyAttendingEvents, EventResponse } from '../api/EventsAPI';

interface UseMyEventsOptions {
  type: 'organized' | 'attending';
  status?: 'live' | 'future' | 'ended';
  autoFetch?: boolean;
}

export const useMyEvents = ({ type, status, autoFetch = true }: UseMyEventsOptions) => {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = type === 'organized' 
        ? await getMyOrganizedEvents(status)
        : await getMyAttendingEvents(status);
      setEvents(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [type, status]);

  useEffect(() => {
    if (autoFetch) {
      fetchEvents();
    }
  }, [fetchEvents, autoFetch]);

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
  };
};
