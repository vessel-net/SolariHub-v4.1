import { Request, Response } from 'express';
import { authService, LoginCredentials } from '../../services/auth.service';
import { CreateUserData } from '../../models/user.model';
import { catchAsync, ValidationError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export const register = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { email, password, role, profile } = req.body;

  // Validate required fields
  if (!email || !password || !role) {
    throw new ValidationError('Email, password, and role are required');
  }

  const userData: CreateUserData = {
    email,
    password,
    role,
    profile,
  };

  const result = await authService.register(userData, req.ip);

  logger.info('User registration successful', {
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

export const login = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }

  const credentials: LoginCredentials = {
    email,
    password,
  };

  const result = await authService.login(credentials, req.ip);

  logger.info('User login successful', {
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

export const refreshToken = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ValidationError('Refresh token is required');
  }

  const tokens = await authService.refreshToken(refreshToken, req.ip);

  logger.info('Token refresh successful', {
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

export const logout = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;

  await authService.logout(userId, req.ip);

  logger.info('User logout successful', {
    userId,
    ip: req.ip,
  });

  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});

export const logoutAll = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;

  await authService.logoutAll(userId, req.ip);

  logger.info('User logout from all devices successful', {
    userId,
    ip: req.ip,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out from all devices successfully',
  });
});

export const changePassword = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.userId!;

  if (!currentPassword || !newPassword) {
    throw new ValidationError('Current password and new password are required');
  }

  await authService.changePassword(userId, currentPassword, newPassword, req.ip);

  logger.info('Password change successful', {
    userId,
    ip: req.ip,
  });

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
});

export const requestPasswordReset = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    if (!email) {
      throw new ValidationError('Email is required');
    }

    await authService.requestPasswordReset(email, req.ip);

    // Always return success for security reasons (don't reveal if email exists)
    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent',
    });
  }
);

export const resetPassword = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw new ValidationError('Reset token and new password are required');
  }

  await authService.resetPassword(token, newPassword, req.ip);

  logger.info('Password reset successful', {
    ip: req.ip,
  });

  res.status(200).json({
    success: true,
    message: 'Password reset successfully',
  });
});

export const getProfile = catchAsync(async (req: Request, res: Response): Promise<void> => {
  // The user profile is already available in req.user from the auth middleware
  const user = {
    id: req.user!.userId,
    email: req.user!.email,
    role: req.user!.role,
  };

  res.status(200).json({
    success: true,
    data: {
      user,
    },
  });
});

export const validateToken = catchAsync(async (req: Request, res: Response): Promise<void> => {
  // If we reach here, the token is valid (validated by auth middleware)
  const user = {
    id: req.user!.userId,
    email: req.user!.email,
    role: req.user!.role,
  };

  res.status(200).json({
    success: true,
    message: 'Token is valid',
    data: {
      user,
      iat: req.user!.iat,
      exp: req.user!.exp,
    },
  });
});

export const getActiveSessions = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;

  const sessionCount = await authService.getActiveSessionsCount(userId);

  res.status(200).json({
    success: true,
    data: {
      activeSessions: sessionCount,
    },
  });
});
