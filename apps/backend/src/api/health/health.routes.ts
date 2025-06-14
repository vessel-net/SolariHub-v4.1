import { Router } from 'express';
import {
  getHealthStatus,
  getReadiness,
  getLiveness,
  getSystemInfo,
  getDatabaseStatus,
  ping,
} from './health.controller';
import { requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public health endpoints (for load balancers, monitoring systems)
router.get('/ping', ping);
router.get('/liveness', getLiveness);
router.get('/readiness', getReadiness);
router.get('/status', getHealthStatus);

// Protected endpoints (require admin role)
router.get('/system', requireAdmin, getSystemInfo);
router.get('/database', requireAdmin, getDatabaseStatus);

export default router; 