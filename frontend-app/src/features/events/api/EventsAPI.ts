import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_EVENTS_API_URL ?? 'http://localhost:3002/api';

// Get token from storage
const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('ginivibe_auth_token');
  } catch {
    return null;
  }
};

// Helper to make authenticated requests
const makeAuthenticatedRequest = async (
  endpoint: string,
  method: string = 'GET',
  body?: any
) => {
  const token = await getAuthToken();
  
  const headers: any = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: any = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
};

// ==================== TYPES ====================

export interface EventResponse {
  id: string;
  title: string;
  description?: string;
  organizer: {
    id: string;
    username: string;
    firstName?: string;
  };
  startAt: string;
  endAt: string;
  status: 'LIVE' | 'FUTURE' | 'ENDED';
  mode: 'ONLINE' | 'OFFLINE';
  meetingUrl?: string;
  platform?: string;
  venue?: string;
  location?: string;
  capacity?: number;
  bannerImageUrl?: string;
  attendeeCount: number;
  isFull: boolean;
  waitlistStatus: 'WAITLISTED' | null;
  waitlistPosition: number | null;
  userAttendanceStatus: 'GOING' | 'INTERESTED' | 'DECLINED' | null;
  createdAt: string;
  updatedAt: string;
  subInterests?: Array<{ id: string; name: string; interest?: { id: string; name: string } }>;
}

export interface EventDetailResponse extends EventResponse {
  attendees: Array<{
    id: string;
    username: string;
    firstName?: string;
    rsvpStatus: 'GOING' | 'INTERESTED' | 'DECLINED';
    joinedAt: string;
  }>;
}

export interface ListEventsResponse {
  success: boolean;
  data: EventResponse[];
  meta?: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface CreateEventInput {
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  mode: 'ONLINE' | 'OFFLINE';
  meetingUrl?: string;
  platform?: string;
  venue?: string;
  location?: string;
  capacity?: number;
  bannerImageUrl?: string;
}

// ==================== API FUNCTIONS ====================

/**
 * Get list of events with optional filters
 */
export const getEvents = async (
  status?: 'live' | 'future' | 'ended',
  mode?: 'online' | 'offline',
  limit: number = 20,
  offset: number = 0
): Promise<ListEventsResponse> => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (mode) params.append('mode', mode);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  const queryString = params.toString();
  const endpoint = `/events${queryString ? '?' + queryString : ''}`;
  
  return makeAuthenticatedRequest(endpoint);
};

export const getPersonalizedEvents = async (): Promise<ListEventsResponse> => {
  return makeAuthenticatedRequest('/events/personalized');
};

/**
 * Get single event detail
 */
export const getEventDetail = async (eventId: string): Promise<{ success: boolean; data: EventDetailResponse }> => {
  return makeAuthenticatedRequest(`/events/${eventId}`);
};

/**
 * Create new event
 */
export const createEvent = async (eventData: CreateEventInput): Promise<{ success: boolean; data: EventResponse }> => {
  return makeAuthenticatedRequest('/events', 'POST', eventData);
};

/**
 * Update event (organizer only)
 */
export const updateEvent = async (
  eventId: string,
  eventData: Partial<CreateEventInput>
): Promise<{ success: boolean; data: EventResponse }> => {
  return makeAuthenticatedRequest(`/events/${eventId}`, 'PUT', eventData);
};

/**
 * Delete event (organizer only)
 */
export const deleteEvent = async (eventId: string): Promise<{ success: boolean }> => {
  return makeAuthenticatedRequest(`/events/${eventId}`, 'DELETE');
};

/**
 * Upload a banner image for an event and get back its URL, to pass as
 * `bannerImageUrl` on createEvent/updateEvent. Picked image comes from
 * expo-image-picker's ImagePickerAsset (has .uri, .mimeType/.type, .fileName).
 */
export const uploadEventImage = async (image: {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}): Promise<{ success: boolean; data: { url: string } }> => {
  const token = await getAuthToken();

  const inferredType = image.mimeType ?? (image.fileName?.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
  const inferredName = image.fileName ?? `event-banner.${inferredType === 'image/png' ? 'png' : 'jpg'}`;

  const formData = new FormData();
  if (Platform.OS === 'web') {
    // On web, expo-image-picker's uri is a blob:/data: URL, not a real file path —
    // FormData on web needs an actual Blob/File, so fetch it back into one first.
    const blobResponse = await fetch(image.uri);
    const blob = await blobResponse.blob();
    formData.append('image', blob, inferredName);
  } else {
    // iOS/Android: React Native's fetch/FormData accepts this { uri, name, type } shape directly.
    formData.append('image', {
      uri: image.uri,
      name: inferredName,
      type: inferredType,
    } as any);
  }

  const headers: any = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  // Deliberately no 'Content-Type' header — fetch sets the multipart boundary itself.

  const response = await fetch(`${API_BASE_URL}/events/upload-image`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to upload image');
  }

  return data;
};

/**
 * RSVP to event
 */
export const rsvpToEvent = async (
  eventId: string,
  status: 'GOING' | 'INTERESTED' | 'DECLINED'
): Promise<{ success: boolean; data: any }> => {
  return makeAuthenticatedRequest(`/events/${eventId}/rsvp`, 'POST', { status });
};

/**
 * Cancel RSVP
 */
export const cancelRsvp = async (eventId: string): Promise<{ success: boolean }> => {
  return makeAuthenticatedRequest(`/events/${eventId}/rsvp`, 'DELETE');
};

export const leaveWaitlist = async (eventId: string): Promise<{ success: boolean }> => {
  return makeAuthenticatedRequest(`/events/${eventId}/waitlist`, 'DELETE');
};

export const joinEvent = async (eventId: string) => rsvpToEvent(eventId, 'GOING');
export const leaveEvent = async (eventId: string) => cancelRsvp(eventId);

/**
 * Get user's organized events
 */
export const getMyOrganizedEvents = async (
  status?: 'live' | 'future' | 'ended'
): Promise<ListEventsResponse> => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  
  const queryString = params.toString();
  const endpoint = `/events/me/organized${queryString ? '?' + queryString : ''}`;
  
  return makeAuthenticatedRequest(endpoint);
};

/**
 * Get user's attended events
 */
export const getMyAttendingEvents = async (
  status?: 'live' | 'future' | 'ended'
): Promise<ListEventsResponse> => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  
  const queryString = params.toString();
  const endpoint = `/events/me/attending${queryString ? '?' + queryString : ''}`;
  
  return makeAuthenticatedRequest(endpoint);
};