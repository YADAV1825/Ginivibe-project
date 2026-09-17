import path from 'node:path';
import dotenv from 'dotenv';

// Load service-local .env first, then root microservices .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const JWT_SECRET = process.env.JWT_SECRET || 'ginivibe_super_secret_jwt_key_2026';
export const JWT_ALGORITHM = 'HS256' as const;