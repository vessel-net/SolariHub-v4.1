import { Request, Response } from 'express';
import { userService } from '../../services/user.service';
import { UpdateUserData, UserRole, UserProfile } from '../../models/user.model';
import { catchAsync, ValidationError, NotFoundError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export const getUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const user = await userService.getUserWithProfile(id);
  
  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.status(200).json({
    success: true,
    data: {
      user,
    },
  });
});

export const getCurrentUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;

  const user = await userService.getUserWithProfile(userId);
  
  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.status(200).json({
    success: true,
    data: {
      user,
    },
  });
});

export const updateUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const updateData: UpdateUserData = req.body;

  // Remove fields that shouldn't be updated via this endpoint
  delete (updateData as any).password;
  delete (updateData as any).password_hash;

  const user = await userService.updateUser(id, updateData);

  logger.info('User updated', {
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

export const updateCurrentUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const updateData: UpdateUserData = req.body;

  // Remove fields that shouldn't be updated via this endpoint
  delete (updateData as any).password;
  delete (updateData as any).password_hash;
  delete (updateData as any).role; // Users can't change their own role

  const user = await userService.updateUser(userId, updateData);

  logger.info('User self-updated', {
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

export const updateUserProfile = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const profileData: Partial<UserProfile> = req.body;

  await userService.updateUserProfile(id, profileData);

  logger.info('User profile updated', {
    userId: id,
    updatedBy: req.userId,
    updatedFields: Object.keys(profileData),
  });

  res.status(200).json({
    success: true,
    message: 'User profile updated successfully',
  });
});

export const updateCurrentUserProfile = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const profileData: Partial<UserProfile> = req.body;

  await userService.updateUserProfile(userId, profileData);

  logger.info('User self-updated profile', {
    userId,
    updatedFields: Object.keys(profileData),
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
  });
});

export const deleteUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  await userService.deleteUser(id);

  logger.info('User deleted', {
    userId: id,
    deletedBy: req.userId,
  });

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});

export const getUsers = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const role = req.query.role as UserRole | undefined;

  let result;

  if (role) {
    result = await userService.getUsersByRole(role, page, limit);
  } else {
    // If no role specified, get all users (admin only)
    const allRoles: UserRole[] = ['buyer', 'seller', 'logistics', 'finance', 'admin'];
    const users: any[] = [];
    let totalCount = 0;

    for (const userRole of allRoles) {
      const roleResult = await userService.getUsersByRole(userRole, 1, 1000);
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

export const searchUsers = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const query = req.query.q as string;
  const role = req.query.role as UserRole | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

  if (!query) {
    throw new ValidationError('Search query is required');
  }

  const result = await userService.searchUsers(query, role, page, limit);

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getUserStats = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const stats = await userService.getUserStats();

  res.status(200).json({
    success: true,
    data: {
      stats,
    },
  });
});

export const verifyUserEmail = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  await userService.verifyUserEmail(id);

  logger.info('User email verified', {
    userId: id,
    verifiedBy: req.userId,
  });

  res.status(200).json({
    success: true,
    message: 'User email verified successfully',
  });
});

export const checkEmailAvailability = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { email } = req.query;

  if (!email || typeof email !== 'string') {
    throw new ValidationError('Email is required');
  }

  const isTaken = await userService.isEmailTaken(email);

  res.status(200).json({
    success: true,
    data: {
      email,
      available: !isTaken,
    },
  });
}); 