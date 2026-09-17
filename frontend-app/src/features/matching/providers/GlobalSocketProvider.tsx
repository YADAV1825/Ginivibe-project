import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  AppState,
  AppStateStatus,
} from 'react-native';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { matchingApi, getMonolithicBaseUrl } from '../api/matchingApi';

interface GlobalSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUserIds: string[];
}

const GlobalSocketContext = createContext<GlobalSocketContextType>({
  socket: null,
  isConnected: false,
  onlineUserIds: [],
});

export const useGlobalSocket = () => useContext(GlobalSocketContext);

interface IncomingCallData {
  requestId: string;
  caller: {
    id: string;
    username?: string;
    firstName?: string;
    profilePic?: string;
  };
  expiresAt: string;
  receiverId: string;
  callerId: string;
}

export function GlobalSocketProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, userId, user } = useAuth();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  // Incoming call state
  const [incomingRequest, setIncomingRequest] = useState<IncomingCallData | null>(null);
  const [incomingTimer, setIncomingTimer] = useState<number>(0);
  const [responding, setResponding] = useState<boolean>(false);

  const socketRef = useRef<Socket | null>(null);
  const currentUserIdRef = useRef<string | null>(userId);

  useEffect(() => {
    currentUserIdRef.current = userId || user?.id || null;
  }, [userId, user?.id]);

  // Connect and manage persistent socket lifecycle
  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const baseUrl = getMonolithicBaseUrl();
    const effectiveUserId = userId || user?.id;

    console.log(`[GlobalSocket] Connecting to ${baseUrl} as userId=${effectiveUserId}`);

    const newSocket = io(baseUrl, {
      auth: {
        token,
        userId: effectiveUserId,
        username: user?.username || user?.email || 'user',
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });

    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      console.log(`[GlobalSocket] Connected to Monolithic Socket: ${newSocket.id}`);
      setIsConnected(true);
      newSocket.emit('set_availability', { availability: 'AVAILABLE' });
    });

    newSocket.on('disconnect', (reason) => {
      console.log(`[GlobalSocket] Disconnected: ${reason}`);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.warn(`[GlobalSocket] Connection error: ${err.message}`);
      setIsConnected(false);
    });

    newSocket.on('presence:init', (data: { onlineUserIds: string[] }) => {
      if (data?.onlineUserIds) {
        setOnlineUserIds(data.onlineUserIds);
      }
    });

    // ─────────────────────────────────────────────────────────────
    // Incoming Video Call Request Handler
    // ─────────────────────────────────────────────────────────────
    newSocket.on('incoming_call_request', (data: IncomingCallData) => {
      console.log('[GlobalSocket] incoming_call_request received:', data);

      const myId = currentUserIdRef.current || userId || user?.id;

      // Ignore if caller is self
      if (data.caller && myId && data.caller.id === myId) {
        console.log('[GlobalSocket] Caller is self, ignoring');
        return;
      }
      if (data.callerId && myId && data.callerId === myId) {
        console.log('[GlobalSocket] CallerId is self, ignoring');
        return;
      }

      // Ignore if target user is explicitly specified and does not match us
      const targetUserId = data.receiverId || (data as any).targetUserId;
      if (targetUserId && myId && targetUserId !== myId) {
        console.log('[GlobalSocket] Call target is not us:', targetUserId, 'vs', myId);
        return;
      }

      console.log('[GlobalSocket] Displaying incoming call modal!');
      setIncomingRequest(data);

      const remaining = data.expiresAt
        ? Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000)
        : 60;
      setIncomingTimer(remaining > 0 ? remaining : 60);
    });

    newSocket.on('call_request_expired', (data?: { requestId?: string }) => {
      setIncomingRequest((prev) => {
        if (!data?.requestId || (prev && prev.requestId === data.requestId)) {
          setIncomingTimer(0);
          return null;
        }
        return prev;
      });
    });

    newSocket.on('call_request_cancelled', (data?: { requestId?: string }) => {
      setIncomingRequest((prev) => {
        if (!data?.requestId || (prev && prev.requestId === data.requestId)) {
          setIncomingTimer(0);
          return null;
        }
        return prev;
      });
    });

    newSocket.on('call_request_rejected', (data?: { requestId?: string }) => {
      setIncomingRequest((prev) => {
        if (!data?.requestId || (prev && prev.requestId === data.requestId)) {
          setIncomingTimer(0);
          return null;
        }
        return prev;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [token, userId, user?.id]);

  // Handle AppState changes: re-assert availability when coming into foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active' && socketRef.current?.connected) {
        socketRef.current.emit('set_availability', { availability: 'AVAILABLE' });
      }
    });
    return () => {
      subscription.remove();
    };
  }, []);

  // Countdown timer local tick for incoming call
  useEffect(() => {
    if (incomingTimer > 0 && incomingRequest) {
      const timer = setTimeout(() => {
        setIncomingTimer((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (incomingTimer === 0 && incomingRequest) {
      setIncomingRequest(null);
    }
  }, [incomingTimer, incomingRequest]);

  // Accept or Decline Incoming Call
  const handleRespond = async (action: 'ACCEPT' | 'REJECT') => {
    if (!incomingRequest || responding) return;

    setResponding(true);
    const reqId = incomingRequest.requestId;

    try {
      if (action === 'ACCEPT') {
        const res = await matchingApi.acceptCall(reqId);
        if (socketRef.current?.connected) {
          socketRef.current.emit('set_availability', { availability: 'IN_CALL' });
        }
        setIncomingRequest(null);
        setIncomingTimer(0);

        if (res.roomCode) {
          router.push({
            pathname: '/video-call',
            params: { roomCode: res.roomCode },
          });
        }
      } else {
        await matchingApi.rejectCall(reqId);
        if (socketRef.current?.connected) {
          socketRef.current.emit('set_availability', { availability: 'AVAILABLE' });
        }
        setIncomingRequest(null);
        setIncomingTimer(0);
      }
    } catch (err: any) {
      console.warn(`[GlobalSocket] Respond error (${action}):`, err.message);
      setIncomingRequest(null);
      setIncomingTimer(0);
    } finally {
      setResponding(false);
    }
  };

  const callerName =
    incomingRequest?.caller?.firstName ||
    incomingRequest?.caller?.username ||
    'GiniVibe Peer';

  const callerAvatar =
    incomingRequest?.caller?.profilePic ||
    `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(callerName)}`;

  return (
    <GlobalSocketContext.Provider value={{ socket, isConnected, onlineUserIds }}>
      {children}

      {/* Global Incoming Call Modal Overlay */}
      {!!incomingRequest && (
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {/* Top Glowing Color Accent Bar */}
            <LinearGradient
              colors={['#ec4899', '#8b5cf6', '#3b82f6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.topAccentBar}
            />

            {/* Caller Avatar with Live Ring */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatarPulseRing} />
              <Image source={{ uri: callerAvatar }} style={styles.callerAvatar} />
            </View>

            {/* Call Type Pill */}
            <View style={styles.badgeContainer}>
              <View style={styles.liveDot} />
              <Text style={styles.badgeText}>INCOMING VIDEO CALL</Text>
            </View>

            {/* Caller Name */}
            <Text style={styles.callerNameText} numberOfLines={1}>
              {callerName}
            </Text>
            <Text style={styles.callerSubtitle}>wants to connect on live video!</Text>

            {/* 60s Countdown Timer Ring */}
            <View style={styles.timerBadge}>
              <Ionicons
                name="time-outline"
                size={16}
                color={incomingTimer <= 15 ? '#ef4444' : '#f59e0b'}
              />
              <Text
                style={[
                  styles.timerText,
                  { color: incomingTimer <= 15 ? '#ef4444' : '#f59e0b' },
                ]}
              >
                {incomingTimer}s
              </Text>
            </View>

            {/* Action Buttons: Decline & Accept */}
            <View style={styles.actionsRow}>
              {/* Decline Button */}
              <TouchableOpacity
                style={styles.declineButton}
                activeOpacity={0.8}
                onPress={() => handleRespond('REJECT')}
                disabled={responding}
              >
                <Ionicons name="close" size={18} color="#f87171" style={{ marginRight: 4 }} />
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>

              {/* Accept Button */}
              <TouchableOpacity
                style={styles.acceptButtonWrapper}
                activeOpacity={0.85}
                onPress={() => handleRespond('ACCEPT')}
                disabled={responding}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.acceptGradient}
                >
                  {responding ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons
                        name="videocam"
                        size={18}
                        color="#ffffff"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.acceptButtonText}>Accept Call</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </GlobalSocketContext.Provider>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999999,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#111827',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(236, 72, 153, 0.4)',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 20,
    overflow: 'hidden',
  },
  topAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  avatarContainer: {
    position: 'relative',
    width: 84,
    height: 84,
    marginBottom: 14,
    marginTop: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPulseRing: {
    position: 'absolute',
    width: 98,
    height: 98,
    borderRadius: 49,
    borderWidth: 2,
    borderColor: '#ec4899',
    opacity: 0.6,
  },
  callerAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2.5,
    borderColor: '#ec4899',
    backgroundColor: '#1e293b',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    marginBottom: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ec4899',
  },
  badgeText: {
    color: '#ec4899',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  callerNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  callerSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 16,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    marginBottom: 20,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  declineButtonText: {
    color: '#f87171',
    fontWeight: '700',
    fontSize: 14,
  },
  acceptButtonWrapper: {
    flex: 1.25,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  acceptGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 12,
  },
  acceptButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
});
