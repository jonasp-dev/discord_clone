import { RedisClientType } from 'redis';
import { getRedisClient } from './redis.client';
import { logger } from '../config/logger';

export class PubSubService {
  private static instance: PubSubService;
  private subscriber: RedisClientType | null = null;
  private isSubscriberConnected = false;
  
  private constructor() {}

  static getInstance(): PubSubService {
    if (!PubSubService.instance) {
      PubSubService.instance = new PubSubService();
    }
    return PubSubService.instance;
  }

  /**
   * Get or create the single dedicated subscriber connection.
   * Redis requires a separate connection for subscriptions since
   * a subscribed client can only issue (P)SUBSCRIBE/(P)UNSUBSCRIBE.
   */
  private async getSubscriber(): Promise<RedisClientType> {
    if (this.subscriber && this.isSubscriberConnected) {
      return this.subscriber;
    }

    const client = getRedisClient();
    this.subscriber = client.duplicate() as RedisClientType;

    this.subscriber.on('error', (err) => {
      logger.error(err, 'Redis subscriber error');
    });

    await this.subscriber.connect();
    this.isSubscriberConnected = true;

    logger.info('Redis subscriber connection established');
    return this.subscriber;
  }

  async publish(channel: string, message: string): Promise<void> {
    try {
      const client = getRedisClient();
      await client.publish(channel, message);
      logger.debug({ channel }, 'Published message');
    } catch (error) {
      logger.error(error, 'Failed to publish message');
      throw error;
    }
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    try {
      const subscriber = await this.getSubscriber();
      
      await subscriber.subscribe(channel, (message) => {
        logger.debug({ channel }, 'Received message');
        callback(message);
      });
      
      logger.info({ channel }, 'Subscribed to channel');
    } catch (error) {
      logger.error(error, 'Failed to subscribe to channel');
      throw error;
    }
  }

  async unsubscribe(channel: string): Promise<void> {
    try {
      if (this.subscriber && this.isSubscriberConnected) {
        await this.subscriber.unsubscribe(channel);
        logger.info({ channel }, 'Unsubscribed from channel');
      }
    } catch (error) {
      logger.error(error, 'Failed to unsubscribe from channel');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.subscriber && this.isSubscriberConnected) {
      await this.subscriber.quit();
      this.subscriber = null;
      this.isSubscriberConnected = false;
      logger.info('Redis subscriber disconnected');
    }
  }
}

export const pubsub = PubSubService.getInstance();
