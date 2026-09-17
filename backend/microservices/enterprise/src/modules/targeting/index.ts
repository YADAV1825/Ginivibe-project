import { Router } from 'express';
import { TargetingController } from './controllers/targeting.controller';
import { requireAuth } from '../../middleware/auth';
import { requireTenantRole } from '../../middleware/tenant';

const router = Router();

// Require valid JWT and Organization Membership for all targeting routes
router.use(requireAuth);
router.use(requireTenantRole([]));

router.post(
  '/', 
  requireTenantRole(['OWNER', 'ADMIN', 'CAMPAIGN_MANAGER']), 
  TargetingController.updateTargeting
);

router.get('/:campaignId', TargetingController.getTargeting);

export default router;
