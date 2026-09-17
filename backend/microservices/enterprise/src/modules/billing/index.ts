import { Router } from 'express';
import { BillingController } from './controllers/billing.controller';
import { requireAuth } from '../../middleware/auth';
import { requireTenantRole } from '../../middleware/tenant';

const router = Router();

// Require valid JWT and Organization Membership for all billing routes
router.use(requireAuth);

router.get(
  '/profile', 
  requireTenantRole(['OWNER', 'ADMIN', 'CAMPAIGN_MANAGER']), 
  BillingController.getProfile
);

router.post(
  '/add-funds', 
  requireTenantRole(['OWNER', 'ADMIN']), // Only Owners/Admins can add funds
  BillingController.addFunds
);

export default router;
