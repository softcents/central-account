import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isClientConnected = false;
  private readonly redisUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
  }

  async onModuleInit() {
    try {
      this.client = new Redis(this.redisUrl, {
        retryStrategy: (times) => Math.min(times * 200, 3000),
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
      });

      this.client.on('connect', () => {
        this.isClientConnected = true;
        this.logger.log(`[RedisService] Connected to Redis instance at ${this.redisUrl}`);
      });

      this.client.on('ready', () => {
        this.isClientConnected = true;
        this.logger.log(`[RedisService] Redis client is ready to process queue & cache operations`);
      });

      this.client.on('error', (err) => {
        this.isClientConnected = false;
        this.logger.warn(`[RedisService] Redis connection warning: ${err.message}`);
      });

      this.client.on('close', () => {
        this.isClientConnected = false;
      });

      await this.client.connect();
      const pingRes = await this.client.ping();
      this.logger.log(`[RedisService] Redis ping check succeeded: ${pingRes}`);
    } catch (err: any) {
      this.isClientConnected = false;
      this.logger.warn(
        `[RedisService] Could not establish immediate Redis connection at ${this.redisUrl}: ${err.message}. Queue will operate with resilient in-memory fallback.`,
      );
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
        this.logger.log('[RedisService] Redis connection closed gracefully');
      } catch {
        // ignore
      }
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  isConnected(): boolean {
    return this.isClientConnected;
  }

  /**
   * Pushes a job to a Redis list and stores its tracking metadata.
   */
  async pushJob(queueName: string, jobId: string, jobData: Record<string, any>): Promise<void> {
    if (!this.client || !this.isClientConnected) {
      return;
    }

    try {
      const jobRecord = {
        id: jobId,
        queue: queueName,
        status: 'QUEUED',
        enqueuedAt: new Date().toISOString(),
        data: jobData,
      };

      await this.client
        .pipeline()
        .lpush(`queue:${queueName}`, JSON.stringify(jobRecord))
        .set(`job:${jobId}`, JSON.stringify(jobRecord), 'EX', 7 * 24 * 60 * 60) // 7 days TTL
        .exec();

      this.logger.log(`[RedisQueue] Job ${jobId} pushed to Redis queue:${queueName}`);
    } catch (err: any) {
      this.logger.warn(`[RedisQueue] Failed to persist job to Redis: ${err.message}`);
    }
  }

  /**
   * Updates the status of a tracked job in Redis.
   */
  async updateJobStatus(
    jobId: string,
    status: 'PROCESSING' | 'COMPLETED' | 'FAILED',
    resultSummary?: Record<string, any>,
  ): Promise<void> {
    if (!this.client || !this.isClientConnected) {
      return;
    }

    try {
      const existing = await this.client.get(`job:${jobId}`);
      if (existing) {
        const parsed = JSON.parse(existing);
        parsed.status = status;
        parsed.updatedAt = new Date().toISOString();
        if (resultSummary) {
          parsed.result = resultSummary;
        }
        await this.client.set(`job:${jobId}`, JSON.stringify(parsed), 'EX', 7 * 24 * 60 * 60);
      }
    } catch (err: any) {
      this.logger.warn(`[RedisQueue] Failed to update job status in Redis: ${err.message}`);
    }
  }

  /**
   * Retrieves tracking details for a job from Redis.
   */
  async getJob(jobId: string): Promise<Record<string, any> | null> {
    if (!this.client || !this.isClientConnected) {
      return null;
    }

    try {
      const data = await this.client.get(`job:${jobId}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Basic key-value cache operations
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client || !this.isClientConnected) return;
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch (err: any) {
      this.logger.warn(`[RedisCache] set error: ${err.message}`);
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client || !this.isClientConnected) return null;
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client || !this.isClientConnected) return;
    try {
      await this.client.del(key);
    } catch (err: any) {
      this.logger.warn(`[RedisCache] del error: ${err.message}`);
    }
  }
}
