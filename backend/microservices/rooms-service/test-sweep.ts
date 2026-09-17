import { prisma } from './src/config/database';
import {
    createRoom,
    joinRoom,
    leaveRoom,
    sweepEmptyRooms,
} from './src/services/room.service';

// Run with: npx tsx test-sweep.ts
// Requires: rooms postgres running (DATABASE_URL in .env). Cleans up after itself.
async function runTests() {
    console.log('🧪 Starting rooms-service Empty-Room Sweeper Verification Suite...\n');

    let passed = 0;
    let total = 0;

    function assert(condition: boolean, testName: string, detail?: string) {
        total++;
        if (condition) {
            console.log(`  ✅ [PASS] ${testName}`);
            passed++;
        } else {
            console.error(`  ❌ [FAIL] ${testName}${detail ? `: ${detail}` : ''}`);
            throw new Error(`Assertion failed for: ${testName}`);
        }
    }

    const suffix = String(Date.now());
    // NOTE: rooms reference monolith user ids as bare strings (no User table).
    const userA = `sweep-user-a-${suffix}`;
    const userB = `sweep-user-b-${suffix}`;
    const createdRoomIds: string[] = [];

    try {
        // --- Category 1: emptiedAt lifecycle on leave/join ---
        console.log('🚪 Test Category: emptiedAt Lifecycle');
        const room = await createRoom({ name: `Sweep Room ${suffix}`, type: 'TEXT', visibility: 'OPEN' }, userA);
        createdRoomIds.push(room.id);
        await joinRoom(room.id, userB, userB, undefined);

        await leaveRoom(room.id, userA);
        const stillActive = await prisma.room.findUnique({ where: { id: room.id } });
        assert(stillActive?.emptiedAt === null, 'Room with one member left has no emptiedAt');

        await leaveRoom(room.id, userB);
        const emptied = await prisma.room.findUnique({ where: { id: room.id } });
        assert(emptied?.emptiedAt instanceof Date, 'Last leave stamps emptiedAt');

        await joinRoom(room.id, userA, userA, undefined);
        const rejoined = await prisma.room.findUnique({ where: { id: room.id } });
        assert(rejoined?.emptiedAt === null, 'Rejoin clears emptiedAt');
        await leaveRoom(room.id, userA);

        // --- Category 2: sweeper deactivates long-empty rooms ---
        console.log('🧹 Test Category: Sweep Behavior');
        const oldRoom = await createRoom({ name: `Old Room ${suffix}`, type: 'TEXT', visibility: 'OPEN' }, userA);
        createdRoomIds.push(oldRoom.id);
        await joinRoom(oldRoom.id, userB, userB, undefined);
        await leaveRoom(oldRoom.id, userA);
        await leaveRoom(oldRoom.id, userB);
        await prisma.room.update({
            where: { id: oldRoom.id },
            data: { emptiedAt: new Date(Date.now() - 11 * 60 * 1000) },
        });

        const freshRoom = await createRoom({ name: `Fresh Room ${suffix}`, type: 'TEXT', visibility: 'OPEN' }, userA);
        createdRoomIds.push(freshRoom.id);
        await leaveRoom(freshRoom.id, userA); // emptiedAt = now

        const swept = await sweepEmptyRooms(10);
        assert(swept.includes(oldRoom.id), 'Room empty 11 min is swept');
        const sweptRow = await prisma.room.findUnique({ where: { id: oldRoom.id } });
        assert(sweptRow?.isActive === false, 'Swept room is deactivated (soft delete)');
        const freshRow = await prisma.room.findUnique({ where: { id: freshRoom.id } });
        assert(freshRow?.isActive === true, 'Freshly emptied room survives');

        // --- Category 3: sweeper heals stale emptiedAt when occupied ---
        console.log('🛡️ Test Category: Occupied Rooms Are Safe');
        const busyRoom = await createRoom({ name: `Busy Room ${suffix}`, type: 'TEXT', visibility: 'OPEN' }, userA);
        createdRoomIds.push(busyRoom.id);
        await prisma.room.update({
            where: { id: busyRoom.id },
            data: { emptiedAt: new Date(Date.now() - 60 * 60 * 1000) },
        });
        await sweepEmptyRooms(10);
        const busyRow = await prisma.room.findUnique({ where: { id: busyRoom.id } });
        assert(busyRow?.isActive === true, 'Occupied room stays active');
        assert(busyRow?.emptiedAt === null, 'Stale emptiedAt cleared on occupied room');

        console.log(`\n🎉 All ${passed}/${total} sweeper verification tests passed successfully!\n`);
    } finally {
        await prisma.roomMessage.deleteMany({ where: { roomId: { in: createdRoomIds } } });
        await prisma.roomParticipant.deleteMany({ where: { roomId: { in: createdRoomIds } } });
        await prisma.room.deleteMany({ where: { id: { in: createdRoomIds } } });
        await prisma.$disconnect();
    }
}

runTests().catch((err) => {
    console.error('\n❌ Test suite failure:', err);
    process.exit(1);
});
