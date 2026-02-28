import { Response, NextFunction } from 'express';
import { dmsService } from './dms.service';
import { successResponse } from '../../types/api';
import { AuthenticatedRequest } from '../../types/context';
import { CreateConversationDto, SendDirectMessageDto } from './dms.types';

export class DmsController {
  async createConversation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const data: CreateConversationDto = req.body;
      const result = await dmsService.getOrCreateConversation(userId, data);
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async getConversations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await dmsService.getUserConversations(userId);
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async getConversation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { conversationId } = req.params;
      const result = await dmsService.getConversationById(conversationId, userId);
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { conversationId } = req.params;
      const { cursor, limit } = req.query;
      const result = await dmsService.getConversationMessages(
        conversationId,
        userId,
        cursor as string | undefined,
        limit ? Number(limit) : undefined
      );
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { conversationId } = req.params;
      const data: SendDirectMessageDto = req.body;
      const result = await dmsService.sendDirectMessage(conversationId, userId, data);
      res.status(201).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async deleteMessage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { messageId } = req.params;
      await dmsService.deleteDirectMessage(messageId, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const dmsController = new DmsController();
