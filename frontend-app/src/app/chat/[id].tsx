//src/app/chat/[id].tsx

import React, { useEffect, useState, useRef, useCallback } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import { chatApi } from '../../features/chat/api/chatApi';
import ChatOptionsModal from '../../features/chat/components/ChatOptionsModal';

const SOCKET_URL = Platform.select({
  android: 'http://10.0.2.2:3001',
  default: 'http://localhost:3001',
});

// Pure JavaScript base64 decoder that works across iOS, Android, and Web without atob
const decodeBase64 = (str: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  const input = str.replace(/[^A-Za-z0-9+/=]/g, '');

  let buffer = 0;
  let bits = 0;

  for (let i = 0; i < input.length; i++) {
    const char = input.charAt(i);
    if (char === '=') break;

    const charIndex = chars.indexOf(char);
    if (charIndex === -1) continue;

    buffer = (buffer << 6) | charIndex;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }

  return output;
};

export default function ChatRoomScreen() {
  const { id: conversationId, name, userId: paramUserId, isMuted: paramIsMuted } =
    useLocalSearchParams<{ id: string; name: string; userId?: string; isMuted?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Real-time presence & options state
  const [otherUserId, setOtherUserId] = useState<string>(paramUserId || '');
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(paramIsMuted === 'true');
  const [showOptionsModal, setShowOptionsModal] = useState<boolean>(false);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/messages');
    }
  };

  // 1. Resolve current user ID reliably
  useEffect(() => {
    const resolveUser = async () => {
      // Check cached ID
      const directId =
        (await AsyncStorage.getItem('ginivibe_user_id')) ||
        (await AsyncStorage.getItem('user_id'));
      if (directId) {
        setCurrentUserId(directId);
        return;
      }

      // Check stored user object
      const storedUser =
        (await AsyncStorage.getItem('ginivibe_user')) ||
        (await AsyncStorage.getItem('user'));
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          const resolved = parsed.id || parsed.userId || parsed._id;
          if (resolved) {
            setCurrentUserId(resolved);
            await AsyncStorage.setItem('ginivibe_user_id', resolved);
            return;
          }
        } catch {}
      }

      // Check JWT Token payload
      const token = await AsyncStorage.getItem('ginivibe_auth_token');
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length >= 2) {
            let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            while (base64.length % 4) {
              base64 += '=';
            }
            const decodedString = decodeBase64(base64);
            const decoded = JSON.parse(decodedString);
            const resolved = decoded.id || decoded.userId || decoded.sub;
            if (resolved) {
              setCurrentUserId(resolved);
              await AsyncStorage.setItem('ginivibe_user_id', resolved);
            }
          }
        } catch (err) {
          console.warn('[ChatRoomScreen] Failed to decode JWT for currentUserId:', err);
        }
      }
    };

    resolveUser();
  }, []);

  // 2. Resolve other user ID and conversation status if not passed in params
  useEffect(() => {
    if (!conversationId || conversationId === 'new') return;
    chatApi.getConversations().then((convs) => {
      const conv = convs.find((c) => c.id === conversationId);
      if (conv) {
        if (typeof conv.isMuted === 'boolean') setIsMuted(conv.isMuted);
        if (!otherUserId) {
          const other = conv.members?.find((m) => (m.userId || m.user?.id) !== currentUserId);
          const foundUserId = other?.userId || other?.user?.id;
          if (foundUserId) setOtherUserId(foundUserId);
        }
      }
    }).catch(() => {});
  }, [conversationId, currentUserId, otherUserId]);

  // 3. Load conversation messages
  const loadMessages = useCallback(async () => {
    if (!conversationId || conversationId === 'new') return;
    try {
      const data = await chatApi.getMessages(conversationId);
      const msgList = Array.isArray(data) ? data : [];
      // Deduplicate by message ID
      const uniqueMap = new Map<string, any>();
      for (const m of msgList) {
        const key = m.id || `${m.senderId}-${m.createdAt}-${m.text}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, m);
        }
      }
      const uniqueMsgs = Array.from(uniqueMap.values());
      setMessages(uniqueMsgs);

      // Fallback resolve other user from messages if still unknown
      if (!otherUserId && msgList.length > 0 && currentUserId) {
        const otherMsg = msgList.find((m: any) => (m.senderId || m.sender?.id) !== currentUserId);
        const resolved = otherMsg ? (otherMsg.senderId || otherMsg.sender?.id) : null;
        if (resolved) setOtherUserId(resolved);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  }, [conversationId, otherUserId, currentUserId]);

  // 4. Real-time socket listener & presence
  useEffect(() => {
    if (!conversationId || conversationId === 'new') return;
    let socket: Socket | undefined;

    (async () => {
      // Check initial presence
      if (otherUserId) {
        try {
          const onlineIds = await chatApi.getOnlineUsers();
          if (Array.isArray(onlineIds)) {
            setIsOnline(onlineIds.includes(otherUserId));
          }
        } catch {}
      }

      const token = await AsyncStorage.getItem('ginivibe_auth_token');
      if (!token) return;

      socket = io(SOCKET_URL, { auth: { token } });

      socket.on('message:new', (msg: any) => {
        if (msg.conversationId !== conversationId) return;

        // If this event was broadcast with a targetUserId that isn't me, ignore it
        if (msg.targetUserId && currentUserId && msg.targetUserId !== currentUserId) {
          return;
        }

        setMessages((prev) => {
          // If already in list by real ID, don't duplicate
          if (prev.some((m) => m.id === msg.id)) return prev;

          // If current user sent it, check if we have a matching optimistic temp message to reconcile
          const senderId = msg.senderId || msg.sender?.id;
          if (senderId && senderId === currentUserId) {
            const tempIdx = prev.findIndex(
              (m) => typeof m.id === 'string' && m.id.startsWith('temp-') && m.text === msg.text
            );
            if (tempIdx !== -1) {
              const next = [...prev];
              next[tempIdx] = msg;
              return next;
            }
          }

          return [...prev, msg];
        });
      });

      socket.on('presence:init', (data: { onlineUserIds: string[] }) => {
        if (otherUserId && Array.isArray(data?.onlineUserIds)) {
          setIsOnline(data.onlineUserIds.includes(otherUserId));
        }
      });

      socket.on('user_presence_update', (data: { userId: string; status: 'ONLINE' | 'OFFLINE' }) => {
        if (data?.userId && data.userId === otherUserId) {
          setIsOnline(data.status === 'ONLINE');
        }
      });

      socket.on('conversation:deleted', (data: { conversationId: string }) => {
        if (data?.conversationId === conversationId) {
          router.replace('/(tabs)/messages');
        }
      });
    })();

    loadMessages().then(() => {
      if (conversationId) chatApi.markRead(conversationId);
    });

    return () => {
      socket?.disconnect();
    };
  }, [conversationId, otherUserId, loadMessages, router]);

  const handleToggleMute = async () => {
    try {
      const res = await chatApi.toggleMuteConversation(conversationId, !isMuted);
      setIsMuted(res.isMuted);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to toggle mute');
    }
  };

  const handleDeleteConversation = async () => {
    try {
      await chatApi.deleteConversation(conversationId);
      router.replace('/(tabs)/messages');
    } catch (err: any) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleBlockUser = async () => {
    let targetId = otherUserId;
    if (!targetId || targetId === currentUserId) {
      const otherMsg = messages.find((m: any) => {
        const sId = m.senderId || m.sender?.id;
        return sId && sId !== currentUserId;
      });
      if (otherMsg) targetId = otherMsg.senderId || otherMsg.sender?.id || '';
    }
    if (!targetId || targetId === currentUserId) {
      try {
        const convs = await chatApi.getConversations();
        const thisConv = convs.find((c) => c.id === conversationId);
        const otherM = thisConv?.members?.find((m) => {
          const mId = m.userId || m.user?.id;
          return mId && mId !== currentUserId;
        });
        targetId = otherM?.userId || otherM?.user?.id || '';
      } catch {}
    }

    if (!targetId || targetId === currentUserId) {
      console.warn('Unable to find target user to block');
      return;
    }
    try {
      await chatApi.blockUser(targetId);
      router.replace('/(tabs)/messages');
    } catch (err: any) {
      console.error('Failed to block user:', err);
    }
  };

  const handleSend = async () => {
    if (!text.trim() || !conversationId) return;
    const msgText = text.trim();
    setText('');

    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      conversationId,
      senderId: currentUserId,
      text: msgText,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const newMsg = await chatApi.sendMessage(conversationId, msgText);
      setMessages((prev) => {
        // If socket already added this message by id, remove the optimistic temp message
        const alreadyInList = prev.some((m) => m.id === newMsg.id);
        if (alreadyInList) {
          return prev.filter((m) => m.id !== tempId);
        }
        // Otherwise replace temp message with server confirmed message
        return prev.map((m) => (m.id === tempId ? newMsg : m));
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove optimistic message on send failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const renderMessageItem = ({ item }: { item: any }) => {
    const senderId = item.senderId || item.sender?.id;
    const isMe = Boolean(currentUserId && senderId && senderId === currentUserId);

    return (
      <View style={[styles.bubbleWrapper, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
        {isMe ? (
          <LinearGradient
            colors={['#9333ea', '#6366f1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.bubble, styles.myBubble]}
          >
            <Text style={styles.myBubbleText}>{item.text}</Text>
            {item.createdAt ? (
              <Text style={styles.myTimeText}>{formatTime(item.createdAt)}</Text>
            ) : null}
          </LinearGradient>
        ) : (
          <View style={[styles.bubble, styles.theirBubble]}>
            <Text style={styles.theirBubbleText}>{item.text}</Text>
            {item.createdAt ? (
              <Text style={styles.theirTimeText}>{formatTime(item.createdAt)}</Text>
            ) : null}
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>

        <View style={styles.headerAvatarContainer}>
          <LinearGradient
            colors={['#818cf8', '#6366f1']}
            style={styles.headerAvatar}
          >
            <Text style={styles.headerAvatarText}>
              {(name || 'C').charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
          {isOnline && <View style={styles.onlineBadge} />}
        </View>

        <View style={styles.headerMeta}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {name || 'Chat'}
            </Text>
            {isMuted && (
              <Ionicons name="volume-mute" size={14} color="#94a3b8" style={{ marginLeft: 6 }} />
            )}
          </View>
          <View style={styles.headerSubtitleRow}>
            <View style={[styles.statusDot, isOnline ? styles.dotOnline : styles.dotOffline]} />
            <Text style={[styles.headerSubtitle, isOnline ? styles.textOnline : styles.textOffline]}>
              {isOnline ? 'Active now' : 'Offline'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setShowOptionsModal(true)}
          style={styles.headerOptionsBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#cbd5e1" />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#a855f7" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => `${item.id || 'msg'}-${index}`}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={44} color="#475569" />
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySub}>Send a message to start the conversation.</Text>
            </View>
          }
        />
      )}

      {/* Input Bar */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Message..."
          placeholderTextColor="#64748b"
          style={styles.textInput}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim()}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <ChatOptionsModal
        visible={showOptionsModal}
        onClose={() => setShowOptionsModal(false)}
        title={name || 'Conversation'}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onDeleteConversation={handleDeleteConversation}
        onBlockUser={handleBlockUser}
        canBlock={Boolean(otherUserId)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtn: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  headerAvatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  headerMeta: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    flexShrink: 1,
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  dotOnline: {
    backgroundColor: '#22c55e',
  },
  dotOffline: {
    backgroundColor: '#64748b',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  textOnline: {
    color: '#22c55e',
  },
  textOffline: {
    color: '#64748b',
  },
  headerOptionsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  messageList: {
    padding: 16,
    paddingBottom: 24,
    gap: 10,
  },
  bubbleWrapper: {
    width: '100%',
    flexDirection: 'row',
    marginVertical: 2,
  },
  bubbleLeft: {
    justifyContent: 'flex-start',
  },
  bubbleRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  myBubble: {
    borderRadius: 20,
    borderBottomRightRadius: 4,
    shadowColor: '#9333ea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  theirBubble: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  myBubbleText: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  },
  theirBubbleText: {
    color: '#f8fafc',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400',
  },
  myTimeText: {
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  theirTimeText: {
    fontSize: 10.5,
    color: '#94a3b8',
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 8,
  },
  emptyTitle: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySub: {
    color: '#64748b',
    fontSize: 13,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0f172a',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    color: '#f8fafc',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#9333ea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#334155',
    opacity: 0.6,
  },
});