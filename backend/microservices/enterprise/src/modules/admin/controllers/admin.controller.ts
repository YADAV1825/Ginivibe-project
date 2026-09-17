import { Response } from 'express';
import { AdminRequest } from '../middleware/admin.guard';
import { AdminService } from '../services/admin.service';
import { AuditService } from '../services/audit.service';

export class AdminController {
  // --- Campaigns ---
  static async getPendingCampaigns(req: AdminRequest, res: Response): Promise<void> {
    try {
      const campaigns = await AdminService.getPendingCampaigns();
      res.status(200).json(campaigns);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async approveCampaign(req: AdminRequest, res: Response): Promise<void> {
    try {
      const campaignId = req.params.id as string;
      const adminId = req.admin!.id;
      
      const campaign = await AdminService.approveCampaign(campaignId, adminId);
      res.status(200).json(campaign);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async rejectCampaign(req: AdminRequest, res: Response): Promise<void> {
    try {
      const campaignId = req.params.id as string;
      const adminId = req.admin!.id;
      const { reason } = req.body;

      if (!reason) {
        res.status(400).json({ error: 'Rejection reason is required' });
        return;
      }
      
      const campaign = await AdminService.rejectCampaign(campaignId, adminId, reason);
      res.status(200).json(campaign);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // --- Organizations ---
  static async getOrganizations(req: AdminRequest, res: Response): Promise<void> {
    try {
      const orgs = await AdminService.getOrganizations();
      res.status(200).json(orgs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async suspendOrganization(req: AdminRequest, res: Response): Promise<void> {
    try {
      const orgId = req.params.id as string;
      const adminId = req.admin!.id;
      
      const org = await AdminService.suspendOrganization(orgId, adminId);
      res.status(200).json(org);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async reactivateOrganization(req: AdminRequest, res: Response): Promise<void> {
    try {
      const orgId = req.params.id as string;
      const adminId = req.admin!.id;
      
      const org = await AdminService.reactivateOrganization(orgId, adminId);
      res.status(200).json(org);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // --- Analytics & Audit ---
  static async getGlobalAnalytics(req: AdminRequest, res: Response): Promise<void> {
    try {
      const stats = await AdminService.getGlobalAnalytics();
      res.status(200).json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getAuditLogs(req: AdminRequest, res: Response): Promise<void> {
    try {
      const logs = await AuditService.getLogs();
      res.status(200).json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
