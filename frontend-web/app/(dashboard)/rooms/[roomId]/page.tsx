'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import {
  MessageSquare, Mic, MicOff, Video, VideoOff, ScreenShare,
  PhoneOff, Users, Send, AlertTriangle, Copy, Check, Trash2,
  Lock, Globe, Info
} from 'lucide-react';
import {
  RoomsApi, ROOMS_SOCKET_URL, type Room, type RoomMessage
} from '../api/rooms';
import { useAuth } from '@/app/core/providers/AuthProvider';
import styles from '../rooms.module.css';

// Type definition for LiveKit participant track mapping
interface TrackParticipant {
  identity: string;
  name: string;
  isLocal: boolean;
  isSpeaking: boolean;
  hasAudio: boolean;
  hasVideo: boolean;
  videoTrack?: any;
  /** Live LiveKit participant handle (voice/video rooms) for track attach. */
  handle?: any;
}

// Attaches a LiveKit participant's camera track to a <video> element.
// Works for local + remote participants; re-syncs on subscribe events.
function LiveVideoTile({ participant, muted, className }: { participant: any; muted: boolean; className?: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !participant) return;

    const currentVideoTrack = () => {
      const pubs: Map<string, any> | undefined = participant.videoTrackPublications;
      if (!pubs) return undefined;
      for (const pub of pubs.values()) {
        if (pub?.track && String(pub.track.kind) === 'video') return pub.track;
      }
      return undefined;
    };

    const attached = new Set<any>();
    const attach = (track: any) => {
      if (track && String(track.kind) === 'video' && !attached.has(track)) {
        attached.add(track);
        try {
          track.attach(el);
        } catch {
          // Ignore races where the element unmounted mid-attach.
        }
      }
    };
    const detach = (track: any) => {
      if (track && attached.has(track)) {
        attached.delete(track);
        try {
          track.detach(el);
        } catch {
          // Ignore detach races.
        }
      }
    };

    attach(currentVideoTrack());
    const onSubscribed = (track: any) => attach(track);
    const onUnsubscribed = (track: any) => detach(track);
    participant.on?.('trackSubscribed', onSubscribed);
    participant.on?.('trackUnsubscribed', onUnsubscribed);
    return () => {
      participant.off?.('trackSubscribed', onSubscribed);
      participant.off?.('trackUnsubscribed', onUnsubscribed);
      attached.forEach((track) => {
        try {
          track.detach(el);
        } catch {
          // Ignore detach races.
        }
      });
      attached.clear();
    };
  }, [participant]);

  return <video ref={videoRef} autoPlay playsInline muted={muted} className={className} />;
}

export default function RoomDetailPage() {
  const params = useParams();
  const roomId = params?.roomId as string;
  const router = useRouter();
  const { user } = useAuth();

  const [room, setRoom] = useState<Room | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tokenType, setTokenType] = useState<'livekit' | 'socket'>('socket');
  const [livekitUrl, setLivekitUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Text Chat State
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // LiveKit / Media Controls State
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [livekitWarning, setLivekitWarning] = useState<string | null>(null);
  const [participants, setParticipants] = useState<TrackParticipant[]>([]);
  const [occupancy, setOccupancy] = useState<number | null>(null);
  const livekitRoomRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  // Set once the HTTP join succeeds, so unmount can leave exactly once.
  const joinedRef = useRef(false);

  const [copied, setCopied] = useState(false);

  // Scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 1. Join and Fetch Room Metadata
  useEffect(() => {
    let isMounted = true;

    async function initRoom() {
      if (!roomId) return;
      setLoading(true);
      setError(null);

      try {
        // Check session storage first
        let sessionToken = sessionStorage.getItem(`room_token_${roomId}`);
        const sessionLkUrl = sessionStorage.getItem(`room_livekit_${roomId}`);

        let joinData;
        if (!sessionToken) {
          joinData = await RoomsApi.join(roomId);
          sessionToken = joinData.token;
          setRoom(joinData.room);
          setTokenType(joinData.tokenType);
          setLivekitUrl(joinData.livekitUrl || null);
          sessionStorage.setItem(`room_token_${roomId}`, joinData.token);
          if (joinData.livekitUrl) {
            sessionStorage.setItem(`room_livekit_${roomId}`, joinData.livekitUrl);
          }
        } else {
          const roomData = await RoomsApi.get(roomId);
          setRoom(roomData);
          setOccupancy(roomData.currentParticipantsCount ?? null);
          setTokenType(roomData.type === 'TEXT' ? 'socket' : 'livekit');
          setLivekitUrl(sessionLkUrl || null);
        }
        joinedRef.current = true;

        if (isMounted) {
          setToken(sessionToken);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to enter room');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void initRoom();

    return () => {
      isMounted = false;
      // Navigating away ends presence (tab closes are covered by the socket
      // disconnect handler server-side). Best-effort: never blocks unmount.
      if (joinedRef.current) {
        joinedRef.current = false;
        void RoomsApi.leave(roomId).catch(() => {});
      }
    };
  }, [roomId]);

  // 2. Setup Socket.IO for Persistent Chat & WebSockets
  useEffect(() => {
    if (!token || !roomId) return;

    const socket = io(ROOMS_SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('join-room', { roomId });
    });

    socket.on('room-history', (history: RoomMessage[]) => {
      setMessages(history);
    });

    socket.on('new-message', (msg: RoomMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('room-occupancy', ({ count }: { roomId: string; count: number }) => {
      if (typeof count === 'number') setOccupancy(count);
    });

    socket.on('room-error', ({ error: roomError }: { error?: string }) => {
      if (roomError) setError(roomError);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, roomId]);

  // 3. Setup LiveKit Audio/Video SFU (VOICE and VIDEO rooms)
  useEffect(() => {
    if (!token || !room || room.type === 'TEXT') return;

    let isCancelled = false;

    const currentRoom = room;
    const currentToken = token;

    async function connectLiveKit() {
      try {
        // Dynamically load livekit-client to keep bundle optimal
        const { Room: LKRoom, RoomEvent, createLocalVideoTrack, createLocalAudioTrack } = await import('livekit-client');

        if (!livekitUrl || livekitUrl.includes('your-livekit-instance')) {
          setLivekitWarning('LiveKit SFU not configured on backend. Simulating local audio/video.');
          setupSimulatedMedia();
          return;
        }

        const lkRoom = new LKRoom({
          adaptiveStream: true,
          dynacast: true,
        });
        livekitRoomRef.current = lkRoom;

        lkRoom.on(RoomEvent.Connected, () => {
          if (isCancelled) return;
          setLivekitWarning(null);
          updateParticipants(lkRoom);
        });

        lkRoom.on(RoomEvent.ParticipantConnected, () => updateParticipants(lkRoom));
        lkRoom.on(RoomEvent.ParticipantDisconnected, () => updateParticipants(lkRoom));
        lkRoom.on(RoomEvent.TrackSubscribed, () => updateParticipants(lkRoom));
        lkRoom.on(RoomEvent.TrackUnsubscribed, () => updateParticipants(lkRoom));
        lkRoom.on(RoomEvent.ActiveSpeakersChanged, () => updateParticipants(lkRoom));

        await lkRoom.connect(livekitUrl, currentToken);

        // Publish local media according to room type
        if (currentRoom.type === 'VOICE' || currentRoom.type === 'VIDEO') {
          try {
            await lkRoom.localParticipant.setMicrophoneEnabled(true);
            setIsMicOn(true);
          } catch (micErr) {
            console.warn('Could not enable microphone:', micErr);
          }
        }

        if (currentRoom.type === 'VIDEO') {
          try {
            await lkRoom.localParticipant.setCameraEnabled(true);
            setIsCameraOn(true);
          } catch (camErr) {
            console.warn('Could not enable camera:', camErr);
          }
        }

        updateParticipants(lkRoom);
      } catch (err: any) {
        console.warn('LiveKit SFU connection error:', err);
        setLivekitWarning(`LiveKit connection notice: ${err.message || 'Running in local media mode'}`);
        setupSimulatedMedia();
      }
    }

    function updateParticipants(lkRoom: any) {
      if (!lkRoom) return;
      const list: TrackParticipant[] = [];

      // Local participant
      if (lkRoom.localParticipant) {
        list.push({
          identity: lkRoom.localParticipant.identity,
          name: lkRoom.localParticipant.name || user?.name || 'You',
          isLocal: true,
          isSpeaking: lkRoom.localParticipant.isSpeaking,
          hasAudio: lkRoom.localParticipant.isMicrophoneEnabled,
          hasVideo: lkRoom.localParticipant.isCameraEnabled,
          handle: lkRoom.localParticipant,
        });
      }

      // Remote participants
      lkRoom.remoteParticipants.forEach((p: any) => {
        list.push({
          identity: p.identity,
          name: p.name || p.identity,
          isLocal: false,
          isSpeaking: p.isSpeaking,
          hasAudio: p.isMicrophoneEnabled,
          hasVideo: p.isCameraEnabled,
          handle: p,
        });
      });

      setParticipants(list);
    }

    async function setupSimulatedMedia() {
      // Local webcam/mic preview fallback
      try {
        if (room?.type === 'VIDEO') {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).catch(() => null);
          if (stream && localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }
      } catch (e) {
        // ignore device permission errors
      }

      setParticipants([
        {
          identity: user?.id || 'local-user',
          name: user?.name || 'You',
          isLocal: true,
          isSpeaking: false,
          hasAudio: true,
          hasVideo: room?.type === 'VIDEO',
        },
      ]);
    }

    void connectLiveKit();

    return () => {
      isCancelled = true;
      if (livekitRoomRef.current) {
        livekitRoomRef.current.disconnect();
        livekitRoomRef.current = null;
      }
    };
  }, [token, room, livekitUrl, user]);

  // Media Toolbar Actions
  const toggleMic = async () => {
    if (livekitRoomRef.current) {
      const next = !isMicOn;
      await livekitRoomRef.current.localParticipant.setMicrophoneEnabled(next);
      setIsMicOn(next);
    } else {
      setIsMicOn(!isMicOn);
    }
  };

  const toggleCamera = async () => {
    if (livekitRoomRef.current) {
      const next = !isCameraOn;
      await livekitRoomRef.current.localParticipant.setCameraEnabled(next);
      setIsCameraOn(next);
    } else {
      setIsCameraOn(!isCameraOn);
    }
  };

  const toggleScreenShare = async () => {
    if (livekitRoomRef.current) {
      const next = !isScreenSharing;
      await livekitRoomRef.current.localParticipant.setScreenShareEnabled(next);
      setIsScreenSharing(next);
    } else {
      setIsScreenSharing(!isScreenSharing);
    }
  };

  // Send Chat Message (IME-safe Enter)
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !socketRef.current) return;

    socketRef.current.emit('send-room-message', {
      roomId,
      text: inputText.trim(),
    });
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !(e.nativeEvent as any).isComposing) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Leave Room
  const handleLeaveRoom = async () => {
    try {
      if (livekitRoomRef.current) {
        livekitRoomRef.current.disconnect();
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      await RoomsApi.leave(roomId).catch(() => {});
    } finally {
      sessionStorage.removeItem(`room_token_${roomId}`);
      sessionStorage.removeItem(`room_livekit_${roomId}`);
      router.push('/rooms');
    }
  };

  // Delete Room (Creator only)
  const handleDeleteRoom = async () => {
    if (!confirm('Are you sure you want to end and delete this room for everyone?')) return;
    try {
      await RoomsApi.delete(roomId);
      router.push('/rooms');
    } catch (err: any) {
      alert(err.message || 'Failed to delete room');
    }
  };

  const copyShareLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--color-border)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: varSpace(4), color: 'var(--color-text-secondary)' }}>Connecting to room...</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className={styles.container}>
        <div className={styles.errorBanner} style={{ margin: 'var(--space-8) 0' }}>
          <AlertTriangle size={20} />
          <span>{error || 'Room not found or no longer active'}</span>
        </div>
        <button className={styles.createBtn} onClick={() => router.push('/rooms')}>
          Back to Rooms
        </button>
      </div>
    );
  }

  const isCreator = user?.id === room.creatorId;

  return (
    <div className={styles.roomContainer}>
      {/* Top Navigation Bar */}
      <div className={styles.roomTopBar}>
        <div className={styles.roomTopInfo}>
          <h1 className={styles.roomTopTitle}>{room.name}</h1>

          <div className={styles.badgeGroup}>
            {room.type === 'TEXT' && (
              <span className={`${styles.typeBadge} ${styles.typeBadgeText}`}>
                <MessageSquare size={12} /> Text
              </span>
            )}
            {room.type === 'VOICE' && (
              <span className={`${styles.typeBadge} ${styles.typeBadgeVoice}`}>
                <Mic size={12} /> Voice
              </span>
            )}
            {room.type === 'VIDEO' && (
              <span className={`${styles.typeBadge} ${styles.typeBadgeVideo}`}>
                <Video size={12} /> Video
              </span>
            )}

            {room.visibility === 'PRIVATE' ? (
              <span className={`${styles.visibilityBadge} ${styles.visibilityPrivate}`}>
                <Lock size={12} /> PIN
              </span>
            ) : (
              <span className={`${styles.visibilityBadge} ${styles.visibilityOpen}`}>
                <Globe size={12} /> Open
              </span>
            )}

            <div className={styles.occupancyInfo} style={{ marginLeft: 6 }} title="People currently in this room">
              <Users size={14} />
              <span>{occupancy ?? participants.length ?? 0} / {room.maxCapacity}</span>
            </div>
          </div>
        </div>

        <div className={styles.roomTopActions}>
          <button
            className={styles.typeChip}
            onClick={copyShareLink}
            title="Copy Invite Link"
            style={{ padding: '0.45rem 0.8rem' }}
          >
            {copied ? <Check size={14} color="var(--color-accent)" /> : <Copy size={14} />}
            <span>{copied ? 'Copied Link' : 'Share'}</span>
          </button>

          {isCreator && (
            <button
              className={styles.deleteBtn}
              onClick={handleDeleteRoom}
              title="Delete room"
            >
              <Trash2 size={18} />
            </button>
          )}

          <button className={styles.leaveRoomBtn} onClick={handleLeaveRoom}>
            <PhoneOff size={16} />
            <span>Leave</span>
          </button>
        </div>
      </div>

      {/* Main Room Layout */}
      <div className={styles.roomMainLayout}>
        {/* Media Stage (Voice / Video) */}
        {room.type !== 'TEXT' && (
          <div className={styles.mediaStage}>
            {livekitWarning && (
              <div className={styles.stageNotification}>
                <Info size={16} />
                <span>{livekitWarning}</span>
              </div>
            )}

            {/* Participant Video / Voice Grid */}
            <div className={styles.participantGrid}>
              {participants.map((p) => (
                <div
                  key={p.identity}
                  className={`${styles.participantTile} ${p.isSpeaking ? styles.speakingIndicator : ''}`}
                >
                  {p.hasVideo && p.isLocal && !p.handle ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className={styles.tileVideo}
                    />
                  ) : p.hasVideo && p.handle ? (
                    <LiveVideoTile participant={p.handle} muted={p.isLocal} className={styles.tileVideo} />
                  ) : (
                    <div className={styles.avatarFallbackLarge}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className={styles.tileOverlay}>
                    <span className={styles.participantName}>
                      {p.name} {p.isLocal ? '(You)' : ''}
                    </span>
                    <div className={styles.tileStatusIcons}>
                      {p.hasAudio ? <Mic size={14} color="var(--color-accent)" /> : <MicOff size={14} color="var(--color-error)" />}
                      {room.type === 'VIDEO' && (
                        p.hasVideo ? <Video size={14} color="var(--color-accent)" /> : <VideoOff size={14} color="var(--color-error)" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Media Toolbar Controls */}
            <div className={styles.mediaControlsBar}>
              <button
                className={`${styles.controlButton} ${!isMicOn ? styles.controlButtonOff : ''}`}
                onClick={toggleMic}
                title={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
              >
                {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
              </button>

              {room.type === 'VIDEO' && (
                <>
                  <button
                    className={`${styles.controlButton} ${!isCameraOn ? styles.controlButtonOff : ''}`}
                    onClick={toggleCamera}
                    title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
                  >
                    {isCameraOn ? <Video size={20} /> : <VideoOff size={20} />}
                  </button>

                  <button
                    className={`${styles.controlButton} ${isScreenSharing ? styles.controlButtonActive : ''}`}
                    onClick={toggleScreenShare}
                    title={isScreenSharing ? 'Stop screen share' : 'Share screen'}
                  >
                    <ScreenShare size={20} />
                  </button>
                </>
              )}

              <button
                className={styles.controlButton}
                onClick={handleLeaveRoom}
                style={{ background: 'var(--color-error)' }}
                title="Leave room"
              >
                <PhoneOff size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Text Chat Sidebar / Full Text Interface */}
        <div
          className={styles.chatSidebar}
          style={room.type === 'TEXT' ? { flex: 1, width: '100%', maxWidth: '800px', margin: '0 auto' } : undefined}
        >
          <div className={styles.chatHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={16} color="var(--color-accent)" />
              <h3>{room.type === 'TEXT' ? 'Room Chat' : 'In-Room Messages'}</h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: socketConnected ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
              ● {socketConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>

          <div className={styles.messagesList}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', margin: 'auto' }}>
                <p>No messages yet. Say hello!</p>
              </div>
            ) : (
              messages.map((m) => {
                const isSelf = m.userId === user?.id;

                return (
                  <div
                    key={m.id}
                    className={`${styles.messageItem} ${isSelf ? styles.messageItemSelf : ''}`}
                  >
                    {!isSelf && (
                      <span className={styles.messageSender}>
                        {m.username}
                        {m.userId === room.creatorId && (
                          <span style={{ fontSize: '0.65rem', color: 'var(--color-warning)', fontWeight: 700 }}>★ CREATOR</span>
                        )}
                      </span>
                    )}

                    <div className={`${styles.messageBubble} ${isSelf ? styles.messageBubbleSelf : ''}`}>
                      {m.text}
                    </div>

                    <span className={styles.messageTime}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className={styles.chatInputArea}>
            <input
              type="text"
              className={styles.chatInput}
              placeholder="Send a message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={500}
            />
            <button
              type="submit"
              className={styles.sendBtn}
              disabled={!inputText.trim()}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function varSpace(num: number): string {
  return `var(--space-${num})`;
}
