//backend/microservices/rooms-service/src/routes/rooms.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import {
    createRoom,
    listActiveRooms,
    joinRoom,
    leaveRoom,
    handleParticipantDisconnected,
    handleRoomFinished,
    RoomNotFoundError,
    RoomFullError,
    InvalidAccessCodeError,
    AlreadyInRoomError,
    NotInRoomError,
    deleteRoom,
} from '../services/room.service';
import { verifyLiveKitWebhook } from '../services/livekit.service';
import { LIVEKIT_URL } from '../config/livekit';

const router = Router();

const ROOM_TYPES = ['TEXT', 'VOICE', 'VIDEO'] as const;
const ROOM_VISIBILITIES = ['OPEN', 'PRIVATE'] as const;
const MAX_ROOM_CAPACITY = 30;

// ---------------------------------------------------------------------
// LiveKit webhook — no Ginivibe user auth (LiveKit is not a logged-in
// user); authenticated instead via WebhookReceiver's signature check.
// Mounted before requireAuth below, and given raw-body parsing in app.ts.
// ---------------------------------------------------------------------
router.post('/webhook/livekit', async (req, res) => {
    try {
        const rawBody = (req.body as Buffer).toString('utf-8');
        const event = await verifyLiveKitWebhook(rawBody, req.headers.authorization);

        if (event.event === 'participant_left' && event.room?.name && event.participant?.identity) {
            await handleParticipantDisconnected(event.room.name, event.participant.identity);
        } else if (event.event === 'room_finished' && event.room?.name) {
            await handleRoomFinished(event.room.name);
        }

        return res.status(200).json({ received: true });
    } catch (err: any) {
        console.error('[rooms-service] webhook error:', err.message);
        return res.status(401).json({ error: 'Invalid webhook signature or payload' });
    }
});

// Everything below requires a valid Ginivibe user JWT.
router.use(requireAuth);

// POST /api/rooms — create a room
router.post('/', async (req: AuthRequest, res) => {
    try {
        const { name, type, visibility = 'OPEN', accessCode, maxCapacity } = req.body ?? {};

        if (!name || typeof name !== 'string' || name.trim().length < 3) {
            return res.status(400).json({ error: 'name must be at least 3 characters' });
        }
        if (!ROOM_TYPES.includes(type)) {
            return res.status(400).json({ error: `type must be one of: ${ROOM_TYPES.join(', ')}` });
        }
        if (!ROOM_VISIBILITIES.includes(visibility)) {
            return res.status(400).json({ error: `visibility must be one of: ${ROOM_VISIBILITIES.join(', ')}` });
        }
        if (visibility === 'PRIVATE' && (!accessCode || String(accessCode).length < 4)) {
            return res.status(400).json({ error: 'accessCode (min 4 chars) is required when visibility is PRIVATE' });
        }
        if (visibility === 'OPEN' && accessCode) {
            return res.status(400).json({ error: 'accessCode must not be provided when visibility is OPEN' });
        }
        const cap = maxCapacity ?? MAX_ROOM_CAPACITY;
        if (typeof cap !== 'number' || !Number.isInteger(cap) || cap <= 0 || cap > MAX_ROOM_CAPACITY) {
            return res.status(400).json({ error: `maxCapacity must be an integer between 1 and ${MAX_ROOM_CAPACITY}` });
        }

        const room = await createRoom(
            { name: name.trim(), type, visibility, accessCode, maxCapacity: cap },
            req.userId!
        );
        return res.status(201).json({ room });
    } catch (err: any) {
        console.error('[rooms-service] createRoom error:', err.message);
        return res.status(500).json({ error: 'Failed to create room' });
    }
});

// GET /api/rooms with filters
router.get('/', async (req: AuthRequest, res) => {
    try {
        const filter = (typeof req.query.filter === 'string' ? req.query.filter : 'all') as any;
        const type = typeof req.query.type === 'string' ? req.query.type : undefined;

        const rooms = await listActiveRooms(filter, type as any, req.userId);
        return res.json({ rooms });
    } catch (err: any) {
        return res.status(500).json({ error: 'Failed to list rooms' });
    }
});

// DELETE /api/rooms/:id — delete own room
router.delete('/:id', async (req: AuthRequest, res) => {
    try {
        await deleteRoom(String(req.params.id), req.userId!);
        return res.json({ message: 'Room deleted successfully' });
    } catch (err: any) {
        if (err instanceof RoomNotFoundError) {
            return res.status(404).json({ error: err.message });
        }
        if (err.message?.includes('Unauthorized')) {
            return res.status(403).json({ error: err.message });
        }
        return res.status(500).json({ error: 'Failed to delete room' });
    }
});


router.get('/:id', async (req: AuthRequest, res) => {
    try {
        const room = await prisma.room.findUnique({
            where: {
                id: String(req.params.id),
            },
            include: {
                _count: {
                    select: {
                        participants: {
                            where: {
                                leftAt: null,
                            },
                        },
                    },
                },
                participants: {
                    where: {
                        leftAt: null,
                    },
                    select: {
                        userId: true,
                        role: true,
                        joinedAt: true,
                    },
                },
            },
        });

        if (!room || !room.isActive) {
            return res.status(404).json({
                error: 'Room not found or no longer active',
            });
        }

        // Private rooms only expose their participant list to members.
        if (room.visibility === 'PRIVATE') {
            const membership = await prisma.roomParticipant.findFirst({
                where: { roomId: room.id, userId: req.userId!, leftAt: null },
                select: { id: true },
            });
            if (!membership) {
                return res.status(403).json({ error: 'Join this private room to view it' });
            }
        }

        return res.json({
            room: {
                id: room.id,
                name: room.name,
                creatorId: room.creatorId,
                type: room.type,
                visibility: room.visibility,
                maxCapacity: room.maxCapacity,
                isActive: room.isActive,
                currentParticipantsCount:
                    room._count.participants,
                participants: room.participants,
                createdAt: room.createdAt,
            },
        });
    } catch (error) {
        console.error('Get room error:', error);

        return res.status(500).json({
            error: 'Failed to fetch room',
        });
    }
});


// POST /api/rooms/:id/join
router.post('/:id/join', async (req: AuthRequest, res) => {
    try {
        const roomId = String(req.params.id);
        const { accessCode } = req.body ?? {};
        const userId = req.userId!;
        const username = req.username || userId;

        const { room, token, tokenType } = await joinRoom(roomId, userId, username, accessCode);

        return res.json({
            room,
            token,
            tokenType,
            livekitUrl: tokenType === 'livekit' ? LIVEKIT_URL : undefined,
        });
    } catch (err: any) {
        if (err instanceof RoomNotFoundError) return res.status(404).json({ error: err.message });
        if (err instanceof RoomFullError) return res.status(403).json({ error: err.message });
        if (err instanceof InvalidAccessCodeError) return res.status(403).json({ error: err.message });
        if (err instanceof AlreadyInRoomError) return res.status(409).json({ error: err.message });
        console.error('[rooms-service] joinRoom error:', err.message);
        return res.status(500).json({ error: 'Failed to join room' });
    }
});

// POST /api/rooms/:id/leave
router.post('/:id/leave', async (req: AuthRequest, res) => {
    try {
        await leaveRoom(String(req.params.id), req.userId!);
        return res.json({ message: 'Left room successfully' });
    } catch (err: any) {
        if (err instanceof NotInRoomError) return res.status(409).json({ error: err.message });
        console.error('[rooms-service] leaveRoom error:', err.message);
        return res.status(500).json({ error: 'Failed to leave room' });
    }
});




export default router;