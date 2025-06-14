import { Request, Response } from 'express';
import { databaseService } from '../../services/database.service';
import { userService } from '../../services/user.service';
import { config } from '../../config/environment';
import { catchAsync } from '../../utils/errors';
import { logger } from '../../utils/logger';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: {
      postgres: boolean;
      mongodb: boolean;
      redis: boolean;
    };
    api: boolean;
  };
  metrics?: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu?: {
      usage: number;
    };
    database?: {
      connections: number;
    };
  };
}

export const getHealthStatus = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    // Check database health
    const dbHealth = await databaseService.healthCheck();
    
    // Check API health (if we got this far, API is working)
    const apiHealth = true;
    
    // Get memory usage
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal + memUsage.external + memUsage.arrayBuffers;
    
    // Determine overall status
    const allServicesHealthy = dbHealth.postgres && dbHealth.mongodb && dbHealth.redis && apiHealth;
    const someServicesHealthy = dbHealth.postgres || dbHealth.mongodb || dbHealth.redis || apiHealth;
    
    let status: 'healthy' | 'unhealthy' | 'degraded';
    if (allServicesHealthy) {
      status = 'healthy';
    } else if (someServicesHealthy) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }
    
    const healthStatus: HealthStatus = {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: config.nodeEnv,
      services: {
        database: dbHealth,
        api: apiHealth,
      },
      metrics: {
        memory: {
          used: totalMemory,
          total: memUsage.heapTotal,
          percentage: Math.round((totalMemory / memUsage.heapTotal) * 100),
        },
      },
    };
    
    const responseTime = Date.now() - startTime;
    
    logger.debug('Health check completed', {
      status,
      responseTime: `${responseTime}ms`,
      services: healthStatus.services,
    });
    
    const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 207 : 503;
    
    res.status(statusCode).json({
      success: status !== 'unhealthy',
      data: healthStatus,
      responseTime: `${responseTime}ms`,
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      responseTime: `${Date.now() - startTime}ms`,
    });
  }
});

export const getReadiness = catchAsync(async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if all critical services are ready
    const dbHealth = await databaseService.healthCheck();
    
    const isReady = dbHealth.postgres && dbHealth.mongodb && dbHealth.redis;
    
    if (isReady) {
      res.status(200).json({
        success: true,
        status: 'ready',
        timestamp: new Date().toISOString(),
        message: 'Service is ready to accept requests',
      });
    } else {
      res.status(503).json({
        success: false,
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        message: 'Service is not ready',
        services: dbHealth,
      });
    }
  } catch (error) {
    logger.error('Readiness check failed:', error);
    
    res.status(503).json({
      success: false,
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: 'Readiness check failed',
    });
  }
});

export const getLiveness = catchAsync(async (req: Request, res: Response): Promise<void> => {
  try {
    // Simple liveness check - if we can respond, we're alive
    res.status(200).json({
      success: true,
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      message: 'Service is alive',
    });
  } catch (error) {
    logger.error('Liveness check failed:', error);
    
    res.status(503).json({
      success: false,
      status: 'not_alive',
      timestamp: new Date().toISOString(),
      error: 'Liveness check failed',
    });
  }
});

export const getSystemInfo = catchAsync(async (req: Request, res: Response): Promise<void> => {
  try {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Get user stats for metrics
    const userStats = await userService.getUserStats();
    
    const systemInfo = {
      application: {
        name: 'SolariHub Backend',
        version: process.env.npm_package_version || '1.0.0',
        environment: config.nodeEnv,
        uptime: process.uptime(),
        startTime: new Date(Date.now() - process.uptime() * 1000).toISOString(),
      },
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        pid: process.pid,
      },
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      statistics: {
        users: userStats,
      },
    };
    
    res.status(200).json({
      success: true,
      data: systemInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('System info retrieval failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve system information',
      timestamp: new Date().toISOString(),
    });
  }
});

export const getDatabaseStatus = catchAsync(async (req: Request, res: Response): Promise<void> => {
  try {
    const dbHealth = await databaseService.healthCheck();
    
    // Additional database metrics
    const dbStatus = {
      health: dbHealth,
      connections: {
        postgres: {
          total: 10, // From pool config
          idle: 0,   // Would need to implement this
          active: 0, // Would need to implement this
        },
      },
      timestamp: new Date().toISOString(),
    };
    
    const allHealthy = dbHealth.postgres && dbHealth.mongodb && dbHealth.redis;
    const statusCode = allHealthy ? 200 : 503;
    
    res.status(statusCode).json({
      success: allHealthy,
      data: dbStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Database status check failed:', error);
    
    res.status(503).json({
      success: false,
      error: 'Database status check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

export const ping = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  res.status(200).json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString(),
    responseTime: `${Date.now() - startTime}ms`,
  });
}); 