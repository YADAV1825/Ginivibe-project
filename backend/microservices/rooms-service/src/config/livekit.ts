import path from 'node:path';
import dotenv from 'dotenv';

// Load service-local .env first, then root microservices .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET || !process.env.LIVEKIT_URL) {
    console.warn(
        '[rooms-service] LIVEKIT_API_KEY / LIVEKIT_API_SECRET / LIVEKIT_URL are not fully set — ' +
        'VOICE and VIDEO room joins will fail until they are configured in .env'
    );
}

export const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || '';
export const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || '';
export const LIVEKIT_URL = process.env.LIVEKIT_URL || '';