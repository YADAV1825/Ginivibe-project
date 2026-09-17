import { Router } from 'express';
import { AdController } from './controllers/ad.controller';
import { requireAuth } from '../../middleware/auth';
import { requireTenantRole } from '../../middleware/tenant';

const router = Router();

// ==========================================
// AD SERVING (Called by Consumer App)
// No Enterprise Auth Required
// ==========================================
router.post('/serve', AdController.serveAd);

// ==========================================
// AD MANAGEMENT (Called by Enterprise Portal)
// Requires Auth & Tenant Validation
// ==========================================
router.post(
  '/', 
  requireAuth,
  requireTenantRole(['OWNER', 'ADMIN', 'CAMPAIGN_MANAGER']), 
  AdController.createAd
);

router.get(
  '/', 
  requireAuth,
  requireTenantRole([]), // Anyone in org can view ads
  AdController.getAds
);

export default router;
