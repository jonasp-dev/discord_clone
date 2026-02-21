import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../utils/validators';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.types';

const router = Router();

router.post('/register', validate(registerSchema), authController.register.bind(authController));
router.post('/login', validate(loginSchema), authController.login.bind(authController));
router.post('/refresh', validate(refreshTokenSchema), authController.refresh.bind(authController));

export default router;
