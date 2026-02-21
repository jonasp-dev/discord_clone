import { Router } from 'express';
import { serversController } from './servers.controller';
import { authenticate } from '../auth/auth.middleware';
import { validate } from '../../utils/validators';
import { createServerSchema, updateServerSchema, joinServerSchema } from './servers.types';

const router = Router();

router.post('/', authenticate, validate(createServerSchema), serversController.createServer.bind(serversController));
router.get('/', authenticate, serversController.getUserServers.bind(serversController));
router.get('/:serverId', authenticate, serversController.getServerById.bind(serversController));
router.patch('/:serverId', authenticate, validate(updateServerSchema), serversController.updateServer.bind(serversController));
router.delete('/:serverId', authenticate, serversController.deleteServer.bind(serversController));
router.post('/join', authenticate, validate(joinServerSchema), serversController.joinServer.bind(serversController));
router.post('/:serverId/leave', authenticate, serversController.leaveServer.bind(serversController));

export default router;
