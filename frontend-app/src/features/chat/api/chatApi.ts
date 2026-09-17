import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = Platform.select({
  android: 'http://10.0.2.2:3001/api/chat',
  default: 'http://localhost:3001/api/chat',
});

export interface ChatUser {
  id: string;
  username: string;
  firstName: string | null;
  lastName?: string | null;
  profilePic?: string | null;
  bio?: string | null;
  zodiacSign?: string | null;
}

export interface ConversationItem {
  id: string;
  isGroup: boolean;
  title?: string | null;
  updatedAt: string;
  unreadCount?: number;
  isMuted?: boolean;
  members: {
    userId?: string;
    user: {
      id: string;
      username: string;
      firstName: string | null;
      lastName?: string | null;
      profilePic?: string | null;
    };
  }[];
  messages: {
    id?: string;
    text: string;
    createdAt: string;
    senderId?: string;
  }[];
}

export interface MessageRequestItem {
  id: string;
  message?: string | null;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    firstName: string | null;
    lastName?: string | null;
    profilePic?: string | null;
    bio?: string | null;
    zodiacSign?: string | null;
  };
}

export const chatApi = {
  getConversations: async (): Promise<ConversationItem[]> => {
    const token = await AsyncStorage.getItem('ginivibe_auth_token');
    if (!token) return [];
    const res = await fetch(`${BASE_URL}/conversations`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  getMessageRequests: async (): Promise<{ requests: MessageRequestItem[]; count: number }> => {
    const token = await AsyncStorage.getItem('ginivibe_auth_token');
    if (!token) return { requests: [], count: 0 };
    const res = await fetch(`${BASE_URL}/requests`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return {
      requests: Array.isArray(data?.requests) ? data.requests : [],
      count: typeof data?.count === 'number' ? data.count : (data?.requests?.length || 0),
    };
  },

  acceptMessageRequest: async (requestId: string): Promise<ConversationItem> => {
    const token = await AsyncStorage.getItem('ginivibe_auth_token');
    const res = await fetch(`${BASE_URL}/requests/${requestId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to accept message request');
    }
    return res.json();
  },

  rejectMessageRequest: async (requestId: string): Promise<{ success: boolean }> => {
    const token = await AsyncStorage.getItem('ginivibe_auth_token');
    const res = await fetch(`${BASE_URL}/requests/${requestId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to reject message request');
    }
    return res.json();
  },

  searchUsers: async (query: string, currentUserId?: string): Promise<ChatUser[]> => {
    if (!query.trim()) return [];
    const token = await AsyncStorage.getItem('ginivibe_auth_token');
    const url = `${BASE_URL}/users/search?query=${encodeURIComponent(query.trim())}${
      currentUserId ? `&currentUserId=${currentUserId}` : ''
    }`;
    const res = await fetch(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        Accept: 'application/json',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  getOrCreateDirectChat: async (otherUserId: string): Promise<ConversationItem> => {
    const token = await AsyncStorage.getItem('ginivibe_auth_token');
    const res = await fetch(`${BASE_URL}/conversations/direct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ otherUserId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create/get direct conversation');
    }
    return res.json();
  },

  getMessages: async (conversationId: string) => {
    const token = await AsyncStorage.getItem('ginivibe_auth_token');
    const res = await fetch(`${BASE_URL}/messages/${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch messages');
    return res.json();
  },

  sendMessage: async (conversationId: string, text: string) => {
    const token = await AsyncStorage.getItem('ginivibe_auth_token');
    const res = await fetch(`${BASE_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ conversationId, text }),
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  },

  markRead: async (conversationId: string) => {
    const token = await AsyncStorage.getItem('ginivibe_auth_token');
    await fetch(`${BASE_URL}/conversations/${conversationId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getOnlineUsers: async (): Promise<string[]> => {
    try {
      const token = await AsyncStorage.getItem('ginivibe_auth_token');
      const res = await fetch(`${BASE_URL}/presence`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.onlineUserIds || [];
    } catch {
      return [];
    }
  },

  deleteConversation: async (conversationId: string): Promise<{ success: boolean }> => {
    const token = await AsyncStorage.getItem('ginivibe_auth_token');
    const res = await fetch(`${BASE_URL}/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to delete conversation');
    return res.json();
  },

  toggleMuteConversation: async (conversationId: string, muted?: boolean): Promise<{ success: boolean; isMuted: boolean }> => {
    const token = await AsyncStorage.getItem('ginivibe_auth_token');
    const res = await fetch(`${BASE_URL}/conversations/${conversationId}/mute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(typeof muted === 'boolean' ? { muted } : {}),
    });
    if (!res.ok) throw new Error('Failed to toggle mute');
    return res.json();
  },

  blockUser: async (targetUserId: string): Promise<{ success: boolean }> => {
    const token = await AsyncStorage.getItem('ginivibe_auth_token');
    const res = await fetch(`${BASE_URL}/users/${targetUserId}/block`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to block user');
    return res.json();
  },
};