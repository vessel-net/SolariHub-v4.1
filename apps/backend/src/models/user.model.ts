import bcrypt from 'bcryptjs';
import { BaseModel } from './base.model';
import { config } from '../config/environment';
import { ValidationError, ConflictError } from '../utils/errors';
import { validateEmail, validatePassword, validateUUID } from '../utils/errors';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserProfile {
  user_id: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
  };
  kyc_status: KYCStatus;
  created_at: Date;
}

export interface CreateUserData {
  email: string;
  password: string;
  role: UserRole;
  profile?: Partial<UserProfile>;
}

export interface UpdateUserData {
  email?: string;
  role?: UserRole;
  email_verified?: boolean;
}

export interface UserWithProfile extends User {
  profile?: UserProfile;
}

export type UserRole = 'buyer' | 'seller' | 'logistics' | 'finance' | 'admin';
export type KYCStatus = 'pending' | 'in_progress' | 'approved' | 'rejected';

export class UserModel extends BaseModel {
  protected static override tableName = 'auth.users';

  public override async findById(id: string): Promise<User | null> {
    validateUUID(id);
    return super.findById(id);
  }

  public async findByEmail(email: string): Promise<User | null> {
    validateEmail(email);
    return this.findByField('email', email);
  }

  public async findWithProfile(id: string): Promise<UserWithProfile | null> {
    validateUUID(id);
    
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
    const user: UserWithProfile = {
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

  public override async create(userData: CreateUserData): Promise<User> {
    const { email, password, role, profile } = userData;

    // Validate input
    validateEmail(email);
    validatePassword(password);

    if (!['buyer', 'seller', 'logistics', 'finance', 'admin'].includes(role)) {
      throw new ValidationError('Invalid user role');
    }

    // Check if user already exists
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, config.security.bcryptRounds);

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

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  public async updateUser(id: string, updateData: UpdateUserData): Promise<User> {
    validateUUID(id);

    if (updateData.email) {
      validateEmail(updateData.email);
      
      // Check if email is already taken by another user
      const existingUser = await this.findByEmail(updateData.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictError('Email is already taken by another user');
      }
    }

    return this.update(id, updateData);
  }

  public async updateProfile(userId: string, profileData: Partial<UserProfile>): Promise<void> {
    validateUUID(userId);

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
        INSERT INTO auth.user_profiles (user_id, ${fields.map(f => f.split(' = ')[0]).join(', ')})
        VALUES ($1, ${fields.map((_, i) => `$${i + 2}`).join(', ')})
      `, [userId, ...values]);
    } else {
      // Update existing profile
      await this.query(`
        UPDATE auth.user_profiles
        SET ${fields.join(', ')}
        WHERE user_id = $1
      `, [userId, ...values]);
    }
  }

  public async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  public async changePassword(userId: string, newPassword: string): Promise<void> {
    validateUUID(userId);
    validatePassword(newPassword);

    const password_hash = await bcrypt.hash(newPassword, config.security.bcryptRounds);
    
    await this.query(`
      UPDATE auth.users
      SET password_hash = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [userId, password_hash]);
  }

  public async verifyEmail(userId: string): Promise<void> {
    validateUUID(userId);
    
    await this.query(`
      UPDATE auth.users
      SET email_verified = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [userId]);
  }

  public async findByRole(role: UserRole, limit = 50, offset = 0): Promise<User[]> {
    const result = await this.query(`
      SELECT * FROM auth.users
      WHERE role = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [role, limit, offset]);

    return result.rows;
  }

  public async getUserStats(): Promise<{
    total: number;
    by_role: Record<UserRole, number>;
    verified: number;
    unverified: number;
  }> {
    const totalResult = await this.query('SELECT COUNT(*) as count FROM auth.users');
    const total = parseInt(totalResult.rows[0].count, 10);

    const roleResult = await this.query(`
      SELECT role, COUNT(*) as count
      FROM auth.users
      GROUP BY role
    `);

    const by_role: Record<UserRole, number> = {
      buyer: 0,
      seller: 0,
      logistics: 0,
      finance: 0,
      admin: 0,
    };

    roleResult.rows.forEach((row: any) => {
      by_role[row.role as UserRole] = parseInt(row.count, 10);
    });

    const verificationResult = await this.query(`
      SELECT email_verified, COUNT(*) as count
      FROM auth.users
      GROUP BY email_verified
    `);

    let verified = 0;
    let unverified = 0;

    verificationResult.rows.forEach((row: any) => {
      if (row.email_verified) {
        verified = parseInt(row.count, 10);
      } else {
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

export const userModel = new UserModel(); 