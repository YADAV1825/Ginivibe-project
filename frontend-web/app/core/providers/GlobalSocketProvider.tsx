'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/app/core/components/Button';
import { AuthService } from '@/app/(auth)';
import { useAuth } from '@/app/core/providers/AuthProvider';

interface GlobalSocketContextProps {
  socket: Socket | null;
  token: string | null;
  currentUserId: string | null;
}

const GlobalSocketContext = createContext<GlobalSocketContextProps>({ socket: null, token: null, currentUserId: null });

export const useGlobalSocket = () => useContext(GlobalSocketContext);

export function GlobalSocketProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useAuth();
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [incomingRequest, setIncomingRequest] = useState<any>(null);
  const [incomingTimer, setIncomingTimer] = useState<number>(0);

  useEffect(() => {
    const checkAuth = () => {
      const currentUser = user || AuthService.getCurrentUser();
      const authToken = AuthService.getToken() || 'dev-token';

      if (currentUser && currentUser.id) {
        setCurrentUserId(currentUser.id);
      }
      if (authToken) {
        setToken(authToken);
      }
    };
    checkAuth();
    const interval = setInterval(checkAuth, 2000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!token) return;
    const currentUser = AuthService.getCurrentUser();
    const effectiveUserId = currentUserId || currentUser?.id;

    const newSocket = io('http://localhost:3001', {
      auth: { 
        token,
        userId: effectiveUserId,
        username: (currentUser as any)?.username || currentUser?.email
      },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to Monolithic Presence Socket (Global):', newSocket.id, 'effectiveUser:', effectiveUserId);
      newSocket.emit('set_availability', { availability: 'AVAILABLE' });
    });

    newSocket.on('connect_error', (err) => {
      console.warn('[GlobalSocketProvider] Socket connection error:', err.message);
    });

    newSocket.on('incoming_call_request', (data) => {
      console.log('[GlobalSocketProvider] incoming_call_request received:', data);
      const myUser = AuthService.getCurrentUser();
      const myId = currentUserId || myUser?.id;
      const myEmail = myUser?.email || '';

      // Ignore if caller is self
      if (data.caller) {
        if (myId && data.caller.id === myId) {
          console.log('[GlobalSocketProvider] Caller is self (by id), ignoring');
          return;
        }
        if (myEmail && data.caller.username && (data.caller.username === myEmail || (data.caller.username.includes('aman') && myEmail.includes('aman')))) {
          console.log('[GlobalSocketProvider] Caller is self (by email/username), ignoring');
          return;
        }
      }

      // If targeted to a specific user and our id is definitely known and distinct
      if (data.targetUserId && myId && myId !== 'mock-123' && data.targetUserId !== myId) {
        console.log('[GlobalSocketProvider] Call not targeted to us:', data.targetUserId, 'vs', myId);
        return;
      }

      console.log('[GlobalSocketProvider] Showing incoming call popup!');
      setIncomingRequest(data);
      const remaining = Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000);
      setIncomingTimer(remaining > 0 ? remaining : 60);
    });

    newSocket.on('call_request_expired', (data) => {
      setIncomingRequest((prev: any) => {
        if (prev && prev.requestId === data.requestId) {
          setIncomingTimer(0);
          return null;
        }
        return prev;
      });
    });

    newSocket.on('call_request_cancelled', (data) => {
      setIncomingRequest((prev: any) => {
        if (prev && prev.requestId === data.requestId) {
          setIncomingTimer(0);
          return null;
        }
        return prev;
      });
    });

    newSocket.on('call_request_rejected', (data) => {
      setIncomingRequest((prev: any) => {
        if (prev && prev.requestId === data.requestId) {
          setIncomingTimer(0);
          return null;
        }
        return prev;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, currentUserId]);

  // Handle incoming request timer local tick
  useEffect(() => {
    if (incomingTimer > 0 && incomingRequest) {
      const to = setTimeout(() => setIncomingTimer(prev => prev - 1), 1000);
      return () => clearTimeout(to);
    } else if (incomingTimer === 0 && incomingRequest) {
      setIncomingRequest(null);
    }
  }, [incomingTimer, incomingRequest]);

  const handleRespondIncoming = async (action: 'ACCEPT' | 'REJECT') => {
    if (!incomingRequest) return;
    try {
      const endpoint = action === 'ACCEPT' ? 'accept' : 'reject';
      const effectiveToken = token || AuthService.getToken();
      const currentUser = AuthService.getCurrentUser();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (effectiveToken) {
        headers['Authorization'] = `Bearer ${effectiveToken}`;
      }
      if (currentUser?.id) {
        headers['x-user-id'] = currentUser.id;
      }

      const res = await fetch(`http://localhost:3001/api/calls/${incomingRequest.requestId}/${endpoint}`, {
        method: 'POST',
        headers
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      if (action === 'ACCEPT' && data.roomCode) {
        if (socket) socket.emit('set_availability', { availability: 'IN_CALL' });
        // Live calls stay embedded in matching (no fullscreen video-call page).
        const caller = incomingRequest.caller || {};
        const params = new URLSearchParams({
          roomCode: data.roomCode,
          peer: caller.firstName || caller.username || 'your match',
        });
        if (caller.profilePic) params.set('avatar', caller.profilePic);
        router.push(`/matching?${params.toString()}`);
      }
      setIncomingRequest(null);
    } catch (e: any) {
      console.error('[GlobalSocketProvider] Call response error:', e);
      if (action === 'ACCEPT') {
        const fallbackRoom = 'ROOM_' + Math.random().toString(36).substring(2, 8).toUpperCase();
        router.push(`/matching?roomCode=${fallbackRoom}`);
      }
      setIncomingRequest(null);
    }
  };

  return (
    <GlobalSocketContext.Provider value={{ socket, token, currentUserId }}>
      {children}
      {incomingRequest && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.2s ease-out',
            padding: '1rem',
          }}
        >
          <div
            className="glass"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '2px solid color-mix(in srgb, var(--color-accent) 50%, transparent)',
              padding: '36px 32px',
              borderRadius: '24px',
              textAlign: 'center',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px color-mix(in srgb, var(--color-accent) 25%, transparent)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top Glowing Pulse */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'var(--color-accent)',
              }}
            />

            {/* Caller Avatar with Live Wave Ring */}
            <div
              style={{
                position: 'relative',
                width: '90px',
                height: '90px',
                margin: '0 auto 20px',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: -6,
                  borderRadius: '50%',
                  border: '2px solid var(--color-accent)',
                  animation: 'pulse 1.5s infinite',
                  opacity: 0.7,
                }}
              />
              <img
                src={
                  incomingRequest.caller?.profilePic ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                    incomingRequest.caller?.username || incomingRequest.caller?.firstName || 'Caller'
                  )}`
                }
                alt="Caller"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--color-accent)',
                  boxShadow: '0 4px 16px color-mix(in srgb, var(--color-accent) 40%, transparent)',
                }}
              />
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '9999px',
                backgroundColor: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
                color: 'var(--color-accent)',
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                marginBottom: '10px',
              }}
            >
              <span>● INCOMING VIDEO CALL</span>
            </div>

            <h2 style={{ color: 'var(--color-text-primary)', fontSize: '1.6rem', fontWeight: 700, margin: '0 0 8px' }}>
              {incomingRequest.caller?.firstName || incomingRequest.caller?.username || 'GiniVibe Peer'}
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', margin: '0 0 24px', lineHeight: 1.5 }}>
              wants to connect on live video!
            </p>

            {/* 60-second Countdown Timer Box */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                backgroundColor: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                padding: '12px 20px',
                borderRadius: '16px',
                margin: '0 auto 28px',
                width: 'fit-content',
              }}
            >
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Ringing:</span>
              <span
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: incomingTimer <= 15 ? 'var(--color-error)' : 'var(--color-warning)',
                  fontVariantNumeric: 'tabular-nums',
                  minWidth: '50px',
                }}
              >
                {incomingTimer}s
              </span>
            </div>

            {/* Action Buttons: Decline & Accept */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '14px' }}>
              <button
                type="button"
                onClick={() => handleRespondIncoming('REJECT')}
                style={{
                  padding: '14px',
                  borderRadius: '14px',
                  border: '1px solid color-mix(in srgb, var(--color-error) 40%, transparent)',
                  backgroundColor: 'color-mix(in srgb, var(--color-error) 12%, transparent)',
                  color: 'var(--color-error)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Decline
              </button>

              <button
                type="button"
                onClick={() => handleRespondIncoming('ACCEPT')}
                style={{
                  padding: '14px',
                  borderRadius: '14px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-btn-bg)',
                  color: 'var(--color-btn-ink)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px color-mix(in srgb, var(--color-accent) 40%, transparent)',
                  transition: 'all 0.2s ease',
                }}
              >
                Accept Call →
              </button>
            </div>
          </div>
        </div>
      )}
    </GlobalSocketContext.Provider>
  );
}
