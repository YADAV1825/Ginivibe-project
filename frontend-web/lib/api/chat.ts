'use client';

import { StorageService } from '@/lib/storage';
import { handleSessionError } from '@/lib/auth-session';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/chat`
  : 'http://localhost:3001/api/chat';

const TOKEN_KEY = 'ginivibe_auth_token';

const getToken = (): string | null => StorageService.getItem(TOKEN_KEY);

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken() ?? ''}`,
});

export interface ChatUser {
  id: string;
  username: string;
  firstName: string | null;
  lastName?: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  mediaUrl?: string | null;
  createdAt: string;
  deliveredAt: string | null;
  readAt: string | null;
  sender: ChatUser;
}

export interface ConversationMember {
  userId: string;
  conversationId: string;
  role?: string;
  joinedAt?: string;
  user: ChatUser;
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  title: string | null;
  updatedAt: string;
  createdAt: string;
  members: ConversationMember[];
  messages: Message[];
  unreadCount?: number;
  isMuted?: boolean;
}

export interface MessageRequestSender {
  id: string;
  username: string;
  firstName: string | null;
  lastName?: string | null;
  profilePic?: string | null;
  bio?: string | null;
  zodiacSign?: string | null;
}

export interface MessageRequest {
  id: string;
  message: string | null;
  createdAt: string;
  sender: MessageRequestSender;
}

export interface MessageRequestsResponse {
  requests: MessageRequest[];
  count: number;
}

export interface PublicProfile {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  profilePic: string | null;
  interests: string[];
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  followStatus: string | null;
  isSelf: boolean;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = 'Request failed';
    try {
      const err = await res.json();
      message = err.error || message;
    } catch {
      // ignore parse errors
    }
    handleSessionError(res.status, message);
    throw new Error(message);
  }
  return res.json();
}

export const chatApi = {
  searchUsers: async (query: string): Promise<ChatUser[]> => {
    if (!query.trim()) return [];
    const res = await fetch(`${API_BASE_URL}/users/search?query=${encodeURIComponent(query)}`, {
      headers: authHeaders(),
      cache: 'no-store',
    });
    return handle<ChatUser[]>(res);
  },

  getOrCreateDirectConversation: async (otherUserId: string): Promise<Conversation> => {
    const res = await fetch(`${API_BASE_URL}/conversations/direct`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ otherUserId }),
    });
    return handle<Conversation>(res);
  },

  getConversations: async (): Promise<Conversation[]> => {
    const res = await fetch(`${API_BASE_URL}/conversations`, {
      headers: authHeaders(),
      cache: 'no-store',
    });
    return handle<Conversation[]>(res);
  },

  createGroup: async (title: string, memberIds: string[]): Promise<Conversation> => {
    const res = await fetch(`${API_BASE_URL}/conversations/group`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ title, memberIds }),
    });
    return handle<Conversation>(res);
  },

  renameGroup: async (conversationId: string, title: string): Promise<Conversation> => {
    const res = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ title }),
    });
    return handle<Conversation>(res);
  },

  addGroupMembers: async (conversationId: string, userIds: string[]): Promise<{ members: ConversationMember[] }> => {
    const res = await fetch(`${API_BASE_URL}/conversations/${conversationId}/members`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ userIds }),
    });
    return handle<{ members: ConversationMember[] }>(res);
  },

  removeGroupMember: async (conversationId: string, userId: string): Promise<{ success: boolean; deleted: boolean }> => {
    const res = await fetch(`${API_BASE_URL}/conversations/${conversationId}/members/${userId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return handle<{ success: boolean; deleted: boolean }>(res);
  },

  getMessages: async (conversationId: string): Promise<Message[]> => {
    const res = await fetch(`${API_BASE_URL}/messages/${conversationId}`, {
      headers: authHeaders(),
      cache: 'no-store',
    });
    return handle<Message[]>(res);
  },

  markConversationRead: async (conversationId: string): Promise<{ ok: boolean }> => {
    const res = await fetch(`${API_BASE_URL}/conversations/${conversationId}/read`, {
      method: 'PATCH',
      headers: authHeaders(),
    });
    return handle<{ ok: boolean }>(res);
  },

  sendMessage: async (payload: { conversationId: string; text: string; mediaUrl?: string }): Promise<Message> => {
    const res = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    return handle<Message>(res);
  },

  suggestReply: async (conversationId: string): Promise<{ suggestion: string }> => {
    const res = await fetch(`${API_BASE_URL}/conversations/${conversationId}/suggest-reply`, {
      method: 'POST',
      headers: authHeaders(),
    });
    return handle<{ suggestion: string }>(res);
  },

  getFollowers: async (userId: string): Promise<{ data: ChatUser[]; count: number }> => {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/followers`, {
      headers: authHeaders(),
      cache: 'no-store',
    });
    return handle<{ data: ChatUser[]; count: number }>(res);
  },

  getFollowing: async (userId: string): Promise<{ data: ChatUser[]; count: number }> => {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/following`, {
      headers: authHeaders(),
      cache: 'no-store',
    });
    return handle<{ data: ChatUser[]; count: number }>(res);
  },

  getMessageRequests: async (limit: number = 20, offset: number = 0): Promise<MessageRequestsResponse> => {
    const res = await fetch(`${API_BASE_URL}/requests?limit=${limit}&offset=${offset}`, {
      headers: authHeaders(),
      cache: 'no-store',
    });
    return handle<MessageRequestsResponse>(res);
  },

  acceptMessageRequest: async (requestId: string): Promise<Conversation> => {
    const res = await fetch(`${API_BASE_URL}/requests/${requestId}/accept`, {
      method: 'POST',
      headers: authHeaders(),
    });
    return handle<Conversation>(res);
  },

  rejectMessageRequest: async (requestId: string): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_BASE_URL}/requests/${requestId}/reject`, {
      method: 'POST',
      headers: authHeaders(),
    });
    return handle<{ success: boolean }>(res);
  },

  getOnlineUsers: async (): Promise<string[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/presence`, {
        headers: authHeaders(),
        cache: 'no-store',
      });
      const data = await handle<{ onlineUserIds: string[] }>(res);
      return data.onlineUserIds || [];
    } catch {
      return [];
    }
  },

  deleteConversation: async (conversationId: string): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return handle<{ success: boolean }>(res);
  },

  toggleMuteConversation: async (conversationId: string, muted?: boolean): Promise<{ success: boolean; isMuted: boolean }> => {
    const res = await fetch(`${API_BASE_URL}/conversations/${conversationId}/mute`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(typeof muted === 'boolean' ? { muted } : {}),
    });
    return handle<{ success: boolean; isMuted: boolean }>(res);
  },

  blockUser: async (targetUserId: string): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_BASE_URL}/users/${targetUserId}/block`, {
      method: 'POST',
      headers: authHeaders(),
    });
    return handle<{ success: boolean }>(res);
  },

  getProfile: async (userId: string): Promise<PublicProfile> => {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/profile`, {
      headers: authHeaders(),
      cache: 'no-store',
    });
    return handle<PublicProfile>(res);
  },

  followUser: async (userId: string): Promise<{ success: boolean; isFollowing: boolean }> => {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/follow`, {
      method: 'POST',
      headers: authHeaders(),
    });
    return handle<{ success: boolean; isFollowing: boolean }>(res);
  },

  unfollowUser: async (userId: string): Promise<{ success: boolean; isFollowing: boolean }> => {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/follow`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return handle<{ success: boolean; isFollowing: boolean }>(res);
  },
};
