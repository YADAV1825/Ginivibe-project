import { Router } from 'express';
import { AdminAuthController } from './controllers/admin-auth.controller';
import { AdminController } from './controllers/admin.controller';
import { requireAdmin } from './middleware/admin.guard';

const router = Router();

// Public route for Admin Login
router.post('/auth/login', AdminAuthController.login);

// Protect all following routes
router.use(requireAdmin()); // Requires at least a valid ADMIN token

// --- Campaigns (Approvals) ---
// We can scope this so only SUPER_ADMIN or REVIEWER can hit it
router.get(
  '/campaigns/pending', 
  requireAdmin(['SUPER_ADMIN', 'REVIEWER', 'PLATFORM_ADMIN']),
  AdminController.getPendingCampaigns
);
router.post(
  '/campaigns/:id/approve', 
  requireAdmin(['SUPER_ADMIN', 'REVIEWER', 'PLATFORM_ADMIN']),
  AdminController.approveCampaign
);
router.post(
  '/campaigns/:id/reject', 
  requireAdmin(['SUPER_ADMIN', 'REVIEWER', 'PLATFORM_ADMIN']),
  AdminController.rejectCampaign
);

// --- Organizations ---
router.get(
  '/organizations', 
  requireAdmin(['SUPER_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT']),
  AdminController.getOrganizations
);
router.post(
  '/organizations/:id/suspend', 
  requireAdmin(['SUPER_ADMIN', 'PLATFORM_ADMIN']), // Support/Reviewer cannot suspend
  AdminController.suspendOrganization
);
router.post(
  '/organizations/:id/reactivate', 
  requireAdmin(['SUPER_ADMIN', 'PLATFORM_ADMIN']),
  AdminController.reactivateOrganization
);

// --- Analytics ---
router.get(
  '/analytics/global', 
  requireAdmin(['SUPER_ADMIN', 'PLATFORM_ADMIN']),
  AdminController.getGlobalAnalytics
);

// --- Audit Logs ---
router.get(
  '/audit-logs', 
  requireAdmin(['SUPER_ADMIN', 'PLATFORM_ADMIN']), // Only high-level admins can see logs
  AdminController.getAuditLogs
);

export default router;
