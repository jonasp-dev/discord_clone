import { createClient, RedisClientType } from 'redis';
import { logger } from '../config/logger';
import { env } from '../config/env';

let redisClient: RedisClientType | null = null;

export const connectRedis = async (): Promise<RedisClientType> => {
  if (redisClient) {
    return redisClient;
  }

  redisClient = createClient({
    url: env.REDIS_URL,
  });

  redisClient.on('error', (err) => {
    logger.error(err, '❌ Redis Client Error');
  });

  redisClient.on('connect', () => {
    logger.info('🔄 Connecting to Redis...');
  });

  redisClient.on('ready', () => {
    logger.info('✅ Redis connected successfully');
  });

  await redisClient.connect();

  return redisClient;
};

export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
};

export const disconnectRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis disconnected');
  }
};
