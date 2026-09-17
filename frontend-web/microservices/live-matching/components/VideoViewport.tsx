'use client';

import React, { useRef, useEffect } from 'react';
import { User, ShieldCheck, Wifi } from 'lucide-react';

interface VideoViewportProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isAudioMuted?: boolean;
  isVideoOff?: boolean;
  roomCode?: string | null;
}

export const VideoViewport: React.FC<VideoViewportProps> = ({
  localStream,
  remoteStream,
  isAudioMuted = false,
  isVideoOff = false,
  roomCode,
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '560px',
        backgroundColor: '#090d16',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {/* Remote Video (Main Stage) */}
      {remoteStream ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-4)',
            color: '#94a3b8',
          }}
        >
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <User size={40} color="#cbd5e1" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 600, fontSize: '1.1rem', color: '#f8fafc', margin: '0 0 4px' }}>
              Connected to Room
            </p>
            <p style={{ fontSize: '0.875rem', margin: 0 }}>
              Waiting for peer stream to negotiate...
            </p>
          </div>
        </div>
      )}

      {/* Floating Header Info */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          right: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(8px)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            color: '#ffffff',
            fontSize: '0.8rem',
            fontWeight: 500,
          }}
        >
          <ShieldCheck size={15} color="#22c55e" />
          <span>P2P WebRTC Encrypted</span>
        </div>

        {roomCode && (
          <div
            style={{
              backgroundColor: 'rgba(99, 102, 241, 0.75)',
              backdropFilter: 'blur(8px)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            Room: {roomCode}
          </div>
        )}
      </div>

      {/* Floating PiP Local Video Preview */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          right: '24px',
          width: '180px',
          height: '130px',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          backgroundColor: '#1e293b',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
          zIndex: 10,
        }}
      >
        {localStream && !isVideoOff ? (
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)', // Mirror local preview
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              backgroundColor: '#0f172a',
            }}
          >
            <User size={28} />
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            bottom: '6px',
            left: '8px',
            fontSize: '0.7rem',
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            color: '#f8fafc',
            padding: '2px 6px',
            borderRadius: '4px',
          }}
        >
          You {isAudioMuted ? '(Muted)' : ''}
        </div>
      </div>
    </div>
  );
};
