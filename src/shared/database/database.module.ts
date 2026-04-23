import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from '../../modules/trips/entities/trip.entity';
import { TripPlace } from '../../modules/trips/entities/trip-place.entity';

/**
 * Kết nối PostgreSQL + đăng ký models dùng chung toàn app.
 * Feature module (vd AuthModule) import SequelizeModule.forFeature([...]).
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: parseInt(config.get<string>('DB_PORT', '5432'), 10),
        username: config.get<string>('DB_USER', 'postgres'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_NAME', 'postgres'),
        autoLoadEntities: true,
        synchronize: false,
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        dialect: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: parseInt(config.get<string>('DB_PORT', '5432'), 10),
        username: config.get<string>('DB_USER', 'postgres'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_NAME', 'postgres'),
        logging:
          config.get<string>('NODE_ENV') === 'development'
            ? console.log
            : false,
        pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
        models: [Trip, TripPlace],
        synchronize: false,
        autoLoadModels: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
