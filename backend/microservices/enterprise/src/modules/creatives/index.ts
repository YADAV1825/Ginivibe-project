import { Router } from 'express';
import { CreativeController } from './controllers/creative.controller';
import { requireAuth } from '../../middleware/auth';
import { requireTenantRole } from '../../middleware/tenant';

const router = Router();

// Require valid JWT and Organization Membership for all creative routes
router.use(requireAuth);
router.use(requireTenantRole([]));

router.post(
  '/', 
  requireTenantRole(['OWNER', 'ADMIN', 'CAMPAIGN_MANAGER']), 
  CreativeController.createCreative
);

router.get('/', CreativeController.getCreatives);

export default router;
