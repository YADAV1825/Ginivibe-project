import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGlobalSocket } from '../providers/GlobalSocketProvider';
import { matchingApi } from '../api/matchingApi';
import { LiveCandidate, CallRequest } from '../types';

export function useLiveMatching(enabled: boolean = true) {
  const { socket } = useGlobalSocket();

  const [candidates, setCandidates] = useState<LiveCandidate[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [callRequest, setCallRequest] = useState<CallRequest | null>(null);
  const [callTimer, setCallTimer] = useState<number>(0);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [acceptedRoomCode, setAcceptedRoomCode] = useState<string | null>(null);

  const isMounted = useRef<boolean>(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchOnlineCandidates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await matchingApi.getOnlineCandidates();
      if (!isMounted.current) return;
      setCandidates(list);
    } catch (err: any) {
      if (!isMounted.current) return;
      console.warn('[useLiveMatching] Fetch candidates error:', err.message);
      setError(err.message || 'Failed to load online candidates');
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  // Use persistent socket from GlobalSocketProvider
  useEffect(() => {
    if (!enabled) return;

    fetchOnlineCandidates();

    if (!socket) return;

    // Ensure we are marked AVAILABLE when entering live matching
    socket.emit('set_availability', { availability: 'AVAILABLE' });

    const handleAccepted = (data: { roomCode: string; requestId: string }) => {
      if (!isMounted.current) return;
      setCallRequest(null);
      setCallTimer(0);
      setError(null);
      setAcceptedRoomCode(data.roomCode);
    };

    const handleRejected = (data?: { requestId: string }) => {
      if (!isMounted.current) return;
      setCallRequest(null);
      setCallTimer(0);
      setError(null);
      setCurrentIndex(0);
      fetchOnlineCandidates();
    };

    const handleExpired = (data?: { requestId: string }) => {
      if (!isMounted.current) return;
      setCallRequest(null);
      setCallTimer(0);
      setError(null);
      setCurrentIndex(0);
      fetchOnlineCandidates();
    };

    const handleCancelled = (data?: { requestId: string }) => {
      if (!isMounted.current) return;
      setCallRequest(null);
      setCallTimer(0);
      setError(null);
      setCurrentIndex(0);
      fetchOnlineCandidates();
    };

    const handlePresenceUpdate = () => {
      if (!isMounted.current) return;
      fetchOnlineCandidates();
    };

    socket.on('call_request_accepted', handleAccepted);
    socket.on('call_request_rejected', handleRejected);
    socket.on('call_request_expired', handleExpired);
    socket.on('call_request_cancelled', handleCancelled);
    socket.on('user_presence_update', handlePresenceUpdate);
    socket.on('user_availability_changed', handlePresenceUpdate);

    return () => {
      socket.off('call_request_accepted', handleAccepted);
      socket.off('call_request_rejected', handleRejected);
      socket.off('call_request_expired', handleExpired);
      socket.off('call_request_cancelled', handleCancelled);
      socket.off('user_presence_update', handlePresenceUpdate);
      socket.off('user_availability_changed', handlePresenceUpdate);
    };
  }, [enabled, socket, fetchOnlineCandidates]);

  // Outgoing call timer countdown
  useEffect(() => {
    if (callTimer > 0 && callRequest) {
      const timer = setTimeout(() => {
        if (isMounted.current) {
          setCallTimer((prev: number) => prev - 1);
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else if (callTimer === 0 && callRequest) {
      setCallRequest(null);
      setError(null);
      setCurrentIndex(0);
      fetchOnlineCandidates();
    }
  }, [callTimer, callRequest, fetchOnlineCandidates]);

  const currentCandidate =
    candidates.length > 0 ? candidates[currentIndex % candidates.length] : null;

  const skipCandidate = useCallback(() => {
    if (candidates.length > 1) {
      setCurrentIndex((prev: number) => (prev + 1) % candidates.length);
    } else {
      fetchOnlineCandidates();
    }
  }, [candidates.length, fetchOnlineCandidates]);

  const requestVideoCall = useCallback(async () => {
    if (!currentCandidate || actionLoading || callRequest) return;

    setActionLoading(true);
    setError(null);

    try {
      const req = await matchingApi.requestCall(currentCandidate.id);
      if (!isMounted.current) return;
      setCallRequest(req);
      setCallTimer(60);
    } catch (err: any) {
      if (!isMounted.current) return;
      console.warn('[useLiveMatching] Request call error:', err.message);
      setError(err.message || 'Could not initiate video call');
    } finally {
      if (isMounted.current) {
        setActionLoading(false);
      }
    }
  }, [currentCandidate, actionLoading, callRequest]);

  const cancelVideoCall = useCallback(async () => {
    if (!callRequest) return;

    const reqId = callRequest.id;
    setCallRequest(null);
    setCallTimer(0);
    setError(null);
    setCurrentIndex(0);

    try {
      await matchingApi.cancelCall(reqId);
      fetchOnlineCandidates();
    } catch (err) {
      console.warn('[useLiveMatching] Cancel call error:', err);
    }
  }, [callRequest, fetchOnlineCandidates]);

  const clearAcceptedRoom = useCallback(() => {
    setAcceptedRoomCode(null);
  }, []);

  return {
    candidate: currentCandidate,
    totalOnline: candidates.length,
    loading,
    actionLoading,
    error,
    callRequest,
    callTimer,
    acceptedRoomCode,
    requestVideoCall,
    cancelVideoCall,
    skipCandidate,
    refetch: fetchOnlineCandidates,
    clearAcceptedRoom,
  };
}
