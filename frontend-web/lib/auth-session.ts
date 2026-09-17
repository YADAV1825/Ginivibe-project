'use client';

import { StorageService } from '@/lib/storage';

const AUTH_KEYS = ['ginivibe_auth_session', 'ginivibe_auth_token', 'ginivibe_auth_user'];

/** True when a 401 means the stored login is dead (rotated secret, expiry, garbage). */
export const isSessionError = (status: number, message: string): boolean =>
  status === 401 && /invalid|expired|unauthorized|signature|token|session|no authorization/i.test(message);

/**
 * Clears the dead login and sends the user to sign in again with an
 * explanation — instead of surfacing cryptic "invalid signature" errors.
 * No-op on auth routes (avoids redirect loops).
 */
export function handleSessionExpired(): void {
  if (typeof window === 'undefined') return;
  const path = window.location.pathname;
  if (path.startsWith('/login') || path.startsWith('/register')) return;
  AUTH_KEYS.forEach((key) => StorageService.removeItem(key));
  window.location.href = '/login?expired=1';
}

/**
 * Drop-in for API error paths: redirects on dead sessions, otherwise no-op.
 * Call BEFORE throwing the regular error, e.g.:
 *   const err = await res.json().catch(() => ({}));
 *   handleSessionError(res.status, err.error);
 *   throw new Error(err.error || 'Failed');
 */
export function handleSessionError(status: number, message: unknown): void {
  if (typeof message === 'string' && isSessionError(status, message)) {
    handleSessionExpired();
    throw new Error('Session expired. Please sign in again.');
  }
}
