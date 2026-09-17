import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VideoCallClient } from '../client/VideoCallClient';
import { getSignalingUrl } from '../api/matchingApi';
import { useGlobalSocket } from '../providers/GlobalSocketProvider';
import { useAuth } from '@/features/auth/providers/AuthProvider';

type CallState = 'IDLE' | 'CONNECTING' | 'SEARCHING' | 'FOUND' | 'IN_CALL' | 'ENDED';

// Isolated timer component so that 1-second ticks DO NOT re-render the VideoCallScreen or video elements
const CallTimer = React.memo(({ inCall }: { inCall: boolean }) => {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let timer: any = null;
    if (inCall) {
      timer = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [inCall]);

  const m = Math.floor(duration / 60);
  const s = duration % 60;
  const formatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  return (
    <Text style={styles.statusPillText}>
      {inCall ? `Live • ${formatted}` : 'Connecting'}
    </Text>
  );
});

// Dedicated stable video tag component for web
const VideoPanelWeb = React.memo(
  ({
    isMuted = false,
    isMirrored = false,
    setRef,
  }: {
    isMuted?: boolean;
    isMirrored?: boolean;
    setRef: (el: any) => void;
  }) => {
    return React.createElement('video', {
      ref: setRef,
      autoPlay: true,
      muted: isMuted,
      playsInline: true,
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: isMirrored ? 'scaleX(-1)' : 'none',
        backgroundColor: isMirrored ? '#020617' : '#0f172a',
      },
    });
  }
);

export function VideoCallScreen() {
  const router = useRouter();
  const { socket } = useGlobalSocket();
  const { token: authToken } = useAuth();
  const params = useLocalSearchParams<{ roomCode?: string }>();

  // Determine initial room code from route params or window query params
  let targetRoomCode = params.roomCode ? String(params.roomCode) : null;
  if (!targetRoomCode && typeof window !== 'undefined' && window.location) {
    const urlParams = new URLSearchParams(window.location.search);
    const fromUrl = urlParams.get('roomCode');
    if (fromUrl) targetRoomCode = fromUrl;
  }

  const [callState, setCallState] = useState<CallState>('CONNECTING');
  const [roomCode, setRoomCode] = useState<string | null>(targetRoomCode);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Connecting to camera & signaling...');
  const [isDesktop, setIsDesktop] = useState(false);

  const clientRef = useRef<VideoCallClient | null>(null);
  const localVideoRef = useRef<any>(null);
  const remoteVideoRef = useRef<any>(null);
  const localStreamRef = useRef<any>(null);
  const remoteStreamRef = useRef<any>(null);
  const isCleaningUpRef = useRef<boolean>(false);

  // Detect layout dimensions
  useEffect(() => {
    const updateLayout = () => {
      const { width, height } = Dimensions.get('window');
      setIsDesktop(width > 768 && width > height);
    };
    updateLayout();
    const sub = Dimensions.addEventListener('change', updateLayout);
    return () => sub?.remove();
  }, []);

  const setRemoteVideoRef = useCallback((el: any) => {
    remoteVideoRef.current = el;
    if (el && remoteStreamRef.current && el.srcObject !== remoteStreamRef.current) {
      el.srcObject = remoteStreamRef.current;
      el.play?.().catch(() => {});
    }
  }, []);

  const setLocalVideoRef = useCallback((el: any) => {
    localVideoRef.current = el;
    if (el && localStreamRef.current && el.srcObject !== localStreamRef.current) {
      el.srcObject = localStreamRef.current;
      el.play?.().catch(() => {});
    }
  }, []);

  const handleCleanupAndExit = useCallback(
    (isUserAction: boolean = false) => {
      if (isCleaningUpRef.current) return;
      isCleaningUpRef.current = true;

      // Reset availability immediately so user can match again
      socket?.emit('set_availability', { availability: 'AVAILABLE' });

      if (clientRef.current) {
        const client = clientRef.current;
        clientRef.current = null;
        if (isUserAction) {
          try {
            client.endCall();
          } catch (e) {}
        }
        try {
          client.disconnect();
        } catch (e) {}
      }

      setTimeout(() => {
        try {
          router.replace('/matching');
        } catch (e) {
          if (router.canGoBack()) {
            router.back();
          }
        }
      }, 300);
    },
    [router, socket]
  );

  // Initialize WebRTC VideoCallClient
  useEffect(() => {
    let isMounted = true;

    const setupClient = async () => {
      try {
        const token = authToken || (await AsyncStorage.getItem('ginivibe_auth_token'));
        const wsUrl = getSignalingUrl();

        console.log(`[VideoCall] Initializing VideoCallClient with URL: ${wsUrl}, roomCode=${targetRoomCode}`);

        const client = new VideoCallClient(wsUrl, {
          authToken: token,
        });
        clientRef.current = client;

        // Local camera stream received
        client.on('localStream', (stream: any) => {
          console.log('[VideoCall] Local stream initialized');
          localStreamRef.current = stream;
          if (localVideoRef.current && localVideoRef.current.srcObject !== stream) {
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.play?.().catch(() => {});
          }
        });

        // Remote peer stream received
        client.on('remoteStream', (stream: any) => {
          console.log('[VideoCall] Remote stream received (Peer connected)');
          remoteStreamRef.current = stream;
          if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== stream) {
            remoteVideoRef.current.srcObject = stream;
            remoteVideoRef.current.play?.().catch(() => {});
          }
        });

        // Connected to WebSocket signaling server
        client.on('connected', () => {
          console.log('[VideoCall] Connected to signaling server');
          if (!isMounted) return;

          if (targetRoomCode) {
            setStatusMessage(`Joining room: ${targetRoomCode}...`);
            setCallState('FOUND');
            client.joinRoom(targetRoomCode);
          } else {
            setStatusMessage('Looking for an available match...');
            setCallState('SEARCHING');
            client.findMatch();
          }
        });

        client.on('roomJoined', (data: any) => {
          console.log('[VideoCall] Room joined:', data.roomCode);
          if (isMounted) {
            setRoomCode(data.roomCode);
            setStatusMessage('Waiting for peer to connect...');
          }
        });

        client.on('matched', (data: any) => {
          console.log('[VideoCall] Matched! Room code:', data.roomCode);
          if (isMounted) {
            setRoomCode(data.roomCode);
            setCallState('FOUND');
            setStatusMessage('Peer matched! Starting video connection...');
          }
        });

        client.on('callStarted', () => {
          console.log('[VideoCall] WebRTC negotiation complete. In call!');
          if (isMounted) {
            setCallState('IN_CALL');
            setStatusMessage('Live Video Call');
          }
        });

        client.on('callEnded', () => {
          console.log('[VideoCall] Call ended');
          if (isMounted) {
            setCallState('ENDED');
            handleCleanupAndExit(false);
          }
        });

        client.on('peerDisconnected', () => {
          console.log('[VideoCall] Peer disconnected');
          if (isMounted) {
            if (Platform.OS === 'web') {
              alert('The other user disconnected.');
            } else {
              Alert.alert('Call Ended', 'The other user disconnected.');
            }
            handleCleanupAndExit(false);
          }
        });

        client.on('error', (err: any) => {
          console.warn('[VideoCall] Client error:', err);
          if (isMounted) {
            setStatusMessage(err.message || 'Connection error occurred');
          }
        });

        // Start media device capture then connect signaling
        await client.start();
        if (isMounted) {
          await client.connect();
        }
      } catch (err: any) {
        console.error('[VideoCall] Initialization error:', err);
        if (isMounted) {
          setStatusMessage('Could not access camera/microphone or connect to server.');
          if (Platform.OS === 'web') {
            alert('Could not access camera/microphone or connect to server. Please allow camera permissions.');
          }
        }
      }
    };

    setupClient();

    return () => {
      isMounted = false;
      handleCleanupAndExit(true);
    };
  }, [authToken, targetRoomCode, handleCleanupAndExit]);

  const handleEndCall = () => {
    handleCleanupAndExit(true);
  };

  const toggleAudio = () => {
    if (clientRef.current) {
      const muted = clientRef.current.toggleAudio();
      setIsAudioMuted(muted);
    }
  };

  const toggleVideo = () => {
    if (clientRef.current) {
      const off = clientRef.current.toggleVideo();
      setIsVideoOff(off);
    }
  };

  const switchCamera = async () => {
    if (clientRef.current) {
      await clientRef.current.switchCamera();
      if (localVideoRef.current && clientRef.current.localStream) {
        localStreamRef.current = clientRef.current.localStream;
        localVideoRef.current.srcObject = clientRef.current.localStream;
        localVideoRef.current.play?.().catch(() => {});
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleEndCall} style={styles.backButton}>
          <Ionicons name="chevron-down" size={26} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.headerTitleRow}>
          <Ionicons name="videocam" size={18} color="#10b981" />
          <Text style={styles.headerTitle}>GiniVibe Live</Text>
        </View>

        <View style={styles.statusPill}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: callState === 'IN_CALL' ? '#10b981' : '#f59e0b' },
            ]}
          />
          <CallTimer inCall={callState === 'IN_CALL'} />
        </View>
      </View>

      {/* Main Video Grid: 50/50 Split (Remote Top, Local Bottom) */}
      <View style={[styles.videoGrid, isDesktop ? styles.videoGridRow : styles.videoGridCol]}>
        {/* Remote Video Container */}
        <View style={styles.videoPanel}>
          {Platform.OS === 'web' && (
            <VideoPanelWeb
              isMuted={false}
              isMirrored={false}
              setRef={setRemoteVideoRef}
            />
          )}

          {/* Remote Placeholder / Connecting State */}
          {callState !== 'IN_CALL' && (
            <View style={styles.placeholderContainer}>
              <Animated.View entering={ZoomIn.delay(200).springify()} style={styles.avatarGlow}>
                <View style={styles.avatarInner}>
                  <Ionicons name="person" size={54} color="#38bdf8" />
                </View>
              </Animated.View>

              <Text style={styles.connectingTitle}>
                {callState === 'SEARCHING'
                  ? 'Finding live peer...'
                  : callState === 'FOUND'
                  ? 'Connecting to peer...'
                  : statusMessage}
              </Text>

              {roomCode ? (
                <View style={styles.roomBadge}>
                  <Text style={styles.roomBadgeText}>Room: {roomCode}</Text>
                </View>
              ) : null}

              <ActivityIndicator size="small" color="#38bdf8" style={{ marginTop: 14 }} />
            </View>
          )}

          {/* Remote User Label Pill */}
          <View style={styles.streamLabel}>
            <Text style={styles.streamLabelText}>
              {callState === 'IN_CALL' ? 'Remote Peer' : 'Peer'}
            </Text>
          </View>
        </View>

        {/* Local Video Container */}
        <View style={styles.videoPanel}>
          {Platform.OS === 'web' && (
            <VideoPanelWeb
              isMuted={true}
              isMirrored={true}
              setRef={setLocalVideoRef}
            />
          )}

          {/* Camera Off Overlay */}
          {isVideoOff && (
            <View style={styles.cameraOffOverlay}>
              <Ionicons name="videocam-off" size={48} color="#64748b" />
              <Text style={styles.cameraOffText}>Camera is turned off</Text>
            </View>
          )}

          {/* Local User Label Pill */}
          <View style={styles.streamLabel}>
            <Text style={styles.streamLabelText}>You</Text>
          </View>

          {/* Floating Controls Bar (docked inside lower video container) */}
          <View style={styles.controlsDock}>
            <BlurView intensity={50} tint="dark" style={styles.controlsGlass}>
              {/* Mic Mute Toggle */}
              <TouchableOpacity
                onPress={toggleAudio}
                style={[styles.circleButton, isAudioMuted && styles.circleButtonDanger]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isAudioMuted ? 'mic-off' : 'mic'}
                  size={22}
                  color="#ffffff"
                />
              </TouchableOpacity>

              {/* Camera Off Toggle */}
              <TouchableOpacity
                onPress={toggleVideo}
                style={[styles.circleButton, isVideoOff && styles.circleButtonDanger]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isVideoOff ? 'videocam-off' : 'videocam'}
                  size={22}
                  color="#ffffff"
                />
              </TouchableOpacity>

              {/* Switch Camera (Front/Back) */}
              <TouchableOpacity
                onPress={switchCamera}
                style={styles.circleButton}
                activeOpacity={0.8}
              >
                <Ionicons name="camera-reverse" size={22} color="#ffffff" />
              </TouchableOpacity>

              {/* End Call Button */}
              <TouchableOpacity
                onPress={handleEndCall}
                style={styles.endCallPill}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#ef4444', '#dc2626']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.endCallGradient}
                >
                  <Ionicons
                    name="call"
                    size={22}
                    color="#ffffff"
                    style={{ transform: [{ rotate: '135deg' }], marginRight: 6 }}
                  />
                  <Text style={styles.endCallText}>End Call</Text>
                </LinearGradient>
              </TouchableOpacity>
            </BlurView>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  videoGrid: {
    flex: 1,
    width: '100%',
    height: '100%',
    paddingTop: 60, // Accommodate absolute top header
  },
  videoGridCol: {
    flexDirection: 'column',
  },
  videoGridRow: {
    flexDirection: 'row',
  },
  videoPanel: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#090d16',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  placeholderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0a0f1d',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 5,
  },
  avatarGlow: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  avatarInner: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectingTitle: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  roomBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  roomBadgeText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  cameraOffOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    zIndex: 6,
  },
  cameraOffText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  streamLabel: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    zIndex: 10,
  },
  streamLabelText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
  },
  controlsDock: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 50,
    alignItems: 'center',
  },
  controlsGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 32,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  circleButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleButtonDanger: {
    backgroundColor: '#ef4444',
  },
  endCallPill: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  endCallGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  endCallText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
