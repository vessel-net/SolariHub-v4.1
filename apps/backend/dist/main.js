/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("tslib");

/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = require("express");

/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("cors");

/***/ }),
/* 4 */
/***/ ((module) => {

module.exports = require("helmet");

/***/ }),
/* 5 */
/***/ ((module) => {

module.exports = require("compression");

/***/ }),
/* 6 */
/***/ ((module) => {

module.exports = require("morgan");

/***/ }),
/* 7 */
/***/ ((module) => {

module.exports = require("express-rate-limit");

/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.config = void 0;
const tslib_1 = __webpack_require__(1);
const dotenv_1 = tslib_1.__importDefault(__webpack_require__(9));
const joi_1 = tslib_1.__importDefault(__webpack_require__(10));
// Load environment variables
dotenv_1.default.config();
// Environment validation schema
const envSchema = joi_1.default.object({
    NODE_ENV: joi_1.default.string().valid('development', 'test', 'production').default('development'),
    PORT: joi_1.default.number().positive().default(4000),
    API_PREFIX: joi_1.default.string().default('/api/v1'),
    // Database Configuration
    POSTGRES_HOST: joi_1.default.string().default('localhost'),
    POSTGRES_PORT: joi_1.default.number().positive().default(5432),
    POSTGRES_DB: joi_1.default.string().default('solarihub'),
    POSTGRES_USER: joi_1.default.string().default('solarihub_user'),
    POSTGRES_PASSWORD: joi_1.default.string().default('temp_password'),
    // MongoDB Configuration
    MONGODB_URI: joi_1.default.string().default('mongodb://localhost:27017/solarihub'),
    // Redis Configuration
    REDIS_HOST: joi_1.default.string().default('localhost'),
    REDIS_PORT: joi_1.default.number().positive().default(6379),
    REDIS_PASSWORD: joi_1.default.string().allow('').default(''),
    // JWT Configuration
    JWT_SECRET: joi_1.default.string().min(32).required(),
    JWT_EXPIRES_IN: joi_1.default.string().default('7d'),
    JWT_REFRESH_EXPIRES_IN: joi_1.default.string().default('30d'),
    // Security
    BCRYPT_ROUNDS: joi_1.default.number().positive().default(12),
    RATE_LIMIT_WINDOW_MS: joi_1.default.number().positive().default(900000),
    RATE_LIMIT_MAX_REQUESTS: joi_1.default.number().positive().default(100),
    // External Services
    FRONTEND_URL: joi_1.default.string().uri().default('http://localhost:3000'),
    // Logging
    LOG_LEVEL: joi_1.default.string().valid('error', 'warn', 'info', 'debug').default('info'),
    LOG_FILE: joi_1.default.string().default('logs/app.log'),
    // Email
    FROM_EMAIL: joi_1.default.string().email().default('no-reply@solarihub.net'),
    // Development
    DEV_SEED_DATA: joi_1.default.boolean().default(false),
    DEV_RESET_DB: joi_1.default.boolean().default(false),
}).unknown();
// Validate environment variables
const { error, value: envVars } = envSchema.validate(process.env);
if (error) {
    throw new Error(`Environment validation error: ${error.message}`);
}
// Export validated configuration
exports.config = {
    // Server
    nodeEnv: envVars.NODE_ENV,
    port: envVars.PORT,
    apiPrefix: envVars.API_PREFIX,
    isProduction: envVars.NODE_ENV === 'production',
    isDevelopment: envVars.NODE_ENV === 'development',
    isTest: envVars.NODE_ENV === 'test',
    // Database
    postgres: {
        host: envVars.POSTGRES_HOST,
        port: envVars.POSTGRES_PORT,
        database: envVars.POSTGRES_DB,
        username: envVars.POSTGRES_USER,
        password: envVars.POSTGRES_PASSWORD,
    },
    mongodb: {
        uri: envVars.MONGODB_URI,
    },
    redis: {
        host: envVars.REDIS_HOST,
        port: envVars.REDIS_PORT,
        password: envVars.REDIS_PASSWORD,
    },
    // JWT
    jwt: {
        secret: envVars.JWT_SECRET,
        expiresIn: envVars.JWT_EXPIRES_IN,
        refreshExpiresIn: envVars.JWT_REFRESH_EXPIRES_IN,
    },
    // Security
    security: {
        bcryptRounds: envVars.BCRYPT_ROUNDS,
        rateLimitWindowMs: envVars.RATE_LIMIT_WINDOW_MS,
        rateLimitMaxRequests: envVars.RATE_LIMIT_MAX_REQUESTS,
    },
    // External Services
    frontendUrl: envVars.FRONTEND_URL,
    // Logging
    logging: {
        level: envVars.LOG_LEVEL,
        file: envVars.LOG_FILE,
    },
    // Email
    email: {
        from: envVars.FROM_EMAIL,
    },
    // Development
    development: {
        seedData: envVars.DEV_SEED_DATA,
        resetDb: envVars.DEV_RESET_DB,
    },
};
exports["default"] = exports.config;


/***/ }),
/* 9 */
/***/ ((module) => {

module.exports = require("dotenv");

/***/ }),
/* 10 */
/***/ ((module) => {

module.exports = require("joi");

/***/ }),
/* 11 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.databaseService = exports.DatabaseService = void 0;
const database_1 = __webpack_require__(12);
const logger_1 = __webpack_require__(16);
const errors_1 = __webpack_require__(18);
class DatabaseService {
    static instance;
    isInitialized = false;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() { }
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        try {
            await (0, database_1.initializeDatabases)();
            this.isInitialized = true;
            logger_1.logger.info('Database service initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize database service:', error);
            throw new errors_1.DatabaseError('Database initialization failed');
        }
    }
    async shutdown() {
        try {
            await (0, database_1.closeDatabaseConnections)();
            this.isInitialized = false;
            logger_1.logger.info('Database service shutdown successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to shutdown database service:', error);
            throw new errors_1.DatabaseError('Database shutdown failed');
        }
    }
    async healthCheck() {
        try {
            return await (0, database_1.checkDatabaseHealth)();
        }
        catch (error) {
            logger_1.logger.error('Database health check failed:', error);
            throw new errors_1.DatabaseError('Database health check failed');
        }
    }
    getPostgresPool() {
        return database_1.postgresPool;
    }
    isHealthy() {
        return this.isInitialized;
    }
}
exports.DatabaseService = DatabaseService;
exports.databaseService = DatabaseService.getInstance();


/***/ }),
/* 12 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.checkDatabaseHealth = exports.closeDatabaseConnections = exports.initializeDatabases = exports.connectRedis = exports.redisClient = exports.connectMongoDB = exports.postgresPool = void 0;
const tslib_1 = __webpack_require__(1);
const pg_1 = __webpack_require__(13);
const mongoose_1 = tslib_1.__importDefault(__webpack_require__(14));
const redis_1 = tslib_1.__importDefault(__webpack_require__(15));
const environment_1 = __webpack_require__(8);
const logger_1 = __webpack_require__(16);
// PostgreSQL Connection
const postgresConfig = {
    host: environment_1.config.postgres.host,
    port: environment_1.config.postgres.port,
    database: environment_1.config.postgres.database,
    user: environment_1.config.postgres.username,
    password: environment_1.config.postgres.password,
    max: 10, // Maximum number of connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: environment_1.config.isProduction ? { rejectUnauthorized: false } : false,
};
exports.postgresPool = new pg_1.Pool(postgresConfig);
// Test PostgreSQL connection
exports.postgresPool.on('connect', () => {
    logger_1.logger.info('PostgreSQL client connected');
});
exports.postgresPool.on('error', (err) => {
    logger_1.logger.error('PostgreSQL connection error:', err);
});
// MongoDB Connection
const mongoOptions = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    bufferCommands: false,
};
const connectMongoDB = async () => {
    try {
        await mongoose_1.default.connect(environment_1.config.mongodb.uri, mongoOptions);
        logger_1.logger.info('MongoDB connected successfully');
    }
    catch (error) {
        logger_1.logger.error('MongoDB connection error:', error);
        throw error;
    }
};
exports.connectMongoDB = connectMongoDB;
// MongoDB event handlers
mongoose_1.default.connection.on('connected', () => {
    logger_1.logger.info('MongoDB connected');
});
mongoose_1.default.connection.on('error', (err) => {
    logger_1.logger.error('MongoDB connection error:', err);
});
mongoose_1.default.connection.on('disconnected', () => {
    logger_1.logger.warn('MongoDB disconnected');
});
// Redis Connection
exports.redisClient = redis_1.default.createClient({
    socket: {
        host: environment_1.config.redis.host,
        port: environment_1.config.redis.port,
    },
    password: environment_1.config.redis.password || undefined,
});
// Redis event handlers
exports.redisClient.on('connect', () => {
    logger_1.logger.info('Redis client connected');
});
exports.redisClient.on('error', (err) => {
    logger_1.logger.error('Redis connection error:', err);
});
exports.redisClient.on('ready', () => {
    logger_1.logger.info('Redis client ready');
});
// Connect to Redis
const connectRedis = async () => {
    try {
        await exports.redisClient.connect();
        logger_1.logger.info('Redis connected successfully');
    }
    catch (error) {
        logger_1.logger.error('Redis connection error:', error);
        throw error;
    }
};
exports.connectRedis = connectRedis;
// Database initialization function
const initializeDatabases = async () => {
    try {
        // Test PostgreSQL connection
        const client = await exports.postgresPool.connect();
        client.release();
        logger_1.logger.info('PostgreSQL connection verified');
        // Connect to MongoDB
        await (0, exports.connectMongoDB)();
        // Connect to Redis
        await (0, exports.connectRedis)();
        logger_1.logger.info('All databases initialized successfully');
    }
    catch (error) {
        logger_1.logger.error('Database initialization failed:', error);
        throw error;
    }
};
exports.initializeDatabases = initializeDatabases;
// Graceful shutdown
const closeDatabaseConnections = async () => {
    try {
        await exports.postgresPool.end();
        await mongoose_1.default.connection.close();
        await exports.redisClient.quit();
        logger_1.logger.info('All database connections closed');
    }
    catch (error) {
        logger_1.logger.error('Error closing database connections:', error);
        throw error;
    }
};
exports.closeDatabaseConnections = closeDatabaseConnections;
// Database health check
const checkDatabaseHealth = async () => {
    const health = {
        postgres: false,
        mongodb: false,
        redis: false,
    };
    try {
        // Check PostgreSQL
        const client = await exports.postgresPool.connect();
        await client.query('SELECT 1');
        client.release();
        health.postgres = true;
    }
    catch (error) {
        logger_1.logger.warn('PostgreSQL health check failed:', error);
    }
    try {
        // Check MongoDB
        if (mongoose_1.default.connection.readyState === 1) {
            health.mongodb = true;
        }
    }
    catch (error) {
        logger_1.logger.warn('MongoDB health check failed:', error);
    }
    try {
        // Check Redis
        await exports.redisClient.ping();
        health.redis = true;
    }
    catch (error) {
        logger_1.logger.warn('Redis health check failed:', error);
    }
    return health;
};
exports.checkDatabaseHealth = checkDatabaseHealth;


/***/ }),
/* 13 */
/***/ ((module) => {

module.exports = require("pg");

/***/ }),
/* 14 */
/***/ ((module) => {

module.exports = require("mongoose");

/***/ }),
/* 15 */
/***/ ((module) => {

module.exports = require("redis");

/***/ }),
/* 16 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.logPerformance = exports.logAuth = exports.logDatabaseOperation = exports.logRequest = exports.logDebug = exports.logWarn = exports.logError = exports.logInfo = exports.morganFormat = exports.morganStream = exports.logger = void 0;
const tslib_1 = __webpack_require__(1);
const winston_1 = tslib_1.__importDefault(__webpack_require__(17));
const environment_1 = __webpack_require__(8);
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
winston_1.default.addColors(colors);
// Define log format
const format = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`));
// Define different transport configurations
const transports = [
    // Console transport for all environments
    new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple()),
    }),
];
// Add file transport for non-test environments
if (environment_1.config.nodeEnv !== 'test') {
    transports.push(new winston_1.default.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }), new winston_1.default.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }));
}
// Create the logger instance
exports.logger = winston_1.default.createLogger({
    level: environment_1.config.isDevelopment ? 'debug' : environment_1.config.logging.level,
    levels,
    format,
    transports,
    exitOnError: false,
});
// Create a stream object with a 'write' function for Morgan HTTP logging
exports.morganStream = {
    write: (message) => {
        exports.logger.http(message.trim());
    },
};
// Request logging format for Morgan
exports.morganFormat = environment_1.config.isDevelopment
    ? 'dev'
    : ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';
// Log uncaught exceptions and unhandled rejections
if (environment_1.config.isProduction) {
    exports.logger.exceptions.handle(new winston_1.default.transports.File({ filename: 'logs/exceptions.log' }));
    exports.logger.rejections.handle(new winston_1.default.transports.File({ filename: 'logs/rejections.log' }));
}
// Helper functions for structured logging
const logInfo = (message, meta) => {
    exports.logger.info(message, meta);
};
exports.logInfo = logInfo;
const logError = (message, error, meta) => {
    if (error instanceof Error) {
        exports.logger.error(message, {
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
            },
            ...meta,
        });
    }
    else {
        exports.logger.error(message, { error, ...meta });
    }
};
exports.logError = logError;
const logWarn = (message, meta) => {
    exports.logger.warn(message, meta);
};
exports.logWarn = logWarn;
const logDebug = (message, meta) => {
    exports.logger.debug(message, meta);
};
exports.logDebug = logDebug;
// Request/Response logging helper
const logRequest = (req, res, message) => {
    exports.logger.info(message, {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        statusCode: res.statusCode,
        responseTime: res.get('X-Response-Time'),
    });
};
exports.logRequest = logRequest;
// Database operation logging
const logDatabaseOperation = (operation, table, duration, meta) => {
    exports.logger.debug(`Database ${operation}`, {
        table,
        duration: duration ? `${duration}ms` : undefined,
        ...meta,
    });
};
exports.logDatabaseOperation = logDatabaseOperation;
// Authentication logging
const logAuth = (action, userId, email, ip, success) => {
    exports.logger.info(`Auth: ${action}`, {
        userId,
        email,
        ip,
        success,
        timestamp: new Date().toISOString(),
    });
};
exports.logAuth = logAuth;
// Performance logging
const logPerformance = (operation, duration, meta) => {
    const level = duration > 1000 ? 'warn' : 'info';
    exports.logger.log(level, `Performance: ${operation}`, {
        duration: `${duration}ms`,
        ...meta,
    });
};
exports.logPerformance = logPerformance;
exports["default"] = exports.logger;


/***/ }),
/* 17 */
/***/ ((module) => {

module.exports = require("winston");

/***/ }),
/* 18 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.validateUUID = exports.validatePassword = exports.validateEmail = exports.validateRequired = exports.setupProcessHandlers = exports.gracefulShutdown = exports.catchAsync = exports.notFoundHandler = exports.globalErrorHandler = exports.createErrorResponse = exports.ExternalServiceError = exports.DatabaseError = exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.AppError = void 0;
const logger_1 = __webpack_require__(16);
// Custom error classes
class AppError extends Error {
    statusCode;
    isOperational;
    code;
    constructor(message, statusCode = 500, isOperational = true, code) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.code = code;
        // Maintain proper stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message = 'Validation failed') {
        super(message, 400, true, 'VALIDATION_ERROR');
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401, true, 'AUTHENTICATION_ERROR');
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends AppError {
    constructor(message = 'Insufficient permissions') {
        super(message, 403, true, 'AUTHORIZATION_ERROR');
    }
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, true, 'NOT_FOUND_ERROR');
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, 409, true, 'CONFLICT_ERROR');
    }
}
exports.ConflictError = ConflictError;
class RateLimitError extends AppError {
    constructor(message = 'Too many requests') {
        super(message, 429, true, 'RATE_LIMIT_ERROR');
    }
}
exports.RateLimitError = RateLimitError;
class DatabaseError extends AppError {
    constructor(message = 'Database operation failed') {
        super(message, 500, true, 'DATABASE_ERROR');
    }
}
exports.DatabaseError = DatabaseError;
class ExternalServiceError extends AppError {
    constructor(message = 'External service unavailable') {
        super(message, 502, true, 'EXTERNAL_SERVICE_ERROR');
    }
}
exports.ExternalServiceError = ExternalServiceError;
// Create standardized error response
const createErrorResponse = (error, path, details) => {
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
exports.createErrorResponse = createErrorResponse;
// Global error handler middleware
const globalErrorHandler = (error, req, res, _next) => {
    let appError;
    // Convert known errors to AppError
    if (error instanceof AppError) {
        appError = error;
    }
    else if (error.name === 'ValidationError') {
        appError = new ValidationError(error.message);
    }
    else if (error.name === 'CastError') {
        appError = new ValidationError('Invalid ID format');
    }
    else if (error.name === 'MongoError' && error.code === 11000) {
        appError = new ConflictError('Duplicate field value');
    }
    else if (error.name === 'JsonWebTokenError') {
        appError = new AuthenticationError('Invalid token');
    }
    else if (error.name === 'TokenExpiredError') {
        appError = new AuthenticationError('Token expired');
    }
    else {
        // Unknown error - log it and create generic error
        logger_1.logger.error('Unhandled error:', error);
        appError = new AppError(process.env.NODE_ENV === 'development' ? error.message : 'Internal server error', 500, false);
    }
    // Log operational errors as warnings, programming errors as errors
    if (appError.isOperational) {
        logger_1.logger.warn(`Operational error: ${appError.message}`, {
            statusCode: appError.statusCode,
            code: appError.code,
            path: req.path,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
    }
    else {
        logger_1.logger.error(`Programming error: ${appError.message}`, {
            statusCode: appError.statusCode,
            code: appError.code,
            stack: appError.stack,
            path: req.path,
            method: req.method,
            ip: req.ip,
        });
    }
    // Send error response
    const errorResponse = (0, exports.createErrorResponse)(appError, req.path);
    res.status(appError.statusCode).json(errorResponse);
};
exports.globalErrorHandler = globalErrorHandler;
// 404 handler for undefined routes
const notFoundHandler = (req, res, _next) => {
    const error = new NotFoundError(`Route ${req.originalUrl} not found`);
    _next(error);
};
exports.notFoundHandler = notFoundHandler;
// Async error wrapper - catches async errors and passes to error handler
const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.catchAsync = catchAsync;
// Graceful shutdown handler
const gracefulShutdown = (server) => {
    return (signal) => {
        logger_1.logger.info(`Received ${signal}. Starting graceful shutdown...`);
        server.close((err) => {
            if (err) {
                logger_1.logger.error('Error during server shutdown:', err);
                process.exit(1);
            }
            logger_1.logger.info('Server closed successfully');
            process.exit(0);
        });
        // Force close after 30 seconds
        setTimeout(() => {
            logger_1.logger.error('Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 30000);
    };
};
exports.gracefulShutdown = gracefulShutdown;
// Handle uncaught exceptions and unhandled rejections
const setupProcessHandlers = () => {
    process.on('uncaughtException', (error) => {
        logger_1.logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', error);
        process.exit(1);
    });
    process.on('unhandledRejection', (reason, promise) => {
        logger_1.logger.error('UNHANDLED REJECTION! 💥 Shutting down...', {
            reason,
            promise,
        });
        process.exit(1);
    });
    process.on('SIGTERM', () => {
        logger_1.logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
        // Graceful shutdown logic here
    });
    process.on('SIGINT', () => {
        logger_1.logger.info('👋 SIGINT RECEIVED. Shutting down gracefully');
        // Graceful shutdown logic here
    });
};
exports.setupProcessHandlers = setupProcessHandlers;
// Validation helper functions
const validateRequired = (value, fieldName) => {
    if (value === undefined || value === null || value === '') {
        throw new ValidationError(`${fieldName} is required`);
    }
};
exports.validateRequired = validateRequired;
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new ValidationError('Invalid email format');
    }
};
exports.validateEmail = validateEmail;
const validatePassword = (password) => {
    if (password.length < 8) {
        throw new ValidationError('Password must be at least 8 characters long');
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        throw new ValidationError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    }
};
exports.validatePassword = validatePassword;
const validateUUID = (id) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        throw new ValidationError('Invalid ID format');
    }
};
exports.validateUUID = validateUUID;


/***/ }),
/* 19 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const express_1 = __webpack_require__(2);
const health_controller_1 = __webpack_require__(20);
const auth_middleware_1 = __webpack_require__(25);
const router = (0, express_1.Router)();
// Public health endpoints (for load balancers, monitoring systems)
router.get('/ping', health_controller_1.ping);
router.get('/liveness', health_controller_1.getLiveness);
router.get('/readiness', health_controller_1.getReadiness);
router.get('/status', health_controller_1.getHealthStatus);
// Protected endpoints (require admin role)
router.get('/system', auth_middleware_1.requireAdmin, health_controller_1.getSystemInfo);
router.get('/database', auth_middleware_1.requireAdmin, health_controller_1.getDatabaseStatus);
exports["default"] = router;


/***/ }),
/* 20 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ping = exports.getDatabaseStatus = exports.getSystemInfo = exports.getLiveness = exports.getReadiness = exports.getHealthStatus = void 0;
const database_service_1 = __webpack_require__(11);
const user_service_1 = __webpack_require__(21);
const environment_1 = __webpack_require__(8);
const errors_1 = __webpack_require__(18);
const logger_1 = __webpack_require__(16);
exports.getHealthStatus = (0, errors_1.catchAsync)(async (req, res) => {
    const startTime = Date.now();
    try {
        // Check database health
        const dbHealth = await database_service_1.databaseService.healthCheck();
        // Check API health (if we got this far, API is working)
        const apiHealth = true;
        // Get memory usage
        const memUsage = process.memoryUsage();
        const totalMemory = memUsage.heapTotal + memUsage.external + memUsage.arrayBuffers;
        // Determine overall status
        const allServicesHealthy = dbHealth.postgres && dbHealth.mongodb && dbHealth.redis && apiHealth;
        const someServicesHealthy = dbHealth.postgres || dbHealth.mongodb || dbHealth.redis || apiHealth;
        let status;
        if (allServicesHealthy) {
            status = 'healthy';
        }
        else if (someServicesHealthy) {
            status = 'degraded';
        }
        else {
            status = 'unhealthy';
        }
        const healthStatus = {
            status,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
            environment: environment_1.config.nodeEnv,
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
        logger_1.logger.debug('Health check completed', {
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
    }
    catch (error) {
        logger_1.logger.error('Health check failed:', error);
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Health check failed',
            responseTime: `${Date.now() - startTime}ms`,
        });
    }
});
exports.getReadiness = (0, errors_1.catchAsync)(async (req, res) => {
    try {
        // Check if all critical services are ready
        const dbHealth = await database_service_1.databaseService.healthCheck();
        const isReady = dbHealth.postgres && dbHealth.mongodb && dbHealth.redis;
        if (isReady) {
            res.status(200).json({
                success: true,
                status: 'ready',
                timestamp: new Date().toISOString(),
                message: 'Service is ready to accept requests',
            });
        }
        else {
            res.status(503).json({
                success: false,
                status: 'not_ready',
                timestamp: new Date().toISOString(),
                message: 'Service is not ready',
                services: dbHealth,
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Readiness check failed:', error);
        res.status(503).json({
            success: false,
            status: 'not_ready',
            timestamp: new Date().toISOString(),
            error: 'Readiness check failed',
        });
    }
});
exports.getLiveness = (0, errors_1.catchAsync)(async (req, res) => {
    try {
        // Simple liveness check - if we can respond, we're alive
        res.status(200).json({
            success: true,
            status: 'alive',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            message: 'Service is alive',
        });
    }
    catch (error) {
        logger_1.logger.error('Liveness check failed:', error);
        res.status(503).json({
            success: false,
            status: 'not_alive',
            timestamp: new Date().toISOString(),
            error: 'Liveness check failed',
        });
    }
});
exports.getSystemInfo = (0, errors_1.catchAsync)(async (req, res) => {
    try {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        // Get user stats for metrics
        const userStats = await user_service_1.userService.getUserStats();
        const systemInfo = {
            application: {
                name: 'SolariHub Backend',
                version: process.env.npm_package_version || '1.0.0',
                environment: environment_1.config.nodeEnv,
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
    }
    catch (error) {
        logger_1.logger.error('System info retrieval failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve system information',
            timestamp: new Date().toISOString(),
        });
    }
});
exports.getDatabaseStatus = (0, errors_1.catchAsync)(async (req, res) => {
    try {
        const dbHealth = await database_service_1.databaseService.healthCheck();
        // Additional database metrics
        const dbStatus = {
            health: dbHealth,
            connections: {
                postgres: {
                    total: 10, // From pool config
                    idle: 0, // Would need to implement this
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
    }
    catch (error) {
        logger_1.logger.error('Database status check failed:', error);
        res.status(503).json({
            success: false,
            error: 'Database status check failed',
            timestamp: new Date().toISOString(),
        });
    }
});
exports.ping = (0, errors_1.catchAsync)(async (req, res) => {
    const startTime = Date.now();
    res.status(200).json({
        success: true,
        message: 'pong',
        timestamp: new Date().toISOString(),
        responseTime: `${Date.now() - startTime}ms`,
    });
});


/***/ }),
/* 21 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.userService = exports.UserService = void 0;
const user_model_1 = __webpack_require__(22);
const errors_1 = __webpack_require__(18);
const logger_1 = __webpack_require__(16);
class UserService {
    static instance;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() { }
    static getInstance() {
        if (!UserService.instance) {
            UserService.instance = new UserService();
        }
        return UserService.instance;
    }
    async createUser(userData) {
        try {
            const user = await user_model_1.userModel.create(userData);
            logger_1.logger.info('User created successfully', {
                userId: user.id,
                email: user.email,
                role: user.role,
            });
            // Return user without password hash
            const { password_hash: _password_hash, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        catch (error) {
            logger_1.logger.error('Failed to create user:', error, {
                email: userData.email,
                role: userData.role,
            });
            throw error;
        }
    }
    async getUserById(id) {
        try {
            const user = await user_model_1.userModel.findById(id);
            if (!user) {
                return null;
            }
            const { password_hash: _password_hash, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        catch (error) {
            logger_1.logger.error('Failed to get user by ID:', error, { userId: id });
            throw error;
        }
    }
    async getUserWithProfile(id) {
        try {
            const userWithProfile = await user_model_1.userModel.findWithProfile(id);
            if (!userWithProfile) {
                return null;
            }
            const { password_hash: _password_hash, ...userWithoutPassword } = userWithProfile;
            return userWithoutPassword;
        }
        catch (error) {
            logger_1.logger.error('Failed to get user with profile:', error, { userId: id });
            throw error;
        }
    }
    async getUserByEmail(email) {
        try {
            return await user_model_1.userModel.findByEmail(email);
        }
        catch (error) {
            logger_1.logger.error('Failed to get user by email:', error, { email });
            throw error;
        }
    }
    async updateUser(id, updateData) {
        try {
            const existingUser = await user_model_1.userModel.findById(id);
            if (!existingUser) {
                throw new errors_1.NotFoundError('User not found');
            }
            const updatedUser = await user_model_1.userModel.updateUser(id, updateData);
            logger_1.logger.info('User updated successfully', {
                userId: id,
                updatedFields: Object.keys(updateData),
            });
            const { password_hash: _password_hash, ...userWithoutPassword } = updatedUser;
            return userWithoutPassword;
        }
        catch (error) {
            logger_1.logger.error('Failed to update user:', error, { userId: id });
            throw error;
        }
    }
    async updateUserProfile(userId, profileData) {
        try {
            const existingUser = await user_model_1.userModel.findById(userId);
            if (!existingUser) {
                throw new errors_1.NotFoundError('User not found');
            }
            await user_model_1.userModel.updateProfile(userId, profileData);
            logger_1.logger.info('User profile updated successfully', {
                userId,
                updatedFields: Object.keys(profileData),
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to update user profile:', error, { userId });
            throw error;
        }
    }
    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await user_model_1.userModel.findById(userId);
            if (!user) {
                throw new errors_1.NotFoundError('User not found');
            }
            // Verify current password
            const isCurrentPasswordValid = await user_model_1.userModel.verifyPassword(currentPassword, user.password_hash);
            if (!isCurrentPasswordValid) {
                throw new errors_1.ValidationError('Current password is incorrect');
            }
            await user_model_1.userModel.changePassword(userId, newPassword);
            logger_1.logger.info('Password changed successfully', { userId });
        }
        catch (error) {
            logger_1.logger.error('Failed to change password:', error, { userId });
            throw error;
        }
    }
    async verifyUserEmail(userId) {
        try {
            const existingUser = await user_model_1.userModel.findById(userId);
            if (!existingUser) {
                throw new errors_1.NotFoundError('User not found');
            }
            await user_model_1.userModel.verifyEmail(userId);
            logger_1.logger.info('User email verified successfully', { userId });
        }
        catch (error) {
            logger_1.logger.error('Failed to verify user email:', error, { userId });
            throw error;
        }
    }
    async deleteUser(id) {
        try {
            const existingUser = await user_model_1.userModel.findById(id);
            if (!existingUser) {
                throw new errors_1.NotFoundError('User not found');
            }
            const deleted = await user_model_1.userModel.delete(id);
            if (!deleted) {
                throw new Error('Failed to delete user');
            }
            logger_1.logger.info('User deleted successfully', { userId: id });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete user:', error, { userId: id });
            throw error;
        }
    }
    async getUsersByRole(role, page = 1, limit = 50) {
        try {
            const offset = (page - 1) * limit;
            const users = await user_model_1.userModel.findByRole(role, limit, offset);
            const total = await user_model_1.userModel.count({ role });
            const usersWithoutPassword = users.map((user) => {
                const { password_hash: _password_hash, ...userWithoutPassword } = user;
                return userWithoutPassword;
            });
            return {
                users: usersWithoutPassword,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get users by role:', error, { role, page, limit });
            throw error;
        }
    }
    async getUserStats() {
        try {
            return await user_model_1.userModel.getUserStats();
        }
        catch (error) {
            logger_1.logger.error('Failed to get user stats:', error);
            throw error;
        }
    }
    async searchUsers(query, role, page = 1, limit = 50) {
        try {
            const offset = (page - 1) * limit;
            let searchQuery = `
        SELECT u.* FROM auth.users u
        LEFT JOIN auth.user_profiles p ON u.id = p.user_id
        WHERE (
          u.email ILIKE $1 OR
          p.first_name ILIKE $1 OR
          p.last_name ILIKE $1 OR
          p.company_name ILIKE $1
        )
      `;
            const params = [`%${query}%`];
            if (role) {
                searchQuery += ` AND u.role = $${params.length + 1}`;
                params.push(role);
            }
            searchQuery += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(limit, offset);
            const result = await user_model_1.userModel.query(searchQuery, params);
            const users = result.rows;
            // Get total count
            let countQuery = `
        SELECT COUNT(DISTINCT u.id) as count FROM auth.users u
        LEFT JOIN auth.user_profiles p ON u.id = p.user_id
        WHERE (
          u.email ILIKE $1 OR
          p.first_name ILIKE $1 OR
          p.last_name ILIKE $1 OR
          p.company_name ILIKE $1
        )
      `;
            const countParams = [`%${query}%`];
            if (role) {
                countQuery += ` AND u.role = $${countParams.length + 1}`;
                countParams.push(role);
            }
            const countResult = await user_model_1.userModel.query(countQuery, countParams);
            const total = parseInt(countResult.rows[0].count, 10);
            const usersWithoutPassword = users.map((user) => {
                const { password_hash: _password_hash, ...userWithoutPassword } = user;
                return userWithoutPassword;
            });
            return {
                users: usersWithoutPassword,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to search users:', error, { query, role, page, limit });
            throw error;
        }
    }
    async isEmailTaken(email, excludeUserId) {
        try {
            const existingUser = await user_model_1.userModel.findByEmail(email);
            if (!existingUser) {
                return false;
            }
            if (excludeUserId && existingUser.id === excludeUserId) {
                return false;
            }
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to check if email is taken:', error, { email });
            throw error;
        }
    }
}
exports.UserService = UserService;
exports.userService = UserService.getInstance();


/***/ }),
/* 22 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.userModel = exports.UserModel = void 0;
const tslib_1 = __webpack_require__(1);
const bcryptjs_1 = tslib_1.__importDefault(__webpack_require__(23));
const base_model_1 = __webpack_require__(24);
const environment_1 = __webpack_require__(8);
const errors_1 = __webpack_require__(18);
const errors_2 = __webpack_require__(18);
class UserModel extends base_model_1.BaseModel {
    static tableName = 'auth.users';
    async findById(id) {
        (0, errors_2.validateUUID)(id);
        return super.findById(id);
    }
    async findByEmail(email) {
        (0, errors_2.validateEmail)(email);
        return this.findByField('email', email);
    }
    async findWithProfile(id) {
        (0, errors_2.validateUUID)(id);
        const result = await this.query(`
      SELECT 
        u.*,
        p.first_name,
        p.last_name,
        p.company_name,
        p.phone,
        p.address,
        p.kyc_status,
        p.created_at as profile_created_at
      FROM auth.users u
      LEFT JOIN auth.user_profiles p ON u.id = p.user_id
      WHERE u.id = $1
    `, [id]);
        if (!result.rows[0]) {
            return null;
        }
        const row = result.rows[0];
        const user = {
            id: row.id,
            email: row.email,
            password_hash: row.password_hash,
            role: row.role,
            email_verified: row.email_verified,
            created_at: row.created_at,
            updated_at: row.updated_at,
        };
        if (row.first_name || row.last_name || row.company_name) {
            user.profile = {
                user_id: row.id,
                first_name: row.first_name,
                last_name: row.last_name,
                company_name: row.company_name,
                phone: row.phone,
                address: row.address,
                kyc_status: row.kyc_status,
                created_at: row.profile_created_at,
            };
        }
        return user;
    }
    async create(userData) {
        const { email, password, role, profile } = userData;
        // Validate input
        (0, errors_2.validateEmail)(email);
        (0, errors_2.validatePassword)(password);
        if (!['buyer', 'seller', 'logistics', 'finance', 'admin'].includes(role)) {
            throw new errors_1.ValidationError('Invalid user role');
        }
        // Check if user already exists
        const existingUser = await this.findByEmail(email);
        if (existingUser) {
            throw new errors_1.ConflictError('User with this email already exists');
        }
        // Hash password
        const password_hash = await bcryptjs_1.default.hash(password, environment_1.config.security.bcryptRounds);
        // Begin transaction
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            // Create user
            const userResult = await client.query(`
        INSERT INTO auth.users (email, password_hash, role)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [email, password_hash, role]);
            const user = userResult.rows[0];
            // Create profile if provided
            if (profile) {
                await client.query(`
          INSERT INTO auth.user_profiles (
            user_id, first_name, last_name, company_name, phone, address
          )
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
                    user.id,
                    profile.first_name || null,
                    profile.last_name || null,
                    profile.company_name || null,
                    profile.phone || null,
                    profile.address ? JSON.stringify(profile.address) : null,
                ]);
            }
            await client.query('COMMIT');
            return user;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async updateUser(id, updateData) {
        (0, errors_2.validateUUID)(id);
        if (updateData.email) {
            (0, errors_2.validateEmail)(updateData.email);
            // Check if email is already taken by another user
            const existingUser = await this.findByEmail(updateData.email);
            if (existingUser && existingUser.id !== id) {
                throw new errors_1.ConflictError('Email is already taken by another user');
            }
        }
        return this.update(id, updateData);
    }
    async updateProfile(userId, profileData) {
        (0, errors_2.validateUUID)(userId);
        const fields = [];
        const values = [];
        let paramCount = 2; // Start at 2 because $1 is user_id
        if (profileData.first_name !== undefined) {
            fields.push(`first_name = $${paramCount}`);
            values.push(profileData.first_name);
            paramCount++;
        }
        if (profileData.last_name !== undefined) {
            fields.push(`last_name = $${paramCount}`);
            values.push(profileData.last_name);
            paramCount++;
        }
        if (profileData.company_name !== undefined) {
            fields.push(`company_name = $${paramCount}`);
            values.push(profileData.company_name);
            paramCount++;
        }
        if (profileData.phone !== undefined) {
            fields.push(`phone = $${paramCount}`);
            values.push(profileData.phone);
            paramCount++;
        }
        if (profileData.address !== undefined) {
            fields.push(`address = $${paramCount}`);
            values.push(JSON.stringify(profileData.address));
            paramCount++;
        }
        if (profileData.kyc_status !== undefined) {
            fields.push(`kyc_status = $${paramCount}`);
            values.push(profileData.kyc_status);
            paramCount++;
        }
        if (fields.length === 0) {
            return; // Nothing to update
        }
        // Check if profile exists
        const profileExists = await this.query(`
      SELECT 1 FROM auth.user_profiles WHERE user_id = $1
    `, [userId]);
        if (profileExists.rowCount === 0) {
            // Create new profile
            await this.query(`
        INSERT INTO auth.user_profiles (user_id, ${fields.map((f) => f.split(' = ')[0]).join(', ')})
        VALUES ($1, ${fields.map((_, i) => `$${i + 2}`).join(', ')})
      `, [userId, ...values]);
        }
        else {
            // Update existing profile
            await this.query(`
        UPDATE auth.user_profiles
        SET ${fields.join(', ')}
        WHERE user_id = $1
      `, [userId, ...values]);
        }
    }
    async verifyPassword(password, hashedPassword) {
        return bcryptjs_1.default.compare(password, hashedPassword);
    }
    async changePassword(userId, newPassword) {
        (0, errors_2.validateUUID)(userId);
        (0, errors_2.validatePassword)(newPassword);
        const password_hash = await bcryptjs_1.default.hash(newPassword, environment_1.config.security.bcryptRounds);
        await this.query(`
      UPDATE auth.users
      SET password_hash = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [userId, password_hash]);
    }
    async verifyEmail(userId) {
        (0, errors_2.validateUUID)(userId);
        await this.query(`
      UPDATE auth.users
      SET email_verified = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [userId]);
    }
    async findByRole(role, limit = 50, offset = 0) {
        const result = await this.query(`
      SELECT * FROM auth.users
      WHERE role = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [role, limit, offset]);
        return result.rows;
    }
    async getUserStats() {
        const totalResult = await this.query('SELECT COUNT(*) as count FROM auth.users');
        const total = parseInt(totalResult.rows[0].count, 10);
        const roleResult = await this.query(`
      SELECT role, COUNT(*) as count
      FROM auth.users
      GROUP BY role
    `);
        const by_role = {
            buyer: 0,
            seller: 0,
            logistics: 0,
            finance: 0,
            admin: 0,
        };
        roleResult.rows.forEach((row) => {
            by_role[row.role] = parseInt(row.count, 10);
        });
        const verificationResult = await this.query(`
      SELECT email_verified, COUNT(*) as count
      FROM auth.users
      GROUP BY email_verified
    `);
        let verified = 0;
        let unverified = 0;
        verificationResult.rows.forEach((row) => {
            if (row.email_verified) {
                verified = parseInt(row.count, 10);
            }
            else {
                unverified = parseInt(row.count, 10);
            }
        });
        return {
            total,
            by_role,
            verified,
            unverified,
        };
    }
}
exports.UserModel = UserModel;
exports.userModel = new UserModel();


/***/ }),
/* 23 */
/***/ ((module) => {

module.exports = require("bcryptjs");

/***/ }),
/* 24 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BaseModel = void 0;
const database_service_1 = __webpack_require__(11);
const errors_1 = __webpack_require__(18);
const logger_1 = __webpack_require__(16);
class BaseModel {
    static tableName;
    pool;
    constructor() {
        this.pool = database_service_1.databaseService.getPostgresPool();
    }
    async query(text, params) {
        const start = Date.now();
        try {
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            logger_1.logger.debug('Database query executed', {
                query: text,
                duration: `${duration}ms`,
                rows: result.rowCount,
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Database query failed:', error, {
                query: text,
                params,
            });
            const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
            throw new errors_1.DatabaseError(`Database query failed: ${errorMessage}`);
        }
    }
    async findById(id) {
        const tableName = this.constructor.tableName;
        const result = await this.query(`SELECT * FROM ${tableName} WHERE id = $1`, [id]);
        return result.rows[0] || null;
    }
    async findByField(field, value) {
        const tableName = this.constructor.tableName;
        const result = await this.query(`SELECT * FROM ${tableName} WHERE ${field} = $1`, [value]);
        return result.rows[0] || null;
    }
    async findAll(limit, offset) {
        const tableName = this.constructor.tableName;
        let query = `SELECT * FROM ${tableName}`;
        const params = [];
        if (limit) {
            query += ` LIMIT $${params.length + 1}`;
            params.push(limit);
        }
        if (offset) {
            query += ` OFFSET $${params.length + 1}`;
            params.push(offset);
        }
        const result = await this.query(query, params);
        return result.rows;
    }
    async create(data) {
        const tableName = this.constructor.tableName;
        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
        const query = `
      INSERT INTO ${tableName} (${fields.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
        const result = await this.query(query, values);
        return result.rows[0];
    }
    async update(id, data) {
        const tableName = this.constructor.tableName;
        const fields = Object.keys(data);
        const values = Object.values(data);
        const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
        const query = `
      UPDATE ${tableName}
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
        const result = await this.query(query, [id, ...values]);
        return result.rows[0];
    }
    async delete(id) {
        const tableName = this.constructor.tableName;
        const result = await this.query(`DELETE FROM ${tableName} WHERE id = $1`, [id]);
        return result.rowCount > 0;
    }
    async exists(field, value) {
        const tableName = this.constructor.tableName;
        const result = await this.query(`SELECT 1 FROM ${tableName} WHERE ${field} = $1 LIMIT 1`, [
            value,
        ]);
        return result.rowCount > 0;
    }
    async count(conditions) {
        const tableName = this.constructor.tableName;
        let query = `SELECT COUNT(*) FROM ${tableName}`;
        const params = [];
        if (conditions && Object.keys(conditions).length > 0) {
            const whereClause = Object.keys(conditions)
                .map((field, index) => `${field} = $${index + 1}`)
                .join(' AND ');
            query += ` WHERE ${whereClause}`;
            params.push(...Object.values(conditions));
        }
        const result = await this.query(query, params);
        return parseInt(result.rows[0].count, 10);
    }
}
exports.BaseModel = BaseModel;


/***/ }),
/* 25 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.requireJSON = exports.requireContentType = exports.extractRealIP = exports.validateApiKey = exports.logRequest = exports.rateLimitByUser = exports.checkEmailVerification = exports.requireOwnershipOrAdmin = exports.requireFinance = exports.requireLogistics = exports.requireBuyer = exports.requireSeller = exports.requireAdmin = exports.requireRole = exports.optionalAuth = exports.authenticateToken = void 0;
const auth_service_1 = __webpack_require__(26);
const user_service_1 = __webpack_require__(21);
const errors_1 = __webpack_require__(18);
const logger_1 = __webpack_require__(16);
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        if (!token) {
            throw new errors_1.AuthenticationError('Access token required');
        }
        const decoded = await auth_service_1.authService.verifyToken(token);
        req.user = decoded;
        req.userId = decoded.userId;
        next();
    }
    catch (error) {
        logger_1.logger.warn('Authentication failed:', error, {
            path: req.path,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
        next(error);
    }
};
exports.authenticateToken = authenticateToken;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            const decoded = await auth_service_1.authService.verifyToken(token);
            req.user = decoded;
            req.userId = decoded.userId;
        }
        next();
    }
    catch (error) {
        // For optional auth, continue without user if token is invalid
        logger_1.logger.debug('Optional authentication failed:', error, {
            path: req.path,
            method: req.method,
            ip: req.ip,
        });
        next();
    }
};
exports.optionalAuth = optionalAuth;
const requireRole = (roles) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                throw new errors_1.AuthenticationError('Authentication required');
            }
            const requiredRoles = Array.isArray(roles) ? roles : [roles];
            if (!requiredRoles.includes(req.user.role)) {
                throw new errors_1.AuthorizationError(`Access denied. Required role: ${roles}`);
            }
            next();
        }
        catch (error) {
            logger_1.logger.warn('Authorization failed:', error, {
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
exports.requireRole = requireRole;
exports.requireAdmin = (0, exports.requireRole)('admin');
exports.requireSeller = (0, exports.requireRole)(['seller', 'admin']);
exports.requireBuyer = (0, exports.requireRole)(['buyer', 'admin']);
exports.requireLogistics = (0, exports.requireRole)(['logistics', 'admin']);
exports.requireFinance = (0, exports.requireRole)(['finance', 'admin']);
const requireOwnershipOrAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.AuthenticationError('Authentication required');
        }
        const resourceUserId = req.params.userId || req.params.id;
        // Admin can access any resource
        if (req.user.role === 'admin') {
            return next();
        }
        // User can only access their own resources
        if (req.user.userId !== resourceUserId) {
            throw new errors_1.AuthorizationError('Access denied. You can only access your own resources');
        }
        next();
    }
    catch (error) {
        logger_1.logger.warn('Ownership authorization failed:', error, {
            userId: req.user?.userId,
            resourceUserId: req.params.userId || req.params.id,
            path: req.path,
            method: req.method,
            ip: req.ip,
        });
        next(error);
    }
};
exports.requireOwnershipOrAdmin = requireOwnershipOrAdmin;
const checkEmailVerification = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.AuthenticationError('Authentication required');
        }
        const user = await user_service_1.userService.getUserById(req.user.userId);
        if (!user) {
            throw new errors_1.AuthenticationError('User not found');
        }
        if (!user.email_verified) {
            throw new errors_1.AuthorizationError('Email verification required');
        }
        next();
    }
    catch (error) {
        logger_1.logger.warn('Email verification check failed:', error, {
            userId: req.user?.userId,
            path: req.path,
            method: req.method,
            ip: req.ip,
        });
        next(error);
    }
};
exports.checkEmailVerification = checkEmailVerification;
const rateLimitByUser = (maxRequests, windowMinutes) => {
    const userRequests = new Map();
    return async (req, res, next) => {
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
                logger_1.logger.warn('Rate limit exceeded by user:', {
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
        }
        catch (error) {
            next(error);
        }
    };
};
exports.rateLimitByUser = rateLimitByUser;
const logRequest = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger_1.logger.info('Request completed', {
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
exports.logRequest = logRequest;
const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return next(new errors_1.AuthenticationError('API key required'));
    }
    // TODO: Implement API key validation logic
    // For now, just pass through
    next();
};
exports.validateApiKey = validateApiKey;
// Middleware to extract user IP address (considering proxies)
const extractRealIP = (req, res, next) => {
    const forwarded = req.headers['x-forwarded-for'];
    const realIP = forwarded ? forwarded.split(',')[0].trim() : req.connection.remoteAddress;
    // Override req.ip with the real IP
    req.ip = realIP;
    next();
};
exports.extractRealIP = extractRealIP;
// Middleware to validate request content type
const requireContentType = (contentType) => {
    return (req, res, next) => {
        const requestContentType = req.headers['content-type'];
        if (!requestContentType || !requestContentType.includes(contentType)) {
            return next(new Error(`Content-Type must be ${contentType}`));
        }
        next();
    };
};
exports.requireContentType = requireContentType;
exports.requireJSON = (0, exports.requireContentType)('application/json');


/***/ }),
/* 26 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.authService = exports.AuthService = void 0;
const tslib_1 = __webpack_require__(1);
const jsonwebtoken_1 = tslib_1.__importDefault(__webpack_require__(27));
const user_model_1 = __webpack_require__(22);
const user_service_1 = __webpack_require__(21);
const database_1 = __webpack_require__(12);
const environment_1 = __webpack_require__(8);
const errors_1 = __webpack_require__(18);
const logger_1 = __webpack_require__(16);
class AuthService {
    static instance;
    JWT_SECRET = environment_1.config.jwt.secret;
    ACCESS_TOKEN_EXPIRES_IN = environment_1.config.jwt.expiresIn;
    REFRESH_TOKEN_EXPIRES_IN = environment_1.config.jwt.refreshExpiresIn;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() { }
    static getInstance() {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }
    async register(userData, ip) {
        try {
            const user = await user_service_1.userService.createUser(userData);
            const tokens = await this.generateTokens(user);
            (0, logger_1.logAuth)('register', user.id, user.email, ip, true);
            logger_1.logger.info('User registered successfully', {
                userId: user.id,
                email: user.email,
                role: user.role,
                ip,
            });
            return {
                user,
                tokens,
            };
        }
        catch (error) {
            (0, logger_1.logAuth)('register', undefined, userData.email, ip, false);
            logger_1.logger.error('Registration failed:', error, {
                email: userData.email,
                role: userData.role,
                ip,
            });
            throw error;
        }
    }
    async login(credentials, ip) {
        const { email, password } = credentials;
        try {
            // Find user by email
            const user = await user_service_1.userService.getUserByEmail(email);
            if (!user) {
                (0, logger_1.logAuth)('login', undefined, email, ip, false);
                throw new errors_1.AuthenticationError('Invalid email or password');
            }
            // Verify password
            const isPasswordValid = await user_model_1.userModel.verifyPassword(password, user.password_hash);
            if (!isPasswordValid) {
                (0, logger_1.logAuth)('login', user.id, email, ip, false);
                throw new errors_1.AuthenticationError('Invalid email or password');
            }
            // Generate tokens
            const tokens = await this.generateTokens(user);
            (0, logger_1.logAuth)('login', user.id, email, ip, true);
            logger_1.logger.info('User logged in successfully', {
                userId: user.id,
                email: user.email,
                role: user.role,
                ip,
            });
            // Remove password hash from response
            const { password_hash: _password_hash, ...userWithoutPassword } = user;
            return {
                user: userWithoutPassword,
                tokens,
            };
        }
        catch (error) {
            if (!(error instanceof errors_1.AuthenticationError)) {
                logger_1.logger.error('Login failed:', error, { email, ip });
            }
            throw error;
        }
    }
    async refreshToken(refreshToken, ip) {
        try {
            // Verify refresh token
            const decoded = jsonwebtoken_1.default.verify(refreshToken, this.JWT_SECRET);
            // Check if refresh token exists in Redis
            const storedToken = await database_1.redisClient.get(`refresh_token:${decoded.userId}`);
            if (!storedToken || storedToken !== refreshToken) {
                throw new errors_1.AuthenticationError('Invalid refresh token');
            }
            // Get user
            const user = await user_service_1.userService.getUserByEmail(decoded.email);
            if (!user) {
                throw new errors_1.AuthenticationError('User not found');
            }
            // Generate new tokens
            const tokens = await this.generateTokens(user);
            (0, logger_1.logAuth)('refresh_token', user.id, user.email, ip, true);
            logger_1.logger.info('Token refreshed successfully', {
                userId: user.id,
                email: user.email,
                ip,
            });
            return tokens;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new errors_1.AuthenticationError('Invalid refresh token');
            }
            throw error;
        }
    }
    async logout(userId, ip) {
        try {
            // Remove refresh token from Redis
            await database_1.redisClient.del(`refresh_token:${userId}`);
            const user = await user_service_1.userService.getUserById(userId);
            (0, logger_1.logAuth)('logout', userId, user?.email, ip, true);
            logger_1.logger.info('User logged out successfully', {
                userId,
                ip,
            });
        }
        catch (error) {
            logger_1.logger.error('Logout failed:', error, { userId, ip });
            throw error;
        }
    }
    async logoutAll(userId, ip) {
        try {
            // Remove all refresh tokens for this user
            const keys = await database_1.redisClient.keys(`refresh_token:${userId}*`);
            if (keys.length > 0) {
                await database_1.redisClient.del(keys);
            }
            const user = await user_service_1.userService.getUserById(userId);
            (0, logger_1.logAuth)('logout_all', userId, user?.email, ip, true);
            logger_1.logger.info('User logged out from all devices', {
                userId,
                devicesCount: keys.length,
                ip,
            });
        }
        catch (error) {
            logger_1.logger.error('Logout all failed:', error, { userId, ip });
            throw error;
        }
    }
    async verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.JWT_SECRET);
            // Check if user still exists
            const user = await user_service_1.userService.getUserById(decoded.userId);
            if (!user) {
                throw new errors_1.AuthenticationError('User not found');
            }
            return decoded;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new errors_1.AuthenticationError('Invalid token');
            }
            throw error;
        }
    }
    async changePassword(userId, currentPassword, newPassword, ip) {
        try {
            await user_service_1.userService.changePassword(userId, currentPassword, newPassword);
            // Logout from all devices for security
            await this.logoutAll(userId, ip);
            const user = await user_service_1.userService.getUserById(userId);
            (0, logger_1.logAuth)('change_password', userId, user?.email, ip, true);
            logger_1.logger.info('Password changed successfully', {
                userId,
                ip,
            });
        }
        catch (error) {
            const user = await user_service_1.userService.getUserById(userId);
            (0, logger_1.logAuth)('change_password', userId, user?.email, ip, false);
            throw error;
        }
    }
    async requestPasswordReset(email, ip) {
        try {
            const user = await user_service_1.userService.getUserByEmail(email);
            if (!user) {
                // Don't reveal that user doesn't exist
                logger_1.logger.warn('Password reset requested for non-existent user', { email, ip });
                return;
            }
            // Generate reset token
            const resetToken = this.generateResetToken(user.id);
            // Store reset token in Redis with 1 hour expiration
            await database_1.redisClient.setEx(`password_reset:${user.id}`, 3600, resetToken);
            (0, logger_1.logAuth)('password_reset_request', user.id, email, ip, true);
            logger_1.logger.info('Password reset requested', {
                userId: user.id,
                email,
                ip,
            });
            // TODO: Send email with reset token
            // await emailService.sendPasswordResetEmail(email, resetToken);
        }
        catch (error) {
            logger_1.logger.error('Password reset request failed:', error, { email, ip });
            throw error;
        }
    }
    async resetPassword(token, newPassword, ip) {
        try {
            // Verify reset token
            const decoded = jsonwebtoken_1.default.verify(token, this.JWT_SECRET);
            if (decoded.type !== 'password_reset') {
                throw new errors_1.AuthenticationError('Invalid reset token');
            }
            // Check if reset token exists in Redis
            const storedToken = await database_1.redisClient.get(`password_reset:${decoded.userId}`);
            if (!storedToken || storedToken !== token) {
                throw new errors_1.AuthenticationError('Invalid or expired reset token');
            }
            // Change password
            await user_model_1.userModel.changePassword(decoded.userId, newPassword);
            // Remove reset token
            await database_1.redisClient.del(`password_reset:${decoded.userId}`);
            // Logout from all devices
            await this.logoutAll(decoded.userId, ip);
            const user = await user_service_1.userService.getUserById(decoded.userId);
            (0, logger_1.logAuth)('password_reset', decoded.userId, user?.email, ip, true);
            logger_1.logger.info('Password reset successfully', {
                userId: decoded.userId,
                ip,
            });
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new errors_1.AuthenticationError('Invalid reset token');
            }
            throw error;
        }
    }
    async generateTokens(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
        };
        // Generate access token
        const accessToken = jsonwebtoken_1.default.sign(payload, this.JWT_SECRET, {
            expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
        });
        // Generate refresh token
        const refreshToken = jsonwebtoken_1.default.sign(payload, this.JWT_SECRET, {
            expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
        });
        // Store refresh token in Redis
        const refreshTokenKey = `refresh_token:${user.id}`;
        const refreshTokenExpiry = this.getExpiryInSeconds(this.REFRESH_TOKEN_EXPIRES_IN);
        await database_1.redisClient.setEx(refreshTokenKey, refreshTokenExpiry, refreshToken);
        return {
            accessToken,
            refreshToken,
            expiresIn: this.getExpiryInSeconds(this.ACCESS_TOKEN_EXPIRES_IN),
        };
    }
    generateResetToken(userId) {
        return jsonwebtoken_1.default.sign({ userId, type: 'password_reset' }, this.JWT_SECRET, { expiresIn: '1h' });
    }
    getExpiryInSeconds(expiresIn) {
        // Parse expiration string (e.g., '7d', '24h', '30m', '3600s')
        const unit = expiresIn.slice(-1);
        const value = parseInt(expiresIn.slice(0, -1), 10);
        switch (unit) {
            case 's':
                return value;
            case 'm':
                return value * 60;
            case 'h':
                return value * 60 * 60;
            case 'd':
                return value * 24 * 60 * 60;
            default:
                return parseInt(expiresIn, 10); // Assume seconds if no unit
        }
    }
    async getActiveSessionsCount(userId) {
        try {
            const keys = await database_1.redisClient.keys(`refresh_token:${userId}*`);
            return keys.length;
        }
        catch (error) {
            logger_1.logger.error('Failed to get active sessions count:', error, { userId });
            return 0;
        }
    }
    async validateUserRole(userId, requiredRoles) {
        try {
            const user = await user_service_1.userService.getUserById(userId);
            if (!user) {
                return false;
            }
            return requiredRoles.includes(user.role);
        }
        catch (error) {
            logger_1.logger.error('Failed to validate user role:', error, { userId, requiredRoles });
            return false;
        }
    }
}
exports.AuthService = AuthService;
exports.authService = AuthService.getInstance();


/***/ }),
/* 27 */
/***/ ((module) => {

module.exports = require("jsonwebtoken");

/***/ }),
/* 28 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const express_1 = __webpack_require__(2);
const auth_controller_1 = __webpack_require__(29);
const auth_middleware_1 = __webpack_require__(25);
const router = (0, express_1.Router)();
// Public routes (rate limited)
router.post('/register', auth_middleware_1.requireJSON, (0, auth_middleware_1.rateLimitByUser)(5, 15), auth_controller_1.register);
router.post('/login', auth_middleware_1.requireJSON, (0, auth_middleware_1.rateLimitByUser)(10, 15), auth_controller_1.login);
router.post('/refresh', auth_middleware_1.requireJSON, (0, auth_middleware_1.rateLimitByUser)(20, 15), auth_controller_1.refreshToken);
router.post('/forgot-password', auth_middleware_1.requireJSON, (0, auth_middleware_1.rateLimitByUser)(3, 60), auth_controller_1.requestPasswordReset);
router.post('/reset-password', auth_middleware_1.requireJSON, (0, auth_middleware_1.rateLimitByUser)(5, 15), auth_controller_1.resetPassword);
// Protected routes (require authentication)
router.use(auth_middleware_1.authenticateToken);
router.get('/profile', auth_controller_1.getProfile);
router.get('/validate', auth_controller_1.validateToken);
router.get('/sessions', auth_controller_1.getActiveSessions);
router.post('/logout', auth_controller_1.logout);
router.post('/logout-all', auth_controller_1.logoutAll);
router.post('/change-password', auth_middleware_1.requireJSON, (0, auth_middleware_1.rateLimitByUser)(5, 60), auth_controller_1.changePassword);
exports["default"] = router;


/***/ }),
/* 29 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getActiveSessions = exports.validateToken = exports.getProfile = exports.resetPassword = exports.requestPasswordReset = exports.changePassword = exports.logoutAll = exports.logout = exports.refreshToken = exports.login = exports.register = void 0;
const auth_service_1 = __webpack_require__(26);
const errors_1 = __webpack_require__(18);
const logger_1 = __webpack_require__(16);
exports.register = (0, errors_1.catchAsync)(async (req, res) => {
    const { email, password, role, profile } = req.body;
    // Validate required fields
    if (!email || !password || !role) {
        throw new errors_1.ValidationError('Email, password, and role are required');
    }
    const userData = {
        email,
        password,
        role,
        profile,
    };
    const result = await auth_service_1.authService.register(userData, req.ip);
    logger_1.logger.info('User registration successful', {
        userId: result.user.id,
        email: result.user.email,
        role: result.user.role,
        ip: req.ip,
    });
    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
            user: result.user,
            tokens: result.tokens,
        },
    });
});
exports.login = (0, errors_1.catchAsync)(async (req, res) => {
    const { email, password } = req.body;
    // Validate required fields
    if (!email || !password) {
        throw new errors_1.ValidationError('Email and password are required');
    }
    const credentials = {
        email,
        password,
    };
    const result = await auth_service_1.authService.login(credentials, req.ip);
    logger_1.logger.info('User login successful', {
        userId: result.user.id,
        email: result.user.email,
        role: result.user.role,
        ip: req.ip,
    });
    res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
            user: result.user,
            tokens: result.tokens,
        },
    });
});
exports.refreshToken = (0, errors_1.catchAsync)(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        throw new errors_1.ValidationError('Refresh token is required');
    }
    const tokens = await auth_service_1.authService.refreshToken(refreshToken, req.ip);
    logger_1.logger.info('Token refresh successful', {
        ip: req.ip,
    });
    res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
            tokens,
        },
    });
});
exports.logout = (0, errors_1.catchAsync)(async (req, res) => {
    const userId = req.userId;
    await auth_service_1.authService.logout(userId, req.ip);
    logger_1.logger.info('User logout successful', {
        userId,
        ip: req.ip,
    });
    res.status(200).json({
        success: true,
        message: 'Logout successful',
    });
});
exports.logoutAll = (0, errors_1.catchAsync)(async (req, res) => {
    const userId = req.userId;
    await auth_service_1.authService.logoutAll(userId, req.ip);
    logger_1.logger.info('User logout from all devices successful', {
        userId,
        ip: req.ip,
    });
    res.status(200).json({
        success: true,
        message: 'Logged out from all devices successfully',
    });
});
exports.changePassword = (0, errors_1.catchAsync)(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;
    if (!currentPassword || !newPassword) {
        throw new errors_1.ValidationError('Current password and new password are required');
    }
    await auth_service_1.authService.changePassword(userId, currentPassword, newPassword, req.ip);
    logger_1.logger.info('Password change successful', {
        userId,
        ip: req.ip,
    });
    res.status(200).json({
        success: true,
        message: 'Password changed successfully',
    });
});
exports.requestPasswordReset = (0, errors_1.catchAsync)(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new errors_1.ValidationError('Email is required');
    }
    await auth_service_1.authService.requestPasswordReset(email, req.ip);
    // Always return success for security reasons (don't reveal if email exists)
    res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent',
    });
});
exports.resetPassword = (0, errors_1.catchAsync)(async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        throw new errors_1.ValidationError('Reset token and new password are required');
    }
    await auth_service_1.authService.resetPassword(token, newPassword, req.ip);
    logger_1.logger.info('Password reset successful', {
        ip: req.ip,
    });
    res.status(200).json({
        success: true,
        message: 'Password reset successfully',
    });
});
exports.getProfile = (0, errors_1.catchAsync)(async (req, res) => {
    // The user profile is already available in req.user from the auth middleware
    const user = {
        id: req.user.userId,
        email: req.user.email,
        role: req.user.role,
    };
    res.status(200).json({
        success: true,
        data: {
            user,
        },
    });
});
exports.validateToken = (0, errors_1.catchAsync)(async (req, res) => {
    // If we reach here, the token is valid (validated by auth middleware)
    const user = {
        id: req.user.userId,
        email: req.user.email,
        role: req.user.role,
    };
    res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: {
            user,
            iat: req.user.iat,
            exp: req.user.exp,
        },
    });
});
exports.getActiveSessions = (0, errors_1.catchAsync)(async (req, res) => {
    const userId = req.userId;
    const sessionCount = await auth_service_1.authService.getActiveSessionsCount(userId);
    res.status(200).json({
        success: true,
        data: {
            activeSessions: sessionCount,
        },
    });
});


/***/ }),
/* 30 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const express_1 = __webpack_require__(2);
const users_controller_1 = __webpack_require__(31);
const auth_middleware_1 = __webpack_require__(25);
const router = (0, express_1.Router)();
// Public endpoints
router.get('/check-email', users_controller_1.checkEmailAvailability);
// All other routes require authentication
router.use(auth_middleware_1.authenticateToken);
// Current user endpoints (self-service)
router.get('/me', users_controller_1.getCurrentUser);
router.put('/me', auth_middleware_1.requireJSON, users_controller_1.updateCurrentUser);
router.put('/me/profile', auth_middleware_1.requireJSON, users_controller_1.updateCurrentUserProfile);
// Admin-only endpoints
router.get('/', auth_middleware_1.requireAdmin, users_controller_1.getUsers);
router.get('/search', auth_middleware_1.requireAdmin, users_controller_1.searchUsers);
router.get('/stats', auth_middleware_1.requireAdmin, users_controller_1.getUserStats);
// User management endpoints with proper authorization
router.get('/:id', auth_middleware_1.requireOwnershipOrAdmin, users_controller_1.getUser);
router.put('/:id', auth_middleware_1.requireAdmin, auth_middleware_1.requireJSON, users_controller_1.updateUser);
router.put('/:id/profile', auth_middleware_1.requireOwnershipOrAdmin, auth_middleware_1.requireJSON, users_controller_1.updateUserProfile);
router.delete('/:id', auth_middleware_1.requireAdmin, users_controller_1.deleteUser);
router.post('/:id/verify-email', auth_middleware_1.requireAdmin, users_controller_1.verifyUserEmail);
exports["default"] = router;


/***/ }),
/* 31 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.checkEmailAvailability = exports.verifyUserEmail = exports.getUserStats = exports.searchUsers = exports.getUsers = exports.deleteUser = exports.updateCurrentUserProfile = exports.updateUserProfile = exports.updateCurrentUser = exports.updateUser = exports.getCurrentUser = exports.getUser = void 0;
const user_service_1 = __webpack_require__(21);
const errors_1 = __webpack_require__(18);
const logger_1 = __webpack_require__(16);
exports.getUser = (0, errors_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const user = await user_service_1.userService.getUserWithProfile(id);
    if (!user) {
        throw new errors_1.NotFoundError('User not found');
    }
    res.status(200).json({
        success: true,
        data: {
            user,
        },
    });
});
exports.getCurrentUser = (0, errors_1.catchAsync)(async (req, res) => {
    const userId = req.userId;
    const user = await user_service_1.userService.getUserWithProfile(userId);
    if (!user) {
        throw new errors_1.NotFoundError('User not found');
    }
    res.status(200).json({
        success: true,
        data: {
            user,
        },
    });
});
exports.updateUser = (0, errors_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    // Remove fields that shouldn't be updated via this endpoint
    delete updateData.password;
    delete updateData.password_hash;
    const user = await user_service_1.userService.updateUser(id, updateData);
    logger_1.logger.info('User updated', {
        userId: id,
        updatedBy: req.userId,
        updatedFields: Object.keys(updateData),
    });
    res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: {
            user,
        },
    });
});
exports.updateCurrentUser = (0, errors_1.catchAsync)(async (req, res) => {
    const userId = req.userId;
    const updateData = req.body;
    // Remove fields that shouldn't be updated via this endpoint
    delete updateData.password;
    delete updateData.password_hash;
    delete updateData.role; // Users can't change their own role
    const user = await user_service_1.userService.updateUser(userId, updateData);
    logger_1.logger.info('User self-updated', {
        userId,
        updatedFields: Object.keys(updateData),
    });
    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
            user,
        },
    });
});
exports.updateUserProfile = (0, errors_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const profileData = req.body;
    await user_service_1.userService.updateUserProfile(id, profileData);
    logger_1.logger.info('User profile updated', {
        userId: id,
        updatedBy: req.userId,
        updatedFields: Object.keys(profileData),
    });
    res.status(200).json({
        success: true,
        message: 'User profile updated successfully',
    });
});
exports.updateCurrentUserProfile = (0, errors_1.catchAsync)(async (req, res) => {
    const userId = req.userId;
    const profileData = req.body;
    await user_service_1.userService.updateUserProfile(userId, profileData);
    logger_1.logger.info('User self-updated profile', {
        userId,
        updatedFields: Object.keys(profileData),
    });
    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
    });
});
exports.deleteUser = (0, errors_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    await user_service_1.userService.deleteUser(id);
    logger_1.logger.info('User deleted', {
        userId: id,
        deletedBy: req.userId,
    });
    res.status(200).json({
        success: true,
        message: 'User deleted successfully',
    });
});
exports.getUsers = (0, errors_1.catchAsync)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const role = req.query.role;
    let result;
    if (role) {
        result = await user_service_1.userService.getUsersByRole(role, page, limit);
    }
    else {
        // If no role specified, get all users (admin only)
        const allRoles = ['buyer', 'seller', 'logistics', 'finance', 'admin'];
        const users = [];
        let totalCount = 0;
        for (const userRole of allRoles) {
            const roleResult = await user_service_1.userService.getUsersByRole(userRole, 1, 1000);
            users.push(...roleResult.users);
            totalCount += roleResult.pagination.total;
        }
        // Apply pagination to combined results
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedUsers = users.slice(startIndex, endIndex);
        result = {
            users: paginatedUsers,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit),
            },
        };
    }
    res.status(200).json({
        success: true,
        data: result,
    });
});
exports.searchUsers = (0, errors_1.catchAsync)(async (req, res) => {
    const query = req.query.q;
    const role = req.query.role;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    if (!query) {
        throw new errors_1.ValidationError('Search query is required');
    }
    const result = await user_service_1.userService.searchUsers(query, role, page, limit);
    res.status(200).json({
        success: true,
        data: result,
    });
});
exports.getUserStats = (0, errors_1.catchAsync)(async (req, res) => {
    const stats = await user_service_1.userService.getUserStats();
    res.status(200).json({
        success: true,
        data: {
            stats,
        },
    });
});
exports.verifyUserEmail = (0, errors_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    await user_service_1.userService.verifyUserEmail(id);
    logger_1.logger.info('User email verified', {
        userId: id,
        verifiedBy: req.userId,
    });
    res.status(200).json({
        success: true,
        message: 'User email verified successfully',
    });
});
exports.checkEmailAvailability = (0, errors_1.catchAsync)(async (req, res) => {
    const { email } = req.query;
    if (!email || typeof email !== 'string') {
        throw new errors_1.ValidationError('Email is required');
    }
    const isTaken = await user_service_1.userService.isEmailTaken(email);
    res.status(200).json({
        success: true,
        data: {
            email,
            available: !isTaken,
        },
    });
});


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SolariHubServer = void 0;
const tslib_1 = __webpack_require__(1);
const express_1 = tslib_1.__importDefault(__webpack_require__(2));
const cors_1 = tslib_1.__importDefault(__webpack_require__(3));
const helmet_1 = tslib_1.__importDefault(__webpack_require__(4));
const compression_1 = tslib_1.__importDefault(__webpack_require__(5));
const morgan_1 = tslib_1.__importDefault(__webpack_require__(6));
const express_rate_limit_1 = tslib_1.__importDefault(__webpack_require__(7));
// Configuration and services
const environment_1 = __webpack_require__(8);
const database_service_1 = __webpack_require__(11);
const logger_1 = __webpack_require__(16);
const errors_1 = __webpack_require__(18);
// Routes
const health_routes_1 = tslib_1.__importDefault(__webpack_require__(19));
const auth_routes_1 = tslib_1.__importDefault(__webpack_require__(28));
const users_routes_1 = tslib_1.__importDefault(__webpack_require__(30));
// Middleware
const auth_middleware_1 = __webpack_require__(25);
class SolariHubServer {
    app;
    server;
    constructor() {
        this.app = (0, express_1.default)();
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }
    initializeMiddleware() {
        // Security middleware
        this.app.use((0, helmet_1.default)({
            contentSecurityPolicy: environment_1.config.isProduction,
            crossOriginEmbedderPolicy: environment_1.config.isProduction,
        }));
        // CORS configuration
        this.app.use((0, cors_1.default)({
            origin: environment_1.config.isProduction
                ? [environment_1.config.frontendUrl, 'https://solarihub.com', 'https://www.solarihub.com']
                : true,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Requested-With'],
        }));
        // Rate limiting
        const rateLimiter = (0, express_rate_limit_1.default)({
            windowMs: environment_1.config.security.rateLimitWindowMs,
            max: environment_1.config.security.rateLimitMaxRequests,
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
        this.app.use(express_1.default.json({
            limit: '10mb',
            verify: (req, res, buf) => {
                try {
                    JSON.parse(buf.toString());
                }
                catch {
                    throw new Error('Invalid JSON');
                }
            },
        }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Compression
        this.app.use((0, compression_1.default)());
        // Request logging
        this.app.use((0, morgan_1.default)(logger_1.morganFormat, { stream: logger_1.morganStream }));
        // Custom middleware
        this.app.use(auth_middleware_1.extractRealIP);
        this.app.use(auth_middleware_1.logRequest);
        // Trust proxy (for accurate IP addresses)
        this.app.set('trust proxy', 1);
    }
    initializeRoutes() {
        // API routes
        this.app.use(`${environment_1.config.apiPrefix}/health`, health_routes_1.default);
        this.app.use(`${environment_1.config.apiPrefix}/auth`, auth_routes_1.default);
        this.app.use(`${environment_1.config.apiPrefix}/users`, users_routes_1.default);
        // Root endpoint
        this.app.get('/', (req, res) => {
            res.json({
                success: true,
                message: 'Welcome to SolariHub API v4.1',
                version: '4.1.0',
                environment: environment_1.config.nodeEnv,
                documentation: `${environment_1.config.frontendUrl}/docs`,
                endpoints: {
                    health: `${environment_1.config.apiPrefix}/health`,
                    auth: `${environment_1.config.apiPrefix}/auth`,
                    users: `${environment_1.config.apiPrefix}/users`,
                },
                timestamp: new Date().toISOString(),
            });
        });
        // API documentation endpoint
        this.app.get(`${environment_1.config.apiPrefix}`, (req, res) => {
            res.json({
                success: true,
                message: 'SolariHub CleanTech Ecosystem API',
                version: '4.1.0',
                environment: environment_1.config.nodeEnv,
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
    initializeErrorHandling() {
        // 404 handler for undefined routes
        this.app.use(errors_1.notFoundHandler);
        // Global error handler
        this.app.use(errors_1.globalErrorHandler);
    }
    async start() {
        try {
            // Initialize database connections
            logger_1.logger.info('Initializing database connections...');
            await database_service_1.databaseService.initialize();
            // Start HTTP server
            this.server = this.app.listen(environment_1.config.port, () => {
                logger_1.logger.info(`🚀 SolariHub API v4.1 started successfully!`, {
                    port: environment_1.config.port,
                    environment: environment_1.config.nodeEnv,
                    apiPrefix: environment_1.config.apiPrefix,
                    timestamp: new Date().toISOString(),
                });
                logger_1.logger.info('📊 Server Information:', {
                    nodeVersion: process.version,
                    platform: process.platform,
                    architecture: process.arch,
                    pid: process.pid,
                    uptime: process.uptime(),
                });
                logger_1.logger.info('🔗 Available Endpoints:', {
                    health: `http://localhost:${environment_1.config.port}${environment_1.config.apiPrefix}/health`,
                    auth: `http://localhost:${environment_1.config.port}${environment_1.config.apiPrefix}/auth`,
                    users: `http://localhost:${environment_1.config.port}${environment_1.config.apiPrefix}/users`,
                    docs: `http://localhost:${environment_1.config.port}${environment_1.config.apiPrefix}`,
                });
                if (environment_1.config.isDevelopment) {
                    logger_1.logger.info('🧪 Development Mode Active:', {
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
            const shutdown = (0, errors_1.gracefulShutdown)(this.server);
            process.on('SIGTERM', () => shutdown('SIGTERM'));
            process.on('SIGINT', () => shutdown('SIGINT'));
            // Setup process error handlers
            (0, errors_1.setupProcessHandlers)();
        }
        catch (error) {
            logger_1.logger.error('Failed to start server:', error);
            process.exit(1);
        }
    }
    async stop() {
        logger_1.logger.info('Shutting down SolariHub API...');
        try {
            // Close database connections
            await database_service_1.databaseService.shutdown();
            // Close HTTP server
            if (this.server) {
                this.server.close();
            }
            logger_1.logger.info('SolariHub API shutdown completed');
        }
        catch (error) {
            logger_1.logger.error('Error during shutdown:', error);
            throw error;
        }
    }
    getApp() {
        return this.app;
    }
}
exports.SolariHubServer = SolariHubServer;
// Create and start server
const server = new SolariHubServer();
// Start server if not in test environment
if (environment_1.config.nodeEnv !== 'test') {
    server.start().catch((error) => {
        logger_1.logger.error('Failed to start SolariHub API:', error);
        process.exit(1);
    });
}
// Export for testing
exports["default"] = server;

})();

/******/ })()
;