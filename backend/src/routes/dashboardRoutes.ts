import { Router } from 'express';
import {
  getStudentDashboard,
  getStaffDashboard,
  getAdminDashboard,
} from '../controllers/dashboardController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/student', authenticate, getStudentDashboard);
router.get('/staff', authenticate, requireRole('STAFF', 'ADMIN'), getStaffDashboard);
router.get('/admin', authenticate, requireRole('ADMIN'), getAdminDashboard);

export default router;
