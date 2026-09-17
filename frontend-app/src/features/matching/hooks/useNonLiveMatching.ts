import { useState, useEffect, useCallback, useRef } from 'react';
import { matchingApi } from '../api/matchingApi';
import { CandidateProfile, CandidateScore } from '../types';

export function useNonLiveMatching(enabled: boolean = true) {
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
  const [matchScore, setMatchScore] = useState<CandidateScore | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [emptyState, setEmptyState] = useState<boolean>(false);
  const [isServiceOffline, setIsServiceOffline] = useState<boolean>(false);

  const isMounted = useRef<boolean>(true);
  const isFetching = useRef<boolean>(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchNextCandidate = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await matchingApi.getNextMatch();
      if (!isMounted.current) return;

      if (!result) {
        setCandidate(null);
        setMatchScore(null);
        setEmptyState(true);
      } else {
        setCandidate(result.profile);
        setMatchScore(result.match);
        setEmptyState(false);
        setIsServiceOffline(false);
      }
    } catch (err: any) {
      if (!isMounted.current) return;
      console.warn('[useNonLiveMatching] Fetch match error:', err.message);
      if (err.message?.includes('Network request failed') || err.message?.includes('Failed to fetch')) {
        setIsServiceOffline(true);
      }
      setError(err.message || 'Unable to fetch candidate');
    } finally {
      isFetching.current = false;
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  const passCandidate = useCallback(() => {
    if (actionLoading || loading) return;
    fetchNextCandidate();
  }, [actionLoading, loading, fetchNextCandidate]);

  const followCandidate = useCallback(
    async (message?: string): Promise<boolean> => {
      if (!candidate || actionLoading || loading) return false;

      setActionLoading(true);
      setError(null);

      const targetId = candidate.id;
      try {
        await matchingApi.sendFollowRequest({
          targetUserId: targetId,
          message,
        });

        if (!isMounted.current) return true;

        // Fetch next candidate upon successful follow
        await fetchNextCandidate();
        return true;
      } catch (err: any) {
        if (!isMounted.current) return false;
        console.warn('[useNonLiveMatching] Follow request error:', err.message);
        setError(err.message || 'Failed to send follow request');
        return false;
      } finally {
        if (isMounted.current) {
          setActionLoading(false);
        }
      }
    },
    [candidate, actionLoading, loading, fetchNextCandidate]
  );

  useEffect(() => {
    if (enabled) {
      fetchNextCandidate();
    }
  }, [enabled, fetchNextCandidate]);

  return {
    candidate,
    matchScore,
    loading,
    actionLoading,
    error,
    emptyState,
    isServiceOffline,
    fetchNextCandidate,
    passCandidate,
    followCandidate,
  };
}
