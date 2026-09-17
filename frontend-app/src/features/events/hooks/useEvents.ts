import { useState, useEffect, useCallback } from 'react';
import { getEvents, getPersonalizedEvents, EventResponse } from '../api/EventsAPI';

interface UseEventsOptions {
  status?: 'live' | 'future' | 'ended';
  mode?: 'online' | 'offline';
  limit?: number;
  offset?: number;
  autoFetch?: boolean;
  personalized?: boolean;
}

export const useEvents = (options: UseEventsOptions = {}) => {
  const {
    status,
    mode,
    limit = 20,
    offset = 0,
    autoFetch = true,
    personalized = false,
  } = options;

  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = personalized ? await getPersonalizedEvents() : await getEvents(status, mode, limit, offset);
      setEvents(response.data);
      setTotal(response.meta?.total ?? response.data.length);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [status, mode, limit, offset, personalized]);

  useEffect(() => {
    if (autoFetch) {
      fetchEvents();
    }
  }, [fetchEvents, autoFetch]);

  return {
    events,
    loading,
    error,
    total,
    refetch: fetchEvents,
  };
};
