import { Router } from 'express';
import {
  submitSOSAlert,
  getSOSAlerts,
  acknowledgeSOSAlert,
  resolveSOSAlert,
} from '../controllers/sosController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, submitSOSAlert);
router.get('/', authenticate, getSOSAlerts);
router.patch('/:id/acknowledge', authenticate, requireRole('ADMIN'), acknowledgeSOSAlert);
router.patch('/:id/resolve', authenticate, requireRole('ADMIN'), resolveSOSAlert);

export default router;
