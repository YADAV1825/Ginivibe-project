//microservices/events-service/src/config/auth.ts
export const JWT_SECRET = process.env.JWT_SECRET || 'this-is-a-secret-key-for-jwt';
export const JWT_ALGORITHM = 'HS256' as const;