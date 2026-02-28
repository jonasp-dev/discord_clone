import express, { Express } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { logger } from './config/logger';
import { errorMiddleware } from './middleware/error.middleware';
import { globalRateLimiter, authRateLimiter, messageRateLimiter } from './middleware/rate-limit.middleware';

import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import serversRoutes from './modules/servers/servers.routes';
import channelsRoutes from './modules/channels/channels.routes';
import messagesRoutes from './modules/messages/messages.routes';
import dmsRoutes from './modules/dms/dms.routes';

export function createApp(): Express {
  const app = express();

  app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(globalRateLimiter);

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/v1/auth', authRateLimiter, authRoutes);
  app.use('/api/v1/users', usersRoutes);
  app.use('/api/v1/servers', serversRoutes);
  app.use('/api/v1/channels', channelsRoutes);
  app.use('/api/v1/messages', messageRateLimiter, messagesRoutes);
  app.use('/api/v1/dms', dmsRoutes);

  app.use(errorMiddleware);

  logger.info('Express app configured');

  return app;
}
