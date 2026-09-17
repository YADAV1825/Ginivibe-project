import { prisma } from '../../../infrastructure/postgres/client';

export class AuditService {
  static async logAction(
    adminId: string, 
    action: string, 
    resourceType: string, 
    resourceId: string, 
    metadata?: any,
    organizationId?: string
  ) {
    return await prisma.adminAuditLog.create({
      data: {
        adminId,
        action,
        resourceType,
        resourceId,
        metadata,
        organizationId
      }
    });
  }

  static async getLogs(limit = 100) {
    return await prisma.adminAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        admin: {
          select: { email: true, role: true }
        }
      }
    });
  }
}
