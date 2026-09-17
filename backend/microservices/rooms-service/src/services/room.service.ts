/**
 * src/services/room.service.ts
 *
 * All business logic for room lifecycle: creation, listing, atomic join
 * (capacity + access-code enforcement), leave, and webhook-driven cleanup.
 *
 * Concurrency safety: `joinRoom` runs inside `prisma.$transaction`, and
 * locks the target Room row with a raw `SELECT ... FOR UPDATE` before
 * reading the live participant count. A concurrent join for the same room
 * blocks on that lock until this transaction commits or rolls back, so two
 * requests can never both observe "29 of 30 seats taken" and both proceed
 * — the DB serializes them.
 */
import bcrypt from 'bcryptjs';
import { Prisma, Room, RoomType, RoomVisibility } from '../generated/client';
import { prisma } from '../config/database';
import { mintMediaToken, mintSocketToken } from './livekit.service';

const BCRYPT_SALT_ROUNDS = 10;

export interface CreateRoomInput {
    name: string;
    type: RoomType;
    visibility: RoomVisibility;
    accessCode?: string;
    maxCapacity?: number;
}

// -----------------------------------------------------------------------
// Error types — routes map these to HTTP status codes.
// -----------------------------------------------------------------------
export class RoomNotFoundError extends Error {
    constructor(roomId: string) {
        super(`Room ${roomId} not found or inactive`);
        this.name = 'RoomNotFoundError';
    }
}
export class RoomFullError extends Error {
    constructor() {
        super('Room is full (Max 30 participants reached)');
        this.name = 'RoomFullError';
    }
}
export class InvalidAccessCodeError extends Error {
    constructor() {
        super('Invalid or missing access code for private room');
        this.name = 'InvalidAccessCodeError';
    }
}
export class AlreadyInRoomError extends Error {
    constructor() {
        super('User is already an active participant in this room');
        this.name = 'AlreadyInRoomError';
    }
}
export class NotInRoomError extends Error {
    constructor() {
        super('User is not an active participant in this room');
        this.name = 'NotInRoomError';
    }
}

// -----------------------------------------------------------------------
// Create room
// -----------------------------------------------------------------------
export async function createRoom(input: CreateRoomInput, creatorId: string): Promise<Room> {
    const accessCodeHash =
        input.visibility === 'PRIVATE' && input.accessCode
            ? await bcrypt.hash(input.accessCode, BCRYPT_SALT_ROUNDS)
            : null;

    return prisma.$transaction(async (tx) => {
        const room = await tx.room.create({
            data: {
                name: input.name,
                creatorId,
                type: input.type,
                visibility: input.visibility,
                accessCodeHash,
                maxCapacity: input.maxCapacity ?? 30,
            },
        });

        // Creator automatically becomes the first active participant.
        await tx.roomParticipant.create({
            data: { roomId: room.id, userId: creatorId, role: 'CREATOR' },
        });

        return room;
    });
}

// -----------------------------------------------------------------------
// List active OPEN rooms with live participant counts
// -----------------------------------------------------------------------
export interface RoomWithCount extends Room {
    currentParticipantsCount: number;
}

interface RoomWithParticipantCountRaw extends Room {
    _count: { participants: number };
}

// Add to room.service.ts

export async function listActiveRooms(
    filter?: 'all' | 'private' | 'public' | 'joined' | 'mine',
    filterType?: RoomType,
    userId?: string
): Promise<RoomWithCount[]> {
    let visibilityCondition: any = { isActive: true };

    if (filter === 'private') {
        visibilityCondition.visibility = 'PRIVATE';
    } else if (filter === 'public' || filter === 'all') {
        visibilityCondition.visibility = 'OPEN';
    } else if (filter === 'mine' && userId) {
        visibilityCondition.creatorId = userId;
    } else if (filter === 'joined' && userId) {
        visibilityCondition.participants = {
            some: { userId, leftAt: null }
        };
    } else {
        // Default 'all' or open rooms
        visibilityCondition.visibility = 'OPEN';
    }

    const rooms = await prisma.room.findMany({
        where: {
            ...visibilityCondition,
            ...(filterType ? { type: filterType } : {}),
        },
        orderBy: { createdAt: 'desc' },
        include: {
            _count: { select: { participants: { where: { leftAt: null } } } },
        },
    });

    return rooms.map(({ _count, ...room }) => ({
        ...room,
        currentParticipantsCount: _count.participants,
    }));
}

export async function deleteRoom(roomId: string, userId: string): Promise<void> {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
        throw new RoomNotFoundError(roomId);
    }
    if (room.creatorId !== userId) {
        throw new Error('Unauthorized: You can only delete your own rooms');
    }

    await prisma.room.update({
        where: { id: roomId },
        data: { isActive: false },
    });
}

// -----------------------------------------------------------------------
// Join room (locked, atomic capacity check + access-code verification)
// -----------------------------------------------------------------------
export interface JoinRoomResult {
    room: Room;
    token: string;
    tokenType: 'livekit' | 'socket';
}

export async function joinRoom(
    roomId: string,
    userId: string,
    username: string,
    accessCode: string | undefined
): Promise<JoinRoomResult> {
    return prisma.$transaction(async (tx) => {
        // Row-level lock: blocks concurrent joins for this room until we commit.
        const locked = await tx.$queryRaw<Room[]>(
            Prisma.sql`SELECT * FROM "Room" WHERE "id" = ${roomId} AND "isActive" = true FOR UPDATE`
        );
        const room = locked[0];

        if (!room) {
            throw new RoomNotFoundError(roomId);
        }

        if (room.visibility === 'PRIVATE') {
            if (!accessCode || !room.accessCodeHash) {
                throw new InvalidAccessCodeError();
            }
            const matches = await bcrypt.compare(accessCode, room.accessCodeHash);
            if (!matches) {
                throw new InvalidAccessCodeError();
            }
        }

        const existing = await tx.roomParticipant.findFirst({
            where: { roomId, userId, leftAt: null },
            select: { id: true },
        });

        // Instead of throwing AlreadyInRoomError, reuse or create participant row if not already in room
        if (!existing) {
            const activeCount = await tx.roomParticipant.count({
                where: { roomId, leftAt: null },
            });

            if (activeCount >= room.maxCapacity) {
                throw new RoomFullError();
            }

            await tx.roomParticipant.create({
                data: { roomId, userId, role: room.creatorId === userId ? 'CREATOR' : 'MEMBER' },
            });
        }

        // Any join (fresh or rejoin) cancels a pending empty-room sweep.
        await tx.room.update({
            where: { id: roomId },
            data: { emptiedAt: null },
        });

        if (room.type === 'TEXT') {
            const token = mintSocketToken({ roomId: room.id, userId, username });
            return { room, token, tokenType: 'socket' as const };
        }

        const token = await mintMediaToken({
            roomId: room.id,
            roomType: room.type,
            userId,
            username,
        });
        return { room, token, tokenType: 'livekit' as const };
    });
}

// -----------------------------------------------------------------------
// Leave room
// -----------------------------------------------------------------------
export async function leaveRoom(roomId: string, userId: string): Promise<void> {
    const result = await prisma.roomParticipant.updateMany({
        where: { roomId, userId, leftAt: null },
        data: { leftAt: new Date() },
    });

    if (result.count === 0) {
        throw new NotInRoomError();
    }

    await markEmptiedIfVacant(roomId);
}

export async function getActiveParticipantCount(roomId: string): Promise<number> {
    return prisma.roomParticipant.count({ where: { roomId, leftAt: null } });
}

// -----------------------------------------------------------------------
// Empty-room tracking + sweeper. A room that stays vacant for
// EMPTY_ROOM_TTL_MINUTES is deactivated (soft delete — history preserved).
// -----------------------------------------------------------------------
export const EMPTY_ROOM_TTL_MINUTES = 10;

async function markEmptiedIfVacant(roomId: string): Promise<void> {
    const activeCount = await getActiveParticipantCount(roomId);
    if (activeCount === 0) {
        await prisma.room.updateMany({
            where: { id: roomId, emptiedAt: null },
            data: { emptiedAt: new Date() },
        });
    }
}

export async function sweepEmptyRooms(maxEmptyMinutes = EMPTY_ROOM_TTL_MINUTES): Promise<string[]> {
    const cutoff = new Date(Date.now() - maxEmptyMinutes * 60 * 1000);
    const candidates = await prisma.room.findMany({
        where: { isActive: true, emptiedAt: { lte: cutoff } },
        select: { id: true },
    });

    const swept: string[] = [];
    for (const candidate of candidates) {
        await prisma.$transaction(async (tx) => {
            // Row lock: a concurrent join blocks here, then clears emptiedAt,
            // so we re-verify everything after acquiring the lock.
            const locked = await tx.$queryRaw<Room[]>(
                Prisma.sql`SELECT * FROM "Room" WHERE "id" = ${candidate.id} AND "isActive" = true FOR UPDATE`
            );
            const room = locked[0];
            if (!room || !room.emptiedAt || room.emptiedAt > cutoff) return;

            const activeCount = await tx.roomParticipant.count({
                where: { roomId: candidate.id, leftAt: null },
            });
            if (activeCount > 0) {
                await tx.room.update({ where: { id: candidate.id }, data: { emptiedAt: null } });
                return;
            }

            await tx.room.update({ where: { id: candidate.id }, data: { isActive: false } });
            swept.push(candidate.id);
        });
    }
    return swept;
}

// -----------------------------------------------------------------------
// Webhook-driven cleanup — LiveKit room name === our Room.id, and
// participant identity === our userId (that's what we set when minting
// the token in livekit.service.ts).
// -----------------------------------------------------------------------
export async function handleParticipantDisconnected(roomId: string, userId: string): Promise<void> {
    await prisma.roomParticipant.updateMany({
        where: { roomId, userId, leftAt: null },
        data: { leftAt: new Date() },
    });
    await markEmptiedIfVacant(roomId);
}

export async function handleRoomFinished(roomId: string): Promise<void> {
    await prisma.room.updateMany({
        where: { id: roomId },
        data: { isActive: false },
    });
}