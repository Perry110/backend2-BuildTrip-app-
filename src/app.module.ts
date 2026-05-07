import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bull';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { NotificationModule } from './modules/notification/notification.module';
import { PlaceManagementModule } from './modules/place/place.module';
import { TripModule } from './modules/trip/trip.module';
import { UsersModule } from './modules/users/users.module';
import { DatabaseModule } from './shared/database/database.module';
import { RedisModule } from './shared/redis/redis.module';
import { SeedOnStartModule } from './core/database/seeds/seed-on-start.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', `.env.${process.env.NODE_ENV}`, '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const password = configService.get<string>('REDIS_PASSWORD');
        return {
          redis: {
            host: configService.get<string>('REDIS_HOST', 'localhost'),
            port: parseInt(configService.get<string>('REDIS_PORT', '6379'), 10),
            ...(password && password.trim() !== ''
              ? { password: password.trim() }
              : {}),
          },
        };
      },
    }),
    DatabaseModule,
    RedisModule,
    AuthModule,
    NotificationModule,
    UsersModule,
    PlaceManagementModule,
    TripModule,
    ...(process.env.SEED_ON_START === 'true' ? [SeedOnStartModule] : []),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
