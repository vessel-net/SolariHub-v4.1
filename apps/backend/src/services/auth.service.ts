import jwt from 'jsonwebtoken';
import { userModel, User, CreateUserData } from '../models/user.model';
import { userService } from './user.service';
import { redisClient } from '../config/database';
import { config } from '../config/environment';
import { AuthenticationError } from '../utils/errors';
import { logger, logAuth } from '../utils/logger';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>;
  tokens: AuthTokens;
}

export class AuthService {
  private static instance: AuthService;
  private readonly JWT_SECRET = config.jwt.secret;
  private readonly ACCESS_TOKEN_EXPIRES_IN = config.jwt.expiresIn;
  private readonly REFRESH_TOKEN_EXPIRES_IN = config.jwt.refreshExpiresIn;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async register(userData: CreateUserData, ip?: string): Promise<AuthResponse> {
    try {
      const user = await userService.createUser(userData);
      const tokens = await this.generateTokens(user);

      logAuth('register', user.id, user.email, ip, true);
      
      logger.info('User registered successfully', {
        userId: user.id,
        email: user.email,
        role: user.role,
        ip,
      });

      return {
        user,
        tokens,
      };
    } catch (error) {
      logAuth('register', undefined, userData.email, ip, false);
      logger.error('Registration failed:', error, {
        email: userData.email,
        role: userData.role,
        ip,
      });
      throw error;
    }
  }

  public async login(credentials: LoginCredentials, ip?: string): Promise<AuthResponse> {
    const { email, password } = credentials;

    try {
      // Find user by email
      const user = await userService.getUserByEmail(email);
      if (!user) {
        logAuth('login', undefined, email, ip, false);
        throw new AuthenticationError('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await userModel.verifyPassword(password, user.password_hash);
      if (!isPasswordValid) {
        logAuth('login', user.id, email, ip, false);
        throw new AuthenticationError('Invalid email or password');
      }

      // Generate tokens
      const tokens = await this.generateTokens(user);

      logAuth('login', user.id, email, ip, true);
      
      logger.info('User logged in successfully', {
        userId: user.id,
        email: user.email,
        role: user.role,
        ip,
      });

      // Remove password hash from response
      const { password_hash, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        tokens,
      };
    } catch (error) {
      if (!(error instanceof AuthenticationError)) {
        logger.error('Login failed:', error, { email, ip });
      }
      throw error;
    }
  }

  public async refreshToken(refreshToken: string, ip?: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.JWT_SECRET) as TokenPayload;
      
      // Check if refresh token exists in Redis
      const storedToken = await redisClient.get(`refresh_token:${decoded.userId}`);
      if (!storedToken || storedToken !== refreshToken) {
        throw new AuthenticationError('Invalid refresh token');
      }

      // Get user
      const user = await userService.getUserByEmail(decoded.email);
      if (!user) {
        throw new AuthenticationError('User not found');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      logAuth('refresh_token', user.id, user.email, ip, true);
      
      logger.info('Token refreshed successfully', {
        userId: user.id,
        email: user.email,
        ip,
      });

      return tokens;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid refresh token');
      }
      throw error;
    }
  }

  public async logout(userId: string, ip?: string): Promise<void> {
    try {
      // Remove refresh token from Redis
      await redisClient.del(`refresh_token:${userId}`);

      const user = await userService.getUserById(userId);
      logAuth('logout', userId, user?.email, ip, true);
      
      logger.info('User logged out successfully', {
        userId,
        ip,
      });
    } catch (error) {
      logger.error('Logout failed:', error, { userId, ip });
      throw error;
    }
  }

  public async logoutAll(userId: string, ip?: string): Promise<void> {
    try {
      // Remove all refresh tokens for this user
      const keys = await redisClient.keys(`refresh_token:${userId}*`);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }

      const user = await userService.getUserById(userId);
      logAuth('logout_all', userId, user?.email, ip, true);
      
      logger.info('User logged out from all devices', {
        userId,
        devicesCount: keys.length,
        ip,
      });
    } catch (error) {
      logger.error('Logout all failed:', error, { userId, ip });
      throw error;
    }
  }

  public async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as TokenPayload;
      
      // Check if user still exists
      const user = await userService.getUserById(decoded.userId);
      if (!user) {
        throw new AuthenticationError('User not found');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid token');
      }
      throw error;
    }
  }

  public async changePassword(userId: string, currentPassword: string, newPassword: string, ip?: string): Promise<void> {
    try {
      await userService.changePassword(userId, currentPassword, newPassword);
      
      // Logout from all devices for security
      await this.logoutAll(userId, ip);

      const user = await userService.getUserById(userId);
      logAuth('change_password', userId, user?.email, ip, true);
      
      logger.info('Password changed successfully', {
        userId,
        ip,
      });
    } catch (error) {
      const user = await userService.getUserById(userId);
      logAuth('change_password', userId, user?.email, ip, false);
      throw error;
    }
  }

  public async requestPasswordReset(email: string, ip?: string): Promise<void> {
    try {
      const user = await userService.getUserByEmail(email);
      if (!user) {
        // Don't reveal that user doesn't exist
        logger.warn('Password reset requested for non-existent user', { email, ip });
        return;
      }

      // Generate reset token
      const resetToken = this.generateResetToken(user.id);
      
      // Store reset token in Redis with 1 hour expiration
      await redisClient.setEx(`password_reset:${user.id}`, 3600, resetToken);

      logAuth('password_reset_request', user.id, email, ip, true);
      
      logger.info('Password reset requested', {
        userId: user.id,
        email,
        ip,
      });

      // TODO: Send email with reset token
      // await emailService.sendPasswordResetEmail(email, resetToken);
    } catch (error) {
      logger.error('Password reset request failed:', error, { email, ip });
      throw error;
    }
  }

  public async resetPassword(token: string, newPassword: string, ip?: string): Promise<void> {
    try {
      // Verify reset token
      const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: string; type: string };
      
      if (decoded.type !== 'password_reset') {
        throw new AuthenticationError('Invalid reset token');
      }

      // Check if reset token exists in Redis
      const storedToken = await redisClient.get(`password_reset:${decoded.userId}`);
      if (!storedToken || storedToken !== token) {
        throw new AuthenticationError('Invalid or expired reset token');
      }

      // Change password
      await userModel.changePassword(decoded.userId, newPassword);
      
      // Remove reset token
      await redisClient.del(`password_reset:${decoded.userId}`);
      
      // Logout from all devices
      await this.logoutAll(decoded.userId, ip);

      const user = await userService.getUserById(decoded.userId);
      logAuth('password_reset', decoded.userId, user?.email, ip, true);
      
      logger.info('Password reset successfully', {
        userId: decoded.userId,
        ip,
      });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid reset token');
      }
      throw error;
    }
  }

  private async generateTokens(user: Omit<User, 'password_hash'>): Promise<AuthTokens> {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    // Generate access token
    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
    } as jwt.SignOptions);

    // Generate refresh token
    const refreshToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
    } as jwt.SignOptions);

    // Store refresh token in Redis
    const refreshTokenKey = `refresh_token:${user.id}`;
    const refreshTokenExpiry = this.getExpiryInSeconds(this.REFRESH_TOKEN_EXPIRES_IN);
    await redisClient.setEx(refreshTokenKey, refreshTokenExpiry, refreshToken);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getExpiryInSeconds(this.ACCESS_TOKEN_EXPIRES_IN),
    };
  }

  private generateResetToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'password_reset' },
      this.JWT_SECRET,
      { expiresIn: '1h' }
    );
  }

  private getExpiryInSeconds(expiresIn: string): number {
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

  public async getActiveSessionsCount(userId: string): Promise<number> {
    try {
      const keys = await redisClient.keys(`refresh_token:${userId}*`);
      return keys.length;
    } catch (error) {
      logger.error('Failed to get active sessions count:', error, { userId });
      return 0;
    }
  }

  public async validateUserRole(userId: string, requiredRoles: string[]): Promise<boolean> {
    try {
      const user = await userService.getUserById(userId);
      if (!user) {
        return false;
      }

      return requiredRoles.includes(user.role);
    } catch (error) {
      logger.error('Failed to validate user role:', error, { userId, requiredRoles });
      return false;
    }
  }
}

export const authService = AuthService.getInstance(); 