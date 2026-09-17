'use client';

import { StorageService } from '@/lib/storage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/search`
  : 'http://localhost:3001/api/search';

const TOKEN_KEY = 'ginivibe_auth_token';

const getToken = (): string | null => StorageService.getItem(TOKEN_KEY);

const authHeaders = () => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export interface UserSearchResultDto {
  id: string;
  username: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  profilePic: string | null;
  gender: string | null;
  zodiacSign: string | null;
  dob?: string | null;
  interests: string[];
  score?: number;
}

export interface AutocompleteResultDto {
  id: string;
  username: string;
  displayName: string;
  profilePic: string | null;
}

export interface SearchIntent {
  text?: string;
  interests?: string[];
  gender?: string;
  zodiacSign?: string;
  ageMin?: number;
  ageMax?: number;
  confidence?: number;
}

export interface UserSearchResponse {
  results: UserSearchResultDto[];
  nextCursor?: string;
  searchMode?: 'lexical' | 'semantic' | 'hybrid';
  degraded?: boolean;
  interpretedIntent?: SearchIntent;
}

export interface PostSearchResult {
  id: string;
  title: string | null;
  body: string | null;
  mediaUrls: string[];
  contentType: string;
  viewsCount: number;
  createdAt: string;
  user: { id: string; username: string; firstName: string | null; lastName: string | null };
  community: { id: string; name: string } | null;
  likesCount: number;
  commentsCount: number;
  score?: number;
}

export interface PostSearchResponse {
  results: PostSearchResult[];
  nextCursor?: string;
  searchMode: 'lexical';
}

export interface CommunitySearchResult {
  id: string;
  name: string;
  description: string | null;
  category: string;
  cityScope: string | null;
  memberCount: number;
  postCount: number;
  isMember: boolean;
  score?: number;
}

export interface CommunitySearchResponse {
  results: CommunitySearchResult[];
  searchMode: 'lexical';
}

export interface SearchParams {
  q?: string;
  nlq?: string;
  mode?: 'lexical' | 'semantic' | 'hybrid';
  gender?: string;
  zodiacSign?: string;
  ageMin?: number;
  ageMax?: number;
  interests?: string[];
  limit?: number;
  cursor?: string;
}

export const SearchApi = {
  /**
   * Searches users using lexical, semantic, hybrid, or natural language query understanding.
   */
  searchUsers: async (params: SearchParams): Promise<UserSearchResponse> => {
    const query = new URLSearchParams();

    if (params.q) query.append('q', params.q.trim());
    if (params.nlq) query.append('nlq', params.nlq.trim());
    if (params.mode) query.append('mode', params.mode);
    if (params.gender) query.append('gender', params.gender);
    if (params.zodiacSign) query.append('zodiacSign', params.zodiacSign);
    if (params.ageMin !== undefined) query.append('ageMin', params.ageMin.toString());
    if (params.ageMax !== undefined) query.append('ageMax', params.ageMax.toString());
    if (params.interests && params.interests.length > 0) {
      query.append('interests', params.interests.join(','));
    }
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.cursor) query.append('cursor', params.cursor);

    const response = await fetch(`${API_BASE_URL}/users?${query.toString()}`, {
      method: 'GET',
      headers: authHeaders(),
    });

    if (!response.ok) {
      let errorMessage = 'Search failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = `HTTP error ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },

  /**
   * Searches posts across titles, bodies, and community names.
   */
  searchPosts: async (query: string, limit = 20, cursor?: string): Promise<PostSearchResponse> => {
    const params = new URLSearchParams({ q: query.trim(), limit: limit.toString() });
    if (cursor) params.append('cursor', cursor);
    const response = await fetch(`${API_BASE_URL}/posts?${params.toString()}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    if (!response.ok) {
      let errorMessage = 'Post search failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = `HTTP error ${response.status}`;
      }
      throw new Error(errorMessage);
    }
    return response.json();
  },

  /**
   * Searches communities across names, descriptions, and categories.
   */
  searchCommunities: async (query: string, limit = 20): Promise<CommunitySearchResponse> => {
    const params = new URLSearchParams({ q: query.trim(), limit: limit.toString() });
    const response = await fetch(`${API_BASE_URL}/communities?${params.toString()}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    if (!response.ok) {
      let errorMessage = 'Community search failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = `HTTP error ${response.status}`;
      }
      throw new Error(errorMessage);
    }
    return response.json();
  },

  /**
   * Fetches lightweight autocomplete suggestions as the user types.
   */
  autocompleteUsers: async (query: string, limit = 8): Promise<AutocompleteResultDto[]> => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    const url = `${API_BASE_URL}/autocomplete?q=${encodeURIComponent(trimmed)}&limit=${limit}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: authHeaders(),
      });

      if (!response.ok) {
        return [];
      }

      return response.json();
    } catch (err) {
      console.error('[SearchApi] Autocomplete error:', err);
      return [];
    }
  },
};
