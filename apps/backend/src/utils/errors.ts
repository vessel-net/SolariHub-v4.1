import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

// Custom error classes
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(message: string, statusCode = 500, isOperational = true, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 400, true, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, true, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, true, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, true, 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, true, 'CONFLICT_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, true, 'RATE_LIMIT_ERROR');
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500, true, 'DATABASE_ERROR');
  }
}

export class ExternalServiceError extends AppError {
  constructor(message = 'External service unavailable') {
    super(message, 502, true, 'EXTERNAL_SERVICE_ERROR');
  }
}

// Error response interface
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    statusCode: number;
    timestamp: string;
    path?: string;
    details?: any;
    stack?: string;
  };
}

// Create standardized error response
export const createErrorResponse = (
  error: AppError | Error,
  path?: string,
  details?: any
): ErrorResponse => {
  const isAppError = error instanceof AppError;

  return {
    success: false,
    error: {
      message: error.message,
      code: isAppError ? error.code : 'INTERNAL_ERROR',
      statusCode: isAppError ? error.statusCode : 500,
      timestamp: new Date().toISOString(),
      path,
      details,
      // Only include stack trace in development
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
  };
};

// Global error handler middleware
export const globalErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let appError: AppError;

  // Convert known errors to AppError
  if (error instanceof AppError) {
    appError = error;
  } else if (error.name === 'ValidationError') {
    appError = new ValidationError(error.message);
  } else if (error.name === 'CastError') {
    appError = new ValidationError('Invalid ID format');
  } else if (error.name === 'MongoError' && (error as any).code === 11000) {
    appError = new ConflictError('Duplicate field value');
  } else if (error.name === 'JsonWebTokenError') {
    appError = new AuthenticationError('Invalid token');
  } else if (error.name === 'TokenExpiredError') {
    appError = new AuthenticationError('Token expired');
  } else {
    // Unknown error - log it and create generic error
    logger.error('Unhandled error:', error);
    appError = new AppError(
      process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      500,
      false
    );
  }

  // Log operational errors as warnings, programming errors as errors
  if (appError.isOperational) {
    logger.warn(`Operational error: ${appError.message}`, {
      statusCode: appError.statusCode,
      code: appError.code,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
  } else {
    logger.error(`Programming error: ${appError.message}`, {
      statusCode: appError.statusCode,
      code: appError.code,
      stack: appError.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
  }

  // Send error response
  const errorResponse = createErrorResponse(appError, req.path);
  res.status(appError.statusCode).json(errorResponse);
};

// 404 handler for undefined routes
export const notFoundHandler = (req: Request, res: Response, _next: NextFunction): void => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  _next(error);
};

// Async error wrapper - catches async errors and passes to error handler
export const catchAsync = (fn: (...args: any[]) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Graceful shutdown handler
export const gracefulShutdown = (server: any) => {
  return (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    server.close((err: Error) => {
      if (err) {
        logger.error('Error during server shutdown:', err);
        process.exit(1);
      }

      logger.info('Server closed successfully');
      process.exit(0);
    });

    // Force close after 30 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  };
};

// Handle uncaught exceptions and unhandled rejections
export const setupProcessHandlers = (): void => {
  process.on('uncaughtException', (error: Error) => {
    logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('UNHANDLED REJECTION! 💥 Shutting down...', {
      reason,
      promise,
    });
    process.exit(1);
  });

  process.on('SIGTERM', () => {
    logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
    // Graceful shutdown logic here
  });

  process.on('SIGINT', () => {
    logger.info('👋 SIGINT RECEIVED. Shutting down gracefully');
    // Graceful shutdown logic here
  });
};

// Validation helper functions
export const validateRequired = (value: any, fieldName: string): void => {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`);
  }
};

export const validateEmail = (email: string): void => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
};

export const validatePassword = (password: string): void => {
  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    throw new ValidationError(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    );
  }
};

export const validateUUID = (id: string): void => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new ValidationError('Invalid ID format');
  }
};
