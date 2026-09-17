import { useState, useEffect, useCallback } from 'react';
import { getEventDetail, EventDetailResponse } from '../api/EventsAPI';

interface UseEventDetailOptions {
  eventId: string;
  autoFetch?: boolean;
}

export const useEventDetail = ({ eventId, autoFetch = true }: UseEventDetailOptions) => {
  const [event, setEvent] = useState<EventDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvent = useCallback(async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await getEventDetail(eventId);
      setEvent(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch event');
      setEvent(null);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (autoFetch && eventId) {
      fetchEvent();
    }
  }, [eventId, autoFetch, fetchEvent]);

  return {
    event,
    loading,
    error,
    refetch: fetchEvent,
  };
};
