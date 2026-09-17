import { Response } from 'express';
import { TenantRequest } from '../../../middleware/tenant';
import { CampaignService } from '../services/campaign.service';
import { createCampaignSchema, updateStatusSchema } from '../schemas/campaign.schema';

export class CampaignController {
  static async createCampaign(req: TenantRequest, res: Response) {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        res.status(401).json({ error: 'Organization context missing' });
        return;
      }

      const validatedData = createCampaignSchema.parse(req.body);
      const campaign = await CampaignService.createCampaign(organizationId, validatedData);
      
      res.status(201).json(campaign);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  }

  static async getCampaigns(req: TenantRequest, res: Response) {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        res.status(401).json({ error: 'Organization context missing' });
        return;
      }

      const campaigns = await CampaignService.getCampaigns(organizationId);
      res.status(200).json(campaigns);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateCampaignStatus(req: TenantRequest, res: Response) {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        res.status(401).json({ error: 'Organization context missing' });
        return;
      }

      const campaignId = req.params.id as string;
      const validatedData = updateStatusSchema.parse(req.body);

      const campaign = await CampaignService.updateCampaignStatus(campaignId, organizationId, validatedData.status);
      res.status(200).json(campaign);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  }
}

