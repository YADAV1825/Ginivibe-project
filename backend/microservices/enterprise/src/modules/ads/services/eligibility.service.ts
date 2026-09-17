import { prisma } from '../../../infrastructure/postgres/client';

export class EligibilityEngine {
  static async findEligibleAds(requestData: any) {
    // 1. Find all active campaigns
    const now = new Date();
    
    // In a real high-scale system, this query would be heavily cached in Redis
    // For V1, we rely on PostgreSQL to filter eligible inventory
    const candidateAds = await prisma.advertisement.findMany({
      where: {
        status: 'ACTIVE',
        placements: {
          some: {
            placementType: requestData.placementType
          }
        },
        campaign: {
          status: 'ACTIVE',
          startDate: { lte: now },
          OR: [
            { endDate: null },
            { endDate: { gte: now } }
          ]
        }
      },
      include: {
        creative: true,
        campaign: {
          include: {
            targeting: true
          }
        }
      }
    });

    // 2. Filter candidates based on targeting rules
    const eligibleAds = candidateAds.filter(ad => {
      const targeting = ad.campaign?.targeting;
      if (!targeting) return true; // No targeting means broadly eligible

      if (targeting.minAge && requestData.userAge && requestData.userAge < targeting.minAge) return false;
      if (targeting.maxAge && requestData.userAge && requestData.userAge > targeting.maxAge) return false;
      
      if (targeting.locations && targeting.locations.length > 0 && requestData.userLocation) {
        if (!targeting.locations.includes(requestData.userLocation)) return false;
      }

      if (targeting.genders && targeting.genders.length > 0 && requestData.userGender) {
        if (!targeting.genders.includes(requestData.userGender)) return false;
      }

      return true;
    });

    return eligibleAds;
  }
}
