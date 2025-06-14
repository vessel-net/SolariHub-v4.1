import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  changePassword,
  requestPasswordReset,
  resetPassword,
  getProfile,
  validateToken,
  getActiveSessions,
} from './auth.controller';
import { authenticateToken, requireJSON, rateLimitByUser } from '../middleware/auth.middleware';

const router = Router();

// Public routes (rate limited)
router.post('/register', requireJSON, rateLimitByUser(5, 15), register);
router.post('/login', requireJSON, rateLimitByUser(10, 15), login);
router.post('/refresh', requireJSON, rateLimitByUser(20, 15), refreshToken);
router.post('/forgot-password', requireJSON, rateLimitByUser(3, 60), requestPasswordReset);
router.post('/reset-password', requireJSON, rateLimitByUser(5, 15), resetPassword);

// Protected routes (require authentication)
router.use(authenticateToken);

router.get('/profile', getProfile);
router.get('/validate', validateToken);
router.get('/sessions', getActiveSessions);
router.post('/logout', logout);
router.post('/logout-all', logoutAll);
router.post('/change-password', requireJSON, rateLimitByUser(5, 60), changePassword);

export default router; 