import { StorageService } from '@/lib/storage';
import { handleSessionError } from '@/lib/auth-session';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/feed';

const TOKEN_KEY = 'ginivibe_auth_token';

const getToken = (explicitToken?: string | null): string | null => {
  if (explicitToken) return explicitToken;
  if (typeof window === 'undefined') return null;
  return (
    StorageService.getItem(TOKEN_KEY) ??
    localStorage.getItem(TOKEN_KEY) ??
    localStorage.getItem('token') ??
    sessionStorage.getItem('token')
  );
};

const authHeaders = (explicitToken?: string | null): Record<string, string> => {
  const token = getToken(explicitToken);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export interface Post {
  id: string;
  userId: string;
  title?: string | null;
  body: string;
  mediaUrls: string[];
  contentType: 'text' | 'image' | 'video';
  viewsCount: number;
  createdAt: string;
  hasLiked?: boolean;
  user: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
  };
  community?: {
    id: string;
    name: string;
  } | null;
  _count: {
    likes: number;
    comments: number;
  };
}

export interface Community {
  id: string;
  name: string;
  description: string | null;
  category: string;
  categories?: string[];
  cityScope: string | null;
  ownerId: string;
  createdAt: string;
  owner?: { id: string; username: string; firstName: string | null; lastName: string | null };
  memberCount?: number;
  postCount?: number;
  isMember?: boolean;
  isOwner?: boolean;
  members?: Array<{
    userId: string;
    user: { id: string; username: string; firstName: string | null; lastName: string | null };
  }>;
}

export const feedApi = {
  getFeed: async (page = 1, limit = 10): Promise<{ data: Post[] }> => {
    const token = getToken();

    const res = await fetch(
      `${API_BASE_URL}?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: 'no-store',
      }
    );

    const responseText = await res.text();

    if (!res.ok) {
      throw new Error(
        `Failed to fetch feed: ${res.status} - ${responseText}`
      );
    }

    try {
      return JSON.parse(responseText);
    } catch {
      throw new Error('Feed API returned invalid JSON');
    }
  },

  getPost: async (id: string): Promise<Post> => {
    const res = await fetch(`${API_BASE_URL}/posts/${id}`, {
      headers: authHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch post');
    }
    return res.json();
  },

  uploadMedia: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = getToken();

    const res = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to upload media');
    }

    return res.json();
  },

  getCommunities: async (): Promise<Community[]> => {
    const res = await fetch(`${API_BASE_URL}/communities`, {
      method: 'GET',
      headers: authHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch communities: ${res.status}`);
    }
    return res.json();
  },

  createCommunity: async (payload: { name: string; description?: string; category: string; categories?: string[]; cityScope?: string }): Promise<Community> => {
    const res = await fetch(`${API_BASE_URL}/communities`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      handleSessionError(res.status, err.error);
      throw new Error(err.error || 'Failed to create community');
    }
    return res.json();
  },

  getCommunity: async (id: string): Promise<Community> => {
    const res = await fetch(`${API_BASE_URL}/communities/${id}`, {
      headers: authHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch community');
    }
    return res.json();
  },

  updateCommunity: async (id: string, payload: { name?: string; description?: string | null; category?: string; categories?: string[]; cityScope?: string | null }): Promise<Community> => {
    const res = await fetch(`${API_BASE_URL}/communities/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      handleSessionError(res.status, err.error);
      throw new Error(err.error || 'Failed to update community');
    }
    return res.json();
  },

  deleteCommunity: async (id: string): Promise<{ success: boolean; id: string }> => {
    const res = await fetch(`${API_BASE_URL}/communities/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      handleSessionError(res.status, err.error);
      throw new Error(err.error || 'Failed to delete community');
    }
    return res.json();
  },

  joinCommunity: async (id: string): Promise<{ success: boolean; alreadyMember: boolean; memberCount?: number }> => {
    const res = await fetch(`${API_BASE_URL}/communities/${id}/join`, {
      method: 'POST',
      headers: authHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      handleSessionError(res.status, err.error);
      throw new Error(err.error || 'Failed to join community');
    }
    return res.json();
  },

  leaveCommunity: async (id: string): Promise<{ success: boolean; memberCount?: number }> => {
    const res = await fetch(`${API_BASE_URL}/communities/${id}/leave`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      handleSessionError(res.status, err.error);
      throw new Error(err.error || 'Failed to leave community');
    }
    return res.json();
  },

  getCommunityPosts: async (id: string, page = 1, limit = 10): Promise<{ data: Post[]; page: number; limit: number }> => {
    const res = await fetch(`${API_BASE_URL}/communities/${id}/posts?page=${page}&limit=${limit}`, {
      headers: authHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch community posts');
    }
    return res.json();
  },

  createPost: async (payload: {
    title?: string;
    body?: string;
    mediaUrls?: string[];
    contentType: 'text' | 'media' | 'image' | 'video';
    communityId?: string | null;
  }): Promise<Post> => {
    const res = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      handleSessionError(res.status, err.error);
      throw new Error(err.error || 'Failed to create post');
    }

    return res.json();
  },

  trackView: async (postId: string): Promise<{ success: boolean; viewsCount: number; alreadyViewed?: boolean }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/view`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed with status ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('Failed to register post view:', error);
      return { success: false, viewsCount: 0 };
    }
  },

  toggleLike: async (postId: string): Promise<{ liked: boolean; likesCount?: number }> => {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
      method: 'POST',
      headers: authHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      handleSessionError(response.status, err.error);
      throw new Error(err.error || 'Failed to toggle like');
    }
    return response.json();
  },

  getLikers: async (postId: string): Promise<Array<{ id: string; username: string; firstName: string | null; lastName: string | null }>> => {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/likes`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed with status ${response.status}`);
    }
    const payload = await response.json();
    return Array.isArray(payload) ? payload : (payload.data ?? []);
  },

  getComments: async (postId: string): Promise<PostComment[]> => {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      handleSessionError(response.status, errorData.error || errorData.message);
      throw new Error(errorData.error || errorData.message || `Failed with status ${response.status}`);
    }
    return response.json();
  },

  addComment: async (postId: string, text: string): Promise<PostComment> => {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      handleSessionError(response.status, errorData.error || errorData.message);
      throw new Error(errorData.error || errorData.message || `Failed with status ${response.status}`);
    }
    return response.json();
  },

  updateComment: async (commentId: string, text: string, explicitToken?: string | null) => {
    const res = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'PATCH',
      headers: authHeaders(explicitToken),
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      handleSessionError(res.status, err.error);
      throw new Error(err.error || 'Failed to update comment');
    }
    return res.json();
  },

  deleteComment: async (commentId: string, explicitToken?: string | null) => {
    const res = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'DELETE',
      headers: authHeaders(explicitToken),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      handleSessionError(res.status, err.error);
      throw new Error(err.error || 'Failed to delete comment');
    }
    return res.json();
  },
};