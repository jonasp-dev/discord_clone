import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { successResponse } from '../../types/api';
import { RegisterDto, LoginDto } from './auth.types';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: RegisterDto = req.body;
      const result = await authService.register(data);
      res.status(201).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: LoginDto = req.body;
      const result = await authService.login(data);
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken);
      res.status(200).json(successResponse({ message: 'Logged out successfully' }));
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
