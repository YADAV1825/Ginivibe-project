import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  Platform.select({
    android: 'http://10.0.2.2:3001',
    default: 'http://localhost:3001',
  });

const BASE_URL = `${API_URL}/api/feed`;

// Helper to retrieve token safely across Mobile & Web
export const getAuthToken = async (): Promise<string | null> => {
  try {
    const token = 
      (await AsyncStorage.getItem('ginivibe_auth_token')) ||
      (await AsyncStorage.getItem('token')) ||
      (await AsyncStorage.getItem('authToken')) ||
      (await AsyncStorage.getItem('jwt')) ||
      (await AsyncStorage.getItem('accessToken'));

    return token ? token.trim() : null;
  } catch (err) {
    console.error('[feedApi] Failed to retrieve auth token from AsyncStorage:', err);
    return null;
  }
};

export interface Post {
  id: string;
  userId: string;
  title?: string | null;
  body: string;
  mediaUrls: string[];
  contentType: 'text' | 'image' | 'video';
  viewsCount?: number;
  createdAt: string;
  hasLiked: boolean;
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

export const feedApi = {
  getFeed: async (page = 1, limit = 10): Promise<{ data: Post[] }> => {
    const token = await getAuthToken();
    const response = await fetch(`${BASE_URL}?page=${page}&limit=${limit}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch feed');
    return response.json();
  },

  trackView: async (postId: string): Promise<{ viewsCount: number }> => {
    const token = await getAuthToken();
    const response = await fetch(`${BASE_URL}/posts/${postId}/view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
    if (!response.ok) return { viewsCount: 0 };
    return response.json();
  },

  uploadMedia: async (
    fileUri: string,
    mimeType?: string,
    fileName?: string
  ): Promise<{ url: string }> => {
    const token = await getAuthToken();
    const formData = new FormData();

    const name = fileName || fileUri.split('/').pop() || 'upload.jpg';
    const type = mimeType || (name.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg');

    if (Platform.OS === 'web') {
      const res = await fetch(fileUri);
      const blob = await res.blob();
      const file = new File([blob], name, { type: blob.type || type });
      formData.append('file', file);
    } else {
      formData.append('file', {
        uri: fileUri,
        name,
        type,
      } as any);
    }

    const response = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || err.message || 'Failed to upload media');
    }
    return response.json();
  },

  createPost: async (postData: {
    contentType: 'text' | 'media' | 'image' | 'video';
    title?: string;
    body?: string;
    mediaUrls?: string[];
    communityId?: string;
  }): Promise<Post> => {
    const token = await getAuthToken();

    const response = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || err.message || 'Failed to create post');
    }
    return response.json();
  },

  toggleLike: async (postId: string): Promise<{ liked: boolean; likesCount?: number }> => {
    const token = await getAuthToken();
    const response = await fetch(`${BASE_URL}/posts/${postId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({}),
    });
    if (!response.ok) throw new Error('Failed to toggle like');
    return response.json();
  },

  getComments: async (postId: string) => {
    const token = await getAuthToken();
    const response = await fetch(`${BASE_URL}/posts/${postId}/comments`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Failed with status ${response.status}`);
    }
    return response.json();
  },

  addComment: async (postId: string, text: string) => {
    const token = await getAuthToken();
    const response = await fetch(`${BASE_URL}/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Failed with status ${response.status}`);
    }
    return response.json();
  },

  updateComment: async (commentId: string, text: string) => {
    const token = await getAuthToken();
    const response = await fetch(`${BASE_URL}/comments/${commentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Failed to update comment');
    }
    return response.json();
  },

 deleteComment: async (commentId: string) => {
  const token = await getAuthToken();
  const url = `${BASE_URL}/comments/${commentId}`;

  console.log('[DEBUG DELETE] Request URL:', url);
  console.log('[DEBUG DELETE] Has Token?:', Boolean(token));

  if (!token) {
    throw new Error('You must be logged in to delete comments (no token found in storage).');
  }

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  console.log('[DEBUG DELETE] Response Status:', response.status);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[DEBUG DELETE] Error payload:', errorData);
    throw new Error(
      errorData.error || errorData.message || `Delete failed with HTTP ${response.status}`
    );
  }

  return response.json();
},
};