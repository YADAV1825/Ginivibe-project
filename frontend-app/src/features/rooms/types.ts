export type RoomType = 'TEXT' | 'VOICE' | 'VIDEO';
export type RoomVisibility = 'OPEN' | 'PRIVATE';

export interface RoomParticipant {
  userId: string;
  role: 'CREATOR' | 'PARTICIPANT';
  joinedAt: string;
}

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
  participants?: RoomParticipant[];
}

export interface RoomMessage {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
}

export interface JoinRoomResponse {
  room: Room;
  token: string;
  tokenType: 'livekit' | 'socket';
  livekitUrl?: string;
}

export interface CreateRoomInput {
  name: string;
  type: RoomType;
  visibility: RoomVisibility;
  accessCode?: string;
  maxCapacity?: number;
}

export type RoomFilter = 'all' | 'public' | 'private' | 'joined' | 'mine';
