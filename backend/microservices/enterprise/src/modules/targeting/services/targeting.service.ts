import { prisma } from '../../../infrastructure/postgres/client';

export class TargetingService {
  static async updateTargeting(campaignId: string, data: any) {
    // Upsert targeting rules for a campaign
    return await prisma.targetingRule.upsert({
      where: { campaignId },
      update: {
        minAge: data.minAge,
        maxAge: data.maxAge,
        locations: data.locations,
        interests: data.interests,
        genders: data.genders,
        devices: data.devices
      },
      create: {
        campaignId,
        minAge: data.minAge,
        maxAge: data.maxAge,
        locations: data.locations || [],
        interests: data.interests || [],
        genders: data.genders || [],
        devices: data.devices || []
      }
    });
  }

  static async getTargeting(campaignId: string) {
    return await prisma.targetingRule.findUnique({
      where: { campaignId }
    });
  }
}
