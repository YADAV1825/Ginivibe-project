'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Video, Users, PlusCircle, ArrowRight, Radio, ShieldCheck, AlertCircle } from 'lucide-react';
import { useLiveMatchingCall } from '../hooks/useLiveMatchingCall';
import { VideoViewport } from '../components/VideoViewport';
import { CallControls } from '../components/CallControls';
import { MatchRadarModal } from '../components/MatchRadarModal';

export function LiveMatchingView() {
  const searchParams = useSearchParams();
  const initialRoomCode = searchParams.get('roomCode');

  const [inputCode, setInputCode] = useState('');
  const {
    callState,
    localStream,
    remoteStream,
    roomCode,
    queuePosition,
    isAudioMuted,
    isVideoOff,
    error,
    joinQueue,
    leaveQueue,
    createRoom,
    joinRoom,
    toggleAudio,
    toggleVideo,
    endCall,
  } = useLiveMatchingCall();

  // Auto-join room if roomCode was passed in the URL (e.g. from invite or non-live match)
  useEffect(() => {
    if (initialRoomCode && callState === 'IDLE') {
      joinRoom(initialRoomCode);
    }
  }, [initialRoomCode, callState, joinRoom]);

  const handleManualJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      joinRoom(inputCode.trim().toUpperCase());
    }
  };

  const isInActiveCall = callState === 'IN_CALL' || callState === 'CONNECTING' || !!remoteStream;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: 'var(--space-6)' }}>
      {/* Header */}
      <header style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
          <div
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
              color: '#ffffff',
            }}
          >
            <Video size={24} />
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>
            Live Video Discovery & Rooms
          </h1>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', margin: 0 }}>
          Direct peer-to-peer WebRTC video calling powered by the GiniVibe Signaling Engine (Port 8080).
        </p>
      </header>

      {/* Error Alert */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#dc2626',
            marginBottom: 'var(--space-6)',
            fontSize: '0.875rem',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Active Call Mode */}
      {isInActiveCall ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-6)' }}>
          <VideoViewport
            localStream={localStream}
            remoteStream={remoteStream}
            isAudioMuted={isAudioMuted}
            isVideoOff={isVideoOff}
            roomCode={roomCode}
          />

          <CallControls
            isAudioMuted={isAudioMuted}
            isVideoOff={isVideoOff}
            roomCode={roomCode}
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
            onEndCall={endCall}
          />
        </div>
      ) : (
        /* Idle Hub Mode */
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--space-6)',
              marginBottom: 'var(--space-8)',
            }}
          >
            {/* Quick Live Discovery Card */}
            <div
              className="glass"
              style={{
                padding: 'var(--space-6)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  <Radio size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                  Instant Random Queue
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--space-6)' }}>
                  Jump directly into the discovery matchmaking queue to meet verified members online right now.
                </p>
              </div>

              <button
                onClick={joinQueue}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--space-2)',
                  width: '100%',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)',
                }}
              >
                <Radio size={18} />
                <span>Start Live Matching</span>
              </button>
            </div>

            {/* Create Private Room Card */}
            <div
              className="glass"
              style={{
                padding: 'var(--space-6)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  <PlusCircle size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                  Create Private Room
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--space-6)' }}>
                  Generate a private room code to share directly with friends or contacts for a secure call.
                </p>
              </div>

              <button
                onClick={createRoom}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--space-2)',
                  width: '100%',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface-elevated)',
                  color: 'var(--color-text-primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <PlusCircle size={18} />
                <span>Create New Room</span>
              </button>
            </div>

            {/* Join Room by Code Card */}
            <div
              className="glass"
              style={{
                padding: 'var(--space-6)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  <Users size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                  Join with Code
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--space-4)' }}>
                  Have an invitation room code? Enter it below to join the call immediately.
                </p>
              </div>

              <form onSubmit={handleManualJoin}>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="e.g. GV-ABC123"
                    style={{
                      flex: 1,
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface-elevated)',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.875rem',
                      outline: 'none',
                      textTransform: 'uppercase',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!inputCode.trim()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      border: 'none',
                      backgroundColor: 'var(--color-accent)',
                      color: '#ffffff',
                      cursor: inputCode.trim() ? 'pointer' : 'not-allowed',
                      opacity: inputCode.trim() ? 1 : 0.6,
                    }}
                  >
                    <ArrowRight size={18} />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Architecture note banner */}
          <div
            className="glass"
            style={{
              padding: 'var(--space-4) var(--space-6)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-elevated)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-4)',
            }}
          >
            <ShieldCheck size={28} color="#22c55e" />
            <div>
              <h4 style={{ margin: '0 0 2px', fontSize: '0.95rem', fontWeight: 600 }}>
                Low-Latency WebRTC P2P Technology
              </h4>
              <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--color-text-secondary)' }}>
                Your media streams transfer directly between browsers with STUN/TURN traversal. The live-matching microservice at Port 8080 coordinates signaling only.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Radar Matching Animation Modal */}
      <MatchRadarModal
        isOpen={callState === 'SEARCHING'}
        queuePosition={queuePosition}
        onCancel={leaveQueue}
      />
    </div>
  );
}
