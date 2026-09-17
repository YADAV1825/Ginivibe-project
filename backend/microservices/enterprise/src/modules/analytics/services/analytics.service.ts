import { prisma } from '../../../infrastructure/postgres/client';

export class AnalyticsService {
  // Phase 10: Impression & Click Tracking
  static async trackImpression(data: any) {
    // In V1, we use fixed CPM logic. E.g., ₹10 CPM means ₹0.01 per impression.
    const impressionCost = 0.01;
    
    return await prisma.adImpression.create({
      data: {
        advertisementId: data.advertisementId,
        placementType: data.placementType,
        userId: data.userId,
        impressionCost
      }
    });
  }

  static async trackClick(data: any) {
    // Fixed CPC for V1. E.g., ₹2 per click.
    const clickCost = 2.00;
    
    return await prisma.adClick.create({
      data: {
        advertisementId: data.advertisementId,
        placementType: data.placementType,
        userId: data.userId,
        clickCost
      }
    });
  }

  // Phase 12: Analytics Aggregation
  static async getCampaignAnalytics(campaignId: string) {
    // Raw aggregation for V1. Later, this moves to an aggregation pipeline/table.
    const ads = await prisma.advertisement.findMany({
      where: { campaignId },
      include: {
        _count: {
          select: { impressions: true, clicks: true }
        }
      }
    });

    let totalImpressions = 0;
    let totalClicks = 0;

    for (const ad of ads) {
      totalImpressions += ad._count.impressions;
      totalClicks += ad._count.clicks;
    }

    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    
    // In a real scenario, we'd also sum the clickCost and impressionCost
    // from the raw tables.
    
    return {
      campaignId,
      impressions: totalImpressions,
      clicks: totalClicks,
      ctr: parseFloat(ctr.toFixed(2)),
      spend: (totalImpressions * 0.01) + (totalClicks * 2.00) // Dummy spend calculation
    };
  }

  static async getOrganizationAnalytics(organizationId: string) {
    const campaigns = await prisma.campaign.findMany({
      where: { organizationId },
      include: {
        ads: {
          include: {
            _count: {
              select: { impressions: true, clicks: true }
            }
          }
        }
      }
    });

    let totalImpressions = 0;
    let totalClicks = 0;

    for (const campaign of campaigns) {
      for (const ad of campaign.ads) {
        totalImpressions += ad._count.impressions;
        totalClicks += ad._count.clicks;
      }
    }

    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const spend = (totalImpressions * 0.01) + (totalClicks * 2.00);

    return {
      organizationId,
      impressions: totalImpressions,
      clicks: totalClicks,
      ctr: parseFloat(ctr.toFixed(2)),
      spend
    };
  }
}

