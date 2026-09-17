import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../infrastructure/postgres/client';
import { PlatformRole } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'ginivibe-super-secret-key';

export interface AdminRequest extends Request {
  admin?: {
    id: string;
    role: PlatformRole;
  };
}

export const requireAdmin = (roles: PlatformRole[] = []) => {
  return async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid authorization header' });
        return;
      }

      const token = authHeader.split(' ')[1];
      let decoded: any;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        res.status(401).json({ error: 'Token is invalid or expired' });
        return;
      }

      // Check if it's an admin token (the payload should specify type: 'ADMIN' and a role)
      if (decoded.type !== 'ADMIN') {
        res.status(403).json({ error: 'Not authorized for Admin Control Plane' });
        return;
      }

      if (roles.length > 0 && !roles.includes(decoded.role as PlatformRole)) {
        res.status(403).json({ error: 'Insufficient platform role' });
        return;
      }

      req.admin = {
        id: decoded.id,
        role: decoded.role as PlatformRole
      };

      next();
    } catch (error) {
      console.error('Admin Auth Error:', error);
      res.status(500).json({ error: 'Internal server error during admin auth' });
    }
  };
};
