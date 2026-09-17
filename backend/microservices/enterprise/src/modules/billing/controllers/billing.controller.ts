import { Response } from 'express';
import { TenantRequest } from '../../../middleware/tenant';
import { BillingService } from '../services/billing.service';
import { addFundsSchema } from '../schemas/billing.schema';

export class BillingController {
  static async getProfile(req: TenantRequest, res: Response) {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        res.status(401).json({ error: 'Organization context missing' });
        return;
      }

      const profile = await BillingService.getBillingProfile(organizationId);
      res.status(200).json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async addFunds(req: TenantRequest, res: Response) {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        res.status(401).json({ error: 'Organization context missing' });
        return;
      }

      const validatedData = addFundsSchema.parse(req.body);
      const profile = await BillingService.addFunds(organizationId, validatedData.amount);
      
      res.status(200).json(profile);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  }
}
