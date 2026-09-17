'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Send,
  X,
  MessageCircle,
  Check,
  Inbox,
  Sparkles,
  Shield,
  Clock,
  UserCheck,
  UserX,
  ArrowLeft,
  Flame,
  MoreVertical,
  Trash2,
  Bell,
  BellOff,
  ShieldAlert,
  AlertTriangle,
  Users,
  UserPlus,
} from 'lucide-react';
import { Input } from '@/app/core/components/Input';
import { Button } from '@/app/core/components/Button';
import { Avatar } from '@/app/core/components/Avatar';
import { useAuth } from '@/app/core/providers/AuthProvider';
import { useGlobalSocket } from '@/app/core/providers/GlobalSocketProvider';
import {
  chatApi,
  ChatUser,
  Conversation,
  Message,
  MessageRequest,
} from '@/lib/api/chat';
import { StorageService } from '@/lib/storage';
import { CreateGroupModal } from './CreateGroupModal';
import { GroupMembersModal } from './GroupMembersModal';

const POLL_INTERVAL_MS = 4000;

function otherMember(conversation: Conversation | null | undefined, currentUserId: string | undefined) {
  if (!conversation || !conversation.members || conversation.members.length === 0) return null;
  if (!currentUserId) {
    return conversation.members[1]?.user || conversation.members[0]?.user || null;
  }
  const other = conversation.members.find((m) => m.userId !== currentUserId);
  if (other) return other.user;
  if (conversation.members.length > 1) {
    return conversation.members.find((m) => m.userId === currentUserId) ? conversation.members[1].user : conversation.members[0].user;
  }
  return conversation.members[0]?.user ?? null;
}

function displayName(u: { firstName?: string | null; lastName?: string | null; username: string } | null) {
  if (!u) return 'Unknown';
  return u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.username;
}

function timeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function MessagesDashboard() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('userId');

  // Robust currentUserId resolution with JWT fallback
  const currentUserId = useMemo(() => {
    if (user?.id) return user.id;
    if (typeof window !== 'undefined') {
      const token = StorageService.getItem('ginivibe_auth_token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          return payload.id || '';
        } catch {}
      }
    }
    return '';
  }, [user]);

  // Navigation tab: 'chats' | 'requests'
  const [activeTab, setActiveTab] = useState<'chats' | 'requests'>('chats');

  // Chats state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [isLoadingConvos, setIsLoadingConvos] = useState(true);

  // AI reply suggestion (suggestion only — nothing is sent until accepted)
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

  // Message Requests state
  const [requests, setRequests] = useState<MessageRequest[]>([]);
  const [requestsCount, setRequestsCount] = useState<number>(0);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isProcessingRequest, setIsProcessingRequest] = useState(false);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);


  // Presence & Conversation Actions State
  const { socket } = useGlobalSocket();
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // UI status
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const handledInitialTargetRef = useRef(false);

  // Fetch initial online users list
  useEffect(() => {
    chatApi.getOnlineUsers().then((ids) => {
      setOnlineUserIds(new Set(ids));
    });
  }, []);

  // Real-time socket events for presence and conversation changes
  useEffect(() => {
    if (!socket) return;

    const handlePresenceInit = (data: { onlineUserIds: string[] }) => {
      if (Array.isArray(data?.onlineUserIds)) {
        setOnlineUserIds(new Set(data.onlineUserIds));
      }
    };

    const handlePresenceUpdate = (data: { userId: string; status: 'ONLINE' | 'OFFLINE' }) => {
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
    };

    const handleConversationDeleted = (data: { conversationId: string }) => {
      setConversations((prev) => prev.filter((c) => c.id !== data.conversationId));
      if (activeId === data.conversationId) {
        setActiveId(null);
      }
    };

    socket.on('presence:init', handlePresenceInit);
    socket.on('user_presence_update', handlePresenceUpdate);
    socket.on('conversation:deleted', handleConversationDeleted);

    return () => {
      socket.off('presence:init', handlePresenceInit);
      socket.off('user_presence_update', handlePresenceUpdate);
      socket.off('conversation:deleted', handleConversationDeleted);
    };
  }, [socket, activeId]);

  const handleDeleteConversation = async () => {
    if (!activeId) return;
    setIsActionLoading(true);
    try {
      await chatApi.deleteConversation(activeId);
      setConversations((prev) => prev.filter((c) => c.id !== activeId));
      setActiveId(null);
      setShowDeleteConfirm(false);
    } catch (e: any) {
      setError(e.message || 'Failed to delete conversation');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleGroupCreated = (conversation: Conversation) => {
    setConversations((prev) => [conversation, ...prev]);
    setActiveTab('chats');
    setActiveId(conversation.id);
    setSelectedRequestId(null);
    setShowCreateGroup(false);
  };

  const handleLeaveGroup = async () => {
    if (!activeId || !currentUserId) return;
    if (!window.confirm('Leave this group?')) return;
    setIsMenuOpen(false);
    setIsActionLoading(true);
    try {
      await chatApi.removeGroupMember(activeId, currentUserId);
      setConversations((prev) => prev.filter((c) => c.id !== activeId));
      setActiveId(null);
    } catch (e: any) {
      setError(e.message || 'Failed to leave group');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleMute = async () => {
    if (!activeId) return;
    try {
      const res = await chatApi.toggleMuteConversation(activeId);
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, isMuted: res.isMuted } : c))
      );
      setIsMenuOpen(false);
    } catch (e: any) {
      setError(e.message || 'Failed to toggle mute');
    }
  };

  const handleBlockUser = async () => {
    const other = otherMember(activeConversation, currentUserId);
    if (!other?.id || other.id === currentUserId) {
      setError('Cannot block: target user not identified');
      return;
    }
    setIsActionLoading(true);
    try {
      await chatApi.blockUser(other.id);
      if (activeId) {
        setConversations((prev) => prev.filter((c) => c.id !== activeId));
        setActiveId(null);
      }
      setShowBlockConfirm(false);
    } catch (e: any) {
      setError(e.message || 'Failed to block user');
    } finally {
      setIsActionLoading(false);
    }
  };

  // 1. Fetch conversations & message requests
  const loadData = useCallback(async () => {
    try {
      const [convData, reqData] = await Promise.all([
        chatApi.getConversations().catch(() => [] as Conversation[]),
        chatApi.getMessageRequests().catch(() => ({ requests: [], count: 0 })),
      ]);
      setConversations(convData);
      setRequests(reqData.requests);
      setRequestsCount(reqData.count);
    } catch (e: any) {
      setError(e.message || 'Failed to refresh messages');
    } finally {
      setIsLoadingConvos(false);
      setIsLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadData]);

  // 2. Handle ?userId=... deep linking logic
  useEffect(() => {
    if (!targetUserId || handledInitialTargetRef.current) return;
    if (isLoadingConvos || isLoadingRequests) return;

    handledInitialTargetRef.current = true;

    // A. Check if active conversation exists with target user
    const existingConv = conversations.find((c) =>
      c.members.some((m) => m.userId === targetUserId)
    );
    if (existingConv) {
      setActiveTab('chats');
      setActiveId(existingConv.id);
      return;
    }

    // B. Check if a pending message request exists from this target user
    const incomingReq = requests.find((r) => r.sender.id === targetUserId);
    if (incomingReq) {
      setActiveTab('requests');
      setSelectedRequestId(incomingReq.id);
      return;
    }
  }, [targetUserId, conversations, requests, isLoadingConvos, isLoadingRequests]);

  // 3. Load messages for active conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const data = await chatApi.getMessages(conversationId);
      setMessages(data);
      await chatApi.markConversationRead(conversationId);
    } catch (e: any) {
      setError(e.message || 'Failed to load messages');
    }
  }, []);

  useEffect(() => {
    if (!activeId) return;
    loadMessages(activeId);
    const interval = setInterval(() => loadMessages(activeId), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [activeId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  );

  const activeRequest = useMemo(
    () => requests.find((r) => r.id === selectedRequestId) ?? null,
    [requests, selectedRequestId]
  );

  // 5. Send message in active chat
  const sendText = async (rawText: string) => {
    if (!rawText.trim() || !activeId) return;
    const text = rawText.trim();
    setDraft('');
    try {
      const message = await chatApi.sendMessage({ conversationId: activeId, text });
      setMessages((prev) => [...prev, message]);
      loadData();
    } catch (e: any) {
      setError(e.message || 'Failed to send message');
    }
  };

  const handleSend = async () => {
    await sendText(draft);
  };

  // 5b. Ask AI for a reply suggestion based on the last 30 messages.
  // The suggestion is only shown — it is never sent automatically.
  const handleSuggest = async () => {
    if (!activeId || isSuggesting) return;
    setIsSuggesting(true);
    setError(null);
    try {
      const { suggestion: text } = await chatApi.suggestReply(activeId);
      setSuggestion(text);
    } catch (e: any) {
      setError(e.message || 'Failed to get suggestion');
    } finally {
      setIsSuggesting(false);
    }
  };

  // Drop any open suggestion when switching conversations.
  useEffect(() => {
    setSuggestion(null);
  }, [activeId]);

  // 6. Handle Accept Request
  const handleAcceptRequest = async (requestId: string) => {
    setIsProcessingRequest(true);
    setError(null);
    try {
      const conv = await chatApi.acceptMessageRequest(requestId);
      // Remove from requests queue
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      setRequestsCount((prev) => Math.max(prev - 1, 0));
      setSelectedRequestId(null);

      // Add to conversation list, switch to chats tab, and activate
      setConversations((prev) => [conv, ...prev.filter((c) => c.id !== conv.id)]);
      setActiveTab('chats');
      setActiveId(conv.id);
    } catch (e: any) {
      setError(e.message || 'Failed to accept message request');
    } finally {
      setIsProcessingRequest(false);
    }
  };

  // 7. Handle Reject Request
  const handleRejectRequest = async (requestId: string) => {
    setIsProcessingRequest(true);
    setError(null);
    try {
      await chatApi.rejectMessageRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      setRequestsCount((prev) => Math.max(prev - 1, 0));
      setSelectedRequestId(null);
    } catch (e: any) {
      setError(e.message || 'Failed to decline message request');
    } finally {
      setIsProcessingRequest(false);
    }
  };


  return (
    <div style={{ display: 'flex', width: '100%', overflow: 'hidden', height: 'calc(100dvh - 212px)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)' }}>
      {/* Sidebar: Chats / Requests List */}
      <div
        style={{
          width: '340px',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--color-surface)',
          flexShrink: 0,
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: 'var(--space-5) var(--space-4) var(--space-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Messages</h1>
          </div>
        </div>

        {/* Instagram-Style Tab Switcher */}
        <div
          style={{
            display: 'flex',
            padding: '0 var(--space-4)',
            gap: 'var(--space-2)',
            borderBottom: '1px solid var(--color-border)',
            marginBottom: 'var(--space-2)',
          }}
        >
          <button
            onClick={() => {
              setActiveTab('chats');
            }}
            style={{
              flex: 1,
              padding: 'var(--space-3) var(--space-2)',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'chats' ? '2px solid var(--color-accent)' : '2px solid transparent',
              color: activeTab === 'chats' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              fontWeight: activeTab === 'chats' ? 700 : 500,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>Chats</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('requests');
              if (requests.length > 0 && !selectedRequestId) {
                setSelectedRequestId(requests[0].id);
              }
            }}
            style={{
              flex: 1,
              padding: 'var(--space-3) var(--space-2)',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'requests' ? '2px solid var(--color-accent)' : '2px solid transparent',
              color: activeTab === 'requests' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              fontWeight: activeTab === 'requests' ? 700 : 500,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>Requests</span>
            {requestsCount > 0 && (
              <span
                style={{
                  background: 'var(--color-accent)',
                  color: 'var(--color-on-accent)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  boxShadow: '0 2px 6px color-mix(in srgb, var(--color-accent) 35%, transparent)',
                }}
              >
                {requestsCount}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Regular Chats List */}
        {activeTab === 'chats' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 var(--space-2)' }}>
            <div style={{ padding: 'var(--space-2) var(--space-1)' }}>
              <Button variant="secondary" fullWidth onClick={() => setShowCreateGroup(true)}>
                <UserPlus size={15} style={{ marginRight: '6px' }} /> New group
              </Button>
            </div>
            {isLoadingConvos && (
              <p style={{ color: 'var(--color-text-muted)', padding: 'var(--space-4)', textAlign: 'center' }}>
                Loading conversations...
              </p>
            )}

            {!isLoadingConvos && conversations.length === 0 && (
              <div style={{ padding: 'var(--space-8) var(--space-4)', textAlign: 'center' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--space-3)',
                    color: 'var(--color-accent)',
                  }}
                >
                  <Inbox size={26} />
                </div>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)', fontSize: '0.9rem', maxWidth: '240px', margin: '0 auto var(--space-4)' }}>
                  No active conversations yet. Match with people in Non-Live Matching to send or accept message requests.
                </p>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/matching'}
                >
                  Explore Matches
                </Button>
              </div>
            )}

            {conversations.map((conversation) => {
              const other = otherMember(conversation, currentUserId);
              const lastMessage = conversation.messages?.[0];
              const isActive = conversation.id === activeId;
              const isGroup = conversation.isGroup;
              const groupTitle = conversation.title || 'Group chat';
              return (
                <button
                  key={conversation.id}
                  onClick={() => {
                    setActiveId(conversation.id);
                    setSelectedRequestId(null);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: isActive ? 'var(--color-surface-elevated)' : 'transparent',
                    border: isActive ? '1px solid var(--color-border)' : '1px solid transparent',
                    textAlign: 'left',
                    marginBottom: 'var(--space-1)',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: isGroup ? '14px' : 'var(--radius-full)',
                        background: 'var(--color-accent)',
                        color: 'var(--color-on-accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '1.1rem',
                        overflow: 'hidden'
                      }}
                    >
                      {isGroup ? (
                        <Users size={22} />
                      ) : other?.profilePic ? (
                        <img
                          src={other.profilePic}
                          alt={other.username}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        displayName(other).charAt(0).toUpperCase()
                      )}
                    </div>
                    {!isGroup && onlineUserIds.has(other?.id || '') && (
                      <span
                        title="Online now"
                        style={{
                          position: 'absolute',
                          bottom: '1px',
                          right: '1px',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--color-accent)',
                          border: '2px solid var(--color-surface)',
                          boxShadow: '0 0 6px color-mix(in srgb, var(--color-accent) 90%, transparent)',
                        }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{isGroup ? groupTitle : displayName(other)}</span>
                        {isGroup && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                            · {conversation.members.length} member{conversation.members.length === 1 ? '' : 's'}
                          </span>
                        )}
                        {conversation.isMuted && (
                          <span title="Muted" style={{ display: 'inline-flex', alignItems: 'center' }}>
                            <BellOff size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                          </span>
                        )}
                      </div>
                      {!!conversation.unreadCount && (
                        <span
                          style={{
                            backgroundColor: 'var(--color-accent)',
                            color: 'var(--color-on-accent)',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.7rem',
                            padding: '2px 7px',
                            fontWeight: 700,
                          }}
                        >
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        color: 'var(--color-text-muted)',
                        fontSize: '0.85rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        margin: '2px 0 0',
                      }}
                    >
                      {lastMessage?.text || 'Say hello 👋'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Tab 2: Incoming Message Requests List */}
        {activeTab === 'requests' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 var(--space-2)' }}>
            <div
              style={{
                padding: 'var(--space-2) var(--space-3) var(--space-3)',
                fontSize: '0.8rem',
                color: 'var(--color-text-muted)',
                lineHeight: 1.4,
              }}
            >
              People who sent you a message request from Non-Live Matching.
            </div>

            {isLoadingRequests && (
              <p style={{ color: 'var(--color-text-muted)', padding: 'var(--space-4)', textAlign: 'center' }}>
                Loading requests...
              </p>
            )}

            {!isLoadingRequests && requests.length === 0 && (
              <div style={{ padding: 'var(--space-8) var(--space-4)', textAlign: 'center' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--space-3)',
                    color: 'var(--color-accent)',
                  }}
                >
                  <Sparkles size={24} />
                </div>
                <h4 style={{ margin: '0 0 var(--space-1)', fontWeight: 600 }}>No Message Requests</h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0 }}>
                  When someone connects with you in Discovery & Matching, their message will appear here.
                </p>
              </div>
            )}

            {requests.map((request) => {
              const isSelected = request.id === selectedRequestId;
              const sender = request.sender;
              return (
                <button
                  key={request.id}
                  onClick={() => {
                    setSelectedRequestId(request.id);
                    setActiveId(null);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: isSelected ? 'var(--color-surface-elevated)' : 'transparent',
                    border: isSelected ? '1px solid color-mix(in srgb, var(--color-accent) 40%, transparent)' : '1px solid transparent',
                    textAlign: 'left',
                    marginBottom: 'var(--space-1)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--color-accent)',
                      color: 'var(--color-on-accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}
                  >
                    {sender.profilePic ? (
                      <img
                        src={sender.profilePic}
                        alt={sender.username}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      displayName(sender).charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.925rem' }}>{displayName(sender)}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {timeAgo(request.createdAt)}
                      </span>
                    </div>
                    <div
                      style={{
                        color: 'var(--color-text-secondary)',
                        fontSize: '0.85rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginTop: '2px',
                        fontStyle: request.message ? 'normal' : 'italic',
                      }}
                    >
                      {request.message || 'Sent you a connection request'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* VIEW A: Instagram-Style Message Request Preview */}
        {activeTab === 'requests' && activeRequest && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              backgroundColor: 'var(--color-background)',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: 'var(--space-4) var(--space-6)',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--color-surface)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-accent)',
                    color: 'var(--color-on-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    overflow: 'hidden'
                  }}
                >
                  {activeRequest.sender.profilePic ? (
                    <img src={activeRequest.sender.profilePic} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    displayName(activeRequest.sender).charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                    {displayName(activeRequest.sender)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    @{activeRequest.sender.username}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
                  color: 'var(--color-accent)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                <Sparkles size={14} />
                <span>Message Request</span>
              </div>
            </div>

            {/* Request Content Body */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: 'var(--space-8) var(--space-6)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-6)',
              }}
            >
              {/* Profile Card */}
              <div
                className="glass"
                style={{
                  width: '100%',
                  maxWidth: '520px',
                  padding: 'var(--space-6)',
                  borderRadius: 'var(--radius-xl)',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-accent)',
                    color: 'var(--color-on-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '2rem',
                    margin: '0 auto var(--space-4)',
                    boxShadow: '0 8px 24px color-mix(in srgb, var(--color-accent) 30%, transparent)',
                    overflow: 'hidden',
                  }}
                >
                  {activeRequest.sender.profilePic ? (
                    <img
                      src={activeRequest.sender.profilePic}
                      alt={activeRequest.sender.username}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    displayName(activeRequest.sender).charAt(0).toUpperCase()
                  )}
                </div>

                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 4px' }}>
                  {displayName(activeRequest.sender)}
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: '0 0 var(--space-3)' }}>
                  @{activeRequest.sender.username}
                </p>

                {activeRequest.sender.zodiacSign && (
                  <div style={{ marginBottom: 'var(--space-3)' }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
                        color: 'var(--color-accent)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      ✨ {activeRequest.sender.zodiacSign}
                    </span>
                  </div>
                )}

                {activeRequest.sender.bio && (
                  <p
                    style={{
                      color: 'var(--color-text-secondary)',
                      fontSize: '0.9rem',
                      lineHeight: 1.5,
                      margin: '0 0 var(--space-4)',
                      padding: '0 var(--space-2)',
                    }}
                  >
                    "{activeRequest.sender.bio}"
                  </p>
                )}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.8rem',
                    borderTop: '1px solid var(--color-border)',
                    paddingTop: 'var(--space-3)',
                  }}
                >
                  <Clock size={14} />
                  <span>Requested {timeAgo(activeRequest.createdAt)}</span>
                </div>
              </div>

              {/* Instagram Notice / Privacy Box */}
              <div
                style={{
                  width: '100%',
                  maxWidth: '520px',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'rgba(22, 24, 29, 0.5)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  gap: 'var(--space-3)',
                  alignItems: 'flex-start',
                }}
              >
                <Shield size={20} color="var(--color-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  <strong style={{ color: 'var(--color-text-primary)' }}>
                    They won't know you've seen this message until you accept.
                  </strong>
                  <div style={{ marginTop: '4px' }}>
                    If you accept, their message will be added to your regular chats and they'll be able to message you directly.
                  </div>
                </div>
              </div>

              {/* Icebreaker Message Bubble */}
              <div style={{ width: '100%', maxWidth: '520px' }}>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    marginBottom: 'var(--space-2)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Attached Introductory Message:
                </div>
                <div
                  style={{
                    padding: 'var(--space-4) var(--space-5)',
                    borderRadius: 'var(--radius-lg)',
                    borderBottomLeftRadius: '4px',
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '1rem',
                    lineHeight: 1.5,
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  {activeRequest.message ? (
                    activeRequest.message
                  ) : (
                    <span style={{ fontStyle: 'italic', color: 'var(--color-text-muted)' }}>
                      "Hey! I saw your profile on Discovery & Matching and would love to connect!"
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Sticky Action Bar */}
            <div
              className="glass"
              style={{
                padding: 'var(--space-4) var(--space-6)',
                borderTop: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                display: 'flex',
                justifyContent: 'center',
                gap: 'var(--space-4)',
              }}
            >
              <button
                onClick={() => handleRejectRequest(activeRequest.id)}
                disabled={isProcessingRequest}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid color-mix(in srgb, var(--color-error) 30%, transparent)',
                  backgroundColor: 'color-mix(in srgb, var(--color-error) 10%, transparent)',
                  color: 'var(--color-error)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: isProcessingRequest ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <X size={18} />
                <span>Decline</span>
              </button>

              <button
                onClick={() => handleAcceptRequest(activeRequest.id)}
                disabled={isProcessingRequest}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 32px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-btn-bg)',
                  color: 'var(--color-btn-ink)',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: isProcessingRequest ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px color-mix(in srgb, var(--color-accent) 40%, transparent)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Check size={18} />
                <span>{isProcessingRequest ? 'Accepting...' : 'Accept Request'}</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW B: Active Conversation View */}
        {activeTab === 'chats' && activeConversation && (
          <>
            <div
              style={{
                padding: 'var(--space-4) var(--space-6)',
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: activeConversation.isGroup ? '12px' : 'var(--radius-full)',
                      background: 'var(--color-accent)',
                      color: 'var(--color-on-accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      overflow: 'hidden',
                    }}
                  >
                    {activeConversation.isGroup ? (
                      <Users size={20} />
                    ) : otherMember(activeConversation, currentUserId)?.profilePic ? (
                      <img
                        src={otherMember(activeConversation, currentUserId).profilePic}
                        alt="avatar"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      displayName(otherMember(activeConversation, currentUserId)).charAt(0).toUpperCase()
                    )}
                  </div>
                  {!activeConversation.isGroup && onlineUserIds.has(otherMember(activeConversation, currentUserId)?.id || '') && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '1px',
                        right: '1px',
                        width: '11px',
                        height: '11px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-accent)',
                        border: '2px solid var(--color-surface)',
                        boxShadow: '0 0 6px var(--color-accent)',
                      }}
                    />
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                      {activeConversation.isGroup
                        ? (activeConversation.title || 'Group chat')
                        : displayName(otherMember(activeConversation, currentUserId))}
                    </span>
                    {activeConversation.isMuted && (
                      <span
                        title="Notifications muted"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '0.72rem',
                          color: 'var(--color-text-muted)',
                          backgroundColor: 'rgba(148, 163, 184, 0.15)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        <BellOff size={11} /> Muted
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', marginTop: '2px' }}>
                    {activeConversation.isGroup ? (
                      <button
                        type="button"
                        onClick={() => setShowMembers(true)}
                        style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-accent)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        {activeConversation.members.length} member{activeConversation.members.length === 1 ? '' : 's'} · View info
                      </button>
                    ) : onlineUserIds.has(otherMember(activeConversation, currentUserId)?.id || '') ? (
                      <span style={{ color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--color-accent)', display: 'inline-block', boxShadow: '0 0 6px var(--color-accent)' }} />
                        Active now
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--color-text-muted)', display: 'inline-block' }} />
                        Offline
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Instagram-Style 3-dots Menu Button */}
              <div style={{ position: 'relative' }}>
                <Button
                  variant="ghost"
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  title="Conversation options"
                  style={{ padding: '8px', borderRadius: 'var(--radius-full)' }}
                >
                  <MoreVertical size={20} />
                </Button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 6px)',
                      width: '230px',
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '14px',
                      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
                      padding: '6px',
                      zIndex: 100,
                      backdropFilter: 'blur(16px)',
                    }}
                  >
                    {/* Option 1: Mute / Unmute */}
                    <button
                      onClick={handleToggleMute}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: 'var(--color-text-primary)',
                        fontSize: '0.88rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-border)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {activeConversation.isMuted ? <Bell size={16} color="var(--color-accent)" /> : <BellOff size={16} color="var(--color-text-muted)" />}
                      <span>{activeConversation.isMuted ? 'Unmute notifications' : 'Mute notifications'}</span>
                    </button>

                    {activeConversation.isGroup && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setShowMembers(true);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: 'var(--color-text-primary)',
                          fontSize: '0.88rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-border)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <Users size={16} color="var(--color-accent)" />
                        <span>View members</span>
                      </button>
                    )}

                    <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: '4px 0' }} />

                    {/* Option 2: Delete Conversation (or Leave/Delete group) */}
                    <button
                      onClick={() => {
                        const amAdmin = activeConversation.members.find((m) => m.userId === currentUserId)?.role === 'admin';
                        if (activeConversation.isGroup && !amAdmin) {
                          void handleLeaveGroup();
                        } else {
                          setIsMenuOpen(false);
                          setShowDeleteConfirm(true);
                        }
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: 'var(--color-error)',
                        fontSize: '0.88rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-error) 12%, transparent)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <Trash2 size={16} color="var(--color-error)" />
                      <span>
                        {activeConversation.isGroup
                          ? (activeConversation.members.find((m) => m.userId === currentUserId)?.role === 'admin'
                            ? 'Delete group'
                            : 'Leave group')
                          : 'Delete conversation'}
                      </span>
                    </button>

                    {/* Option 3: Block User (1:1 chats only) */}
                    {!activeConversation.isGroup && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setShowBlockConfirm(true);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: 'var(--color-error)',
                        fontSize: '0.88rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-error) 18%, transparent)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <ShieldAlert size={16} color="var(--color-error)" />
                      <span>Block @{otherMember(activeConversation, currentUserId)?.username}</span>
                    </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6)' }}>
              {messages.map((message, index) => {
                const myId = user?.id || currentUserId;
                const isMine = message.senderId === myId;
                const prev = messages[index - 1];
                const grouped = prev !== undefined && prev.senderId === message.senderId;
                const time = new Date(message.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                return (
                  <div
                    key={message.id}
                    style={{
                      display: 'flex',
                      justifyContent: isMine ? 'flex-end' : 'flex-start',
                      alignItems: 'flex-end',
                      gap: '8px',
                      marginBottom: grouped ? '4px' : '14px',
                    }}
                  >
                    {!isMine && (
                      <span style={{ width: '28px', flexShrink: 0, display: 'flex' }}>
                        {!grouped && (
                          <Avatar
                            person={{
                              id: message.sender?.id,
                              username: message.sender?.username,
                              firstName: message.sender?.firstName,
                            }}
                            size="xs"
                          />
                        )}
                      </span>
                    )}
                    <div style={{ maxWidth: '65%', display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                      {!isMine && !grouped && activeConversation?.isGroup && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '2px', padding: '0 4px' }}>
                          {message.sender?.firstName || message.sender?.username || 'Member'}
                        </span>
                      )}
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: '18px',
                          borderBottomRightRadius: isMine ? '4px' : '18px',
                          borderBottomLeftRadius: isMine ? '18px' : '4px',
                          backgroundColor: isMine ? '#b6ff2e' : '#ffffff',
                          color: '#23262f',
                          lineHeight: 1.45,
                          fontSize: '0.93rem',
                          border: isMine ? 'none' : '1px solid var(--color-border)',
                          boxShadow: '0 1px 2px rgb(35 38 47 / 0.08)',
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {message.text}
                      </div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: '3px', padding: '0 4px' }}>
                        {time}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {suggestion !== null && (
              <div
                style={{
                  margin: '0 var(--space-6)',
                  marginBottom: 'var(--space-3)',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid color-mix(in srgb, #b6ff2e 55%, var(--color-border))',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-accent)' }}>
                    <Sparkles size={15} /> Suggested reply
                  </span>
                  <button
                    type="button"
                    onClick={() => setSuggestion(null)}
                    aria-label="Dismiss suggestion"
                    style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px' }}
                  >
                    <X size={16} />
                  </button>
                </div>
                <textarea
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  rows={2}
                  autoFocus
                  aria-label="Edit suggested reply"
                  style={{
                    width: '100%', resize: 'vertical', padding: '10px 12px', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-elevated)',
                    color: 'var(--color-text-primary)', fontSize: '0.92rem', lineHeight: 1.5, outline: 'none',
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '6px 0 var(--space-3)' }}>
                  Edit it to make it yours — nothing is sent until you accept.
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                  <Button variant="ghost" onClick={() => setSuggestion(null)}>
                    Reject
                  </Button>
                  <Button
                    disabled={!suggestion.trim()}
                    onClick={async () => {
                      const text = suggestion;
                      setSuggestion(null);
                      await sendText(text);
                    }}
                  >
                    <Check size={16} /> Accept & Send
                  </Button>
                </div>
              </div>
            )}

            <div
              style={{
                padding: 'var(--space-4) var(--space-6)',
                borderTop: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                display: 'flex',
                gap: 'var(--space-2)',
                alignItems: 'center',
              }}
            >
              <button
                type="button"
                onClick={() => void handleSuggest()}
                disabled={isSuggesting || messages.length === 0}
                title="Suggest a reply with AI"
                aria-label="Suggest a reply with AI"
                style={{
                  width: '42px', height: '42px', borderRadius: '999px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isSuggesting ? 'var(--color-surface-elevated)' : '#b6ff2e',
                  color: '#23262f', border: '1px solid var(--color-border)',
                  opacity: isSuggesting || messages.length === 0 ? 0.55 : 1,
                  cursor: isSuggesting || messages.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <Sparkles size={19} />
              </button>
              <Input
                placeholder={isSuggesting ? 'Dreaming up a reply…' : 'Type a message...'}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                }}
                style={{ flex: 1 }}
              />
              <Button onClick={handleSend} disabled={!draft.trim()}>
                <Send size={18} />
              </Button>
            </div>
          </>
        )}

        {/* VIEW C: Empty Selection View */}
        {((activeTab === 'chats' && !activeConversation) ||
          (activeTab === 'requests' && !activeRequest)) && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-muted)',
              padding: 'var(--space-6)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'color-mix(in srgb, var(--color-accent) 8%, transparent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--space-4)',
                color: 'var(--color-accent)',
              }}
            >
              {activeTab === 'requests' ? <Sparkles size={32} /> : <MessageCircle size={32} />}
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: '0 0 var(--space-2)' }}>
              {activeTab === 'requests' ? 'Select a Message Request' : 'Your Messages'}
            </h3>
            <p style={{ maxWidth: '340px', fontSize: '0.9rem', margin: 0 }}>
              {activeTab === 'requests'
                ? 'Choose a request from the list to preview their introductory message and profile.'
                : 'Select an active conversation to chat, or accept match requests in the Requests tab.'}
            </p>
          </div>
        )}
      </div>

      {/* Delete Conversation Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(22, 24, 29, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            style={{
              width: '400px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'color-mix(in srgb, var(--color-error) 15%, transparent)',
                color: 'var(--color-error)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Trash2 size={26} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px', color: 'var(--color-text-primary)' }}>
              Delete Conversation?
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 24px' }}>
              This will permanently remove this conversation and its messages. This action cannot be undone.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isActionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConversation}
                disabled={isActionLoading}
                style={{ backgroundColor: 'var(--color-error)', borderColor: 'var(--color-error)', color: 'var(--color-on-accent)' }}
              >
                {isActionLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Block User Confirmation Modal */}
      {showBlockConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(22, 24, 29, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowBlockConfirm(false)}
        >
          <div
            style={{
              width: '420px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid color-mix(in srgb, var(--color-error) 25%, transparent)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'color-mix(in srgb, var(--color-error) 15%, transparent)',
                color: 'var(--color-error)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <ShieldAlert size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px', color: 'var(--color-text-primary)' }}>
              Block @{otherMember(activeConversation, currentUserId)?.username}?
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 24px' }}>
              They will not be able to send you messages or find your profile in Matching. They will not be notified that you blocked them.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Button
                variant="outline"
                onClick={() => setShowBlockConfirm(false)}
                disabled={isActionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBlockUser}
                disabled={isActionLoading}
                style={{ backgroundColor: 'var(--color-error)', borderColor: 'var(--color-error)', color: 'var(--color-on-accent)' }}
              >
                {isActionLoading ? 'Blocking...' : 'Block User'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Group Modals */}
      {showCreateGroup && (
        <CreateGroupModal
          currentUserId={currentUserId}
          onClose={() => setShowCreateGroup(false)}
          onCreated={handleGroupCreated}
        />
      )}
      {showMembers && activeConversation?.isGroup && (
        <GroupMembersModal
          conversation={activeConversation}
          currentUserId={currentUserId}
          onClose={() => setShowMembers(false)}
          onChanged={() => void loadData()}
          onLeft={() => {
            setShowMembers(false);
            setActiveId(null);
            void loadData();
          }}
        />
      )}

      {/* Global Error Banner */}
      {error && (
        <div
          style={{
            position: 'fixed',
            bottom: 'var(--space-4)',
            right: 'var(--space-4)',
            backgroundColor: 'var(--color-error)',
            color: 'var(--color-on-accent)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            cursor: 'pointer',
            zIndex: 9999,
          }}
          onClick={() => setError(null)}
        >
          {error} (Click to dismiss)
        </div>
      )}
    </div>
  );
}
