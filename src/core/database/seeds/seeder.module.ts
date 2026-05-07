import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlaceCategoryOrmEntity } from '../../../modules/place/infrastructure/persistence/typeorm/place-category.orm-entity';
import { PlaceOrmEntity } from '../../../modules/place/infrastructure/persistence/typeorm/place.orm-entity';
import { PlaceCategorySeeder } from './seeders/place-category.seeder';
import { PlaceSeeder } from './seeders/place.seeder';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', `.env.${process.env.NODE_ENV}`, '.env'],
    }),
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
        entities: [PlaceCategoryOrmEntity, PlaceOrmEntity],
        synchronize: false,
        logging: false,
      }),
    }),
    TypeOrmModule.forFeature([PlaceCategoryOrmEntity, PlaceOrmEntity]),
  ],
  providers: [PlaceCategorySeeder, PlaceSeeder],
})
export class SeederModule {}
