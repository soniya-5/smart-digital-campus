import { Router } from 'express';
import {
  checkDuplicates,
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignComplaint,
  addComment,
  submitFeedback,
  reopenComplaint,
  verifyCommunityIssue,
} from '../controllers/complaintController';
import { authenticate, requireRole } from '../middleware/auth';
import { uploadSingleImage } from '../middleware/upload';

const router = Router();

// Duplicate check
router.post('/check-duplicate', authenticate, checkDuplicates);

// List and Create
router.get('/', authenticate, getComplaints);
router.post('/', authenticate, uploadSingleImage.single('image'), createComplaint);

// Single details
router.get('/:id', authenticate, getComplaintById);

// Status updates (Staff & Admin)
router.post('/:id/status', authenticate, updateComplaintStatus);

// Admin assignment
router.post('/:id/assign', authenticate, requireRole('ADMIN'), assignComplaint);

// Comments & Notes
router.post('/:id/comments', authenticate, addComment);

// Feedback & Rating
router.post('/:id/feedback', authenticate, submitFeedback);

// Reopen
router.post('/:id/reopen', authenticate, reopenComplaint);

// Community Verification
router.post('/:id/verify', authenticate, verifyCommunityIssue);

export default router;
