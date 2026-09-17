import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import AnimatedBackground from '../../../components/AnimatedBackground';
import {
  chatApi,
  ConversationItem,
  MessageRequestItem,
} from '../api/chatApi';
import ChatOptionsModal from '../components/ChatOptionsModal';

const SOCKET_URL = Platform.select({
  android: 'http://10.0.2.2:3001',
  default: 'http://localhost:3001',
});

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

type TabType = 'chats' | 'requests';

export default function ConversationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabType>('chats');
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [requests, setRequests] = useState<MessageRequestItem[]>([]);
  const [requestsCount, setRequestsCount] = useState<number>(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  // Real-time online presence state & options modal
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [selectedConversation, setSelectedConversation] = useState<ConversationItem | null>(null);
  const [showOptionsModal, setShowOptionsModal] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const storedId =
        (await AsyncStorage.getItem('ginivibe_user_id')) ||
        (await AsyncStorage.getItem('user_id'));
      if (storedId) {
        setCurrentUserId(storedId);
        return;
      }

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

      const token = await AsyncStorage.getItem('ginivibe_auth_token');
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length >= 2) {
            let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            while (base64.length % 4) base64 += '=';
            const decoded = JSON.parse(decodeBase64(base64));
            const resolved = decoded.id || decoded.userId || decoded.sub;
            if (resolved) {
              setCurrentUserId(resolved);
              await AsyncStorage.setItem('ginivibe_user_id', resolved);
            }
          }
        } catch {}
      }
    })();
  }, []);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [convos, reqs] = await Promise.all([
        chatApi.getConversations().catch(() => []),
        chatApi.getMessageRequests().catch(() => ({ requests: [], count: 0 })),
      ]);
      setConversations(convos);
      setRequests(reqs.requests);
      setRequestsCount(reqs.count);
    } catch (err) {
      console.warn('[ConversationsScreen] Failed to load chat data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time socket presence & conversation events
  useEffect(() => {
    let socket: Socket | undefined;

    (async () => {
      // 1. Initial REST fetch for accurate online users
      try {
        const initialOnline = await chatApi.getOnlineUsers();
        if (Array.isArray(initialOnline)) {
          setOnlineUserIds(new Set(initialOnline));
        }
      } catch (e) {
        console.warn('Failed to load initial online users:', e);
      }

      // 2. Connect socket
      const token = await AsyncStorage.getItem('ginivibe_auth_token');
      if (!token) return;

      socket = io(SOCKET_URL, { auth: { token } });

      socket.on('presence:init', (data: { onlineUserIds: string[] }) => {
        if (Array.isArray(data?.onlineUserIds)) {
          setOnlineUserIds(new Set(data.onlineUserIds));
        }
      });

      socket.on('user_presence_update', (data: { userId: string; status: 'ONLINE' | 'OFFLINE' }) => {
        if (!data?.userId) return;
        setOnlineUserIds((prev) => {
          const next = new Set(prev);
          if (data.status === 'ONLINE') {
            next.add(data.userId);
          } else {
            next.delete(data.userId);
          }
          return next;
        });
      });

      socket.on('conversation:deleted', (data: { conversationId: string }) => {
        if (!data?.conversationId) return;
        setConversations((prev) => prev.filter((c) => c.id !== data.conversationId));
      });
    })();

    return () => {
      socket?.disconnect();
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
    chatApi.getOnlineUsers().then((ids) => {
      if (Array.isArray(ids)) setOnlineUserIds(new Set(ids));
    }).catch(() => {});
  };


  const handleAcceptRequest = async (request: MessageRequestItem) => {
    if (processingRequestId) return;
    setProcessingRequestId(request.id);
    const displayName = request.sender.firstName
      ? `${request.sender.firstName} ${request.sender.lastName || ''}`.trim()
      : request.sender.username;

    try {
      const conversation = await chatApi.acceptMessageRequest(request.id);
      // Remove from requests state
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
      setRequestsCount((prev) => Math.max(0, prev - 1));
      // Navigate to chat
      router.push({
        pathname: '/chat/[id]',
        params: {
          id: conversation.id,
          name: displayName,
          userId: request.sender.id,
        },
      });
    } catch (err: any) {
      console.error('Failed to accept request:', err);
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (processingRequestId) return;
    setProcessingRequestId(requestId);
    try {
      await chatApi.rejectMessageRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      setRequestsCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Failed to decline request:', err);
    } finally {
      setProcessingRequestId(null);
    }
  };

  const getChatTitle = (item: ConversationItem) => {
    if (item.isGroup) return item.title || 'Group Chat';
    const otherMember = item.members?.find(
      (m) => (m.userId || m.user?.id) !== currentUserId
    );
    return (
      otherMember?.user?.firstName ||
      otherMember?.user?.username ||
      'Direct Message'
    );
  };

  const handleOpenOptions = (conv: ConversationItem) => {
    setSelectedConversation(conv);
    setShowOptionsModal(true);
  };

  const handleToggleMute = async () => {
    if (!selectedConversation) return;
    try {
      const res = await chatApi.toggleMuteConversation(selectedConversation.id);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversation.id ? { ...c, isMuted: res.isMuted } : c
        )
      );
    } catch (err: any) {
      console.error('Failed to toggle mute:', err);
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return;
    const convId = selectedConversation.id;
    try {
      await chatApi.deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
    } catch (err: any) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleBlockUser = async () => {
    if (!selectedConversation) return;
    const otherMember =
      selectedConversation.members?.find((m) => {
        const mId = m.userId || m.user?.id;
        return mId && mId !== currentUserId;
      }) ||
      selectedConversation.members?.find(
        (m) => (m.userId || m.user?.id) !== currentUserId
      );

    let otherUserId = otherMember?.userId || otherMember?.user?.id;
    if (otherUserId === currentUserId && (selectedConversation.members?.length || 0) > 1) {
      const alt = selectedConversation.members.find((m) => (m.userId || m.user?.id) !== otherUserId);
      otherUserId = alt?.userId || alt?.user?.id;
    }

    if (!otherUserId || otherUserId === currentUserId) {
      console.warn('Cannot block: target user id not found or matches self');
      return;
    }

    try {
      await chatApi.blockUser(otherUserId);
      setConversations((prev) => prev.filter((c) => c.id !== selectedConversation.id));
    } catch (err: any) {
      console.error('Failed to block user:', err);
    }
  };

  const renderConversationItem = ({ item }: { item: ConversationItem }) => {
    const title = getChatTitle(item);
    const lastMessage = item.messages?.[0]?.text || 'No messages yet';
    const hasUnread = (item.unreadCount || 0) > 0;
    const otherMember =
      item.members?.find((m) => {
        const mId = m.userId || m.user?.id;
        return mId && mId !== currentUserId;
      }) ||
      item.members?.find((m) => (m.userId || m.user?.id) !== currentUserId);

    let otherUserId = otherMember?.userId || otherMember?.user?.id;
    if (otherUserId === currentUserId && (item.members?.length || 0) > 1) {
      const alt = item.members.find((m) => (m.userId || m.user?.id) !== otherUserId);
      otherUserId = alt?.userId || alt?.user?.id;
    }
    const isOnline = Boolean(otherUserId && onlineUserIds.has(otherUserId));

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() =>
          router.push({
            pathname: '/chat/[id]',
            params: {
              id: item.id,
              name: title,
              userId: otherUserId || '',
              isMuted: String(Boolean(item.isMuted)),
            },
          })
        }
        onLongPress={() => handleOpenOptions(item)}
        style={styles.cardWrapper}
      >
        <BlurView intensity={25} tint="dark" style={styles.card}>
          <View style={styles.avatarContainer}>
            {otherMember?.user?.profilePic ? (
              <Image source={{ uri: otherMember.user.profilePic }} style={styles.avatarImg} />
            ) : (
              <LinearGradient
                colors={['#818cf8', '#6366f1']}
                style={styles.avatar}
              >
                <Text style={styles.avatarInitial}>
                  {title.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
            )}
            {isOnline && <View style={styles.onlineBadge} />}
          </View>

          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.chatTitle} numberOfLines={1}>
                  {title}
                </Text>
                {item.isMuted && (
                  <Ionicons name="volume-mute" size={13} color="#94a3b8" style={{ marginLeft: 4 }} />
                )}
              </View>
              <Text style={styles.chatTime}>
                {item.updatedAt
                  ? new Date(item.updatedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''}
              </Text>
            </View>
            <View style={styles.cardSubRow}>
              <Text
                numberOfLines={1}
                style={[styles.lastMessage, hasUnread && styles.lastMessageUnread]}
              >
                {lastMessage}
              </Text>
              <View style={styles.cardRightGroup}>
                {hasUnread && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                  </View>
                )}
                <TouchableOpacity
                  onPress={() => handleOpenOptions(item)}
                  style={styles.moreOptionsBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="ellipsis-vertical" size={16} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BlurView>
      </TouchableOpacity>
    );
  };

  const renderRequestItem = ({ item }: { item: MessageRequestItem }) => {
    const sender = item.sender;
    const fullName = sender.firstName
      ? `${sender.firstName} ${sender.lastName || ''}`.trim()
      : sender.username;
    const isProcessing = processingRequestId === item.id;

    return (
      <Animated.View entering={FadeInDown.duration(200)} style={styles.cardWrapper}>
        <BlurView intensity={30} tint="dark" style={styles.requestCard}>
          <View style={styles.requestHeader}>
            {sender.profilePic ? (
              <Image source={{ uri: sender.profilePic }} style={styles.reqAvatarImg} />
            ) : (
              <LinearGradient colors={['#ec4899', '#8b5cf6']} style={styles.reqAvatar}>
                <Text style={styles.avatarInitial}>{fullName.charAt(0).toUpperCase()}</Text>
              </LinearGradient>
            )}

            <View style={styles.requestMeta}>
              <View style={styles.nameRow}>
                <Text style={styles.requestName} numberOfLines={1}>
                  {fullName}
                </Text>
                {sender.zodiacSign && (
                  <View style={styles.zodiacTag}>
                    <Text style={styles.zodiacText}>{sender.zodiacSign}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.requestUsername}>@{sender.username}</Text>
              {sender.bio && (
                <Text style={styles.requestBio} numberOfLines={2}>
                  {sender.bio}
                </Text>
              )}
            </View>
          </View>

          {item.message ? (
            <View style={styles.icebreakerBox}>
              <Ionicons name="chatbubble-ellipses" size={14} color="#a78bfa" style={{ marginRight: 6, marginTop: 2 }} />
              <Text style={styles.icebreakerText}>"{item.message}"</Text>
            </View>
          ) : null}

          <View style={styles.requestActions}>
            <TouchableOpacity
              style={styles.declineBtn}
              onPress={() => handleRejectRequest(item.id)}
              disabled={isProcessing}
            >
              <Ionicons name="close" size={18} color="#94a3b8" />
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => handleAcceptRequest(item)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <LinearGradient
                  colors={['#9333ea', '#6366f1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.acceptGradient}
                >
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={styles.acceptBtnText}>Accept & Chat</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>
    );
  };

  return (
    <AnimatedBackground>
      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Messages</Text>
            <Text style={styles.subtitle}>Direct chats & match requests</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/rooms' as any)}
            style={styles.roomsHeaderBtn}
          >
            <Ionicons name="radio" size={13} color="#c084fc" style={{ marginRight: 5 }} />
            <Text style={styles.roomsHeaderBtnText}>Live Lounges</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs Switcher: Chats vs. Requests */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('chats')}
            style={[styles.tabButton, activeTab === 'chats' && styles.tabButtonActive]}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={18}
              color={activeTab === 'chats' ? '#f8fafc' : '#64748b'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabText, activeTab === 'chats' && styles.tabTextActive]}>
              Chats
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('requests')}
            style={[styles.tabButton, activeTab === 'requests' && styles.tabButtonActive]}
          >
            <Ionicons
              name="mail-unread-outline"
              size={18}
              color={activeTab === 'requests' ? '#f8fafc' : '#64748b'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
              Requests
            </Text>
            {requestsCount > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{requestsCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#a855f7" />
          </View>
        ) : activeTab === 'chats' ? (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={renderConversationItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#a855f7"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="chatbubbles-outline" size={48} color="#475569" />
                <Text style={styles.emptyTitle}>No conversations yet</Text>
                <Text style={styles.emptySub}>
                  Send a message request in Non-Live Matching. When accepted, you can chat here!
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={() => router.push('/(tabs)/matching' as any)}
                >
                  <Text style={styles.emptyActionBtnText}>Explore Matches</Text>
                </TouchableOpacity>
              </View>
            }
          />
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item.id}
            renderItem={renderRequestItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#a855f7"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="heart-dislike-outline" size={48} color="#475569" />
                <Text style={styles.emptyTitle}>No Pending Requests</Text>
                <Text style={styles.emptySub}>
                  When someone likes your profile or sends you a match request, it will appear here.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {selectedConversation && (
        <ChatOptionsModal
          visible={showOptionsModal}
          onClose={() => setShowOptionsModal(false)}
          title={getChatTitle(selectedConversation)}
          isMuted={selectedConversation.isMuted}
          onToggleMute={handleToggleMute}
          onDeleteConversation={handleDeleteConversation}
          onBlockUser={handleBlockUser}
          canBlock={!selectedConversation.isGroup}
        />
      )}
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flexOne: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  roomsHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  roomsHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#c084fc',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: '#9333ea',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    gap: 12,
  },
  cardWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: 'rgba(30, 41, 59, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 2.5,
    borderColor: '#0f172a',
  },
  avatarInitial: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    flexShrink: 1,
  },
  chatTime: {
    fontSize: 12,
    color: '#64748b',
  },
  cardSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#94a3b8',
    flex: 1,
  },
  lastMessageUnread: {
    color: '#f8fafc',
    fontWeight: '600',
  },
  cardRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unreadBadge: {
    backgroundColor: '#a855f7',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  moreOptionsBtn: {
    padding: 4,
  },
  requestCard: {
    padding: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 18,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  reqAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  reqAvatarImg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 14,
  },
  requestMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  zodiacTag: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  zodiacText: {
    fontSize: 11,
    color: '#d8b4fe',
    fontWeight: '600',
  },
  requestUsername: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  requestBio: {
    fontSize: 13,
    color: '#cbd5e1',
    marginTop: 6,
    lineHeight: 18,
  },
  icebreakerBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
    marginTop: 12,
  },
  icebreakerText: {
    flex: 1,
    fontSize: 13.5,
    color: '#f1f5f9',
    fontStyle: 'italic',
    lineHeight: 19,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  declineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  declineBtnText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  acceptBtn: {
    flex: 1.5,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
  },
  acceptGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  acceptBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 16,
  },
  emptySub: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  emptyActionBtn: {
    marginTop: 20,
    backgroundColor: '#9333ea',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyActionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
