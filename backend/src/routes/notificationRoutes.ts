import { Router } from 'express';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getNotifications);
router.patch('/:id/read', authenticate, markNotificationAsRead);
router.patch('/read-all', authenticate, markAllNotificationsAsRead);

export default router;
