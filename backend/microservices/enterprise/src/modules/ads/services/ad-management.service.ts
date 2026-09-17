import { prisma } from '../../../infrastructure/postgres/client';

export class AdManagementService {
  static async createAd(data: any) {
    return await prisma.$transaction(async (tx) => {
      const ad = await tx.advertisement.create({
        data: {
          campaignId: data.campaignId,
          creativeId: data.creativeId,
          name: data.name,
          status: 'ACTIVE' // Defaulting to ACTIVE for V1 simplicity
        }
      });

      // Map placements
      if (data.placements && data.placements.length > 0) {
        await tx.adPlacement.createMany({
          data: data.placements.map((placement: string) => ({
            advertisementId: ad.id,
            placementType: placement as any
          }))
        });
      }

      return ad;
    });
  }

  static async getAdsByCampaign(campaignId: string) {
    return await prisma.advertisement.findMany({
      where: { campaignId },
      include: {
        creative: true,
        placements: true
      }
    });
  }
}
