import { Router } from 'express';
import { dmsController } from './dms.controller';
import { authenticate } from '../auth/auth.middleware';
import { validate } from '../../utils/validators';
import {
  createConversationSchema,
  sendDirectMessageSchema,
  getConversationMessagesSchema,
  deleteDirectMessageSchema,
} from './dms.types';

const router = Router();

// All DM routes require authentication
router.use(authenticate);

// Conversations
router.post('/', validate(createConversationSchema), dmsController.createConversation.bind(dmsController));
router.get('/', dmsController.getConversations.bind(dmsController));
router.get('/:conversationId', dmsController.getConversation.bind(dmsController));

// Messages within a conversation
router.get(
  '/:conversationId/messages',
  validate(getConversationMessagesSchema),
  dmsController.getMessages.bind(dmsController)
);
router.post(
  '/:conversationId/messages',
  validate(sendDirectMessageSchema),
  dmsController.sendMessage.bind(dmsController)
);

// Delete a DM
router.delete(
  '/messages/:messageId',
  validate(deleteDirectMessageSchema),
  dmsController.deleteMessage.bind(dmsController)
);

export default router;
