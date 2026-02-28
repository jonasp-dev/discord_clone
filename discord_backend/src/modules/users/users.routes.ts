import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate } from '../auth/auth.middleware';
import { validate } from '../../utils/validators';
import { updateProfileSchema } from './users.types';

const router = Router();

router.get('/me', authenticate, usersController.getMe.bind(usersController));
router.get('/:userId', authenticate, usersController.getUserById.bind(usersController));
router.get('/username/:username', authenticate, usersController.getUserByUsername.bind(usersController));
router.patch('/me', authenticate, validate(updateProfileSchema), usersController.updateProfile.bind(usersController));

export default router;
