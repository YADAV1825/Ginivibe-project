import path from 'node:path';
import dotenv from 'dotenv';

// Load service-local .env first, then root microservices .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { app } from './app';
import http from 'http';
import { setupRoomSocket } from './realtime/socket';
import { EMPTY_ROOM_TTL_MINUTES, sweepEmptyRooms } from './services/room.service';

const port = Number(
    process.env.ROOMS_PORT ||
    (process.env.PORT && process.env.PORT !== '3002' ? process.env.PORT : 3007)
);
const server = http.createServer(app);

// Attach Socket.IO to the HTTP server
setupRoomSocket(server);

// Reclaim rooms left empty for longer than the TTL (soft delete; chat
// history is preserved). Runs every minute; each sweep is idempotent and
// race-safe against concurrent joins.
const SWEEP_INTERVAL_MS = 60 * 1000;
setInterval(() => {
    sweepEmptyRooms()
        .then((swept) => {
            if (swept.length > 0) {
                console.log(`[rooms-service] swept ${swept.length} empty room(s): ${swept.join(', ')}`);
            }
        })
        .catch((err) => console.error('[rooms-service] empty-room sweep failed:', err));
}, SWEEP_INTERVAL_MS);

server.listen(port, () => {
    console.log(`[rooms-service] started with WebSockets on port ${port} (empty-room TTL: ${EMPTY_ROOM_TTL_MINUTES} min)`);
});