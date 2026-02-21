import { Response, NextFunction } from 'express';
import { serversService } from './servers.service';
import { successResponse } from '../../types/api';
import { AuthenticatedRequest } from '../../types/context';
import { CreateServerDto, UpdateServerDto } from './servers.types';

export class ServersController {
  async createServer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const data: CreateServerDto = req.body;
      const server = await serversService.createServer(userId, data);
      res.status(201).json(successResponse(server));
    } catch (error) {
      next(error);
    }
  }

  async getServerById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { serverId } = req.params;
      const server = await serversService.getServerById(serverId, userId);
      res.status(200).json(successResponse(server));
    } catch (error) {
      next(error);
    }
  }

  async getUserServers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const servers = await serversService.getUserServers(userId);
      res.status(200).json(successResponse(servers));
    } catch (error) {
      next(error);
    }
  }

  async updateServer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { serverId } = req.params;
      const data: UpdateServerDto = req.body;
      const server = await serversService.updateServer(serverId, userId, data);
      res.status(200).json(successResponse(server));
    } catch (error) {
      next(error);
    }
  }

  async deleteServer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { serverId } = req.params;
      await serversService.deleteServer(serverId, userId);
      res.status(200).json(successResponse({ message: 'Server deleted successfully' }));
    } catch (error) {
      next(error);
    }
  }

  async joinServer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { inviteCode } = req.body;
      const server = await serversService.joinServer(userId, inviteCode);
      res.status(200).json(successResponse(server));
    } catch (error) {
      next(error);
    }
  }

  async leaveServer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { serverId } = req.params;
      await serversService.leaveServer(serverId, userId);
      res.status(200).json(successResponse({ message: 'Left server successfully' }));
    } catch (error) {
      next(error);
    }
  }
}

export const serversController = new ServersController();
