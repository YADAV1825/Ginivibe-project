'use client';

import { useState, useEffect, useCallback } from 'react';
import { CandidateProfile } from '@/microservices/non-live-matching/types';
import { useGlobalSocket } from '@/app/core/providers/GlobalSocketProvider';
import { AuthService } from '@/app/(auth)';

export function useLiveCandidates(strategyTitle?: string) {
  const { socket, currentUserId } = useGlobalSocket();
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOnlineCandidates = useCallback(async () => {
    try {
      const token = AuthService.getToken();
      const currentUser = AuthService.getCurrentUser();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const effectiveUserId = currentUser?.id || currentUserId;
      if (effectiveUserId) {
        headers['x-user-id'] = effectiveUserId;
      }

      const res = await fetch('http://localhost:3001/api/calls/online-candidates', {
        headers,
      });

      if (!res.ok) {
        throw new Error('Failed to fetch online candidates');
      }

      const data = await res.json();
      const onlineList: CandidateProfile[] = data.candidates || [];

      setCandidates(onlineList);
      setError(null);
    } catch (err: any) {
      console.warn('[useLiveCandidates] fetch error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Initial fetch
  useEffect(() => {
    fetchOnlineCandidates();
  }, [fetchOnlineCandidates]);

  // Real-time socket updates: when someone comes online or goes offline, refresh candidates!
  useEffect(() => {
    if (!socket) return;

    const handlePresenceUpdate = (data: { userId: string; status: string }) => {
      console.log('[useLiveCandidates] Presence update received:', data);
      fetchOnlineCandidates();
    };

    socket.on('user_presence_update', handlePresenceUpdate);

    // Also periodic poll every 5s while looking for candidates
    const interval = setInterval(() => {
      fetchOnlineCandidates();
    }, 5000);

    return () => {
      socket.off('user_presence_update', handlePresenceUpdate);
      clearInterval(interval);
    };
  }, [socket, fetchOnlineCandidates]);

  const skipCandidate = () => {
    if (candidates.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % candidates.length);
    } else {
      // Refresh to see if someone new came online
      fetchOnlineCandidates();
    }
  };

  const currentCandidate = candidates.length > 0 ? candidates[currentIndex % candidates.length] : null;

  return {
    candidate: currentCandidate,
    totalOnline: candidates.length,
    loading,
    error,
    skipCandidate,
    refetch: fetchOnlineCandidates,
  };
}
