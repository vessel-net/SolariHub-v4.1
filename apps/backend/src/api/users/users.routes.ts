import { Router } from 'express';
import {
  getUser,
  getCurrentUser,
  updateUser,
  updateCurrentUser,
  updateUserProfile,
  updateCurrentUserProfile,
  deleteUser,
  getUsers,
  searchUsers,
  getUserStats,
  verifyUserEmail,
  checkEmailAvailability,
} from './users.controller';
import {
  authenticateToken,
  requireAdmin,
  requireOwnershipOrAdmin,
  requireJSON,
} from '../middleware/auth.middleware';

const router = Router();

// Public endpoints
router.get('/check-email', checkEmailAvailability);

// All other routes require authentication
router.use(authenticateToken);

// Current user endpoints (self-service)
router.get('/me', getCurrentUser);
router.put('/me', requireJSON, updateCurrentUser);
router.put('/me/profile', requireJSON, updateCurrentUserProfile);

// Admin-only endpoints
router.get('/', requireAdmin, getUsers);
router.get('/search', requireAdmin, searchUsers);
router.get('/stats', requireAdmin, getUserStats);

// User management endpoints with proper authorization
router.get('/:id', requireOwnershipOrAdmin, getUser);
router.put('/:id', requireAdmin, requireJSON, updateUser);
router.put('/:id/profile', requireOwnershipOrAdmin, requireJSON, updateUserProfile);
router.delete('/:id', requireAdmin, deleteUser);
router.post('/:id/verify-email', requireAdmin, verifyUserEmail);

export default router; 