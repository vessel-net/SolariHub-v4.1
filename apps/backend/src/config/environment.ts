import dotenv from 'dotenv';
import Joi from 'joi';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().positive().default(4000),
  API_PREFIX: Joi.string().default('/api/v1'),

  // Database Configuration
  POSTGRES_HOST: Joi.string().default('localhost'),
  POSTGRES_PORT: Joi.number().positive().default(5432),
  POSTGRES_DB: Joi.string().required(),
  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().required(),

  // MongoDB Configuration
  MONGODB_URI: Joi.string().required(),

  // Redis Configuration
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().positive().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),

  // JWT Configuration
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),

  // Security
  BCRYPT_ROUNDS: Joi.number().positive().default(12),
  RATE_LIMIT_WINDOW_MS: Joi.number().positive().default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().positive().default(100),

  // External Services
  FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),

  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  LOG_FILE: Joi.string().default('logs/app.log'),

  // Email
  FROM_EMAIL: Joi.string().email().default('no-reply@solarihub.net'),

  // Development
  DEV_SEED_DATA: Joi.boolean().default(false),
  DEV_RESET_DB: Joi.boolean().default(false),
}).unknown();

// Validate environment variables
const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

// Export validated configuration
export const config = {
  // Server
  nodeEnv: envVars.NODE_ENV as string,
  port: envVars.PORT as number,
  apiPrefix: envVars.API_PREFIX as string,
  isProduction: envVars.NODE_ENV === 'production',
  isDevelopment: envVars.NODE_ENV === 'development',
  isTest: envVars.NODE_ENV === 'test',

  // Database
  postgres: {
    host: envVars.POSTGRES_HOST as string,
    port: envVars.POSTGRES_PORT as number,
    database: envVars.POSTGRES_DB as string,
    username: envVars.POSTGRES_USER as string,
    password: envVars.POSTGRES_PASSWORD as string,
  },

  mongodb: {
    uri: envVars.MONGODB_URI as string,
  },

  redis: {
    host: envVars.REDIS_HOST as string,
    port: envVars.REDIS_PORT as number,
    password: envVars.REDIS_PASSWORD as string,
  },

  // JWT
  jwt: {
    secret: envVars.JWT_SECRET as string,
    expiresIn: envVars.JWT_EXPIRES_IN as string,
    refreshExpiresIn: envVars.JWT_REFRESH_EXPIRES_IN as string,
  },

  // Security
  security: {
    bcryptRounds: envVars.BCRYPT_ROUNDS as number,
    rateLimitWindowMs: envVars.RATE_LIMIT_WINDOW_MS as number,
    rateLimitMaxRequests: envVars.RATE_LIMIT_MAX_REQUESTS as number,
  },

  // External Services
  frontendUrl: envVars.FRONTEND_URL as string,

  // Logging
  logging: {
    level: envVars.LOG_LEVEL as string,
    file: envVars.LOG_FILE as string,
  },

  // Email
  email: {
    from: envVars.FROM_EMAIL as string,
  },

  // Development
  development: {
    seedData: envVars.DEV_SEED_DATA as boolean,
    resetDb: envVars.DEV_RESET_DB as boolean,
  },
} as const;

export default config; 