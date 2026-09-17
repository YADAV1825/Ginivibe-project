import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import { RoomsAPI, ROOMS_SOCKET_URL } from '../api/RoomsAPI';
import { RoomMessage, RoomType } from '../types';

export default function ActiveRoomScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id: string;
    name?: string;
    type?: RoomType;
    visibility?: string;
    token?: string;
    tokenType?: string;
    livekitUrl?: string;
  }>();

  const roomId = params.id;
  const roomName = params.name || 'Community Lounge';
  const roomType = (params.type || 'TEXT') as RoomType;

  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUsername, setCurrentUsername] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [connected, setConnected] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Media Controls (for Voice & Video rooms)
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // 1. Resolve current user identity
  useEffect(() => {
    (async () => {
      const storedId =
        (await AsyncStorage.getItem('ginivibe_user_id')) ||
        (await AsyncStorage.getItem('user_id'));
      if (storedId) setCurrentUserId(storedId);

      const storedUser = await AsyncStorage.getItem('ginivibe_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed.username) setCurrentUsername(parsed.username);
          if (!storedId && (parsed.id || parsed.userId)) {
            setCurrentUserId(parsed.id || parsed.userId);
          }
        } catch {}
      }
    })();
  }, []);

  // 2. Setup Socket.IO connection & room listeners
  useEffect(() => {
    if (!roomId) return;
    let socket: Socket | undefined;

    (async () => {
      let authToken = params.token;
      if (!authToken) {
        authToken = (await AsyncStorage.getItem('ginivibe_auth_token')) || undefined;
      }

      socket = io(ROOMS_SOCKET_URL, {
        auth: { token: authToken },
        transports: ['websocket', 'polling'],
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        setConnected(true);
        socket?.emit('join-room', { roomId });
      });

      socket.on('room-history', (history: RoomMessage[]) => {
        if (Array.isArray(history)) {
          setMessages(history);
        }
        setLoadingHistory(false);
      });

      socket.on('new-message', (newMsg: RoomMessage) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      });

      socket.on('message-error', (err: any) => {
        console.warn('[ActiveRoomScreen] Message error:', err);
      });

      socket.on('disconnect', () => {
        setConnected(false);
      });
    })();

    return () => {
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [roomId, params.token]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Send message
  const handleSendMessage = () => {
    const text = inputText.trim();
    if (!text || !socketRef.current) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    socketRef.current.emit('send-room-message', {
      roomId,
      text,
    });
    setInputText('');
  };

  // Leave room
  const handleLeaveRoom = async () => {
    setLeaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      await RoomsAPI.leave(roomId);
    } catch (err) {
      console.warn('[ActiveRoomScreen] Error leaving room:', err);
    } finally {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/rooms' as any);
      }
    }
  };

  const renderMessageItem = useCallback(
    ({ item }: { item: RoomMessage }) => {
      const isMe = item.userId === currentUserId;
      const timeStr = item.createdAt
        ? new Date(item.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
        : '';

      return (
        <View style={[styles.msgWrapper, isMe ? styles.msgWrapperMe : styles.msgWrapperOther]}>
          {!isMe && (
            <View style={styles.avatarMini}>
              <Text style={styles.avatarMiniText}>
                {(item.username || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleOther]}>
            {!isMe && (
              <Text style={styles.senderName}>{item.username || 'Participant'}</Text>
            )}
            <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{item.text}</Text>
            <Text style={[styles.msgTime, isMe && styles.msgTimeMe]}>{timeStr}</Text>
          </View>
        </View>
      );
    },
    [currentUserId]
  );

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      {/* Top App Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity
            onPress={handleLeaveRoom}
            style={styles.leaveCircleBtn}
            disabled={leaving}
          >
            <Ionicons name="chevron-down" size={20} color="#f8fafc" />
          </TouchableOpacity>

          <View style={styles.titleInfo}>
            <View style={styles.roomHeaderTitleRow}>
              <Text style={styles.roomHeaderTitle} numberOfLines={1}>
                {roomName}
              </Text>
              <View style={[styles.statusDot, connected ? styles.statusOnline : styles.statusOffline]} />
            </View>
            <View style={styles.typeSubRow}>
              <Ionicons
                name={
                  roomType === 'VOICE'
                    ? 'mic'
                    : roomType === 'VIDEO'
                    ? 'videocam'
                    : 'chatbubble-ellipses'
                }
                size={12}
                color="#c084fc"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.typeSubText}>
                {roomType === 'VOICE'
                  ? 'Voice Lounge'
                  : roomType === 'VIDEO'
                  ? 'Video Stage'
                  : 'Text Channel'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleLeaveRoom}
          style={styles.leaveBtn}
          disabled={leaving}
        >
          {leaving ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={14} color="#ef4444" style={{ marginRight: 4 }} />
              <Text style={styles.leaveBtnText}>Leave</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Media Stage: Voice / Video controls and visualizer */}
      {roomType !== 'TEXT' && (
        <View style={styles.mediaStage}>
          <BlurView intensity={35} tint="dark" style={styles.mediaStageCard}>
            <View style={styles.mediaStageHeader}>
              <View style={styles.mediaStageLivePill}>
                <View style={styles.mediaStageLiveDot} />
                <Text style={styles.mediaStageLiveText}>
                  {roomType === 'VOICE' ? 'AUDIO STAGE' : 'VIDEO BROADCAST'}
                </Text>
              </View>
              <Text style={styles.mediaStageStatus}>
                {connected ? 'Live Session' : 'Connecting...'}
              </Text>
            </View>

            {/* Visualizer / Avatar Waves */}
            <View style={styles.visualizerArea}>
              <View style={styles.pulseOuter}>
                <View style={styles.pulseMiddle}>
                  <View style={styles.pulseInner}>
                    <Ionicons
                      name={roomType === 'VOICE' ? 'mic' : 'videocam'}
                      size={28}
                      color="#c084fc"
                    />
                  </View>
                </View>
              </View>
              <Text style={styles.visualizerLabel}>
                {isMuted ? 'Microphone is Muted' : 'Speaking Channel Open'}
              </Text>
            </View>

            {/* Media Action Toolbar */}
            <View style={styles.mediaToolbar}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  setIsMuted((prev) => !prev);
                }}
                style={[styles.toolBtn, isMuted && styles.toolBtnActiveRed]}
              >
                <Ionicons
                  name={isMuted ? 'mic-off' : 'mic'}
                  size={20}
                  color={isMuted ? '#ef4444' : '#f8fafc'}
                />
              </TouchableOpacity>

              {roomType === 'VIDEO' && (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    setIsVideoOff((prev) => !prev);
                  }}
                  style={[styles.toolBtn, isVideoOff && styles.toolBtnActiveRed]}
                >
                  <Ionicons
                    name={isVideoOff ? 'videocam-off' : 'videocam'}
                    size={20}
                    color={isVideoOff ? '#ef4444' : '#f8fafc'}
                  />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  setIsSpeakerOn((prev) => !prev);
                }}
                style={[styles.toolBtn, !isSpeakerOn && styles.toolBtnActiveRed]}
              >
                <Ionicons
                  name={isSpeakerOn ? 'volume-high' : 'volume-mute'}
                  size={20}
                  color={!isSpeakerOn ? '#ef4444' : '#f8fafc'}
                />
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      )}

      {/* Messages Stream Header */}
      <View style={styles.chatSectionHeader}>
        <Ionicons name="chatbubbles-outline" size={14} color="#94a3b8" style={{ marginRight: 6 }} />
        <Text style={styles.chatSectionTitle}>Live Lounge Chat</Text>
      </View>

      {/* Chat Messages */}
      {loadingHistory ? (
        <View style={styles.loadingHistoryWrap}>
          <ActivityIndicator size="small" color="#a855f7" />
          <Text style={styles.loadingHistoryText}>Loading conversation...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={
            <View style={styles.emptyMessages}>
              <Ionicons name="chatbubble-outline" size={32} color="#475569" />
              <Text style={styles.emptyMessagesText}>
                No messages yet. Say hello to everyone! 👋
              </Text>
            </View>
          }
        />
      )}

      {/* Message Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.inputBar}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Send a message in the room..."
              placeholderTextColor="#64748b"
              style={styles.textInput}
              multiline={false}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!inputText.trim()}
              style={[
                styles.sendBtn,
                !inputText.trim() && styles.sendBtnDisabled,
              ]}
            >
              <LinearGradient
                colors={inputText.trim() ? ['#8b5cf6', '#6366f1'] : ['#334155', '#334155']}
                style={styles.sendGradient}
              >
                <Ionicons name="arrow-up" size={18} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  leaveCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleInfo: {
    flex: 1,
  },
  roomHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roomHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusOnline: {
    backgroundColor: '#22c55e',
  },
  statusOffline: {
    backgroundColor: '#eab308',
  },
  typeSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  typeSubText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  leaveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ef4444',
  },
  mediaStage: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  mediaStageCard: {
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  mediaStageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mediaStageLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mediaStageLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#c084fc',
    marginRight: 6,
  },
  mediaStageLiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#c084fc',
    letterSpacing: 0.5,
  },
  mediaStageStatus: {
    fontSize: 11,
    color: '#94a3b8',
  },
  visualizerArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  pulseOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(192, 132, 252, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseMiddle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(192, 132, 252, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(192, 132, 252, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualizerLabel: {
    marginTop: 10,
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  mediaToolbar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
  },
  toolBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBtnActiveRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  chatSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  chatSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  msgWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  msgWrapperMe: {
    justifyContent: 'flex-end',
  },
  msgWrapperOther: {
    justifyContent: 'flex-start',
  },
  avatarMini: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4338ca',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMiniText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  msgBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  msgBubbleMe: {
    backgroundColor: '#7c3aed',
    borderBottomRightRadius: 4,
  },
  msgBubbleOther: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#c084fc',
    marginBottom: 3,
  },
  msgText: {
    fontSize: 14,
    color: '#f8fafc',
    lineHeight: 19,
  },
  msgTextMe: {
    color: '#ffffff',
  },
  msgTime: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  msgTimeMe: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  loadingHistoryWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingHistoryText: {
    color: '#64748b',
    fontSize: 13,
  },
  emptyMessages: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyMessagesText: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: '#090d16',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 8,
  },
  textInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 14,
    paddingVertical: 6,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
