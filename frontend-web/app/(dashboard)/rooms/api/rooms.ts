'use client';

import { StorageService } from '@/lib/storage';

export const ROOMS_API_URL = process.env.NEXT_PUBLIC_ROOMS_API_URL ?? 'http://localhost:3007/api/rooms';
export const ROOMS_SOCKET_URL = process.env.NEXT_PUBLIC_ROOMS_SOCKET_URL ?? 'http://localhost:3007';
const TOKEN_KEY = 'ginivibe_auth_token';

export type RoomType = 'TEXT' | 'VOICE' | 'VIDEO';
export type RoomVisibility = 'OPEN' | 'PRIVATE';

export interface Room {
  id: string;
  name: string;
  creatorId: string;
  type: RoomType;
  visibility: RoomVisibility;
  maxCapacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  currentParticipantsCount: number;
}

export interface JoinRoomResponse {
  room: Room;
  token: string;
  tokenType: 'livekit' | 'socket';
  livekitUrl?: string;
}

export interface RoomMessage {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
}

export interface CreateRoomInput {
  name: string;
  type: RoomType;
  visibility: RoomVisibility;
  accessCode?: string;
  maxCapacity?: number;
}

export type RoomFilter = 'all' | 'public' | 'private' | 'joined' | 'mine';

const getAuthHeaders = (): HeadersInit => {
  const token = StorageService.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const RoomsApi = {
  async list(filter: RoomFilter = 'all', type?: RoomType): Promise<Room[]> {
    const params = new URLSearchParams();
    if (filter) params.set('filter', filter);
    if (type) params.set('type', type);

    const url = `${ROOMS_API_URL}${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    const data = await response.json() as { rooms?: Room[]; error?: string };
    if (!response.ok || !data.rooms) {
      throw new Error(data.error || 'Failed to load rooms');
    }
    return data.rooms;
  },

  async get(id: string): Promise<Room> {
    const response = await fetch(`${ROOMS_API_URL}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    const data = await response.json() as { room?: Room; error?: string };
    if (!response.ok || !data.room) {
      throw new Error(data.error || 'Room not found');
    }
    return data.room;
  },

  async create(input: CreateRoomInput): Promise<Room> {
    const response = await fetch(ROOMS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(input),
    });

    const data = await response.json() as { room?: Room; error?: string };
    if (!response.ok || !data.room) {
      throw new Error(data.error || 'Failed to create room');
    }
    return data.room;
  },

  async join(id: string, accessCode?: string): Promise<JoinRoomResponse> {
    const response = await fetch(`${ROOMS_API_URL}/${id}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ accessCode }),
    });

    const data = await response.json() as JoinRoomResponse & { error?: string };
    if (!response.ok || !data.token) {
      throw new Error(data.error || 'Failed to join room');
    }
    return data;
  },

  async leave(id: string): Promise<void> {
    const response = await fetch(`${ROOMS_API_URL}/${id}/leave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(data.error || 'Failed to leave room');
    }
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${ROOMS_API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(data.error || 'Failed to delete room');
    }
  },
};
