import { Response } from 'express';
import { AuthenticatedRequest } from '../../../middleware/auth';
import { OrganizationService } from '../services/organization.service';
import { createOrganizationSchema } from '../schemas/organization.schema';

export class OrganizationController {
  static async createOrganization(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const validatedData = createOrganizationSchema.parse(req.body);
      const org = await OrganizationService.createOrganization(userId, validatedData);
      
      res.status(201).json(org);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  }

  static async getMyOrganizations(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const orgs = await OrganizationService.getUserOrganizations(userId);
      res.status(200).json(orgs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
