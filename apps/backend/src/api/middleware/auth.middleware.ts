import { Request, Response, NextFunction } from 'express';
import { authService, TokenPayload } from '../../services/auth.service';
import { userService } from '../../services/user.service';
import { AuthenticationError, AuthorizationError } from '../../utils/errors';
import { logger } from '../../utils/logger';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      userId?: string;
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AuthenticationError('Access token required');
    }

    const decoded = await authService.verifyToken(token);
    req.user = decoded;
    req.userId = decoded.userId;

    next();
  } catch (error) {
    logger.warn('Authentication failed:', error, {
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    next(error);
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = await authService.verifyToken(token);
      req.user = decoded;
      req.userId = decoded.userId;
    }

    next();
  } catch (error) {
    // For optional auth, continue without user if token is invalid
    logger.debug('Optional authentication failed:', error, {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    next();
  }
};

export const requireRole = (roles: string | string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      const requiredRoles = Array.isArray(roles) ? roles : [roles];
      
      if (!requiredRoles.includes(req.user.role)) {
        throw new AuthorizationError(`Access denied. Required role: ${roles}`);
      }

      next();
    } catch (error) {
      logger.warn('Authorization failed:', error, {
        userId: req.user?.userId,
        userRole: req.user?.role,
        requiredRoles: roles,
        path: req.path,
        method: req.method,
        ip: req.ip,
      });
      next(error);
    }
  };
};

export const requireAdmin = requireRole('admin');

export const requireSeller = requireRole(['seller', 'admin']);

export const requireBuyer = requireRole(['buyer', 'admin']);

export const requireLogistics = requireRole(['logistics', 'admin']);

export const requireFinance = requireRole(['finance', 'admin']);

export const requireOwnershipOrAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const resourceUserId = req.params.userId || req.params.id;
    
    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // User can only access their own resources
    if (req.user.userId !== resourceUserId) {
      throw new AuthorizationError('Access denied. You can only access your own resources');
    }

    next();
  } catch (error) {
    logger.warn('Ownership authorization failed:', error, {
      userId: req.user?.userId,
      resourceUserId: req.params.userId || req.params.id,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    next(error);
  }
};

export const checkEmailVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const user = await userService.getUserById(req.user.userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    if (!user.email_verified) {
      throw new AuthorizationError('Email verification required');
    }

    next();
  } catch (error) {
    logger.warn('Email verification check failed:', error, {
      userId: req.user?.userId,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    next(error);
  }
};

export const rateLimitByUser = (maxRequests: number, windowMinutes: number) => {
  const userRequests = new Map<string, { count: number; resetTime: number }>();

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId || req.ip || 'anonymous';
      const now = Date.now();
      const windowMs = windowMinutes * 60 * 1000;

      const userLimit = userRequests.get(userId);

      if (!userLimit || now > userLimit.resetTime) {
        userRequests.set(userId, {
          count: 1,
          resetTime: now + windowMs,
        });
        return next();
      }

      if (userLimit.count >= maxRequests) {
        const resetTimeInSeconds = Math.ceil((userLimit.resetTime - now) / 1000);
        
        logger.warn('Rate limit exceeded by user:', {
          userId: req.user?.userId,
          ip: req.ip,
          path: req.path,
          method: req.method,
          requestCount: userLimit.count,
          maxRequests,
          resetIn: resetTimeInSeconds,
        });

        res.status(429).json({
          success: false,
          error: {
            message: 'Too many requests',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: resetTimeInSeconds,
          },
        });
        return;
      }

      userLimit.count++;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const logRequest = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.userId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
  });

  next();
};

export const validateApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return next(new AuthenticationError('API key required'));
  }

  // TODO: Implement API key validation logic
  // For now, just pass through
  next();
};

// Middleware to extract user IP address (considering proxies)
export const extractRealIP = (req: Request, res: Response, next: NextFunction): void => {
  const forwarded = req.headers['x-forwarded-for'] as string;
  const realIP = forwarded ? forwarded.split(',')[0].trim() : req.connection.remoteAddress;
  
  // Override req.ip with the real IP
  (req as any).ip = realIP;
  
  next();
};

// Middleware to validate request content type
export const requireContentType = (contentType: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestContentType = req.headers['content-type'];
    
    if (!requestContentType || !requestContentType.includes(contentType)) {
      return next(new Error(`Content-Type must be ${contentType}`));
    }
    
    next();
  };
};

export const requireJSON = requireContentType('application/json'); 