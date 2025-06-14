import {
  postgresPool,
  initializeDatabases,
  closeDatabaseConnections,
  checkDatabaseHealth,
} from '../config/database';
import { logger } from '../utils/logger';
import { DatabaseError } from '../utils/errors';

export class DatabaseService {
  private static instance: DatabaseService;
  private isInitialized = false;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await initializeDatabases();
      this.isInitialized = true;
      logger.info('Database service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database service:', error);
      throw new DatabaseError('Database initialization failed');
    }
  }

  public async shutdown(): Promise<void> {
    try {
      await closeDatabaseConnections();
      this.isInitialized = false;
      logger.info('Database service shutdown successfully');
    } catch (error) {
      logger.error('Failed to shutdown database service:', error);
      throw new DatabaseError('Database shutdown failed');
    }
  }

  public async healthCheck(): Promise<{ postgres: boolean; mongodb: boolean; redis: boolean }> {
    try {
      return await checkDatabaseHealth();
    } catch (error) {
      logger.error('Database health check failed:', error);
      throw new DatabaseError('Database health check failed');
    }
  }

  public getPostgresPool() {
    return postgresPool;
  }

  public isHealthy(): boolean {
    return this.isInitialized;
  }
}

export const databaseService = DatabaseService.getInstance();
