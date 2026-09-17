import { Router } from 'express';
import { OrganizationController } from './controllers/organization.controller';
import { requireAuth } from '../../middleware/auth';
import { requireTenantRole } from '../../middleware/tenant';

const router = Router();

// Require valid JWT for all organization routes
router.use(requireAuth);

router.post('/', OrganizationController.createOrganization);
router.get('/', OrganizationController.getMyOrganizations);

// Example of a route requiring a specific RBAC role
// router.delete('/:id', requireTenantRole(['OWNER']), OrganizationController.deleteOrganization);

export default router;
