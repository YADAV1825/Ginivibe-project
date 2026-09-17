import { Request, Response } from 'express';
import { TenantRequest } from '../../../middleware/tenant';
import { AnalyticsService } from '../services/analytics.service';
import { impressionSchema, clickSchema } from '../schemas/analytics.schema';

export class AnalyticsController {
  // Tracking endpoints (High QPS, no auth required)
  static async trackImpression(req: Request, res: Response) {
    try {
      const validatedData = impressionSchema.parse(req.body);
      // We don't await this in production to keep the response extremely fast
      // (Fire and forget, or push to Event Bus)
      await AnalyticsService.trackImpression(validatedData);
      res.status(202).send();
    } catch (error) {
      res.status(400).send();
    }
  }

  static async trackClick(req: Request, res: Response) {
    try {
      const validatedData = clickSchema.parse(req.body);
      await AnalyticsService.trackClick(validatedData);
      res.status(202).send();
    } catch (error) {
      res.status(400).send();
    }
  }

  // Dashboard endpoint (Auth required)
  static async getCampaignAnalytics(req: TenantRequest, res: Response) {
    try {
      const campaignId = req.params.campaignId as string;
      const analytics = await AnalyticsService.getCampaignAnalytics(campaignId);
      res.status(200).json(analytics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getOrganizationSummary(req: TenantRequest, res: Response) {
    try {
      // Accessing organization ID properly
      const orgId = req.params.organizationId as string;
      if (!orgId) {
        res.status(400).json({ error: 'Organization ID is required' });
        return;
      }
      const summary = await AnalyticsService.getOrganizationAnalytics(orgId);
      res.status(200).json(summary);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

