'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, VideoOff } from 'lucide-react';
import { WebcamPixelGrid } from '@/components/ui/webcam-pixel-grid';
import { AuthService } from '@/app/(auth)';
import { useGlobalSocket } from '@/app/core/providers/GlobalSocketProvider';
import VideoCallClient from '@/app/(dashboard)/video-call/VideoCallClient';

type RoomState = 'CONNECTING' | 'WAITING' | 'IN_CALL';

interface LiveMatchRoomProps {
  roomCode: string;
  peerName: string;
  peerAvatar?: string;
  onEnd: () => void;
}

const PIXEL_PANE_PROPS = {
  gridCols: 48,
  gridRows: 32,
  maxElevation: 18,
  motionSensitivity: 0.3,
  elevationSmoothing: 0.15,
  colorMode: 'webcam' as const,
  backgroundColor: '#101208',
  gapRatio: 0.08,
  invertColors: false,
  darken: 0.25,
  borderColor: '#ffffff',
  borderOpacity: 0.05,
  fallback: 'brand' as const,
  showErrorUI: false,
};

export function LiveMatchRoom({ roomCode, peerName, peerAvatar, onEnd }: LiveMatchRoomProps) {
  const { socket } = useGlobalSocket();
  const socketRef = useRef(socket);
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  const [roomState, setRoomState] = useState<RoomState>('CONNECTING');
  const [client, setClient] = useState<VideoCallClient | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(() => {
    try {
      return AuthService.getToken() ? null : 'You need to be signed in to join a live call.';
    } catch {
      return 'You need to be signed in to join a live call.';
    }
  });

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const onEndRef = useRef(onEnd);
  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  const revealed = roomState === 'IN_CALL';

  // Attach streams to the plain <video> elements used after reveal.
  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
  }, [localStream]);
  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  useEffect(() => {
    let token: string | null = null;
    try {
      token = AuthService.getToken();
    } catch {
      token = null;
    }
    if (!token) return;

    let wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!wsUrl || wsUrl.includes('localhost') || wsUrl.includes('127.0.0.1')) {
      wsUrl =
        typeof window !== 'undefined'
          ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8080`
          : 'ws://localhost:8080';
    }

    const newClient = new VideoCallClient(wsUrl, { authToken: token });

    newClient.on('localStream', (stream: MediaStream) => {
      setLocalStream(stream);
    });
    newClient.on('remoteStream', (stream: MediaStream) => {
      setRemoteStream(stream);
    });
    newClient.on('connected', () => {
      setRoomState('WAITING');
      newClient.joinRoom(roomCode);
    });
    newClient.on('roomJoined', () => {
      setRoomState('WAITING');
    });
    newClient.on('matched', () => {
      setRoomState('WAITING');
    });
    newClient.on('callStarted', () => {
      setRoomState('IN_CALL');
    });
    newClient.on('callEnded', () => {
      if (socketRef.current) socketRef.current.emit('set_availability', { availability: 'AVAILABLE' });
      onEndRef.current();
    });
    newClient.on('peerDisconnected', () => {
      if (socketRef.current) socketRef.current.emit('set_availability', { availability: 'AVAILABLE' });
      onEndRef.current();
    });
    newClient.on('error', (err: unknown) => {
      console.error('[LiveMatchRoom] Client error:', err);
    });

    let mounted = true;
    const init = async () => {
      try {
        setClient(newClient);
        try {
          await newClient.start();
        } catch (e) {
          console.warn('[LiveMatchRoom] Local media unavailable, continuing without camera:', e);
          if (mounted) {
            setMediaError('Camera unavailable — showing vibe pixels instead. Audio/video from your side may be off.');
          }
        }
        if (mounted) await newClient.connect();
      } catch (e) {
        console.error('[LiveMatchRoom] Failed to init call:', e);
        if (mounted) setFatalError('Could not connect to the call server. Please try again.');
      }
    };
    init();

    return () => {
      mounted = false;
      newClient.disconnect();
    };
  }, [roomCode]);

  const toggleAudio = () => {
    if (client) setIsAudioMuted(client.toggleAudio());
  };
  const toggleVideo = () => {
    if (client) setIsVideoOff(client.toggleVideo());
  };
  const endCall = () => {
    try {
      client?.endCall();
    } catch {}
    if (socketRef.current) socketRef.current.emit('set_availability', { availability: 'AVAILABLE' });
    onEnd();
  };

  if (fatalError) {
    return (
      <div className="gv-live-room" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
          Live call unavailable
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>{fatalError}</p>
        <button type="button" className="gv-live-end" onClick={onEnd}>
          Back to matching
        </button>
      </div>
    );
  }

  const statusText =
    roomState === 'IN_CALL'
      ? `Connected with ${peerName}`
      : roomState === 'WAITING'
        ? `Waiting for ${peerName} to join…`
        : 'Connecting…';

  return (
    <div className="gv-live-room">
      <div className="gv-live-head">
        <span className="gv-live-badge">
          <span className="gv-live-dot" aria-hidden="true" />
          LIVE
        </span>
        <span className="gv-live-status">{statusText}</span>
        <span className="gv-live-roomcode">{roomCode}</span>
      </div>

      <div className="gv-live-panes">
        {/* You */}
        <div className="gv-live-pane">
          <div className="gv-live-frame">
            {!revealed && (
              <div className="gv-live-pixels">
                <WebcamPixelGrid stream={localStream} mirror={true} {...PIXEL_PANE_PROPS} />
              </div>
            )}
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="gv-live-video gv-live-video-mirror"
              style={{ display: revealed && !isVideoOff ? 'block' : 'none' }}
            />
            {isVideoOff && (
              <div className="gv-live-off">
                <span className="gv-live-off-icon">
                  <VideoOff size={28} />
                </span>
                <span>Camera is off</span>
              </div>
            )}
            <span className="gv-chip gv-live-tag">You</span>
          </div>
        </div>

        {/* Match */}
        <div className="gv-live-pane">
          <div className="gv-live-frame">
            {!revealed && (
              <div className="gv-live-pixels">
                <WebcamPixelGrid stream={remoteStream} mirror={false} {...PIXEL_PANE_PROPS} />
              </div>
            )}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="gv-live-video"
              style={{ display: revealed ? 'block' : 'none' }}
            />
            {!revealed && (
              <div className="gv-live-waiting">
                {peerAvatar ? (
                  <img src={peerAvatar} alt="" className="gv-live-avatar" />
                ) : (
                  <span className="gv-live-avatar gv-live-avatar-fallback">
                    {peerName.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="gv-live-waiting-name">{peerName}</span>
                <span className="gv-live-waiting-sub">{statusText}</span>
              </div>
            )}
            <span className="gv-chip gv-live-tag">{peerName}</span>
          </div>
        </div>
      </div>

      {mediaError && <p className="gv-live-note">{mediaError}</p>}

      <div className="gv-live-controls">
        <button
          type="button"
          onClick={toggleAudio}
          className={`gv-live-round ${isAudioMuted ? 'is-off' : ''}`}
          aria-label={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isAudioMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        <button
          type="button"
          onClick={toggleVideo}
          className={`gv-live-round ${isVideoOff ? 'is-off' : ''}`}
          aria-label={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
        >
          <VideoOff size={20} />
        </button>
        <button type="button" onClick={endCall} className="gv-live-end">
          <PhoneOff size={18} /> End call
        </button>
      </div>
    </div>
  );
}
