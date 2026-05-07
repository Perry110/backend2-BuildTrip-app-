import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SeederModule } from './seeder.module';
import { PlaceCategorySeeder } from './seeders/place-category.seeder';
import { PlaceSeeder } from './seeders/place.seeder';

const logger = new Logger('Seed');

async function runSeeders(): Promise<void> {
  logger.log('Bootstrapping seeder application context...');

  const app = await NestFactory.createApplicationContext(SeederModule, {
    logger: ['log', 'warn', 'error'],
  });

  try {
    await app.get(PlaceCategorySeeder).run();
    await app.get(PlaceSeeder).run();
    logger.log('All seeders completed successfully.');
  } catch (error) {
    logger.error('Seeding failed', error instanceof Error ? error.stack : error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

void runSeeders();
