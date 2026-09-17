import { Request, Response } from 'express';
import { TenantRequest } from '../../../middleware/tenant';
import { AdManagementService } from '../services/ad-management.service';
import { AdServingService } from '../services/ad-serving.service';
import { createAdSchema, adRequestSchema } from '../schemas/ad.schema';

export class AdController {
  // --------------------------------------------------------
  // ENTERPRISE MANAGEMENT PORTAL ENDPOINTS
  // --------------------------------------------------------
  static async createAd(req: TenantRequest, res: Response) {
    try {
      const validatedData = createAdSchema.parse(req.body);
      // In production, ensure campaign and creative belong to req.organization
      const ad = await AdManagementService.createAd(validatedData);
      res.status(201).json(ad);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  }

  static async getAds(req: TenantRequest, res: Response) {
    try {
      const campaignId = req.query.campaignId as string;
      if (!campaignId) {
        res.status(400).json({ error: 'campaignId query param required' });
        return;
      }
      const ads = await AdManagementService.getAdsByCampaign(campaignId);
      res.status(200).json(ads);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // --------------------------------------------------------
  // CONSUMER AD SERVING ENDPOINT (High QPS)
  // --------------------------------------------------------
  static async serveAd(req: Request, res: Response) {
    try {
      // This endpoint is hit by GiniVibe frontend/mobile apps, NOT enterprise portal
      const validatedData = adRequestSchema.parse(req.body);
      const adDecision = await AdServingService.serveAd(validatedData);
      
      if (!adDecision) {
        res.status(204).send(); // No content (no ad eligible)
        return;
      }

      res.status(200).json(adDecision);
    } catch (error: any) {
      console.error('[Ad Serving Error]', error);
      res.status(500).json({ error: 'Internal ad serving failure' });
    }
  }
}
