import { Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { successResponse } from '../../types/api';
import { AuthenticatedRequest } from '../../types/context';
import { UpdateProfileDto } from './users.types';

export class UsersController {
  async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = await usersService.getCurrentUser(userId);
      res.status(200).json(successResponse(user));
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const user = await usersService.getUserById(userId);
      res.status(200).json(successResponse(user));
    } catch (error) {
      next(error);
    }
  }

  async getUserByUsername(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username } = req.params;
      const user = await usersService.getUserByUsername(username);
      res.status(200).json(successResponse(user));
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const data: UpdateProfileDto = req.body;
      const user = await usersService.updateProfile(userId, data);
      res.status(200).json(successResponse(user));
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
