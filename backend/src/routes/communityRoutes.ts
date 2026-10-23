import { Router } from 'express';
import {
  getHealthScore,
  getLeaderboard,
  getHotspots,
  getMaintenanceTrends,
} from '../controllers/communityController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/health-score', getHealthScore);
router.get('/leaderboard', getLeaderboard);
router.get('/hotspots', authenticate, getHotspots);
router.get('/trends', authenticate, getMaintenanceTrends);

export default router;
