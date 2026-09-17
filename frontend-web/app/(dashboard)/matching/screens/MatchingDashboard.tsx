'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/app/core/components/Card';
import { Button } from '@/app/core/components/Button';
import { Sparkles, X } from 'lucide-react';
import { useGlobalSocket } from '@/app/core/providers/GlobalSocketProvider';
import { WebcamPixelGrid } from '@/components/ui/webcam-pixel-grid';
import { MatchingExpandableGrid } from './MatchingExpandableGrid';
import { LiveMatchRoom } from './LiveMatchRoom';

const MATCH_STATE_KEY = 'ginivibe_match_state';

interface PersistedMatchState {
  category: string;
  mode: 'live' | 'non-live';
  candidate: any;
}

function readMatchParams(): { category: string | null; mode: 'live' | 'non-live' | null; candidateId: string | null } {
  if (typeof window === 'undefined') return { category: null, mode: null, candidateId: null };
  try {
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');
    const rawMode = params.get('mode');
    const mode = rawMode === 'live' || rawMode === 'non-live' ? rawMode : null;
    return { category, mode, candidateId: params.get('candidate') };
  } catch {
    return { category: null, mode: null, candidateId: null };
  }
}

function readStoredMatch(): PersistedMatchState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(MATCH_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.category || !parsed?.mode) return null;
    if (parsed.mode !== 'live' && parsed.mode !== 'non-live') return null;
    return parsed as PersistedMatchState;
  } catch {
    return null;
  }
}

interface RoomInvite {
  room: string | null;
  peer: string | null;
  avatar: string | null;
}

// Receiver path: accepting a call from the global popup lands on
// /matching?roomCode=...&peer=... — the embedded room opens from this.
function readRoomInvite(): RoomInvite {
  const empty: RoomInvite = { room: null, peer: null, avatar: null };
  if (typeof window === 'undefined') return empty;
  try {
    const params = new URLSearchParams(window.location.search);
    return {
      room: params.get('roomCode'),
      peer: params.get('peer'),
      avatar: params.get('avatar'),
    };
  } catch {
    return empty;
  }
}

export function MatchingDashboard() {
  const [activeCategory, setActiveCategory] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    if (readRoomInvite().room) return null;
    const fromUrl = readMatchParams();
    if (fromUrl.category) return fromUrl.category;
    return readStoredMatch()?.category ?? null;
  });
  const [matchingMode, setMatchingMode] = useState<'live' | 'non-live' | null>(() => {
    if (typeof window === 'undefined') return null;
    if (readRoomInvite().room) return 'live';
    const fromUrl = readMatchParams();
    if (fromUrl.mode) return fromUrl.mode;
    return readStoredMatch()?.mode ?? null;
  });
  const [candidate, setCandidate] = useState<any>(() => {
    if (typeof window === 'undefined') return null;
    if (readRoomInvite().room) return null;
    const stored = readStoredMatch();
    const fromUrl = readMatchParams();
    if (!stored?.candidate) return null;
    // Only restore the stored profile when it belongs to the restored flow.
    if (fromUrl.category && stored.category !== fromUrl.category) return null;
    if (fromUrl.mode && stored.mode !== fromUrl.mode) return null;
    if (fromUrl.candidateId && stored.candidate?.profile?.id !== fromUrl.candidateId) return null;
    if (!fromUrl.category && !fromUrl.mode && stored.candidate) return stored.candidate;
    if ((fromUrl.category || fromUrl.mode) && stored.candidate) return stored.candidate;
    return null;
  });
  // Embedded live call: room code when a call is active (no fullscreen nav).
  const [liveRoom, setLiveRoom] = useState<string | null>(() => readRoomInvite().room);
  const [roomPeer, setRoomPeer] = useState<{ name: string; avatar?: string } | null>(() => {
    const { peer, avatar } = readRoomInvite();
    return peer ? { name: peer, avatar: avatar || undefined } : null;
  });
  const skipInitialFetchRef = useRef(Boolean(candidate));
  const candidateRef = useRef<{ profile?: { name?: string; avatarUrl?: string } } | null>(null);
  useEffect(() => {
    candidateRef.current = candidate;
  }, [candidate]);
  const [loading, setLoading] = useState(false);
  const { socket, token, currentUserId } = useGlobalSocket();
  const [isMessaging, setIsMessaging] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  // Reset the photo fallback whenever a different candidate is shown.
  useEffect(() => {
    setAvatarFailed(false);
    setShowPhotoModal(false);
  }, [candidate?.profile?.id]);
  const [callRequest, setCallRequest] = useState<any>(null);
  const [callTimer, setCallTimer] = useState<number>(0);
  const [liveIndex, setLiveIndex] = useState(0);
  const [aiIntent, setAiIntent] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      return localStorage.getItem('ginivibe_match_intent') || '';
    } catch {
      return '';
    }
  });
  const saveAiIntent = (value: string) => {
    setAiIntent(value);
    try {
      localStorage.setItem('ginivibe_match_intent', value);
    } catch {}
  };

  // Consume the room invite URL once state has initialized from it.
  // Preserve match deep-link params (?category=&mode=&candidate=) when clearing.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (readRoomInvite().room) {
      const params = new URLSearchParams(window.location.search);
      params.delete('roomCode');
      params.delete('peer');
      params.delete('avatar');
      const qs = params.toString();
      window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''));
      try {
        sessionStorage.removeItem(MATCH_STATE_KEY);
      } catch {}
    }
  }, []);

  // Deep-link the open match flow so refresh restores the same profile view.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (liveRoom) return; // room invite owns the URL while a call is active
    try {
      const params = new URLSearchParams(window.location.search);
      if (activeCategory && matchingMode) {
        params.set('category', activeCategory);
        params.set('mode', matchingMode);
        const cid = candidate?.profile?.id;
        if (cid) params.set('candidate', String(cid));
        else params.delete('candidate');
        window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
        sessionStorage.setItem(
          MATCH_STATE_KEY,
          JSON.stringify({ category: activeCategory, mode: matchingMode, candidate }),
        );
      } else if (activeCategory && !matchingMode) {
        // Back at mode picker: keep category, drop stale candidate.
        params.set('category', activeCategory);
        params.delete('mode');
        params.delete('candidate');
        window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
        try {
          sessionStorage.removeItem(MATCH_STATE_KEY);
        } catch {}
      } else {
        params.delete('category');
        params.delete('mode');
        params.delete('candidate');
        const qs = params.toString();
        window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''));
        sessionStorage.removeItem(MATCH_STATE_KEY);
      }
    } catch {}
  }, [activeCategory, matchingMode, candidate, liveRoom]);

  // Full-bleed pixel picker: black shell + transparent panel while picking.
  // Lime/champagne returns once a match flow starts.
  const inPicker = !liveRoom && !(activeCategory && matchingMode);
  useEffect(() => {
    const shell = document.querySelector('.layout-container');
    const panel = document.querySelector('.app-container');
    shell?.classList.toggle('gv-pixel-shell', inPicker);
    panel?.classList.toggle('gv-match-bleed', inPicker);
    return () => {
      shell?.classList.remove('gv-pixel-shell');
      panel?.classList.remove('gv-match-bleed');
    };
  }, [inPicker]);

  useEffect(() => {
    if (!socket) return;

    // We don't need to listen to incoming_call_request here anymore, it's global!

    const onAccepted = (data: any) => {
      const peer = candidateRef.current?.profile;
      if (peer) setRoomPeer({ name: peer.name || 'your match', avatar: peer.avatarUrl });
      setCallRequest(null);
      setCallTimer(0);
      setLiveRoom(data.roomCode);
    };
    
    const onRejected = () => {
      setCallRequest(null);
      setCallTimer(0);
      fetchCandidate();
    };
    
    const onExpired = (data: any) => {
      setCallRequest((prev: any) => {
        if (prev && prev.id === data.requestId) {
          setCallTimer(0);
          fetchCandidate();
          return null;
        }
        return prev;
      });
    };

    socket.on('call_request_accepted', onAccepted);
    socket.on('call_request_rejected', onRejected);
    socket.on('call_request_expired', onExpired);

    return () => {
      socket.off('call_request_accepted', onAccepted);
      socket.off('call_request_rejected', onRejected);
      socket.off('call_request_expired', onExpired);
    };
  }, [socket]);

  const getEffectiveUserId = async (): Promise<string | null> => {
    if (currentUserId && currentUserId !== 'mock-123') return currentUserId;
    if (typeof window !== 'undefined') {
      try {
        const session = localStorage.getItem('ginivibe_auth_session');
        if (session) {
          const parsed = JSON.parse(session);
          if (parsed?.id && parsed.id !== 'mock-123') return parsed.id;
        }
      } catch {}
      try {
        const stored = localStorage.getItem('ginivibe_auth_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.id && parsed.id !== 'mock-123') return parsed.id;
        }
      } catch {}
    }
    try {
      const res = await fetch('http://localhost:3003/api/matching/test-user');
      if (res.ok) {
        const data = await res.json();
        if (data?.id) return data.id;
      }
    } catch {}
    return currentUserId || null;
  };

  useEffect(() => {
    // Fetch if the category is set and matching mode is selected.
    // Skip the very first auto-fetch when we restored the open profile from
    // URL/session so refresh keeps the user on the same card.
    if (activeCategory && (matchingMode === 'non-live' || matchingMode === 'live')) {
      if (skipInitialFetchRef.current) {
        skipInitialFetchRef.current = false;
        setLoading(false);
        return;
      }
      fetchCandidate();
    }
  }, [liveIndex, activeCategory, matchingMode, currentUserId]);

  const fetchCandidate = async () => {
    setLoading(true);
    const userId = await getEffectiveUserId();
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      if (matchingMode === 'live') {
        const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('ginivibe_auth_token') : null) || 'dev-token';
        const res = await fetch('http://localhost:3001/api/presence/available', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.ok) {
          const users = await res.json();
          if (users.length > 0) {
            const safeIndex = liveIndex % users.length;
            const u = users[safeIndex];
            setCandidate({
              profile: {
                id: u.id,
                name: u.firstName || u.username,
                avatarUrl: u.profilePic || 'https://i.pravatar.cc/150?u=' + u.id,
                age: 25,
                bio: 'I am available for a video call!',
                tags: ['Live', 'Video']
              },
              match: { totalScore: 0.95 }
            });
          } else {
            setCandidate(null);
          }
        }
      } else {
        const queryParams = new URLSearchParams();
        if (activeCategory) queryParams.append('category', activeCategory);
        if (activeCategory === 'ai' && aiIntent) queryParams.append('intent', aiIntent);
        
        const res = await fetch(`http://localhost:3003/api/matching/next?${queryParams.toString()}`, {
          headers: { 'x-user-id': userId }
        });
        if (res.ok) {
          const data = await res.json();
          setCandidate(data);
        } else if (res.status === 404) {
          setCandidate(null);
        } else {
          // Keep the current card on transient errors instead of blanking to
          // "No more candidates".
          console.warn('Matching fetch failed:', res.status);
        }
      }
    } catch (e) {
      console.error(e);
      // Don't wipe a restored/visible card on network failure.
      if (!candidateRef.current) {
        setCandidate(null);
      }
    }
    setLoading(false);
  };

  const handleFollowAction = async (msg?: string) => {
    const userId = await getEffectiveUserId();
    if (!userId || !candidate) return;
    try {
      await fetch('http://localhost:3003/api/follow/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({ targetUserId: candidate.profile.id, message: msg || undefined })
      });
      setIsMessaging(false);
      setMessageText("");
      fetchCandidate();
    } catch (e) {
      console.error(e);
    }
  };

  const handlePass = () => {
    setIsMessaging(false);
    setMessageText("");
    if (matchingMode === 'live') {
      setLiveIndex(prev => prev + 1);
    } else {
      fetchCandidate();
    }
  };

  useEffect(() => {
    if (activeCategory && (matchingMode === 'non-live' || matchingMode === 'live')) {
      setLiveIndex(0); 
    }
  }, [activeCategory, matchingMode]);

  // Handle outgoing request timer local tick
  useEffect(() => {
    if (callTimer > 0 && callRequest) {
      const to = setTimeout(() => setCallTimer(prev => prev - 1), 1000);
      return () => clearTimeout(to);
    }
  }, [callTimer, callRequest]);

  const handleLiveRequest = async () => {
    const userId = await getEffectiveUserId();
    if (!userId || !candidate) return;
    const effectiveToken = token || (typeof window !== 'undefined' ? localStorage.getItem('ginivibe_auth_token') : null) || 'dev-token';
    try {
      const res = await fetch('http://localhost:3001/api/calls/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${effectiveToken}`,
          'x-user-id': userId
        },
        body: JSON.stringify({ receiverId: candidate.profile.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCallRequest(data);
      setCallTimer(60);
    } catch (e: any) {
      alert(e.message);
      console.error(e);
    }
  };

  const handleRoomEnd = () => {
    setLiveRoom(null);
    setRoomPeer(null);
    setCallRequest(null);
    setCallTimer(0);
    // Caller path: move to the next candidate. Receiver path (no category
    // selected) simply falls back to the pixel picker.
    if (activeCategory && matchingMode) {
      if (matchingMode === 'live') {
        setLiveIndex(prev => prev + 1);
      } else {
        fetchCandidate();
      }
    }
  };

  if (liveRoom) {
    return (
      <div style={{ padding: 'var(--space-6)', maxWidth: '1080px', margin: '0 auto' }}>
        <LiveMatchRoom
          roomCode={liveRoom}
          peerName={roomPeer?.name || candidate?.profile?.name || 'your match'}
          peerAvatar={roomPeer?.avatar || candidate?.profile?.avatarUrl}
          onEnd={handleRoomEnd}
        />
      </div>
    );
  }

  if (activeCategory && (matchingMode === 'non-live' || matchingMode === 'live')) {
    return (
      <div style={{ padding: 'var(--space-6)', maxWidth: '1000px', margin: '0 auto' }}>
        <Button variant="ghost" onClick={() => { setMatchingMode(null); setCandidate(null); setShowPhotoModal(false); }} style={{ marginBottom: 'var(--space-2)' }}>
          ← Change Mode
        </Button>
        {activeCategory === 'ai' && aiIntent && (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: '0 0 var(--space-4) 0' }}>
            Looking for: <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>“{aiIntent}”</span>
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-8)' }}>
          {loading ? (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.2rem' }}>Finding your perfect match...</p>
          ) : !candidate ? (
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-4)', color: 'var(--color-text-primary)' }}>No more candidates right now!</h2>
              <Button onClick={() => { setActiveCategory(null); setMatchingMode(null); setCandidate(null); }}>Go Back</Button>
            </div>
          ) : (
            <Card style={{ maxWidth: '420px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.35)', color: 'var(--color-text-primary)' }}>
              <style dangerouslySetInnerHTML={{__html: `
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
              `}} />
              
              <div className="hide-scrollbar" style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {/* Top Banner Wave */}
                <div style={{ height: '110px', flexShrink: 0, background: 'linear-gradient(180deg, #b6ff2e 0%, #d9f873 100%)', position: 'relative', borderRadius: '0 0 100% 100% / 0 0 30px 30px', zIndex: 1, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                  <div style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: 'rgba(22, 24, 29, 0.6)', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid color-mix(in srgb, var(--color-text-primary) 6%, transparent)', backdropFilter: 'blur(4px)' }}>
                    <Sparkles size={14} color="var(--color-accent)" /> {Math.round(candidate.match.totalScore * 100)}% Match
                  </div>
                </div>
                
                <CardContent style={{ padding: '0 24px', position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column' }}>
                  {/* Avatar & Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: '-45px', marginBottom: '20px', gap: '16px' }}>
                    <div 
                      style={{ position: 'relative', flexShrink: 0, cursor: 'pointer', transition: 'transform 0.2s ease' }} 
                      onClick={() => setShowPhotoModal(true)}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      title="View Photo"
                    >
                    {(() => {
                      const rawAvatar = candidate.profile.avatarUrl;
                      const avatarUrl = typeof rawAvatar === 'string' ? rawAvatar.trim() : '';
                      const initial = ((candidate.profile.name || 'G').trim().charAt(0) || 'G').toUpperCase();
                      return avatarUrl && !avatarFailed ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarUrl}
                          alt={candidate.profile.name || 'Match photo'}
                          loading="lazy"
                          onError={() => setAvatarFailed(true)}
                          style={{ width: '92px', height: '92px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--color-surface)', boxShadow: '0 0 25px color-mix(in srgb, var(--color-accent) 30%, transparent)', backgroundColor: 'var(--color-surface)' }}
                        />
                      ) : (
                        <div
                          role="img"
                          aria-label={candidate.profile.name || 'Match'}
                          style={{ width: '92px', height: '92px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '2rem', border: '4px solid var(--color-surface)', boxShadow: '0 0 25px color-mix(in srgb, var(--color-accent) 30%, transparent)', backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-secondary)' }}
                        >
                          {initial}
                        </div>
                      );
                    })()}
                  </div>
                  <div style={{ paddingTop: '50px', minWidth: 0, flex: 1 }}>
                    <h3 style={{ fontSize: '1.45rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{candidate.profile.name}</span>
                      <span style={{ fontSize: '1.15rem', opacity: 0.9, fontWeight: 400, flexShrink: 0 }}>{candidate.profile.zodiacSign || '☽ ☿ ☆。• ✧'}</span>
                    </h3>
                    <p style={{ color: 'var(--color-text-muted)', margin: '2px 0 0 0', fontSize: '0.9rem', letterSpacing: '0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {candidate.profile.handle || '@uniqueuser777'}
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 500 }}>
                  Local time: {candidate.profile.localTime || '02:27'}
                </div>

                {/* Country / Secret Pills */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ flex: 1, backgroundColor: 'var(--color-surface-elevated)', padding: '12px 10px', borderRadius: '12px', textAlign: 'center', fontSize: '0.95rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', border: '1px solid color-mix(in srgb, var(--color-text-primary) 3%, transparent)', boxShadow: 'inset 0 1px 0 color-mix(in srgb, var(--color-text-primary) 6%, transparent)' }}>
                    <span style={{ fontSize: '1.1rem' }}>{candidate.profile.locationFlag || '🇧🇷'}</span> {candidate.profile.location || 'Brazil'}
                  </div>
                  {(candidate.profile.isSecret !== false) && (
                    <div style={{ flex: 1, backgroundColor: 'var(--color-surface-elevated)', padding: '12px 10px', borderRadius: '12px', textAlign: 'center', fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-accent)', border: '1px solid color-mix(in srgb, var(--color-text-primary) 3%, transparent)', boxShadow: 'inset 0 1px 0 color-mix(in srgb, var(--color-text-primary) 6%, transparent)' }}>
                      Secret
                    </div>
                  )}
                </div>

                <div style={{ backgroundColor: 'var(--color-surface-elevated)', borderRadius: '16px', padding: '20px', marginBottom: '24px', border: '1px solid color-mix(in srgb, var(--color-text-primary) 4%, transparent)', boxShadow: '0 4px 15px rgba(0,0,0,0.15)' }}>
                  {/* Gender / Age */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px', paddingBottom: '18px', borderBottom: '1px solid color-mix(in srgb, var(--color-text-primary) 7%, transparent)' }}>
                    <span style={{ color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                      <span style={{ color: 'var(--color-text-primary)', fontSize: '1.1rem' }}>
                        {(candidate.profile.gender || 'Female').toLowerCase() === 'female' ? '♀' : '♂'}
                      </span> 
                      {candidate.profile.gender || 'Female'}
                    </span>
                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 400 }}>
                      <b style={{ fontWeight: 600 }}>{candidate.profile.age}</b> years old
                    </span>
                  </div>

                  {/* Numerology / MBTI */}
                  <div style={{ marginBottom: '16px', fontSize: '0.95rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    {candidate.profile.personalityType || '777 ☆ INFJ'}
                  </div>

                  {/* Bio */}
                  <p style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)', lineHeight: 1.6, marginBottom: '20px', opacity: 0.95 }}>
                    {candidate.profile.bio || "I can say that I'm authentic; the rest you'll discover by talking to me."}
                  </p>

                  <div style={{ fontSize: '0.8rem', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '14px', color: 'var(--color-text-primary)', fontWeight: 600, opacity: 0.85 }}>
                    {candidate.profile.mantra || 'MANTRA AND MEDITATION FOREVER'}
                  </div>
                  
                  <div style={{ marginBottom: '28px', letterSpacing: '4px', fontSize: '1.05rem' }}>
                    {candidate.profile.emojis || '🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻'}
                  </div>

                  {/* Topics of interest */}
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '14px', color: 'var(--color-text-primary)', opacity: 0.9 }}>Topics of interest</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '28px' }}>
                    {(candidate.profile.tags && candidate.profile.tags.length > 0 ? candidate.profile.tags : ['Poetry', 'Psychology', 'Reading', 'Yoga', 'Photography']).map((tag: string) => (
                      <span key={tag} style={{ padding: '7px 16px', backgroundColor: 'color-mix(in srgb, var(--color-text-primary) 5%, transparent)', borderRadius: '24px', border: '1px solid color-mix(in srgb, var(--color-text-primary) 7%, transparent)', fontSize: '0.85rem', color: 'var(--color-text-muted)', transition: 'all 0.2s ease', cursor: 'default' }} onMouseOver={e => {e.currentTarget.style.backgroundColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-primary)'}} onMouseOut={e => {e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-text-primary) 5%, transparent)'; e.currentTarget.style.color = 'var(--color-text-muted)'}}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Languages */}
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '14px', color: 'var(--color-text-primary)', opacity: 0.9 }}>Languages spoken</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {(candidate.profile.languages && candidate.profile.languages.length > 0 ? candidate.profile.languages : [{name: 'English', flag: '🇬🇧', primary: true}, {name: 'Spanish', flag: '🇪🇸'}, {name: 'Portuguese', flag: '🇵🇹'}]).map((lang: any) => (
                      <span key={lang.name} style={{ padding: '7px 16px', backgroundColor: lang.primary ? 'color-mix(in srgb, var(--color-accent) 8%, transparent)' : 'color-mix(in srgb, var(--color-text-primary) 5%, transparent)', borderRadius: '24px', border: `1px solid ${lang.primary ? 'color-mix(in srgb, var(--color-accent) 30%, transparent)' : 'color-mix(in srgb, var(--color-text-primary) 7%, transparent)'}`, fontSize: '0.85rem', color: lang.primary ? 'var(--color-accent)' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.1rem' }}>{lang.flag}</span> <span style={{ color: 'var(--color-text-secondary)' }}>{lang.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </div>

            {/* Bottom Actions - Fixed at bottom */}
            <div style={{ flexShrink: 0, padding: '16px 24px 20px 24px', backgroundColor: 'rgba(30, 39, 50, 0.95)', borderTop: '1px solid color-mix(in srgb, var(--color-text-primary) 6%, transparent)', position: 'relative', zIndex: 10, backdropFilter: 'blur(8px)' }}>
              {matchingMode === 'non-live' ? (
                isMessaging ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', animation: 'fadeIn 0.2s ease-out' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500, marginBottom: '2px' }}>
                      <span>Add an optional message</span>
                      <span style={{ color: messageText.length >= 150 ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
                        {messageText.length}/150
                      </span>
                    </div>
                    {activeCategory === 'ai' && aiIntent && !messageText && (
                      <button
                        type="button"
                        onClick={() => setMessageText(aiIntent.slice(0, 150))}
                        style={{ alignSelf: 'flex-start', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-primary)', fontSize: '0.8rem', padding: '6px 12px', cursor: 'pointer' }}
                      >
                        Use my intent as the icebreaker
                      </button>
                    )}
                    <textarea 
                      placeholder="Type something nice to break the ice..." 
                      value={messageText}
                      maxLength={150}
                      onChange={e => setMessageText(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', fontSize: '0.9rem', resize: 'none', height: '64px', outline: 'none', fontFamily: 'inherit' }}
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                      <Button 
                        variant="ghost" 
                        onClick={() => { setIsMessaging(false); setMessageText(""); }} 
                        style={{ flex: 1, backgroundColor: 'color-mix(in srgb, var(--color-text-primary) 6%, transparent)', color: 'var(--color-text-primary)', borderRadius: '12px', fontWeight: 600, padding: '12px 0' }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => handleFollowAction(messageText)} 
                        style={{ flex: 2, backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-ink)', border: '1px solid var(--color-border)', fontWeight: 700, borderRadius: '12px', padding: '12px 0', boxShadow: '0 4px 15px color-mix(in srgb, var(--color-accent) 25%, transparent)' }}
                      >
                        Send Request
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={handlePass}
                      style={{ flex: 1, padding: '14px 0', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                    >
                      Skip
                    </button>
                    
                    <button 
                      onClick={() => setIsMessaging(true)}
                      style={{ flex: 2, padding: '14px 0', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--color-btn-bg)', border: '1px solid var(--color-border)', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', color: 'var(--color-btn-ink)', fontWeight: 700, fontSize: '1rem', boxShadow: '0 4px 15px color-mix(in srgb, var(--color-accent) 30%, transparent)' }}
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-accent) 25%, var(--color-btn-bg))'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px color-mix(in srgb, var(--color-accent) 40%, transparent)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-accent)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px color-mix(in srgb, var(--color-accent) 30%, transparent)'; }}
                    >
                      Follow
                    </button>
                  </div>
                )
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {callRequest && callTimer > 0 ? (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: 'var(--color-accent)', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px' }}>{callTimer}s</div>
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>Waiting for {candidate.profile.name} to accept...</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        onClick={handlePass}
                        style={{ flex: 1, padding: '14px 0', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                      >
                        Skip
                      </button>
                      <button 
                        onClick={handleLiveRequest}
                        style={{ flex: 2, padding: '14px 0', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--color-btn-bg)', border: '1px solid var(--color-border)', cursor: 'pointer', color: 'var(--color-btn-ink)', fontWeight: 700, fontSize: '1rem', boxShadow: '0 4px 15px color-mix(in srgb, var(--color-accent) 30%, transparent)' }}
                      >
                        Request Video Call
                      </button>
                    </div>
                  )}
                </div>
              )}
              </div>

              {/* Photo Modal */}
              {showPhotoModal && (
                <div 
                  style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(22, 24, 29, 0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease-out' }}
                  onClick={() => setShowPhotoModal(false)}
                >
                  <div
                    style={{ width: 'min(90vw, 80vh)', height: 'min(90vw, 80vh)', borderRadius: '50%', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', border: '4px solid var(--color-surface)', backgroundColor: 'var(--color-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(() => {
                      const rawAvatar = candidate.profile.avatarUrl;
                      const avatarUrl = typeof rawAvatar === 'string' ? rawAvatar.trim() : '';
                      const initial = ((candidate.profile.name || 'G').trim().charAt(0) || 'G').toUpperCase();
                      return avatarUrl && !avatarFailed ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarUrl}
                          alt={candidate.profile.name || 'Match photo'}
                          onError={() => setAvatarFailed(true)}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ fontSize: '4rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>{initial}</span>
                      );
                    })()}
                  </div>
                  <button 
                    onClick={() => setShowPhotoModal(false)}
                    style={{ position: 'absolute', top: '24px', right: '24px', backgroundColor: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', cursor: 'pointer' }}
                  >
                    <X size={24} />
                  </button>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="gv-match-stage">
      <div className="gv-match-bg">
        <WebcamPixelGrid
          gridCols={60}
          gridRows={40}
          maxElevation={50}
          motionSensitivity={0.25}
          elevationSmoothing={0.2}
          colorMode="webcam"
          backgroundColor="#030303"
          mirror={true}
          gapRatio={0.05}
          invertColors={false}
          darken={0.6}
          borderColor="#ffffff"
          borderOpacity={0.06}
          fallback="brand"
          showErrorUI={false}
          className="w-full h-full"
        />
      </div>
      <div className="gv-match-veil" />

      <div className="gv-match-content">
        <header style={{ marginBottom: 'var(--space-8)' }}>
          <h1 className="gv-pixel-title">Matching</h1>
          <p className="gv-pixel-sub">
            Tell GiniVibe who you are looking for, or browse by kundli, custom rules and compatibility.
          </p>
        </header>

        <MatchingExpandableGrid
          aiIntent={aiIntent}
          onAiIntentChange={saveAiIntent}
          onPick={(categoryId, mode) => {
            setActiveCategory(categoryId);
            setMatchingMode(mode);
          }}
        />
      </div>
    </div>
  );
}
