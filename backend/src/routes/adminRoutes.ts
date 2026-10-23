import { Router } from 'express';
import {
  getUsers,
  updateUserRole,
  getDepartments,
  createDepartment,
  getAuditLogs,
  createStaffAccount,
} from '../controllers/adminController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate, requireRole('ADMIN'));

router.get('/users', getUsers);
router.patch('/users/:id/role', updateUserRole);
router.post('/staff', createStaffAccount);
router.get('/departments', getDepartments);
router.post('/departments', createDepartment);
router.get('/audit-logs', getAuditLogs);

export default router;
