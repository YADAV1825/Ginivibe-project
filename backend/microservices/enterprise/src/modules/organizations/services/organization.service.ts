import { prisma } from '../../../infrastructure/postgres/client';

export class OrganizationService {
  static async createOrganization(userId: string, data: { name: string }) {
    // Run in a transaction: create org and add user as OWNER
    return await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: data.name
        }
      });

      await tx.organizationMember.create({
        data: {
          organizationId: org.id,
          userId: userId,
          role: 'OWNER'
        }
      });

      return org;
    });
  }

  static async getUserOrganizations(userId: string) {
    const memberships = await prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: true
      }
    });

    return memberships.map(m => ({
      ...m.organization,
      role: m.role
    }));
  }
}
