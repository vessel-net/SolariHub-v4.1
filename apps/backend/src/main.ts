/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

// Configuration and services
import { config } from './config/environment';
import { databaseService } from './services/database.service';
import { logger, morganStream, morganFormat } from './utils/logger';
import { 
  globalErrorHandler, 
  notFoundHandler, 
  setupProcessHandlers,
  gracefulShutdown 
} from './utils/errors';

// Routes
import healthRoutes from './api/health/health.routes';
import authRoutes from './api/auth/auth.routes';
import userRoutes from './api/users/users.routes';

// Middleware
import { extractRealIP, logRequest } from './api/middleware/auth.middleware';

class SolariHubServer {
  private app: express.Application;
  private server: any;

  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: config.isProduction,
      crossOriginEmbedderPolicy: config.isProduction,
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.isProduction 
        ? [config.frontendUrl, 'https://solarihub.com', 'https://www.solarihub.com']
        : true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Requested-With'],
    }));

    // Rate limiting
    const rateLimiter = rateLimit({
      windowMs: config.security.rateLimitWindowMs,
      max: config.security.rateLimitMaxRequests,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: {
          message: 'Too many requests from this IP, please try again later',
          code: 'RATE_LIMIT_EXCEEDED',
        },
      },
    });

    this.app.use(rateLimiter);

    // Body parsing middleware
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req, res, buf) => {
        try {
          JSON.parse(buf.toString());
        } catch (e) {
          throw new Error('Invalid JSON');
        }
      }
    }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression
    this.app.use(compression());

    // Request logging
    this.app.use(morgan(morganFormat, { stream: morganStream }));

    // Custom middleware
    this.app.use(extractRealIP);
    this.app.use(logRequest);

    // Trust proxy (for accurate IP addresses)
    this.app.set('trust proxy', 1);
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use(`${config.apiPrefix}/health`, healthRoutes);
    this.app.use(`${config.apiPrefix}/auth`, authRoutes);
    this.app.use(`${config.apiPrefix}/users`, userRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Welcome to SolariHub API v4.1',
        version: '4.1.0',
        environment: config.nodeEnv,
        documentation: `${config.frontendUrl}/docs`,
        endpoints: {
          health: `${config.apiPrefix}/health`,
          auth: `${config.apiPrefix}/auth`,
          users: `${config.apiPrefix}/users`,
        },
        timestamp: new Date().toISOString(),
      });
    });

    // API documentation endpoint
    this.app.get(`${config.apiPrefix}`, (req, res) => {
      res.json({
        success: true,
        message: 'SolariHub CleanTech Ecosystem API',
        version: '4.1.0',
        environment: config.nodeEnv,
        features: [
          'User Management & Authentication',
          'Role-Based Access Control',
          'Database Integration (PostgreSQL, MongoDB, Redis)',
          'Comprehensive Logging & Monitoring',
          'Rate Limiting & Security',
          'Health Checks & Metrics',
        ],
        endpoints: {
          health: {
            ping: 'GET /health/ping',
            status: 'GET /health/status',
            liveness: 'GET /health/liveness',
            readiness: 'GET /health/readiness',
            system: 'GET /health/system (admin)',
            database: 'GET /health/database (admin)',
          },
          auth: {
            register: 'POST /auth/register',
            login: 'POST /auth/login',
            logout: 'POST /auth/logout',
            refresh: 'POST /auth/refresh',
            profile: 'GET /auth/profile',
            changePassword: 'POST /auth/change-password',
            forgotPassword: 'POST /auth/forgot-password',
            resetPassword: 'POST /auth/reset-password',
          },
          users: {
            me: 'GET /users/me',
            updateMe: 'PUT /users/me',
            list: 'GET /users (admin)',
            search: 'GET /users/search (admin)',
            stats: 'GET /users/stats (admin)',
            getUser: 'GET /users/:id',
            updateUser: 'PUT /users/:id (admin)',
            deleteUser: 'DELETE /users/:id (admin)',
          },
        },
        documentation: 'https://docs.solarihub.com',
        support: 'support@solarihub.com',
        timestamp: new Date().toISOString(),
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler for undefined routes
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(globalErrorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Initialize database connections
      logger.info('Initializing database connections...');
      await databaseService.initialize();

      // Start HTTP server
      this.server = this.app.listen(config.port, () => {
        logger.info(`🚀 SolariHub API v4.1 started successfully!`, {
          port: config.port,
          environment: config.nodeEnv,
          apiPrefix: config.apiPrefix,
          timestamp: new Date().toISOString(),
        });

        logger.info('📊 Server Information:', {
          nodeVersion: process.version,
          platform: process.platform,
          architecture: process.arch,
          pid: process.pid,
          uptime: process.uptime(),
        });

        logger.info('🔗 Available Endpoints:', {
          health: `http://localhost:${config.port}${config.apiPrefix}/health`,
          auth: `http://localhost:${config.port}${config.apiPrefix}/auth`,
          users: `http://localhost:${config.port}${config.apiPrefix}/users`,
          docs: `http://localhost:${config.port}${config.apiPrefix}`,
        });

        if (config.isDevelopment) {
          logger.info('🧪 Development Mode Active:', {
            devFeatures: [
              'Detailed error messages',
              'CORS enabled for all origins',
              'Extended logging',
              'Hot reload support',
            ],
          });
        }
      });

      // Setup graceful shutdown
      const shutdown = gracefulShutdown(this.server);
      process.on('SIGTERM', () => shutdown('SIGTERM'));
      process.on('SIGINT', () => shutdown('SIGINT'));

      // Setup process error handlers
      setupProcessHandlers();

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    logger.info('Shutting down SolariHub API...');
    
    try {
      // Close database connections
      await databaseService.shutdown();
      
      // Close HTTP server
      if (this.server) {
        this.server.close();
      }
      
      logger.info('SolariHub API shutdown completed');
    } catch (error) {
      logger.error('Error during shutdown:', error);
      throw error;
    }
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Create and start server
const server = new SolariHubServer();

// Start server if not in test environment
if (config.nodeEnv !== 'test') {
  server.start().catch((error) => {
    logger.error('Failed to start SolariHub API:', error);
    process.exit(1);
  });
}

// Export for testing
export default server;
export { SolariHubServer };
