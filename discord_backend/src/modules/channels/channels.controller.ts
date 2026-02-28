import { Response, NextFunction } from 'express';
import { channelsService } from './channels.service';
import { successResponse } from '../../types/api';
import { AuthenticatedRequest } from '../../types/context';
import { CreateChannelDto, UpdateChannelDto } from './channels.types';

export class ChannelsController {
  async createChannel(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { serverId } = req.params;
      const data: CreateChannelDto = req.body;
      const channel = await channelsService.createChannel(serverId, userId, data);
      res.status(201).json(successResponse(channel));
    } catch (error) {
      next(error);
    }
  }

  async getChannelById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { channelId } = req.params;
      const channel = await channelsService.getChannelById(channelId, userId);
      res.status(200).json(successResponse(channel));
    } catch (error) {
      next(error);
    }
  }

  async getServerChannels(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { serverId } = req.params;
      const channels = await channelsService.getServerChannels(serverId, userId);
      res.status(200).json(successResponse(channels));
    } catch (error) {
      next(error);
    }
  }

  async updateChannel(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { channelId } = req.params;
      const data: UpdateChannelDto = req.body;
      const channel = await channelsService.updateChannel(channelId, userId, data);
      res.status(200).json(successResponse(channel));
    } catch (error) {
      next(error);
    }
  }

  async deleteChannel(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { channelId } = req.params;
      await channelsService.deleteChannel(channelId, userId);
      res.status(200).json(successResponse({ message: 'Channel deleted successfully' }));
    } catch (error) {
      next(error);
    }
  }
}

export const channelsController = new ChannelsController();
