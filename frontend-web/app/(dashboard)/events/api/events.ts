'use client';

import { StorageService } from '@/lib/storage';
import { handleSessionError } from '@/lib/auth-session';

const EVENTS_API_URL = process.env.NEXT_PUBLIC_EVENTS_API_URL ?? 'http://localhost:3002/api/events';
const TOKEN_KEY = 'ginivibe_auth_token';

export type EventStatus = 'LIVE' | 'FUTURE' | 'ENDED';
export type EventMode = 'ONLINE' | 'OFFLINE';
export type RsvpStatus = 'INTERESTED' | 'GOING' | 'DECLINED';

/** Compact attendance counts: 999 → "999", 1500 → "1.5k", 5000 → "5k". */
export function formatCount(n: number): string {
  if (!Number.isFinite(n)) return '0';
  if (n < 1000) return `${n}`;
  const v = n / 1000;
  return `${v >= 100 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, '')}k`;
}

export interface ServiceEvent {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  status: EventStatus;
  mode: EventMode;
  meetingUrl: string | null;
  joinUrl: string | null;
  platform: string | null;
  venue: string | null;
  location: string | null;
  capacity: number | null;
  bannerImageUrl: string | null;
  attendeeCount: number;
  isFull: boolean;
  waitlistStatus: 'WAITLISTED' | null;
  waitlistPosition: number | null;
  userAttendanceStatus: RsvpStatus | null;
  organizer: { id: string; username: string; firstName: string | null; lastName?: string | null };
  subInterests?: Array<{ id: string; name: string; interest?: { id: string; name: string } }>;
  attendees?: Array<{ id: string; username: string; firstName: string | null; rsvpStatus: RsvpStatus; joinedAt: string }>;
  createdAt: string;
  updatedAt: string;
}

interface EventsResponse {
  success: boolean;
  data: ServiceEvent[];
  error?: string;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  mode: EventMode;
  meetingUrl?: string;
  joinUrl?: string;
  platform?: string;
  venue?: string;
  location?: string;
  capacity?: number;
  bannerImageUrl?: string;
}

const headers = (): HeadersInit => {
  const token = StorageService.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const EventsApi = {
  async create(data: CreateEventInput): Promise<ServiceEvent> {
    const response = await fetch(EVENTS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers() },
      body: JSON.stringify(data),
    });
    const payload = await response.json() as { success: boolean; data?: ServiceEvent; error?: string };
    if (!response.ok || !payload.success || !payload.data) {
      handleSessionError(response.status, payload.error);
      throw new Error(payload.error ?? 'Unable to create event');
    }
    return payload.data;
  },

  /**
   * Upload a banner image and get back its URL, to pass as `bannerImageUrl`
   * on create()/update(). The events API itself stays plain JSON — this hits
   * a dedicated multipart endpoint so the image can be uploaded (and previewed)
   * as soon as it's picked, before the rest of the form is submitted.
   */
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${EVENTS_API_URL}/upload-image`, {
      method: 'POST',
      headers: headers(), // no Content-Type — the browser sets the multipart boundary
      body: formData,
    });
    const payload = await response.json() as { success: boolean; data?: { url: string }; error?: string };
    if (!response.ok || !payload.success || !payload.data) throw new Error(payload.error ?? 'Unable to upload image');
    return payload.data.url;
  },

  async list(filters: { status?: EventStatus; mode?: EventMode; personalized?: boolean } = {}): Promise<ServiceEvent[]> {
    const query = new URLSearchParams();
    if (filters.status) query.set('status', filters.status);
    if (filters.mode) query.set('mode', filters.mode);
    const endpoint = filters.personalized ? `${EVENTS_API_URL}/personalized` : EVENTS_API_URL;
    const response = await fetch(`${endpoint}${query.size ? `?${query}` : ''}`, { headers: headers() });
    const payload = (await response.json()) as EventsResponse;

    if (!response.ok || !payload.success) {
      throw new Error(payload.error ?? 'Unable to load events');
    }

    return payload.data;
  },

  async get(eventId: string): Promise<ServiceEvent> {
    const response = await fetch(`${EVENTS_API_URL}/${eventId}`, { headers: headers() });
    const payload = await response.json() as { success: boolean; data?: ServiceEvent; error?: string };
    if (!response.ok || !payload.success || !payload.data) throw new Error(payload.error ?? 'Unable to load event');
    return payload.data;
  },

  async rsvp(eventId: string, status: RsvpStatus): Promise<void> {
    const response = await fetch(`${EVENTS_API_URL}/${eventId}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers() },
      body: JSON.stringify({ status }),
    });
    const payload = await response.json() as { success: boolean; error?: string };

    if (!response.ok || !payload.success) {
      handleSessionError(response.status, payload.error);
      throw new Error(payload.error ?? 'Unable to update RSVP');
    }
  },

  async cancelRsvp(eventId: string): Promise<void> {
    const response = await fetch(`${EVENTS_API_URL}/${eventId}/rsvp`, { method: 'DELETE', headers: headers() });
    const payload = await response.json() as { success: boolean; error?: string };
    if (!response.ok || !payload.success) throw new Error(payload.error ?? 'Unable to cancel RSVP');
  },

  async leaveWaitlist(eventId: string): Promise<void> {
    const response = await fetch(`${EVENTS_API_URL}/${eventId}/waitlist`, { method: 'DELETE', headers: headers() });
    const payload = await response.json() as { success: boolean; error?: string };
    if (!response.ok || !payload.success) throw new Error(payload.error ?? 'Unable to leave waitlist');
  },

  async organized(): Promise<ServiceEvent[]> {
    return this.listFrom('/me/organized');
  },

  async attending(): Promise<ServiceEvent[]> {
    return this.listFrom('/me/attending');
  },

  async update(eventId: string, data: Partial<Pick<ServiceEvent, 'title' | 'description' | 'startAt' | 'endAt' | 'mode' | 'meetingUrl' | 'joinUrl' | 'platform' | 'venue' | 'location' | 'capacity' | 'bannerImageUrl'>>): Promise<ServiceEvent> {
    const response = await fetch(`${EVENTS_API_URL}/${eventId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers() },
      body: JSON.stringify(data),
    });
    const payload = await response.json() as { success: boolean; data?: ServiceEvent; error?: string };
    if (!response.ok || !payload.success || !payload.data) throw new Error(payload.error ?? 'Unable to update event');
    return payload.data;
  },

  async remove(eventId: string): Promise<void> {
    const response = await fetch(`${EVENTS_API_URL}/${eventId}`, { method: 'DELETE', headers: headers() });
    const payload = await response.json() as { success: boolean; error?: string };
    if (!response.ok || !payload.success) throw new Error(payload.error ?? 'Unable to delete event');
  },

  async listFrom(path: string): Promise<ServiceEvent[]> {
    const response = await fetch(`${EVENTS_API_URL}${path}`, { headers: headers() });
    const payload = await response.json() as EventsResponse;
    if (!response.ok || !payload.success) throw new Error(payload.error ?? 'Unable to load events');
    return payload.data;
  },
};