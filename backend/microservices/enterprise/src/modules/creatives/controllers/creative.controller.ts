import { Response } from 'express';
import { TenantRequest } from '../../../middleware/tenant';
import { CreativeService } from '../services/creative.service';
import { createCreativeSchema } from '../schemas/creative.schema';

export class CreativeController {
  static async createCreative(req: TenantRequest, res: Response) {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        res.status(401).json({ error: 'Organization context missing' });
        return;
      }

      const validatedData = createCreativeSchema.parse(req.body);
      const creative = await CreativeService.createCreative(organizationId, validatedData);
      
      res.status(201).json(creative);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  }

  static async getCreatives(req: TenantRequest, res: Response) {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        res.status(401).json({ error: 'Organization context missing' });
        return;
      }

      const creatives = await CreativeService.getCreatives(organizationId);
      res.status(200).json(creatives);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
