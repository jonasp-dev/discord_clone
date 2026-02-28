import { Router } from 'express';
import { channelsController } from './channels.controller';
import { authenticate } from '../auth/auth.middleware';
import { validate } from '../../utils/validators';
import { createChannelSchema, updateChannelSchema } from './channels.types';

const router = Router();

router.post('/servers/:serverId/channels', authenticate, validate(createChannelSchema), channelsController.createChannel.bind(channelsController));
router.get('/servers/:serverId/channels', authenticate, channelsController.getServerChannels.bind(channelsController));
router.get('/:channelId', authenticate, channelsController.getChannelById.bind(channelsController));
router.patch('/:channelId', authenticate, validate(updateChannelSchema), channelsController.updateChannel.bind(channelsController));
router.delete('/:channelId', authenticate, channelsController.deleteChannel.bind(channelsController));

export default router;
