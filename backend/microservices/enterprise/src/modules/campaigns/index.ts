import { Router } from 'express';
import { CampaignController } from './controllers/campaign.controller';
import { requireAuth } from '../../middleware/auth';
import { requireTenantRole } from '../../middleware/tenant';

const router = Router();

// Require valid JWT and Organization Membership for all campaign routes
router.use(requireAuth);
// Empty array means any role in the org can access by default. 
// For creating campaigns, we restrict it to Campaign Managers, Admins, and Owners.
router.use(requireTenantRole([]));

router.post(
  '/', 
  requireTenantRole(['OWNER', 'ADMIN', 'CAMPAIGN_MANAGER']), 
  CampaignController.createCampaign
);

router.patch(
  '/:id/status',
  requireTenantRole(['OWNER', 'ADMIN', 'CAMPAIGN_MANAGER']),
  CampaignController.updateCampaignStatus
);

router.get('/', CampaignController.getCampaigns);

export default router;
