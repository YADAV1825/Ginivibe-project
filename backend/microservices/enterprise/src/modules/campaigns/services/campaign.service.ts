import { prisma } from '../../../infrastructure/postgres/client';

export class CampaignService {
  static async createCampaign(organizationId: string, data: any) {
    return await prisma.campaign.create({
      data: {
        organizationId,
        name: data.name,
        objective: data.objective,
        budget: data.budget,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null
      }
    });
  }

  static async getCampaigns(organizationId: string) {
    return await prisma.campaign.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async updateCampaignStatus(campaignId: string, organizationId: string, status: any) {
    // Ensure the campaign actually belongs to this organization
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId }
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // SECURITY: A tenant can NEVER set their own campaign to ACTIVE or REJECTED.
    // That is strictly the responsibility of the Admin Control Plane.
    if (status === 'ACTIVE' || status === 'REJECTED') {
      throw new Error(`Unauthorized status transition. Tenants cannot set status to ${status}.`);
    }

    // Only allow logical transitions (e.g., DRAFT -> PENDING_REVIEW)
    if (campaign.status === 'DRAFT' && status !== 'PENDING_REVIEW') {
      throw new Error('A DRAFT campaign must be submitted for review (PENDING_REVIEW).');
    }

    return await prisma.campaign.update({
      where: { id: campaignId },
      data: { status }
    });
  }
}

