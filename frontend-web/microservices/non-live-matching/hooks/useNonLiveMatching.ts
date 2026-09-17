import { useState, useEffect, useCallback } from 'react';
import { matchingApi } from '../api/matchingApi';
import { CandidateProfile, CandidateScore } from '../types';

export function useNonLiveMatching() {
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
  const [matchScore, setMatchScore] = useState<CandidateScore | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isServiceOffline, setIsServiceOffline] = useState<boolean>(false);
  const [emptyState, setEmptyState] = useState<boolean>(false);

  const fetchNextCandidate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await matchingApi.getNextMatch();
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
      console.warn('[NonLiveMatching] Fetch match error:', err.message);
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        setIsServiceOffline(true);
      }
      setError(err.message || 'Unable to fetch candidates');
    } finally {
      setLoading(false);
    }
  }, []);

  const passCandidate = useCallback(() => {
    fetchNextCandidate();
  }, [fetchNextCandidate]);

  const followCandidate = useCallback(async (message?: string) => {
    if (!candidate) return false;
    setActionLoading(true);
    setError(null);
    try {
      await matchingApi.sendFollowRequest({
        targetUserId: candidate.id,
        message,
      });
      // Move to next candidate after successful follow
      await fetchNextCandidate();
      return true;
    } catch (err: any) {
      console.error('[NonLiveMatching] Follow request error:', err);
      setError(err.message || 'Failed to send follow request');
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [candidate, fetchNextCandidate]);

  useEffect(() => {
    fetchNextCandidate();
  }, [fetchNextCandidate]);

  return {
    candidate,
    matchScore,
    loading,
    actionLoading,
    error,
    isServiceOffline,
    emptyState,
    fetchNextCandidate,
    passCandidate,
    followCandidate,
  };
}
