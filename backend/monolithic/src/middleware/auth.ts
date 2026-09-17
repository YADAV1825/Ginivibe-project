import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { JWT_ALGORITHM, JWT_SECRET } from '../config/auth';

export interface AuthRequest extends Request {
  userId?: string;
}

const getBearerToken = (authorization: string | undefined): string | null => {
  if (!authorization) return null;
  const match = authorization.match(/^Bearer\s+(\S+)$/i);
  return match?.[1] ?? null;
};

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = getBearerToken(req.headers.authorization);
  if (!token) return res.status(401).json({ error: 'Missing authorization header' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] }) as jwt.JwtPayload;
    if (typeof decoded.id !== 'string' || !decoded.id) throw new Error('bad payload');
    req.userId = decoded.id;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};