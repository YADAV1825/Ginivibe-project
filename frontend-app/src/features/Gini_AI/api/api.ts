import { Platform } from 'react-native';

export const getGiniAiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_GINI_AI_URL) {
    return process.env.EXPO_PUBLIC_GINI_AI_URL.replace(/\/$/, '');
  }
  return Platform.select({
    android: 'http://10.0.2.2:3004',
    default: 'http://localhost:3004',
  }) as string;
};

const getApiUrl = () => `${getGiniAiBaseUrl()}/api/gini_ai`;

export const GiniAiApi = {
  getAvatars: async () => {
    try {
      const res = await fetch(`${getApiUrl()}/avatars`);
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json) ? json : (json?.data || []);
    } catch (e) {
      console.warn('[GiniAiApi] Failed to fetch avatars:', e);
      return [];
    }
  },
  getCharacters: async () => {
    try {
      const res = await fetch(`${getApiUrl()}/characters`);
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json) ? json : (json?.data || []);
    } catch (e) {
      console.warn('[GiniAiApi] Failed to fetch characters:', e);
      return [];
    }
  },
  createCharacter: async (data: any) => {
    const res = await fetch(`${getApiUrl()}/characters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to create character: ${text}`);
    }
    return res.json();
  },
  sendMessage: async (characterId: string, message: string, sessionId?: string) => {
    const res = await fetch(`${getApiUrl()}/chat/${characterId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId }),
    });
    if (!res.ok) throw new Error('Chat failed');
    return res.json();
  },
  deleteCharacter: async (id: string) => {
    const res = await fetch(`${getApiUrl()}/characters/${id}`, { method: 'DELETE' });
    if (!res.ok) return { success: false };
    return res.json();
  },
  getLatestSession: async (characterId: string) => {
    try {
      const res = await fetch(`${getApiUrl()}/chat/${characterId}/latest`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },
};
