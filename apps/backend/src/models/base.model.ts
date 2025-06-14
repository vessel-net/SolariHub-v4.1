import { Pool } from 'pg';
import { databaseService } from '../services/database.service';
import { DatabaseError } from '../utils/errors';
import { logger } from '../utils/logger';

export abstract class BaseModel {
  protected static tableName: string;
  protected pool: Pool;

  constructor() {
    this.pool = databaseService.getPostgresPool();
  }

  public async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug('Database query executed', {
        query: text,
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
      return result;
    } catch (error) {
      logger.error('Database query failed:', error, {
        query: text,
        params,
      });
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
      throw new DatabaseError(`Database query failed: ${errorMessage}`);
    }
  }

  protected async findById(id: string): Promise<any | null> {
    const tableName = (this.constructor as any).tableName;
    const result = await this.query(
      `SELECT * FROM ${tableName} WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  protected async findByField(field: string, value: any): Promise<any | null> {
    const tableName = (this.constructor as any).tableName;
    const result = await this.query(
      `SELECT * FROM ${tableName} WHERE ${field} = $1`,
      [value]
    );
    return result.rows[0] || null;
  }

  protected async findAll(limit?: number, offset?: number): Promise<any[]> {
    const tableName = (this.constructor as any).tableName;
    let query = `SELECT * FROM ${tableName}`;
    const params: any[] = [];

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

  protected async create(data: Record<string, any>): Promise<any> {
    const tableName = (this.constructor as any).tableName;
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

  protected async update(id: string, data: Record<string, any>): Promise<any> {
    const tableName = (this.constructor as any).tableName;
    const fields = Object.keys(data);
    const values = Object.values(data);
    
    const setClause = fields
      .map((field, index) => `${field} = $${index + 2}`)
      .join(', ');

    const query = `
      UPDATE ${tableName}
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.query(query, [id, ...values]);
    return result.rows[0];
  }

  public async delete(id: string): Promise<boolean> {
    const tableName = (this.constructor as any).tableName;
    const result = await this.query(
      `DELETE FROM ${tableName} WHERE id = $1`,
      [id]
    );
    return result.rowCount > 0;
  }

  public async exists(field: string, value: any): Promise<boolean> {
    const tableName = (this.constructor as any).tableName;
    const result = await this.query(
      `SELECT 1 FROM ${tableName} WHERE ${field} = $1 LIMIT 1`,
      [value]
    );
    return result.rowCount > 0;
  }

  public async count(conditions?: Record<string, any>): Promise<number> {
    const tableName = (this.constructor as any).tableName;
    let query = `SELECT COUNT(*) FROM ${tableName}`;
    const params: any[] = [];

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