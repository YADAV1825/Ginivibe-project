'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Video, PhoneOff, Clock, ShieldCheck, Sparkles, X, RefreshCw, AlertCircle } from 'lucide-react';
import { CandidateProfile, CandidateScore } from '@/microservices/non-live-matching/types';
import { useGlobalSocket } from '@/app/core/providers/GlobalSocketProvider';
import { AuthService } from '@/app/(auth)';

interface LiveCandidateCardProps {
  candidate: CandidateProfile;
  matchScore?: CandidateScore | null;
  onSkip: () => void;
  strategyTitle?: string;
}

export const LiveCandidateCard: React.FC<LiveCandidateCardProps> = ({
  candidate,
  matchScore,
  onSkip,
  strategyTitle = 'Live Match',
}) => {
  const router = useRouter();
  const { socket } = useGlobalSocket();

  const [callState, setCallState] = useState<'IDLE' | 'CALLING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'>('IDLE');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Listen to incoming socket responses for this call request
  useEffect(() => {
    if (!socket) return;

    const handleAccepted = (data: any) => {
      console.log('[LiveCall] Call accepted by peer:', data);
      if (timerRef.current) clearInterval(timerRef.current);
      setCallState('ACCEPTED');
      setStatusMessage('Request accepted! Joining video call room...');
      setTimeout(() => {
        router.push(`/video-call?roomCode=${data.roomCode || 'ROOM-' + Math.random().toString(36).substring(2, 8)}`);
      }, 1200);
    };

    const handleRejected = () => {
      console.log('[LiveCall] Call rejected by peer');
      if (timerRef.current) clearInterval(timerRef.current);
      setCallState('REJECTED');
      setStatusMessage(`${candidate.name} is currently unavailable or declined the request.`);
    };

    const handleExpired = () => {
      console.log('[LiveCall] Call request expired (60s timeout)');
      if (timerRef.current) clearInterval(timerRef.current);
      setCallState('EXPIRED');
      setStatusMessage(`Call request expired. No response received within 60 seconds.`);
    };

    socket.on('call_request_accepted', handleAccepted);
    socket.on('call_request_rejected', handleRejected);
    socket.on('call_request_expired', handleExpired);

    return () => {
      socket.off('call_request_accepted', handleAccepted);
      socket.off('call_request_rejected', handleRejected);
      socket.off('call_request_expired', handleExpired);
    };
  }, [socket, candidate.name, router]);

  // Handle 60s countdown timer
  useEffect(() => {
    if (callState === 'CALLING') {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setCallState('EXPIRED');
            setStatusMessage(`Call request expired. ${candidate.name} did not answer within 60 seconds.`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [callState, candidate.name]);

  const handleStartCallRequest = async () => {
    setLoading(true);
    setStatusMessage('');
    try {
      const token = AuthService.getToken();
      const currentUser = AuthService.getCurrentUser();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      if (currentUser?.id) {
        headers['x-user-id'] = currentUser.id;
      }

      const res = await fetch('http://localhost:3001/api/calls/request', {
        method: 'POST',
        headers,
        body: JSON.stringify({ receiverId: candidate.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate call request');
      }

      setActiveRequestId(data.id);
      setStatusMessage('');
      setSecondsRemaining(60);
      setCallState('CALLING');
    } catch (err: any) {
      console.warn('[LiveCall] Call request error:', err.message);
      setStatusMessage(err.message || 'Connecting...');
      setSecondsRemaining(60);
      setCallState('CALLING');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelCall = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (activeRequestId) {
      try {
        const token = AuthService.getToken();
        await fetch(`http://localhost:3001/api/calls/${activeRequestId}/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
      } catch (e) {
        console.warn('Failed to cancel call on backend:', e);
      }
    }
    setCallState('IDLE');
    setSecondsRemaining(60);
    setStatusMessage('');
  };

  const scorePercent = matchScore?.score ? Math.round(matchScore.score * 100) : 92;

  return (
    <div
      className="glass"
      style={{
        maxWidth: '480px',
        width: '100%',
        margin: '0 auto',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
      }}
    >
      {/* ──────────────── ACTIVE 60s CALLING OVERLAY ──────────────── */}
      {callState === 'CALLING' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-6)',
            textAlign: 'center',
            color: '#ffffff',
          }}
        >
          {/* Pulsing Avatar */}
          <div
            style={{
              position: 'relative',
              width: '120px',
              height: '120px',
              marginBottom: 'var(--space-6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: '-12px',
                borderRadius: 'var(--radius-full)',
                border: '2px solid rgba(236, 72, 153, 0.5)',
                animation: 'ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite',
              }}
            />
            <img
              src={candidate.avatarUrl}
              alt={candidate.name}
              style={{
                width: '100px',
                height: '100px',
                borderRadius: 'var(--radius-full)',
                objectFit: 'cover',
                border: '3px solid #ec4899',
                boxShadow: '0 0 30px rgba(236, 72, 153, 0.6)',
                zIndex: 2,
              }}
            />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 6px', color: '#ffffff' }}>
            Calling {candidate.name}...
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: '0 0 var(--space-6)', maxWidth: '300px' }}>
            Ringing... waiting for response
          </p>

          {/* 60s Countdown Timer Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 24px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(236, 72, 153, 0.15)',
              border: '1px solid rgba(236, 72, 153, 0.4)',
              color: '#f472b6',
              fontWeight: 800,
              fontSize: '1.75rem',
              marginBottom: 'var(--space-6)',
              boxShadow: '0 4px 20px rgba(236, 72, 153, 0.25)',
            }}
          >
            <Clock size={24} />
            <span>{secondsRemaining}s</span>
          </div>

          {statusMessage && (
            <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: 'var(--space-6)' }}>
              {statusMessage}
            </p>
          )}

          <button
            onClick={handleCancelCall}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 24px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)',
            }}
          >
            <PhoneOff size={18} />
            <span>Cancel Call</span>
          </button>
        </div>
      )}

      {/* ──────────────── ACCEPTED OVERLAY ──────────────── */}
      {callState === 'ACCEPTED' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-6)',
            textAlign: 'center',
            color: '#ffffff',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-4)',
              color: '#ffffff',
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.5)',
            }}
          >
            <Video size={40} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 6px', color: '#10b981' }}>
            Connected!
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Starting video call...
          </p>
        </div>
      )}

      {/* ──────────────── EXPIRED / REJECTED OVERLAY ──────────────── */}
      {(callState === 'EXPIRED' || callState === 'REJECTED') && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-6)',
            textAlign: 'center',
            color: '#ffffff',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-4)',
              color: '#ef4444',
            }}
          >
            <AlertCircle size={32} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px' }}>
            {callState === 'EXPIRED' ? 'No Answer' : 'Call Ended'}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 'var(--space-6)', maxWidth: '320px' }}>
            {candidate.name} is unavailable right now.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleStartCallRequest}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={15} />
              <span>Retry</span>
            </button>
            <button
              onClick={() => {
                setCallState('IDLE');
                onSkip();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: 'var(--color-accent)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              <span>Next Profile</span>
            </button>
          </div>
        </div>
      )}

      {/* ──────────────── HERO CARD VIEW ──────────────── */}
      <div style={{ position: 'relative', width: '100%', height: '360px', overflow: 'hidden' }}>
        <img
          src={candidate.avatarUrl}
          alt={candidate.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.4) 40%, transparent 80%)',
          }}
        />

        {/* Live Badge */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(236, 72, 153, 0.9)',
            color: '#ffffff',
            fontSize: '0.75rem',
            fontWeight: 700,
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              animation: 'pulse 1s infinite',
            }}
          />
          <span>ONLINE NOW</span>
        </div>

        {/* Compatibility Score */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(99, 102, 241, 0.85)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.85rem',
          }}
        >
          <Sparkles size={15} />
          <span>{scorePercent}% Match</span>
        </div>

        {/* Name and Age */}
        <div style={{ position: 'absolute', bottom: '16px', left: '20px', right: '20px', color: '#ffffff' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
            {candidate.name}, <span style={{ fontWeight: 400, opacity: 0.9 }}>{candidate.age}</span>
          </h2>
          {candidate.location && (
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: '4px 0 0' }}>
              📍 {candidate.location}
            </p>
          )}
        </div>
      </div>

      {/* Body Details */}
      <div style={{ padding: 'var(--space-5)' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>
          {candidate.bio}
        </p>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: 'var(--space-6)' }}>
          {candidate.tags && candidate.tags.length > 0 ? (
            candidate.tags.map((tag, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '0.75rem',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                #{tag}
              </span>
            ))
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              #LiveMatching
            </span>
          )}
        </div>

        {/* Action Controls: Skip vs Send Video Call Request (60s Timer) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '120px 1fr',
            gap: 'var(--space-3)',
            paddingTop: 'var(--space-3)',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          {/* Skip Button */}
          <button
            onClick={onSkip}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '12px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-elevated)',
              color: 'var(--color-text-secondary)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
            <span>Skip</span>
          </button>

          {/* Request Live Video Call Button */}
          <button
            onClick={handleStartCallRequest}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 18px',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 16px rgba(236, 72, 153, 0.4)',
            }}
          >
            <Video size={20} />
            <span>Call (60s)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
