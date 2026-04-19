import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';
import { Comment } from '../../comments/entities/comment.entity';
import { User } from '../../users/entities/user.entity';
import { PlaceEntity } from '../domain/place.entity';
import type { PlaceStatusValue } from '../domain/value-objects/place-status.vo';
import { PlaceMapper } from '../place.mapper';
import type { PlaceDbTransaction, PlaceRepositoryPort } from './place.repository.port';
import { Category } from './models/category.model';
import { Place } from './models/place.model';
import { Tag } from './models/tag.model';

const PUBLISHED: PlaceStatusValue = 'published';

@Injectable()
export class PlaceRepository implements PlaceRepositoryPort {
  constructor(
    @InjectModel(Place)
    private readonly placeModel: typeof Place,
    @InjectModel(Category)
    private readonly categoryModel: typeof Category,
    @InjectModel(Tag)
    private readonly tagModel: typeof Tag,
    @InjectModel(Comment)
    private readonly commentModel: typeof Comment,
    private readonly mapper: PlaceMapper,
  ) {}

  // ── 1. Transaction ────────────────────────────────────────────────────────

  async runTransaction<T>(fn: (tx: PlaceDbTransaction) => Promise<T>): Promise<T> {
    const sequelize = this.placeModel.sequelize;
    if (!sequelize) throw new Error('Sequelize instance not available');
    return sequelize.transaction(async (t) => fn(t as PlaceDbTransaction));
  }

  // ── 2. Write (aggregate) ──────────────────────────────────────────────────

  async save(entity: PlaceEntity, tx?: PlaceDbTransaction): Promise<void> {
    const record = this.mapper.toPersistence(entity);
    const t = tx as Transaction;

    if (entity.isNew()) {
      await this.placeModel.create(record, { transaction: t });

      if (record.tagIds.length) {
        const row = await this.placeModel.findByPk(record.id, { transaction: t });
        if (row) {
          await (row as Place & { setTags: (ids: string[], opts: { transaction: Transaction }) => Promise<void> })
            .setTags(record.tagIds, { transaction: t });
        }
      }
    } else {
      await this.placeModel.update(
        { status: record.status, averageRating: record.averageRating, reviewCount: record.reviewCount },
        { where: { id: record.id }, transaction: t },
      );
    }
  }

  // ── 3. Single-aggregate reads (commands) ─────────────────────────────────

  async findById(id: string, tx?: PlaceDbTransaction): Promise<PlaceEntity | null> {
    const row = await this.placeModel.findByPk(id, {
      include: [{ model: Tag, as: 'tags', attributes: ['id'] }],
      transaction: tx as Transaction,
    });
    if (!row) return null;
    const tagIds = ((row.tags ?? []) as Array<{ id: string }>).map((t) => t.id);
    return this.mapper.toDomain(row, tagIds);
  }

  // ── 4. Validation helpers ─────────────────────────────────────────────────

  async categoryExists(categoryId: string, tx?: PlaceDbTransaction): Promise<boolean> {
    const row = await this.categoryModel.findByPk(categoryId, { transaction: tx as Transaction });
    return row !== null;
  }

  async findExistingTagIds(tagIds: string[], tx?: PlaceDbTransaction): Promise<string[]> {
    const rows = await this.tagModel.findAll({ where: { id: tagIds }, transaction: tx as Transaction });
    return rows.map((r) => r.id);
  }

  // ── 5. Read models ────────────────────────────────────────────────────────

  async loadPlaceDetails(placeId: string): Promise<unknown | null> {
    return this.placeModel.findByPk(placeId, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Tag, as: 'tags', attributes: ['id', 'name'], through: { attributes: [] } },
      ],
    });
  }

  async findPublishedPlaceByPk(id: string): Promise<unknown | null> {
    return this.placeModel.findOne({
      where: { id, status: PUBLISHED },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'], required: false },
        { model: Tag, as: 'tags', attributes: ['id', 'name'], through: { attributes: [] } },
      ],
    });
  }

  async findCategoryIdByName(name: string): Promise<string | null> {
    const row = await this.categoryModel.findOne({ where: { name } });
    return row?.id ?? null;
  }

  async findPlacesSearchCandidates(params: {
    search: string;
    categoryId?: string;
  }): Promise<Array<{ id: string } & Record<string, unknown>>> {
    const where: Record<string, unknown> = { status: PUBLISHED };
    if (params.search) {
      (where as { [Op.or]?: unknown })[Op.or] = [
        { name: { [Op.iLike]: `%${params.search}%` } },
        { address: { [Op.iLike]: `%${params.search}%` } },
      ];
    }
    if (params.categoryId) where.categoryId = params.categoryId;

    const rows = await this.placeModel.findAll({
      where,
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'], required: false }],
      order: [['averageRating', 'DESC']],
    });
    return rows as unknown as Array<{ id: string } & Record<string, unknown>>;
  }

  async findPlacesPaginated(params: {
    search: string;
    categoryId?: string;
    limit: number;
    offset: number;
  }): Promise<{ count: number; rows: unknown[] }> {
    const where: Record<string, unknown> = { status: PUBLISHED };
    if (params.search) {
      (where as { [Op.or]?: unknown })[Op.or] = [
        { name: { [Op.iLike]: `%${params.search}%` } },
        { address: { [Op.iLike]: `%${params.search}%` } },
      ];
    }
    if (params.categoryId) where.categoryId = params.categoryId;

    return this.placeModel.findAndCountAll({
      where,
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'], required: false }],
      limit: params.limit,
      offset: params.offset,
      order: [['averageRating', 'DESC']],
      subQuery: false,
    });
  }

  async findPlacesByIds(ids: string[]): Promise<unknown[]> {
    if (ids.length === 0) return [];
    return this.placeModel.findAll({
      where: { id: ids, status: PUBLISHED },
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
    });
  }

  async findTopRatedPaginated(limit: number, offset: number): Promise<{ count: number; rows: unknown[] }> {
    return this.placeModel.findAndCountAll({
      where: { status: PUBLISHED },
      order: [['averageRating', 'DESC']],
      limit,
      offset,
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
    });
  }

  async findPlacesByStatusPaginated(params: {
    status: PlaceStatusValue;
    limit: number;
    offset: number;
  }): Promise<{ count: number; rows: unknown[] }> {
    return this.placeModel.findAndCountAll({
      where: { status: params.status },
      limit: params.limit,
      offset: params.offset,
      order: [['createdAt', 'DESC']],
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
    });
  }

  // ── 6. Comment helpers ────────────────────────────────────────────────────

  async addCommentRow(
    params: { placeId: string; userId: string; username: string; rating: number; content: string },
    tx: PlaceDbTransaction,
  ): Promise<unknown> {
    const comment = await this.commentModel.create(
      { userId: params.userId, placeId: params.placeId, rating: params.rating, content: params.content, imageUrls: [], isHidden: false },
      { transaction: tx as Transaction },
    );
    return { ...(comment.toJSON() as Record<string, unknown>), username: params.username };
  }

  async listCommentsForPlace(placeId: string, limit: number, offset: number): Promise<{ count: number; rows: unknown[] }> {
    return this.commentModel.findAndCountAll({
      where: { placeId },
      include: [{ model: User, as: 'user', attributes: ['id', 'username'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });
  }
}
