import { Pool, PoolConfig } from 'pg';
import mongoose, { ConnectOptions } from 'mongoose';
import Redis from 'redis';
import { config } from './environment';
import { logger } from '../utils/logger';

// PostgreSQL Connection
const postgresConfig: PoolConfig = {
  host: config.postgres.host,
  port: config.postgres.port,
  database: config.postgres.database,
  user: config.postgres.username,
  password: config.postgres.password,
  max: 10, // Maximum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: config.isProduction ? { rejectUnauthorized: false } : false,
};

export const postgresPool = new Pool(postgresConfig);

// Test PostgreSQL connection
postgresPool.on('connect', () => {
  logger.info('PostgreSQL client connected');
});

postgresPool.on('error', (err) => {
  logger.error('PostgreSQL connection error:', err);
});

// MongoDB Connection
const mongoOptions: ConnectOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
};

export const connectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodb.uri, mongoOptions);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    throw error;
  }
};

// MongoDB event handlers
mongoose.connection.on('connected', () => {
  logger.info('MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

// Redis Connection
export const redisClient = Redis.createClient({
  socket: {
    host: config.redis.host,
    port: config.redis.port,
  },
  password: config.redis.password || undefined,
});

// Redis event handlers
redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

// Connect to Redis
export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    logger.info('Redis connected successfully');
  } catch (error) {
    logger.error('Redis connection error:', error);
    throw error;
  }
};

// Database initialization function
export const initializeDatabases = async (): Promise<void> => {
  try {
    // Test PostgreSQL connection
    const client = await postgresPool.connect();
    client.release();
    logger.info('PostgreSQL connection verified');

    // Connect to MongoDB
    await connectMongoDB();

    // Connect to Redis
    await connectRedis();

    logger.info('All databases initialized successfully');
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
};

// Graceful shutdown
export const closeDatabaseConnections = async (): Promise<void> => {
  try {
    await postgresPool.end();
    await mongoose.connection.close();
    await redisClient.quit();
    logger.info('All database connections closed');
  } catch (error) {
    logger.error('Error closing database connections:', error);
    throw error;
  }
};

// Database health check
export const checkDatabaseHealth = async (): Promise<{ postgres: boolean; mongodb: boolean; redis: boolean }> => {
  const health = {
    postgres: false,
    mongodb: false,
    redis: false,
  };

  try {
    // Check PostgreSQL
    const client = await postgresPool.connect();
    await client.query('SELECT 1');
    client.release();
    health.postgres = true;
  } catch (error) {
    logger.warn('PostgreSQL health check failed:', error);
  }

  try {
    // Check MongoDB
    if (mongoose.connection.readyState === 1) {
      health.mongodb = true;
    }
  } catch (error) {
    logger.warn('MongoDB health check failed:', error);
  }

  try {
    // Check Redis
    await redisClient.ping();
    health.redis = true;
  } catch (error) {
    logger.warn('Redis health check failed:', error);
  }

  return health;
}; 