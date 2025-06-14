import winston from 'winston';
import { config } from '../config/environment';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston about our custom colors
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
);

// Define different transport configurations
const transports: winston.transport[] = [
  // Console transport for all environments
  new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
  }),
];

// Add file transport for non-test environments
if (config.nodeEnv !== 'test') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create the logger instance
export const logger = winston.createLogger({
  level: config.isDevelopment ? 'debug' : config.logging.level,
  levels,
  format,
  transports,
  exitOnError: false,
});

// Create a stream object with a 'write' function for Morgan HTTP logging
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Request logging format for Morgan
export const morganFormat = config.isDevelopment
  ? 'dev'
  : ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';

// Log uncaught exceptions and unhandled rejections
if (config.isProduction) {
  logger.exceptions.handle(new winston.transports.File({ filename: 'logs/exceptions.log' }));

  logger.rejections.handle(new winston.transports.File({ filename: 'logs/rejections.log' }));
}

// Helper functions for structured logging
export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logError = (message: string, error?: Error | any, meta?: any) => {
  if (error instanceof Error) {
    logger.error(message, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...meta,
    });
  } else {
    logger.error(message, { error, ...meta });
  }
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

// Request/Response logging helper
export const logRequest = (req: any, res: any, message: string) => {
  logger.info(message, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    statusCode: res.statusCode,
    responseTime: res.get('X-Response-Time'),
  });
};

// Database operation logging
export const logDatabaseOperation = (
  operation: string,
  table: string,
  duration?: number,
  meta?: any
) => {
  logger.debug(`Database ${operation}`, {
    table,
    duration: duration ? `${duration}ms` : undefined,
    ...meta,
  });
};

// Authentication logging
export const logAuth = (
  action: string,
  userId?: string,
  email?: string,
  ip?: string,
  success?: boolean
) => {
  logger.info(`Auth: ${action}`, {
    userId,
    email,
    ip,
    success,
    timestamp: new Date().toISOString(),
  });
};

// Performance logging
export const logPerformance = (operation: string, duration: number, meta?: any) => {
  const level = duration > 1000 ? 'warn' : 'info';
  logger.log(level, `Performance: ${operation}`, {
    duration: `${duration}ms`,
    ...meta,
  });
};

export default logger;
