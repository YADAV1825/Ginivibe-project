import { prisma } from '../../../infrastructure/postgres/client';
import { AuditService } from './audit.service';
import { CampaignStatus, OrganizationStatus } from '@prisma/client';

export class AdminService {
  static async getPendingCampaigns() {
    return await prisma.campaign.findMany({
      where: { status: 'PENDING_REVIEW' },
      include: {
        organization: {
          select: { name: true, status: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async approveCampaign(campaignId: string, adminId: string) {
    const campaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'ACTIVE' }
    });

    await AuditService.logAction(
      adminId, 
      'APPROVE_CAMPAIGN', 
      'Campaign', 
      campaignId, 
      { previousState: 'PENDING_REVIEW', newState: 'ACTIVE' },
      campaign.organizationId
    );

    return campaign;
  }

  static async rejectCampaign(campaignId: string, adminId: string, reason: string) {
    const campaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'REJECTED' }
    });

    await AuditService.logAction(
      adminId, 
      'REJECT_CAMPAIGN', 
      'Campaign', 
      campaignId, 
      { previousState: 'PENDING_REVIEW', newState: 'REJECTED', reason },
      campaign.organizationId
    );

    return campaign;
  }

  static async suspendOrganization(organizationId: string, adminId: string) {
    const org = await prisma.organization.update({
      where: { id: organizationId },
      data: { status: 'SUSPENDED' }
    });

    await AuditService.logAction(
      adminId, 
      'SUSPEND_ORGANIZATION', 
      'Organization', 
      organizationId, 
      { previousState: 'ACTIVE', newState: 'SUSPENDED' },
      organizationId
    );

    return org;
  }

  static async reactivateOrganization(organizationId: string, adminId: string) {
    const org = await prisma.organization.update({
      where: { id: organizationId },
      data: { status: 'ACTIVE' }
    });

    await AuditService.logAction(
      adminId, 
      'REACTIVATE_ORGANIZATION', 
      'Organization', 
      organizationId, 
      { previousState: 'SUSPENDED', newState: 'ACTIVE' },
      organizationId
    );

    return org;
  }

  static async getOrganizations() {
    return await prisma.organization.findMany({
      include: {
        _count: {
          select: { campaigns: true, members: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getGlobalAnalytics() {
    const campaigns = await prisma.campaign.findMany({
      include: {
        ads: {
          include: {
            _count: { select: { impressions: true, clicks: true } }
          }
        }
      }
    });

    let totalImpressions = 0;
    let totalClicks = 0;
    let activeCampaigns = 0;

    for (const c of campaigns) {
      if (c.status === 'ACTIVE') activeCampaigns++;
      for (const ad of c.ads) {
        totalImpressions += ad._count.impressions;
        totalClicks += ad._count.clicks;
      }
    }

    const spend = (totalImpressions * 0.01) + (totalClicks * 2.00);

    return {
      totalImpressions,
      totalClicks,
      activeCampaigns,
      totalRevenue: spend
    };
  }
}
