import { Router } from 'express';
import { AnalyticsController } from './controllers/analytics.controller';
import { requireAuth } from '../../middleware/auth';
import { requireTenantRole } from '../../middleware/tenant';

const router = Router();

// ==========================================
// TRACKING (Called by Consumer App)
// No Enterprise Auth Required
// ==========================================
router.post('/impression', AnalyticsController.trackImpression);
router.post('/click', AnalyticsController.trackClick);

// ==========================================
// DASHBOARD (Called by Enterprise Portal)
// Requires Auth & Tenant Validation
// ==========================================
router.get(
  '/campaign/:campaignId', 
  requireAuth,
  requireTenantRole([]), // Any member can view analytics
  AnalyticsController.getCampaignAnalytics
);

router.get(
  '/organization/:organizationId/summary',
  requireAuth,
  requireTenantRole([]), // Any member can view summary
  AnalyticsController.getOrganizationSummary
);

export default router;
