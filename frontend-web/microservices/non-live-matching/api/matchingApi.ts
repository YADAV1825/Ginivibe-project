import { MatchResponse, FollowRequestPayload, FollowResponse } from '../types';

const NON_LIVE_API_URL =
  process.env.NEXT_PUBLIC_NON_LIVE_API_URL || 'http://localhost:3003';

const TOKEN_KEY = 'ginivibe_auth_token';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
}

export class MatchingApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = NON_LIVE_API_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async getHeaders(): Promise<HeadersInit> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // In local dev, try to fetch test user ID as fallback for seamless testing
      try {
        const testUserRes = await fetch(`${this.baseUrl}/api/matching/test-user`);
        if (testUserRes.ok) {
          const testUserData = await testUserRes.json();
          if (testUserData?.id) {
            headers['x-user-id'] = testUserData.id;
          }
        }
      } catch {
        // Ignore if test user endpoint is unreachable
      }
    }

    return headers;
  }

  async checkHealth(): Promise<{ status: string; service: string }> {
    const res = await fetch(`${this.baseUrl}/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return res.json();
  }

  async getNextMatch(): Promise<MatchResponse | null> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}/api/matching/next`, {
      method: 'GET',
      headers,
    });

    if (res.status === 404) {
      return null; // No more eligible candidates available
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || err.message || 'Failed to fetch next match');
    }

    return res.json();
  }

  async sendFollowRequest(payload: FollowRequestPayload): Promise<FollowResponse> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}/api/follow/request`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || err.message || 'Failed to send follow request');
    }

    return res.json();
  }

  async getTestUser(): Promise<{ id: string }> {
    const res = await fetch(`${this.baseUrl}/api/matching/test-user`);
    if (!res.ok) throw new Error('Failed to retrieve test user');
    return res.json();
  }
}

export const matchingApi = new MatchingApiClient();
