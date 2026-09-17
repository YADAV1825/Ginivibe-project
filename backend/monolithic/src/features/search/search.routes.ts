import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { searchRateLimiter } from './search.rateLimiter';
import { SearchController } from './search.controller';

const router = Router();

// GET /api/search/users
router.get(
  '/users',
  requireAuth,
  searchRateLimiter.middleware(),
  SearchController.searchUsers
);

// GET /api/search/autocomplete
router.get(
  '/autocomplete',
  requireAuth,
  searchRateLimiter.middleware(),
  SearchController.autocompleteUsers
);

// GET /api/search/posts
router.get(
  '/posts',
  requireAuth,
  searchRateLimiter.middleware(),
  SearchController.searchPosts
);

// GET /api/search/communities
router.get(
  '/communities',
  requireAuth,
  searchRateLimiter.middleware(),
  SearchController.searchCommunities
);

export default router;
