import { Response, NextFunction } from 'express';
import { messagesService } from './messages.service';
import { successResponse } from '../../types/api';
import { AuthenticatedRequest } from '../../types/context';
import { CreateMessageDto } from './messages.types';

export class MessagesController {
  async createMessage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { channelId } = req.params;
      const data: CreateMessageDto = req.body;
      const message = await messagesService.createMessage(channelId, userId, data);
      res.status(201).json(successResponse(message));
    } catch (error) {
      next(error);
    }
  }

  async getChannelMessages(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { channelId } = req.params;
      const { cursor, limit } = req.query;
      const messages = await messagesService.getChannelMessages(
        channelId,
        userId,
        cursor as string | undefined,
        limit ? Number(limit) : undefined
      );
      res.status(200).json(successResponse(messages));
    } catch (error) {
      next(error);
    }
  }

  async getMessageById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { messageId } = req.params;
      const message = await messagesService.getMessageById(messageId, userId);
      res.status(200).json(successResponse(message));
    } catch (error) {
      next(error);
    }
  }

  async deleteMessage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { messageId } = req.params;
      await messagesService.deleteMessage(messageId, userId);
      res.status(200).json(successResponse({ message: 'Message deleted successfully' }));
    } catch (error) {
      next(error);
    }
  }
}

export const messagesController = new MessagesController();
