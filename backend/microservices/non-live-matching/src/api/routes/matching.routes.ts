import { Router } from 'express';
import { MatchingController } from '../controllers/matching.controller';
import { requireAuth } from '../middlewares/requireAuth';

const router = Router();

// Endpoint to retrieve the next best match for the user
router.get('/next', requireAuth, MatchingController.getNextMatch);

// Utility for frontend testing to get a valid user ID
router.get('/test-user', MatchingController.getTestUser);



export default router;
