import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlaceOrmEntity } from '../../../../modules/place/infrastructure/persistence/typeorm/place.orm-entity';
import { PlaceCategoryOrmEntity } from '../../../../modules/place/infrastructure/persistence/typeorm/place-category.orm-entity';
import { readPlaceCategoryCsvRows } from '../utils/place-category-csv.util';
import { parseJsonField, readPlaceCsvRows } from '../utils/place-csv.util';

function toNullableString(input: string): string | null {
  const value = input?.trim() ?? '';
  return value.length > 0 ? value : null;
}

function mapStatus(input: string): string {
  return 'published';
}

function toNullableInteger(input: string): number | null {
  const value = input?.trim() ?? '';
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

@Injectable()
export class PlaceSeeder {
  private readonly logger = new Logger(PlaceSeeder.name);

  constructor(
    @InjectRepository(PlaceOrmEntity)
    private readonly placeRepository: Repository<PlaceOrmEntity>,
    @InjectRepository(PlaceCategoryOrmEntity)
    private readonly categoryRepository: Repository<PlaceCategoryOrmEntity>,
  ) {}

  async run(): Promise<void> {
    const categoryRows = readPlaceCategoryCsvRows();
    const categoryNameByLegacyId = new Map(
      categoryRows.map((category) => [category.id, category.name]),
    );

    const rows = readPlaceCsvRows();
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of rows) {
      if (!row.id || !row.name || !row.address || !row.lat || !row.lng) {
        skipped += 1;
        continue;
      }

      const categoryName = categoryNameByLegacyId.get(row.category_id);
      if (!categoryName) {
        skipped += 1;
        continue;
      }

      const category = await this.categoryRepository.findOne({
        where: { name: categoryName },
      });
      if (!category) {
        skipped += 1;
        continue;
      }

      const existing = await this.placeRepository.findOne({ where: { id: row.id } });
      const place = existing ?? this.placeRepository.create({ id: row.id });
      const isNew = !existing;

      place.name = row.name;
      place.address = row.address;
      place.lat = row.lat;
      place.lng = row.lng;
      place.description = toNullableString(row.description);
      place.averageRating = row.average_rating ? row.average_rating : null;
      place.reviewCount = toNullableInteger(row.review_count);
      place.category = category.id;
      place.tagScores = parseJsonField<Record<string, number>>(row.tag_scores);
      place.status = mapStatus(row.status);
      place.thumbnail = toNullableString(row.thumbnail);
      place.imageUrls = parseJsonField<string[]>(row.image_urls);

      await this.placeRepository.save(place);
      if (isNew) created += 1;
      else updated += 1;
    }

    this.logger.log(
      `[OK] Places processed: ${rows.length} (created=${created}, updated=${updated}, skipped=${skipped})`,
    );
  }
}
