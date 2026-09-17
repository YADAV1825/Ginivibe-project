/**
 * src/services/livekit.service.ts
 *
 * - VOICE/VIDEO rooms: mints a LiveKit AccessToken whose publish grant is
 *   strictly derived from room.type. VOICE can only publish `microphone`;
 *   VIDEO can publish microphone + camera + screen share. This is the
 *   actual enforcement point — LiveKit's SFU rejects any track a token's
 *   grant doesn't cover, so a VOICE-room client can't sneak a camera
 *   track in even if it tries.
 * - TEXT rooms: no LiveKit at all. Mints a plain signed JWT with the same
 *   `{ id, username }` shape the monolithic backend's socket-auth
 *   middleware (`src/socket/socket-auth.ts`) already decodes, so the
 *   existing Socket.IO gateway can verify it without any changes.
 * - Webhook signature verification for the `participant_left` /
 *   `room_finished` cleanup events, via LiveKit's own WebhookReceiver.
 */
import jwt, { SignOptions } from 'jsonwebtoken';
import { AccessToken, WebhookReceiver } from 'livekit-server-sdk';
import { TrackSource } from '@livekit/protocol';
import type { WebhookEvent } from '@livekit/protocol';
import { RoomType } from '../generated/client';
import { JWT_SECRET } from '../config/auth';
import { LIVEKIT_API_KEY, LIVEKIT_API_SECRET } from '../config/livekit';

const webhookReceiver = new WebhookReceiver(LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

interface MintMediaTokenParams {
    roomId: string;
    roomType: Extract<RoomType, 'VOICE' | 'VIDEO'>;
    userId: string;
    username: string;
}

export async function mintMediaToken(params: MintMediaTokenParams): Promise<string> {
    const { roomId, roomType, userId, username } = params;

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
        identity: userId,
        name: username,
        ttl: '6h',
    });

    if (roomType === 'VOICE') {
        at.addGrant({
            room: roomId,
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
            // Camera and screen share are simply absent from the grant — not
            // just turned off — so the SFU has nothing to permit even if a
            // client asks.
            canPublishSources: [TrackSource.MICROPHONE],
        });
    } else {
        at.addGrant({
            room: roomId,
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
            canPublishSources: [
                TrackSource.MICROPHONE,
                TrackSource.CAMERA,
                TrackSource.SCREEN_SHARE,
                TrackSource.SCREEN_SHARE_AUDIO,
            ],
        });
    }

    return at.toJwt();
}

interface MintSocketTokenParams {
    roomId: string;
    userId: string;
    username: string;
}

/**
 * Deliberately shaped to match what `socket-auth.ts` already decodes
 * (`decoded.id`, `decoded.username`) so the existing Socket.IO gateway
 * in the monolithic backend can verify it as-is. `roomId` rides along as
 * an extra claim for the chat gateway to authorize the specific room.
 */
export function mintSocketToken(params: MintSocketTokenParams): string {
    const { roomId, userId, username } = params;
    const options: SignOptions = { expiresIn: '6h' };

    return jwt.sign({ id: userId, username, roomId, scope: 'text-room-socket' }, JWT_SECRET, options);
}

export async function verifyLiveKitWebhook(
    rawBody: string,
    authHeader: string | undefined
): Promise<WebhookEvent> {
    if (!authHeader) {
        throw new Error('Missing Authorization header on LiveKit webhook request');
    }
    return webhookReceiver.receive(rawBody, authHeader);
}