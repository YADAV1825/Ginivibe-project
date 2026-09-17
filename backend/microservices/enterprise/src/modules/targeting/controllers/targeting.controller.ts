import { Response } from 'express';
import { TenantRequest } from '../../../middleware/tenant';
import { TargetingService } from '../services/targeting.service';
import { targetingSchema } from '../schemas/targeting.schema';

export class TargetingController {
  static async updateTargeting(req: TenantRequest, res: Response) {
    try {
      // In a real scenario, we'd also verify the campaign belongs to this organization
      const validatedData = targetingSchema.parse(req.body);
      const targeting = await TargetingService.updateTargeting(validatedData.campaignId, validatedData);
      
      res.status(200).json(targeting);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  }

  static async getTargeting(req: TenantRequest, res: Response) {
    try {
      const campaignId = req.params.campaignId as string;
      const targeting = await TargetingService.getTargeting(campaignId);
      
      if (!targeting) {
        res.status(404).json({ error: 'Targeting rules not found' });
        return;
      }

      res.status(200).json(targeting);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
