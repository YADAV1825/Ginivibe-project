import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { JWT_ALGORITHM, JWT_SECRET } from '../config/auth';

export interface AuthRequest extends Request {
  userId?: string;
}

type AuthTokenPayload = jwt.JwtPayload & {
  id?: unknown;
};

const getBearerToken = (authorization: string | undefined): string | null => {
  if (!authorization) return null;

  const match = authorization.match(/^Bearer\s+(\S+)$/i);
  return match?.[1] ?? null;
};

const getUserId = (token: string): string => {
  const decoded = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });

  if (typeof decoded === 'string' || typeof decoded.id !== 'string' || !decoded.id) {
    throw new Error('JWT does not contain a valid user id');
  }

  return decoded.id;
};

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = getBearerToken(authHeader);
  if (!token) {
    return res.status(401).json({ success: false, error: 'Missing authorization header' });
  }

  try {
    req.userId = getUserId(token);
    return next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

// Public discovery may include a valid existing JWT to expose the caller's
// RSVP state without making event browsing itself a protected operation.
export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const token = getBearerToken(req.headers.authorization);
  if (!token) return next();

  try {
    req.userId = getUserId(token);
  } catch {
    // Keep the existing public-discovery behavior for stale or malformed tokens.
  }
  return next();
};
