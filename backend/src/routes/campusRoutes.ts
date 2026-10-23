import { Router } from 'express';
import {
  getMarketplaceListings,
  createMarketplaceListing,
  updateMarketplaceListing,
  deleteMarketplaceListing,
  getStudyGroups,
  createStudyGroup,
  joinStudyGroup,
  leaveStudyGroup,
  getFacilityRatings,
  submitFacilityRating,
  getLostAndFound,
  createLostAndFound,
  updateLostAndFoundStatus,
  getCanteenMenu,
  createCanteenItem,
  updateCanteenItem,
  deleteCanteenItem,
} from '../controllers/campusModulesController';
import { authenticate, requireRole } from '../middleware/auth';
import { uploadSingleImage } from '../middleware/upload';

const router = Router();

// Marketplace
router.get('/marketplace', getMarketplaceListings);
router.post('/marketplace', authenticate, uploadSingleImage.single('image'), createMarketplaceListing);
router.put('/marketplace/:id', authenticate, uploadSingleImage.single('image'), updateMarketplaceListing);
router.delete('/marketplace/:id', authenticate, deleteMarketplaceListing);

// Study Groups
router.get('/study-groups', getStudyGroups);
router.post('/study-groups', authenticate, createStudyGroup);
router.post('/study-groups/:id/join', authenticate, joinStudyGroup);
router.post('/study-groups/:id/leave', authenticate, leaveStudyGroup);

// Facility Ratings
router.get('/ratings', getFacilityRatings);
router.post('/ratings', authenticate, submitFacilityRating);

// Lost and Found
router.get('/lost-found', getLostAndFound);
router.post('/lost-found', authenticate, uploadSingleImage.single('image'), createLostAndFound);
router.patch('/lost-found/:id/status', authenticate, updateLostAndFoundStatus);

// Canteen Menu
router.get('/canteen', getCanteenMenu);
router.post('/canteen', authenticate, requireRole('ADMIN'), uploadSingleImage.single('image'), createCanteenItem);
router.put('/canteen/:id', authenticate, requireRole('ADMIN'), uploadSingleImage.single('image'), updateCanteenItem);
router.delete('/canteen/:id', authenticate, requireRole('ADMIN'), deleteCanteenItem);

export default router;
