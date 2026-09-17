'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/app/core/components/Card';
import { Button } from '@/app/core/components/Button';
import { Video, Clock, Mic, MicOff, VideoOff, PhoneOff, Users } from 'lucide-react';
import { AuthService } from '@/app/(auth)';
import { useGlobalSocket } from '@/app/core/providers/GlobalSocketProvider';
import VideoCallClient from './VideoCallClient';

type MatchState = 'IDLE' | 'SEARCHING' | 'FOUND' | 'IN_CALL';

function VideoCallContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { socket } = useGlobalSocket();
  const socketRef = useRef(socket);
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);
  
  const strategy = searchParams.get('strategy') || 'random';
  const urlRoomCode = searchParams.get('roomCode');
  
  const [matchState, setMatchState] = useState<MatchState>('IDLE');
  const [client, setClient] = useState<any>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    handleResize(); // set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const token = AuthService.getToken();
    if (!token) {
      throw new Error("Authentication token is required for video call");
    }

    // Determine the URL dynamically based on the current origin to allow global network access.
    // We ignore cached localhost env variables to avoid Next.js Turbopack caching issues.
    let wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!wsUrl || wsUrl.includes('localhost') || wsUrl.includes('127.0.0.1')) {
      wsUrl = typeof window !== 'undefined' 
        ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8080`
        : 'ws://localhost:8080';
    }
    
    console.log('[VideoCall] Initializing VideoCallClient with URL:', wsUrl);
    
    // Initialize VideoCallClient
    const newClient = new VideoCallClient(wsUrl, {
        authToken: token
    });

    newClient.on('localStream', (stream: MediaStream) => {
      console.log('[VideoCall] localStream initialized');
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    });

    newClient.on('remoteStream', (stream: MediaStream) => {
      console.log('[VideoCall] remoteStream received (Remote participant connected)');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    });

    newClient.on('connected', () => {
      console.log('[VideoCall] WebSocket connected and authenticated successfully');
      // Read directly from URL to bypass any React stale closure bugs
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const room = params.get('roomCode');
        if (room) {
          console.log('[VideoCall] joinRoom() called with roomCode:', room);
          setRoomCode(room);
          setMatchState('FOUND');
          newClient.joinRoom(room);
        }
      }
    });

    newClient.on('roomJoined', (data: any) => {
      console.log('[VideoCall] Room joined:', data.roomCode);
    });

    newClient.on('searching', () => {
      setMatchState('SEARCHING');
    });

    newClient.on('matched', (data: any) => {
      console.log('[VideoCall] Matched! Room code:', data.roomCode, 'WebRTC negotiation starting...');
      setRoomCode(data.roomCode);
      setMatchState('FOUND');
    });

    newClient.on('callStarted', () => {
      console.log('[VideoCall] WebRTC callStarted (Negotiation complete)');
      setMatchState('IN_CALL');
    });

    newClient.on('callEnded', () => {
      console.log('[VideoCall] Call ended');
      if (socketRef.current) socketRef.current.emit('set_availability', { availability: 'AVAILABLE' });
      router.push('/matching');
    });

    newClient.on('peerDisconnected', () => {
      console.log('[VideoCall] Peer disconnected');
      alert('The other user disconnected.');
      if (socketRef.current) socketRef.current.emit('set_availability', { availability: 'AVAILABLE' });
      router.push('/matching');
    });

    newClient.on('error', (err: any) => {
      console.error('[VideoCall] Client error:', err);
    });

    // Start local media and connect immediately when the page loads
    let mounted = true;
    const init = async () => {
      try {
        setClient(newClient);
        await newClient.start();
        if (mounted) {
          await newClient.connect();
        }
      } catch (e) {
        console.error('Failed to init VideoCallClient', e);
        alert('Could not access camera/microphone or connect to server.');
      }
    };

    init();

    return () => {
      mounted = false;
      newClient.disconnect();
    };
  }, []);

  const handleStartMatch = async () => {
    if (client) {
      try {
        if (!client.localStream) {
          await client.start();
          await client.connect();
        }
        client.findMatch();
      } catch (e) {
        console.error(e);
        alert('Camera permission denied or failed to connect.');
      }
    }
  };

  const cancelSearch = () => {
    if (client) {
      client.cancelSearch();
      setMatchState('IDLE');
    }
  };

  const endCall = () => {
    if (client) {
      client.endCall();
    }
    if (socketRef.current) socketRef.current.emit('set_availability', { availability: 'AVAILABLE' });
    router.push('/matching');
  };

  const toggleAudio = () => {
    if (client) {
      const isMuted = client.toggleAudio();
      setIsAudioMuted(isMuted);
    }
  };

  const toggleVideo = () => {
    if (client) {
      const isOff = client.toggleVideo();
      setIsVideoOff(isOff);
    }
  };

  return (
    <div style={{ height: '100vh', width: '100vw', backgroundColor: '#000', position: 'fixed', top: 0, left: 0, zIndex: 99999, display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '16px 24px', display: 'flex', alignItems: 'center', zIndex: 10, background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)' }}>
        <h1 style={{ color: '#fff', margin: 0, fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Video size={20} color="var(--color-accent)" /> GiniVibe Live
        </h1>
      </div>

      {/* Video Grid */}
      <div style={{ flex: 1, display: 'flex', flexDirection: isDesktop ? 'row' : 'column', width: '100%', height: '100%' }}>
        
        {/* Remote Video (Top / Left) */}
        <div style={{ flex: 1, position: 'relative', backgroundColor: '#111', borderBottom: isDesktop ? 'none' : '2px solid #222', borderRight: isDesktop ? '2px solid #222' : 'none' }}>
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
          {matchState !== 'IN_CALL' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Users size={32} color="#666" />
              </div>
              <p style={{ color: '#888', fontSize: '1.1rem', fontWeight: 500 }}>
                {matchState === 'SEARCHING' ? 'Looking for someone...' : matchState === 'FOUND' ? 'Connecting...' : 'Waiting for connection...'}
              </p>

            </div>
          )}
        </div>

        {/* Local Video (Bottom / Right) */}
        <div style={{ flex: 1, position: 'relative', backgroundColor: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <video 
            ref={localVideoRef} 
            autoPlay 
            muted 
            playsInline 
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: isVideoOff ? 'none' : 'block' }} 
          />
          {isVideoOff && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', zIndex: 5, gap: '16px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <VideoOff size={40} color="#666" />
              </div>
              <p style={{ color: '#888', fontWeight: 500 }}>Camera is off</p>
            </div>
          )}
          
          {/* Floating Controls on Local Video */}
          <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 50, pointerEvents: 'none' }}>
            {/* Audio/Video Toggles */}
            <div style={{ display: 'flex', gap: '12px', pointerEvents: 'auto' }}>
              <button onClick={toggleAudio} style={{ width: '48px', height: '48px', borderRadius: '50%', border: 'none', backgroundColor: isAudioMuted ? 'var(--color-error)' : 'rgba(0,0,0,0.6)', color: '#fff', cursor: 'pointer', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {isAudioMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <button onClick={toggleVideo} style={{ width: '48px', height: '48px', borderRadius: '50%', border: 'none', backgroundColor: isVideoOff ? 'var(--color-error)' : 'rgba(0,0,0,0.6)', color: '#fff', cursor: 'pointer', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
              </button>
            </div>

            {/* Action Buttons */}
            <div style={{ pointerEvents: 'auto' }}>
              <button onClick={endCall} style={{ padding: '14px 24px', borderRadius: '100px', backgroundColor: 'var(--color-error)', color: '#fff', fontWeight: 700, fontSize: '1.1rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PhoneOff size={20} /> End Call
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VideoCallPage() {
  return (
    <Suspense fallback={<div>Loading matching criteria...</div>}>
      <VideoCallContent />
    </Suspense>
  );
}
