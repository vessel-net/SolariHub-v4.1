import {
  userModel,
  User,
  UserWithProfile,
  CreateUserData,
  UpdateUserData,
  UserRole,
  UserProfile,
} from '../models/user.model';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

export class UserService {
  private static instance: UserService;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  public async createUser(userData: CreateUserData): Promise<Omit<User, 'password_hash'>> {
    try {
      const user = await userModel.create(userData);

      logger.info('User created successfully', {
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Return user without password hash
      const { password_hash: _password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      logger.error('Failed to create user:', error, {
        email: userData.email,
        role: userData.role,
      });
      throw error;
    }
  }

  public async getUserById(id: string): Promise<Omit<User, 'password_hash'> | null> {
    try {
      const user = await userModel.findById(id);

      if (!user) {
        return null;
      }

      const { password_hash: _password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      logger.error('Failed to get user by ID:', error, { userId: id });
      throw error;
    }
  }

  public async getUserWithProfile(
    id: string
  ): Promise<Omit<UserWithProfile, 'password_hash'> | null> {
    try {
      const userWithProfile = await userModel.findWithProfile(id);

      if (!userWithProfile) {
        return null;
      }

      const { password_hash: _password_hash, ...userWithoutPassword } = userWithProfile;
      return userWithoutPassword;
    } catch (error) {
      logger.error('Failed to get user with profile:', error, { userId: id });
      throw error;
    }
  }

  public async getUserByEmail(email: string): Promise<User | null> {
    try {
      return await userModel.findByEmail(email);
    } catch (error) {
      logger.error('Failed to get user by email:', error, { email });
      throw error;
    }
  }

  public async updateUser(
    id: string,
    updateData: UpdateUserData
  ): Promise<Omit<User, 'password_hash'>> {
    try {
      const existingUser = await userModel.findById(id);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      const updatedUser = await userModel.updateUser(id, updateData);

      logger.info('User updated successfully', {
        userId: id,
        updatedFields: Object.keys(updateData),
      });

      const { password_hash: _password_hash, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;
    } catch (error) {
      logger.error('Failed to update user:', error, { userId: id });
      throw error;
    }
  }

  public async updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<void> {
    try {
      const existingUser = await userModel.findById(userId);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      await userModel.updateProfile(userId, profileData);

      logger.info('User profile updated successfully', {
        userId,
        updatedFields: Object.keys(profileData),
      });
    } catch (error) {
      logger.error('Failed to update user profile:', error, { userId });
      throw error;
    }
  }

  public async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      const user = await userModel.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await userModel.verifyPassword(
        currentPassword,
        user.password_hash
      );
      if (!isCurrentPasswordValid) {
        throw new ValidationError('Current password is incorrect');
      }

      await userModel.changePassword(userId, newPassword);

      logger.info('Password changed successfully', { userId });
    } catch (error) {
      logger.error('Failed to change password:', error, { userId });
      throw error;
    }
  }

  public async verifyUserEmail(userId: string): Promise<void> {
    try {
      const existingUser = await userModel.findById(userId);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      await userModel.verifyEmail(userId);

      logger.info('User email verified successfully', { userId });
    } catch (error) {
      logger.error('Failed to verify user email:', error, { userId });
      throw error;
    }
  }

  public async deleteUser(id: string): Promise<void> {
    try {
      const existingUser = await userModel.findById(id);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      const deleted = await userModel.delete(id);
      if (!deleted) {
        throw new Error('Failed to delete user');
      }

      logger.info('User deleted successfully', { userId: id });
    } catch (error) {
      logger.error('Failed to delete user:', error, { userId: id });
      throw error;
    }
  }

  public async getUsersByRole(
    role: UserRole,
    page = 1,
    limit = 50
  ): Promise<{
    users: Omit<User, 'password_hash'>[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const offset = (page - 1) * limit;
      const users = await userModel.findByRole(role, limit, offset);
      const total = await userModel.count({ role });

      const usersWithoutPassword = users.map((user: any) => {
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
    } catch (error) {
      logger.error('Failed to get users by role:', error, { role, page, limit });
      throw error;
    }
  }

  public async getUserStats(): Promise<{
    total: number;
    by_role: Record<UserRole, number>;
    verified: number;
    unverified: number;
  }> {
    try {
      return await userModel.getUserStats();
    } catch (error) {
      logger.error('Failed to get user stats:', error);
      throw error;
    }
  }

  public async searchUsers(
    query: string,
    role?: UserRole,
    page = 1,
    limit = 50
  ): Promise<{
    users: Omit<User, 'password_hash'>[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
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

      const params: any[] = [`%${query}%`];

      if (role) {
        searchQuery += ` AND u.role = $${params.length + 1}`;
        params.push(role);
      }

      searchQuery += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await userModel.query(searchQuery, params);
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

      const countParams: any[] = [`%${query}%`];

      if (role) {
        countQuery += ` AND u.role = $${countParams.length + 1}`;
        countParams.push(role);
      }

      const countResult = await userModel.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count, 10);

      const usersWithoutPassword = users.map((user: any) => {
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
    } catch (error) {
      logger.error('Failed to search users:', error, { query, role, page, limit });
      throw error;
    }
  }

  public async isEmailTaken(email: string, excludeUserId?: string): Promise<boolean> {
    try {
      const existingUser = await userModel.findByEmail(email);

      if (!existingUser) {
        return false;
      }

      if (excludeUserId && existingUser.id === excludeUserId) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Failed to check if email is taken:', error, { email });
      throw error;
    }
  }
}

export const userService = UserService.getInstance();
