import { getRedisClient } from './redis.client';
import { logger } from '../config/logger';

export class PubSubService {
  private static instance: PubSubService;
  
  private constructor() {}

  static getInstance(): PubSubService {
    if (!PubSubService.instance) {
      PubSubService.instance = new PubSubService();
    }
    return PubSubService.instance;
  }

  async publish(channel: string, message: string): Promise<void> {
    try {
      const client = getRedisClient();
      await client.publish(channel, message);
      logger.debug({ channel, message }, 'Published message');
    } catch (error) {
      logger.error(error, 'Failed to publish message');
      throw error;
    }
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    try {
      const client = getRedisClient().duplicate();
      await client.connect();
      
      await client.subscribe(channel, (message) => {
        logger.debug({ channel, message }, 'Received message');
        callback(message);
      });
      
      logger.info({ channel }, 'Subscribed to channel');
    } catch (error) {
      logger.error(error, 'Failed to subscribe to channel');
      throw error;
    }
  }
}

export const pubsub = PubSubService.getInstance();
