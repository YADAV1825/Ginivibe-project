import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { prisma } from '../infrastructure/postgres/client';

export interface TenantRequest extends AuthenticatedRequest {
  organization?: {
    id: string;
    role: string;
  };
}

export const requireTenantRole = (allowedRoles: string[]) => {
  return async (req: TenantRequest, res: Response, next: NextFunction) => {
    const organizationId = req.headers['x-organization-id'] as string;

    if (!organizationId) {
      res.status(400).json({ error: 'Missing x-organization-id header' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const membership = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId: req.user.id
          }
        }
      });

      if (!membership) {
        res.status(403).json({ error: 'Forbidden: Not a member of this organization' });
        return;
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(membership.role)) {
        res.status(403).json({ error: 'Forbidden: Insufficient role permissions' });
        return;
      }

      req.organization = {
        id: organizationId,
        role: membership.role
      };

      next();
    } catch (error) {
      console.error('[Tenant Middleware Error]', error);
      res.status(500).json({ error: 'Internal Server Error validating tenant access' });
    }
  };
};
