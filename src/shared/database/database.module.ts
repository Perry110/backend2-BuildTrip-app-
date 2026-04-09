import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { Comment } from '../../modules/comments/entities/comment.entity';
import { Category } from '../../modules/place/entities/category.entity';
import { Place } from '../../modules/place/entities/place.entity';
import { Tag } from '../../modules/place/entities/tag.entity';
import { Trip } from '../../modules/trips/entities/trip.entity';
import { TripPlace } from '../../modules/trips/entities/trip-place.entity';
import { User } from '../../modules/users/entities/user.entity';

/**
 * Kết nối PostgreSQL + đăng ký models dùng chung toàn app.
 * Feature module (vd AuthModule) import SequelizeModule.forFeature([...]).
 */
@Module({
  imports: [
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
        models: [User, Place, Category, Tag, Trip, TripPlace, Comment],
        synchronize: false,
        autoLoadModels: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
