import { Injectable, Logger, Module, OnApplicationBootstrap } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationPreferenceEntity } from '../../../modules/notification/entities/notification-preference.entity';
import { PlaceCategoryOrmEntity } from '../../../modules/place/infrastructure/persistence/typeorm/place-category.orm-entity';
import { PlaceOrmEntity } from '../../../modules/place/infrastructure/persistence/typeorm/place.orm-entity';
import { User } from '../../../modules/users/entities/user.entity';
import { NotificationPreferenceSeeder } from './seeders/notification-preference.seeder';
import { PlaceCategorySeeder } from './seeders/place-category.seeder';
import { PlaceSeeder } from './seeders/place.seeder';

@Injectable()
class SeedOnStartService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedOnStartService.name);

  constructor(
    private readonly placeCategorySeeder: PlaceCategorySeeder,
    private readonly placeSeeder: PlaceSeeder,
    private readonly notificationPreferenceSeeder: NotificationPreferenceSeeder,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    this.logger.log('Running startup seeders...');
    try {
      await this.placeCategorySeeder.run();
      await this.placeSeeder.run();
      await this.notificationPreferenceSeeder.run();
      this.logger.log('Startup seeding completed successfully.');
    } catch (error) {
      this.logger.error(
        'Startup seeding failed',
        error instanceof Error ? error.stack : error,
      );
    }
  }
}

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlaceCategoryOrmEntity,
      PlaceOrmEntity,
      User,
      NotificationPreferenceEntity,
    ]),
  ],
  providers: [
    PlaceCategorySeeder,
    PlaceSeeder,
    NotificationPreferenceSeeder,
    SeedOnStartService,
  ],
})
export class SeedOnStartModule {}
