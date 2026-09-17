import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Room,
  RoomFilter,
  RoomType,
  CreateRoomInput,
  JoinRoomResponse,
} from '../types';

export const ROOMS_API_URL =
  process.env.EXPO_PUBLIC_ROOMS_API_URL ??
  Platform.select({
    android: 'http://10.0.2.2:3007/api/rooms',
    default: 'http://localhost:3007/api/rooms',
  });

export const ROOMS_SOCKET_URL =
  process.env.EXPO_PUBLIC_ROOMS_SOCKET_URL ??
  Platform.select({
    android: 'http://10.0.2.2:3007',
    default: 'http://localhost:3007',
  });

const TOKEN_KEY = 'ginivibe_auth_token';

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const RoomsAPI = {
  async list(filter: RoomFilter = 'all', type?: RoomType): Promise<Room[]> {
    const params = new URLSearchParams();
    if (filter) params.set('filter', filter);
    if (type) params.set('type', type);

    const query = params.toString();
    const url = `${ROOMS_API_URL}${query ? `?${query}` : ''}`;
    const headers = await getAuthHeaders();

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });

    const data = (await response.json()) as { rooms?: Room[]; error?: string };
    if (!response.ok || !data.rooms) {
      throw new Error(data.error || 'Failed to load rooms');
    }
    return data.rooms;
  },

  async get(id: string): Promise<Room> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${ROOMS_API_URL}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });

    const data = (await response.json()) as { room?: Room; error?: string };
    if (!response.ok || !data.room) {
      throw new Error(data.error || 'Room not found');
    }
    return data.room;
  },

  async create(input: CreateRoomInput): Promise<Room> {
    const headers = await getAuthHeaders();
    const response = await fetch(ROOMS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(input),
    });

    const data = (await response.json()) as { room?: Room; error?: string };
    if (!response.ok || !data.room) {
      throw new Error(data.error || 'Failed to create room');
    }
    return data.room;
  },

  async join(id: string, accessCode?: string): Promise<JoinRoomResponse> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${ROOMS_API_URL}/${id}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ accessCode }),
    });

    const data = (await response.json()) as JoinRoomResponse & { error?: string };
    if (!response.ok || !data.token) {
      throw new Error(data.error || 'Failed to join room');
    }
    return data;
  },

  async leave(id: string): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${ROOMS_API_URL}/${id}/leave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error || 'Failed to leave room');
    }
  },

  async delete(id: string): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${ROOMS_API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error || 'Failed to delete room');
    }
  },
};
