import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const password = this.configService.get<string>('REDIS_PASSWORD');
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: parseInt(
        this.configService.get<string>('REDIS_PORT', '6379'),
        10,
      ),
      ...(password && password.trim() !== ''
        ? { password: password.trim() }
        : {}),
    });
    this.client.on('connect', () =>
      this.logger.log('Redis connected'),
    );
    this.client.on('error', (err) =>
      this.logger.error(`Redis error: ${err.message}`),
    );
  }

  onModuleDestroy(): void {
    this.client?.disconnect();
  }

  getClient(): Redis {
    return this.client;
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    await this.client.setex(key, seconds, value);
  }
}
