import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlaceCategoryOrmEntity } from '../../../../modules/place/infrastructure/persistence/typeorm/place-category.orm-entity';
import { readPlaceCategoryCsvRows } from '../utils/place-category-csv.util';

@Injectable()
export class PlaceCategorySeeder {
  private readonly logger = new Logger(PlaceCategorySeeder.name);

  constructor(
    @InjectRepository(PlaceCategoryOrmEntity)
    private readonly categoryRepository: Repository<PlaceCategoryOrmEntity>,
  ) {}

  async run(): Promise<void> {
    const rows = readPlaceCategoryCsvRows();
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of rows) {
      if (!row.name) {
        skipped += 1;
        continue;
      }

      const existing = await this.categoryRepository.findOne({
        where: { name: row.name },
      });

      if (!existing) {
        const next = this.categoryRepository.create({ name: row.name });
        await this.categoryRepository.save(next);
        created += 1;
        continue;
      }

      if (existing.name !== row.name) {
        existing.name = row.name;
        await this.categoryRepository.save(existing);
        updated += 1;
        continue;
      }

      skipped += 1;
    }

    this.logger.log(
      `[OK] Categories processed: ${rows.length} (created=${created}, updated=${updated}, skipped=${skipped})`,
    );
  }
}
