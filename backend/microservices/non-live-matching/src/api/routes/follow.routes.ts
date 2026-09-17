import { Router } from 'express';
import { FollowController } from '../controllers/follow.controller';
import { requireAuth } from '../middlewares/requireAuth';

const router = Router();

// Endpoint to send a follow request (optionally with message)
router.post('/request', requireAuth, FollowController.sendFollowRequest);

export default router;
