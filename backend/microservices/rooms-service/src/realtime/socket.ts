import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_ALGORITHM } from '../config/auth';
import { prisma } from '../config/database';
import { getActiveParticipantCount, handleParticipantDisconnected } from '../services/room.service';

interface RoomSocketData {
    userId: string;
    username: string;
    /** Room this token was minted for (join tokens only). */
    tokenRoomId?: string;
    /** Rooms this socket has successfully joined. */
    joinedRooms: Set<string>;
}

function verifyToken(token: string): any {
    try {
        return jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
    } catch {
        const fallbackSecret = JWT_SECRET === 'ginivibe_super_secret_jwt_key_2026'
            ? 'ginivibe_super_secret_jwt_key'
            : 'ginivibe_super_secret_jwt_key_2026';
        return jwt.verify(token, fallbackSecret, { algorithms: [JWT_ALGORITHM] });
    }
}

async function assertActiveMember(roomId: string, userId: string): Promise<boolean> {
    const row = await prisma.roomParticipant.findFirst({
        where: { roomId, userId, leftAt: null },
        select: { id: true },
    });
    return Boolean(row);
}

export function setupRoomSocket(server: HttpServer) {
    const io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    // Live socket count per room+user. A user with two tabs open must not be
    // marked "left" when one tab closes — only the last disconnect counts.
    // NOTE: single-instance memory. A restart orphans counts (DB rows stay
    // until leave/disconnect); the empty-room sweeper still reclaims fully
    // vacant rooms, which is the case that matters for auto-delete.
    const liveConnections = new Map<string, number>();
    const connKey = (roomId: string, userId: string) => `${roomId}:${userId}`;

    // Middleware to authenticate socket connections. Accepts either the
    // per-room join token minted by POST /:id/join (carries roomId + scope
    // claims) or a plain Ginivibe user JWT (membership is then checked
    // against the database on join-room).
    io.use((socket: Socket, next: (err?: Error) => void) => {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
        if (!token) {
            return next(new Error('Authentication error: Token missing'));
        }

        try {
            const decoded = verifyToken(token);
            const data = socket.data as Partial<RoomSocketData>;
            data.userId = decoded.id;
            data.username = decoded.username || decoded.id;
            if (typeof decoded.roomId === 'string') data.tokenRoomId = decoded.roomId;
            data.joinedRooms = new Set<string>();
            next();
        } catch {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    const emitOccupancy = async (roomId: string) => {
        try {
            const count = await getActiveParticipantCount(roomId);
            io.to(roomId).emit('room-occupancy', { roomId, count });
        } catch (err) {
            console.error('Failed to emit room occupancy:', err);
        }
    };

    io.on('connection', (socket: Socket) => {
        const data = socket.data as RoomSocketData;

        // User joins a specific room channel (membership-verified).
        socket.on('join-room', async ({ roomId }: { roomId: string }) => {
            if (!roomId || typeof roomId !== 'string') return;

            // A join token is bound to exactly one room.
            if (data.tokenRoomId && data.tokenRoomId !== roomId) {
                socket.emit('room-error', { error: 'Token is not valid for this room' });
                return;
            }

            try {
                const room = await prisma.room.findUnique({
                    where: { id: roomId },
                    select: { id: true, isActive: true },
                });
                if (!room || !room.isActive) {
                    socket.emit('room-error', { error: 'Room not found or no longer active' });
                    return;
                }
                if (!(await assertActiveMember(roomId, data.userId))) {
                    socket.emit('room-error', { error: 'Join the room before listening to it' });
                    return;
                }

                socket.join(roomId);
                if (!data.joinedRooms.has(roomId)) {
                    data.joinedRooms.add(roomId);
                    const key = connKey(roomId, data.userId);
                    liveConnections.set(key, (liveConnections.get(key) ?? 0) + 1);
                }
                void emitOccupancy(roomId);

                // Fetch and send message history (persistent store like WhatsApp/Discord)
                try {
                    const messages = await prisma.roomMessage.findMany({
                        where: { roomId },
                        orderBy: { createdAt: 'asc' },
                        take: 50,
                    });
                    socket.emit('room-history', messages);
                } catch (err) {
                    console.error('Failed to load room history:', err);
                }
            } catch (err) {
                console.error('Failed to join room channel:', err);
                socket.emit('room-error', { error: 'Could not join room channel' });
            }
        });

        // Handle incoming message: membership-checked, saved to DB, broadcast live.
        socket.on('send-room-message', async ({ roomId, text }: { roomId: string; text: string }) => {
            if (!text || !text.trim()) return;
            if (!roomId || typeof roomId !== 'string') return;
            if (data.tokenRoomId && data.tokenRoomId !== roomId) return;

            try {
                if (!(await assertActiveMember(roomId, data.userId))) {
                    socket.emit('message-error', { error: 'Join the room before sending messages' });
                    return;
                }

                // 1. Save message to PostgreSQL permanently
                const newMessage = await prisma.roomMessage.create({
                    data: {
                        roomId,
                        userId: data.userId,
                        username: data.username,
                        text: text.trim().slice(0, 2000),
                    },
                });

                // 2. Broadcast live message to all participants in the room
                io.to(roomId).emit('new-message', newMessage);
            } catch (err) {
                console.error('Failed to save and broadcast message:', err);
                socket.emit('message-error', { error: 'Could not send message' });
            }
        });

        socket.on('disconnect', () => {
            // Closing the tab / navigating away ends TEXT presence: without
            // this, leavers would count as participants forever (voice/video
            // rooms are covered by the LiveKit webhook instead).
            for (const roomId of data.joinedRooms) {
                const key = connKey(roomId, data.userId);
                const remaining = (liveConnections.get(key) ?? 1) - 1;
                if (remaining <= 0) {
                    liveConnections.delete(key);
                    void handleParticipantDisconnected(roomId, data.userId)
                        .then(() => emitOccupancy(roomId))
                        .catch((err) => console.error('Failed to mark participant left:', err));
                } else {
                    liveConnections.set(key, remaining);
                    void emitOccupancy(roomId);
                }
            }
            data.joinedRooms.clear();
        });
    });

    return io;
}
