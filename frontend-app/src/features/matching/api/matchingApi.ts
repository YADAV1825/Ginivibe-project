import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MatchResponse,
  FollowRequestPayload,
  FollowResponse,
  CallRequest,
  LiveCandidate,
} from '../types';

export const getNonLiveBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_NON_LIVE_API_URL) {
    return process.env.EXPO_PUBLIC_NON_LIVE_API_URL.replace(/\/$/, '');
  }
  return Platform.select({
    android: 'http://10.0.2.2:3003',
    default: 'http://localhost:3003',
  }) as string;
};

export const getMonolithicBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }
  return Platform.select({
    android: 'http://10.0.2.2:3001',
    default: 'http://localhost:3001',
  }) as string;
};

export const getSignalingUrl = (): string => {
  if (process.env.EXPO_PUBLIC_SIGNALING_URL) {
    return process.env.EXPO_PUBLIC_SIGNALING_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    return `${protocol}//${host}:8080`;
  }
  return Platform.select({
    android: 'ws://10.0.2.2:8080',
    default: 'ws://localhost:8080',
  }) as string;
};

function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export class MatchingApiClient {
  private async getAuthInfo(): Promise<{ token: string | null; userId: string | null }> {
    try {
      const token = await AsyncStorage.getItem('ginivibe_auth_token');
      let userId = await AsyncStorage.getItem('ginivibe_user_id');

      if (!userId && token) {
        const decoded = parseJwt(token);
        if (decoded?.id) {
          userId = decoded.id;
        }
      }

      return { token, userId };
    } catch {
      return { token: null, userId: null };
    }
  }

  private async getHeaders(customBaseUrl?: string): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const { token, userId } = await this.getAuthInfo();

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (userId) {
      headers['x-user-id'] = userId;
    } else if (!token) {
      // Dev fallback: query test-user from backend if available
      try {
        const baseUrl = customBaseUrl || getNonLiveBaseUrl();
        const testUserRes = await fetch(`${baseUrl}/api/matching/test-user`);
        if (testUserRes.ok) {
          const testUserData = await testUserRes.json();
          if (testUserData?.id) {
            headers['x-user-id'] = testUserData.id;
          }
        }
      } catch {
        // Silently ignore if offline
      }
    }

    return headers;
  }

  // ─────────────────────────────────────────────────────────────
  // Non-Live Matching APIs (port 3003)
  // ─────────────────────────────────────────────────────────────

  async getNextMatch(): Promise<MatchResponse | null> {
    const baseUrl = getNonLiveBaseUrl();
    const headers = await this.getHeaders(baseUrl);

    const res = await fetch(`${baseUrl}/api/matching/next`, {
      method: 'GET',
      headers,
    });

    if (res.status === 404) {
      return null; // No more eligible candidates available
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || err.message || 'Failed to fetch next match candidate');
    }

    return res.json();
  }

  async sendFollowRequest(payload: FollowRequestPayload): Promise<FollowResponse> {
    const baseUrl = getNonLiveBaseUrl();
    const headers = await this.getHeaders(baseUrl);

    const res = await fetch(`${baseUrl}/api/follow/request`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.message || 'Failed to send follow request');
    }

    return data;
  }

  async getTestUser(): Promise<{ id: string }> {
    const baseUrl = getNonLiveBaseUrl();
    const res = await fetch(`${baseUrl}/api/matching/test-user`);
    if (!res.ok) throw new Error('Failed to retrieve test user');
    return res.json();
  }

  // ─────────────────────────────────────────────────────────────
  // Live Matching & Monolithic Call APIs (port 3001)
  // ─────────────────────────────────────────────────────────────

  async getOnlineCandidates(): Promise<LiveCandidate[]> {
    const baseUrl = getMonolithicBaseUrl();
    const headers = await this.getHeaders(baseUrl);

    const res = await fetch(`${baseUrl}/api/calls/online-candidates`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      // Try fallback presence endpoint
      try {
        const presenceRes = await fetch(`${baseUrl}/api/presence/available`, {
          method: 'GET',
          headers,
        });
        if (presenceRes.ok) {
          const users = await presenceRes.json();
          return users.map((u: any) => ({
            id: u.id,
            name: u.firstName || u.username || 'Peer',
            username: u.username,
            avatarUrl: u.profilePic || `https://i.pravatar.cc/150?u=${u.id}`,
            age: 25,
            bio: 'Available for video chat',
            tags: ['Live', 'Video'],
          }));
        }
      } catch {}
      throw new Error('Failed to fetch online candidates');
    }

    const data = await res.json();
    return data.candidates || [];
  }

  async requestCall(receiverId: string): Promise<CallRequest> {
    const baseUrl = getMonolithicBaseUrl();
    const headers = await this.getHeaders(baseUrl);

    const res = await fetch(`${baseUrl}/api/calls/request`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ receiverId }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.message || 'Failed to initiate video call request');
    }

    return data;
  }

  async acceptCall(requestId: string): Promise<{ success: boolean; callSessionId: string; roomCode: string }> {
    const baseUrl = getMonolithicBaseUrl();
    const headers = await this.getHeaders(baseUrl);

    const res = await fetch(`${baseUrl}/api/calls/${requestId}/accept`, {
      method: 'POST',
      headers,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.message || 'Failed to accept call request');
    }

    return data;
  }

  async rejectCall(requestId: string): Promise<{ success: boolean }> {
    const baseUrl = getMonolithicBaseUrl();
    const headers = await this.getHeaders(baseUrl);

    const res = await fetch(`${baseUrl}/api/calls/${requestId}/reject`, {
      method: 'POST',
      headers,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.message || 'Failed to reject call request');
    }

    return data;
  }

  async cancelCall(requestId: string): Promise<{ success: boolean }> {
    const baseUrl = getMonolithicBaseUrl();
    const headers = await this.getHeaders(baseUrl);

    const res = await fetch(`${baseUrl}/api/calls/${requestId}/cancel`, {
      method: 'POST',
      headers,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.message || 'Failed to cancel call request');
    }

    return data;
  }
}

export const matchingApi = new MatchingApiClient();
