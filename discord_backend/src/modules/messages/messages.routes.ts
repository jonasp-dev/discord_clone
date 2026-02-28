import { Router } from 'express';
import { messagesController } from './messages.controller';
import { authenticate } from '../auth/auth.middleware';
import { validate } from '../../utils/validators';
import { createMessageSchema, getMessagesSchema } from './messages.types';

const router = Router();

router.post('/:channelId', authenticate, validate(createMessageSchema), messagesController.createMessage.bind(messagesController));
router.get('/:channelId', authenticate, validate(getMessagesSchema), messagesController.getChannelMessages.bind(messagesController));
router.get('/message/:messageId', authenticate, messagesController.getMessageById.bind(messagesController));
router.delete('/:messageId', authenticate, messagesController.deleteMessage.bind(messagesController));

export default router;
