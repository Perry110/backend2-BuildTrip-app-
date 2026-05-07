import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { PlaceStatus } from '../../../../domain/value-objects/place-status.vo.js';
import { PlaceCategoryOrmEntity } from '../place-category.orm-entity.js';
import { PlaceOrmEntity } from '../place.orm-entity.js';
import {
  FindNearbyPlacesQuery,
  NearbyPlaceReadModel,
  PaginatedPlaceCatalogItems,
  PlaceCatalogDetailReadModel,
  PlaceCatalogListItemReadModel,
  PlaceCatalogRepositoryPort,
  PlaceCategoryReadModel,
  SearchPlacesQuery,
} from '../../../../application/ports/place-catalog-repository.port.js';

@Injectable()
export class PlaceCatalogRepository implements PlaceCatalogRepositoryPort {
  constructor(
    @InjectRepository(PlaceOrmEntity)
    private readonly placeRepository: Repository<PlaceOrmEntity>,
    @InjectRepository(PlaceCategoryOrmEntity)
    private readonly categoryRepository: Repository<PlaceCategoryOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async search(query: SearchPlacesQuery): Promise<PaginatedPlaceCatalogItems> {
    const searchExpression = this.getCatalogSearchExpression();
    const ratingExpression = this.getCatalogEffectiveRatingExpression();
    const qb = this.placeRepository
      .createQueryBuilder('p')
      .leftJoin(PlaceCategoryOrmEntity, 'c', 'c.id = p.category_id')
      .select([
        'p.id AS id',
        'p.name AS name',
        'p.address AS address',
        'p.lat AS lat',
        'p.lng AS lng',
        'p.thumbnail AS "thumbnailUrl"',
        'p.category_id AS "categoryId"',
        'c.name AS "categoryName"',
        'p.average_rating AS "seedAverageRating"',
        'COALESCE(p.review_count, 0) AS "seedReviewCount"',
        'NULL::numeric AS "averageRating"',
        '0::int AS "reviewCount"',
      ])
      .where('1=1')
      .offset((query.page - 1) * query.limit)
      .limit(query.limit);
    this.applyVisiblePlaceFilter(qb);

    if (query.q) {
      qb.andWhere(`${searchExpression} ILIKE :kw`, {
        kw: `%${query.q}%`,
      });
    }

    if (query.categoryId) {
      qb.andWhere('p.category_id = :categoryId', { categoryId: query.categoryId });
    }

    if (query.minRating !== undefined) {
      qb.andWhere(`${ratingExpression} >= :minRating`, {
        minRating: query.minRating,
      });
    }

    switch (query.sort) {
      case 'rating_desc':
        qb.orderBy(ratingExpression, 'DESC', 'NULLS LAST');
        qb.addOrderBy('p."id"', 'ASC');
        break;
      case 'name_asc':
        qb.orderBy('p."name"', 'ASC');
        qb.addOrderBy('p."id"', 'ASC');
        break;
      case 'newest':
      default:
        qb.orderBy('p."updated_at"', 'DESC');
        qb.addOrderBy('p."id"', 'DESC');
    }

    const countQb = this.placeRepository.createQueryBuilder('p').where('1=1');
    this.applyVisiblePlaceFilter(countQb);

    if (query.q) {
      countQb
        .leftJoin(PlaceCategoryOrmEntity, 'c', 'c.id = p.category_id')
        .andWhere(`${searchExpression} ILIKE :kw`, {
          kw: `%${query.q}%`,
        });
    }
    if (query.categoryId) {
      countQb.andWhere('p.category_id = :categoryId', { categoryId: query.categoryId });
    }
    if (query.minRating !== undefined) {
      countQb.andWhere(`${ratingExpression} >= :minRating`, {
        minRating: query.minRating,
      });
    }

    const [rows, total] = await Promise.all([qb.getRawMany<PlaceSearchRow>(), countQb.getCount()]);

    return {
      items: rows.map((row) => this.toListItem(row)),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async findById(placeId: string): Promise<PlaceCatalogDetailReadModel | null> {
    const qb = this.placeRepository
      .createQueryBuilder('p')
      .leftJoin(PlaceCategoryOrmEntity, 'c', 'c.id = p.category_id')
      .select([
        'p.id AS id',
        'p.name AS name',
        'p.description AS description',
        'p.address AS address',
        'p.lat AS lat',
        'p.lng AS lng',
        'p.image_urls AS "imageUrls"',
        'p.thumbnail AS "thumbnailUrl"',
        'p.category_id AS "categoryId"',
        'c.name AS "categoryName"',
        'p.average_rating AS "seedAverageRating"',
        'COALESCE(p.review_count, 0) AS "seedReviewCount"',
        'NULL::numeric AS "averageRating"',
        '0::int AS "reviewCount"',
      ])
      .where('p."id" = :placeId', { placeId });
    this.applyVisiblePlaceFilter(qb);

    const row = await qb.getRawOne<PlaceDetailRow>();

    if (!row) {
      return null;
    }

    return this.toDetailItem(row);
  }

  async listCategories(): Promise<PlaceCategoryReadModel[]> {
    const categories = await this.categoryRepository
      .createQueryBuilder('c')
      .innerJoin(PlaceOrmEntity, 'p', 'c.id = p.category_id')
      .select([
        'c.id AS id',
        'c.name AS name',
        "lower(replace(c.name, ' ', '-')) AS slug",
        'NULL::uuid AS "parentId"',
      ])
      .andWhere('p.status = :status', { status: PlaceStatus.PUBLISHED })
      .andWhere('p.deleted_at IS NULL')
      .groupBy('c.id')
      .addGroupBy('c.name')
      .orderBy('c.name', 'ASC')
      .getRawMany<CategoryRow>();

    return categories.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      parentId: item.parentId ?? null,
    }));
  }

  async findNearby(query: FindNearbyPlacesQuery): Promise<NearbyPlaceReadModel[]> {
    const rows = await this.runNearbyQueryWithTimeout(query, 1500);
    return rows.map((row) => ({
      ...this.toListItem(row),
      distanceInMeters: Number(row.distanceInMeters),
    }));
  }

  private toListItem(row: PlaceSearchRow): PlaceCatalogListItemReadModel {
    return {
      id: row.id,
      name: row.name,
      address: row.address,
      lat: Number(row.lat),
      lng: Number(row.lng),
      thumbnailUrl: row.thumbnailUrl ?? null,
      categoryId: row.categoryId ?? null,
      categoryName: row.categoryName ?? null,
      seedRating: {
        averageRating: row.seedAverageRating === null ? null : Number(row.seedAverageRating),
        reviewCount: row.seedReviewCount ?? 0,
      },
      communityRating: {
        averageRating: row.averageRating === null ? null : Number(row.averageRating),
        reviewCount: row.reviewCount ?? 0,
      },
    };
  }

  private toDetailItem(row: PlaceDetailRow): PlaceCatalogDetailReadModel {
    return {
      ...this.toListItem(row),
      description: row.description ?? null,
      imageUrls: row.imageUrls ?? null,
    };
  }

  private applyVisiblePlaceFilter(qb: SelectQueryBuilder<PlaceOrmEntity>): void {
    qb.andWhere('p."status" = :status', { status: PlaceStatus.PUBLISHED }).andWhere('p."deleted_at" IS NULL');
  }

  private getCatalogSearchExpression(): string {
    return `(COALESCE(p.name, '') || ' ' || COALESCE(p.address, '') || ' ' || COALESCE(p.description, '') || ' ' || COALESCE(c.name, ''))`;
  }

  private getCatalogEffectiveRatingExpression(): string {
    return `0`;
  }

  private async runNearbyQueryWithTimeout(
    query: FindNearbyPlacesQuery,
    timeoutMs: number,
  ): Promise<NearbySearchRow[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.query(`SET LOCAL statement_timeout = ${timeoutMs}`);

      const rows = await queryRunner.query(
        `
          SELECT
            p."id" AS "id",
            p."name" AS "name",
            p."address" AS "address",
            p."lat" AS "lat",
            p."lng" AS "lng",
            p."thumbnail" AS "thumbnailUrl",
            p."category_id" AS "categoryId",
            c."name" AS "categoryName",
            p."average_rating" AS "seedAverageRating",
            COALESCE(p."review_count", 0)::int AS "seedReviewCount",
            NULL::numeric AS "averageRating",
            0::int AS "reviewCount",
            ST_Distance(
              ST_SetSRID(ST_MakePoint(p."lng"::double precision, p."lat"::double precision), 4326)::geography,
              ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
            ) AS "distanceInMeters"
          FROM "places" p
          LEFT JOIN "categories" c ON c."id" = p."category_id"
          WHERE p."status" = $3
            AND p."deleted_at" IS NULL
            AND ST_DWithin(
              ST_SetSRID(ST_MakePoint(p."lng"::double precision, p."lat"::double precision), 4326)::geography,
              ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
              $4
            )
          ORDER BY
            ST_SetSRID(ST_MakePoint(p."lng"::double precision, p."lat"::double precision), 4326)::geography
            <->
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography ASC,
            p."id" ASC
          LIMIT $5
        `,
        [query.lng, query.lat, PlaceStatus.PUBLISHED, query.radiusInMeters, query.limit],
      );

      await queryRunner.commitTransaction();
      return rows as NearbySearchRow[];
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

interface PlaceSearchRow {
  id: string;
  name: string;
  address: string;
  lat: string;
  lng: string;
  thumbnailUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  seedAverageRating: string | null;
  seedReviewCount: number | null;
  averageRating: string | null;
  reviewCount: number | null;
}

interface PlaceDetailRow extends PlaceSearchRow {
  description: string | null;
  imageUrls: string[] | null;
}

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

interface NearbySearchRow extends PlaceSearchRow {
  distanceInMeters: string;
}
