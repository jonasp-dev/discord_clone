import { createServer } from 'http';
import { createApp } from './app';
import { createSocketServer } from './socket';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './db/prisma';
import { connectRedis, disconnectRedis } from './redis/redis.client';

async function startServer() {
  try {
    await connectDatabase();
    await connectRedis();

    const app = createApp();
    const httpServer = createServer(app);
    const io = createSocketServer(httpServer);

    const PORT = parseInt(env.PORT, 10);

    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server is running on port ${PORT}`);
      logger.info(`📡 HTTP API: http://localhost:${PORT}`);
      logger.info(`🔌 WebSocket: ws://localhost:${PORT}`);
      logger.info(`🌍 Environment: ${env.NODE_ENV}`);
    });

    const shutdown = async () => {
      logger.info('Shutting down gracefully...');
      
      io.close(() => {
        logger.info('Socket.io server closed');
      });

      httpServer.close(async () => {
        logger.info('HTTP server closed');
        await disconnectDatabase();
        await disconnectRedis();
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}

startServer();
