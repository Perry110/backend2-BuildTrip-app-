import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { ResponseCommon } from '../../common/dto/response.dto';
import { Comment } from '../comments/entities/comment.entity';
import { Trip } from '../trips/entities/trip.entity';
import { TripPlace } from '../trips/entities/trip-place.entity';
import { User } from '../users/entities/user.entity';
import { AddCommentDto } from './dto/add-comment.dto';
import { CreatePlaceDto } from './dto/create-place.dto';
import { QueryCommentsDto } from './dto/query-comments.dto';
import { QueryPlacesDto } from './dto/query-places.dto';
import { QueryRecommendationsDto } from './dto/query-recommendations.dto';
import { Category } from './entities/category.entity';
import { Place } from './entities/place.entity';
import { Tag } from './entities/tag.entity';

type MlRecommendRequest = {
  candidate_ids?: string[];
  trip_place_ids: string[];
  trip_categories: string[];
  user_lat: number | null;
  user_lng: number | null;
  exclude_ids?: string[];
  category_filter?: string | null;
  limit: number;
  offset: number;
};

type MlRecommendResponse = {
  items?: Array<{ place_id: string; score: number }>;
  total?: number;
};

@Injectable()
export class PlaceService {
  private readonly logger = new Logger(PlaceService.name);
  private readonly mlApiUrl = process.env.ML_API_URL || 'http://localhost:8000';

  constructor(
    @InjectModel(Place)
    private readonly placeModel: typeof Place,
    @InjectModel(Category)
    private readonly categoryModel: typeof Category,
    @InjectModel(Tag)
    private readonly tagModel: typeof Tag,
    @InjectModel(TripPlace)
    private readonly tripPlaceModel: typeof TripPlace,
    @InjectModel(Comment)
    private readonly commentModel: typeof Comment,
  ) {}

  private serverError(message: string): never {
    throw new HttpException(
      new ResponseCommon(HttpStatus.INTERNAL_SERVER_ERROR, false, message, null),
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  private async callMlRecommend(payload: MlRecommendRequest): Promise<MlRecommendResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
      const response = await fetch(`${this.mlApiUrl}/recommend`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`ML service responded with ${response.status}`);
      }
      return (await response.json()) as MlRecommendResponse;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async getUserTripContext(userId: string) {
    try {
      const rows = await this.tripPlaceModel.findAll({
        include: [
          {
            model: Trip,
            as: 'trip',
            where: { userId },
            attributes: [],
            required: true,
          },
          {
            model: Place,
            as: 'place',
            attributes: ['id'],
            include: [{ model: Category, as: 'category', attributes: ['name'] }],
          },
        ],
        attributes: ['placeId'],
      });

      const placeIds = [...new Set(rows.map((r) => r.placeId).filter(Boolean))];
      const categories = [
        ...new Set(
          rows
            .map((r) => r.place?.category?.name)
            .filter(Boolean)
            .map((name) => String(name).toLowerCase()),
        ),
      ];

      return { placeIds, categories };
    } catch {
      return { placeIds: [], categories: [] };
    }
  }

  async getPlaces(userId: string, query: QueryPlacesDto) {
    try {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const search = query.search ?? '';
      const category = query.category ?? '';
      const lat = query.lat ?? null;
      const lng = query.lng ?? null;
      const offset = (page - 1) * limit;

      const whereCondition: Record<string, unknown> = {};
      if (search) {
        (whereCondition as { [Op.or]?: unknown })[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { address: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (category) {
        const cat = await this.categoryModel.findOne({ where: { name: category } });
        if (!cat) {
          return new ResponseCommon(HttpStatus.OK, true, 'Places fetched', {
            items: [],
            pagination: {
              totalItems: 0,
              totalPages: 0,
              currentPage: page,
              itemsPerPage: limit,
            },
          });
        }
        whereCondition.categoryId = cat.id;
      }

      if (search) {
        const candidates = await this.placeModel.findAll({
          where: whereCondition,
          include: [{ model: Category, as: 'category', attributes: ['id', 'name'], required: false }],
          order: [['averageRating', 'DESC']],
        });

        if (candidates.length === 0) {
          return new ResponseCommon(HttpStatus.OK, true, 'Places fetched', {
            items: [],
            pagination: {
              totalItems: 0,
              totalPages: 0,
              currentPage: page,
              itemsPerPage: limit,
            },
          });
        }

        const candidateIds = candidates.map((p) => p.id);
        try {
          const { placeIds: userPlaceIds, categories: userCategories } =
            await this.getUserTripContext(userId);

          const mlRes = await this.callMlRecommend({
            candidate_ids: candidateIds,
            trip_place_ids: userPlaceIds,
            trip_categories: userCategories,
            user_lat: lat,
            user_lng: lng,
            limit,
            offset,
          });

          const scores = mlRes.items ?? [];
          const total = mlRes.total ?? scores.length;
          const orderedIds = scores.map((s) => s.place_id);
          const placeMap = new Map(candidates.map((p) => [p.id, p]));
          const reranked = orderedIds.map((id) => placeMap.get(id)).filter(Boolean);

          return new ResponseCommon(HttpStatus.OK, true, 'Places fetched', {
            items: reranked,
            source: 'ml',
            pagination: {
              totalItems: total,
              totalPages: Math.ceil(total / limit),
              currentPage: page,
              itemsPerPage: limit,
            },
          });
        } catch (mlError) {
          this.logger.warn(
            `ML unavailable for search re-ranking, fallback by rating: ${String((mlError as Error).message)}`,
          );
          const paginated = candidates.slice(offset, offset + limit);
          return new ResponseCommon(HttpStatus.OK, true, 'Places fetched', {
            items: paginated,
            pagination: {
              totalItems: candidates.length,
              totalPages: Math.ceil(candidates.length / limit),
              currentPage: page,
              itemsPerPage: limit,
            },
          });
        }
      }

      const { count, rows: places } = await this.placeModel.findAndCountAll({
        where: whereCondition,
        include: [{ model: Category, as: 'category', attributes: ['id', 'name'], required: false }],
        limit,
        offset,
        order: [['averageRating', 'DESC']],
        subQuery: false,
      });

      return new ResponseCommon(HttpStatus.OK, true, 'Places fetched', {
        items: places,
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          itemsPerPage: limit,
        },
      });
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách địa điểm: ${String(error)}`);
      this.serverError('Lỗi server.');
    }
  }

  async getPlaceById(id: string) {
    try {
      const place = await this.placeModel.findByPk(id);
      if (!place) {
        throw new HttpException(
          new ResponseCommon(HttpStatus.NOT_FOUND, false, 'Không tìm thấy địa điểm.', null),
          HttpStatus.NOT_FOUND,
        );
      }
      return new ResponseCommon(HttpStatus.OK, true, 'Place fetched', place);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Lỗi khi lấy chi tiết địa điểm: ${String(error)}`);
      this.serverError('Lỗi server.');
    }
  }

  async createPlace(dto: CreatePlaceDto) {
    const sequelize = this.placeModel.sequelize;
    if (!sequelize) {
      this.serverError('Database chưa sẵn sàng.');
    }
    const transaction = await sequelize.transaction();
    try {
      const category = await this.categoryModel.findByPk(dto.categoryId, { transaction });
      if (!category) {
        await transaction.rollback();
        throw new HttpException(
          new ResponseCommon(
            HttpStatus.NOT_FOUND,
            false,
            'Danh mục (Category) không tồn tại.',
            null,
          ),
          HttpStatus.NOT_FOUND,
        );
      }

      const newPlace = await this.placeModel.create(
        {
          name: dto.name,
          address: dto.address,
          lat: dto.lat ?? null,
          lng: dto.lng ?? null,
          description: dto.description,
          categoryId: dto.categoryId,
        },
        { transaction },
      );

      if (dto.tags?.length) {
        const existingTags = await this.tagModel.findAll({
          where: { id: dto.tags },
          transaction,
        });
        if (existingTags.length !== dto.tags.length) {
          await transaction.rollback();
          throw new HttpException(
            new ResponseCommon(
              HttpStatus.BAD_REQUEST,
              false,
              'Một hoặc nhiều Tags không tồn tại trong hệ thống.',
              null,
            ),
            HttpStatus.BAD_REQUEST,
          );
        }
        await (newPlace as Place & { setTags: (tagIds: string[], opts: { transaction: unknown }) => Promise<void> }).setTags(
          dto.tags,
          { transaction },
        );
      }

      await transaction.commit();

      const savedPlace = await this.placeModel.findByPk(newPlace.id, {
        include: [
          { model: Category, as: 'category', attributes: ['id', 'name'] },
          {
            model: Tag,
            as: 'tags',
            attributes: ['id', 'name'],
            through: { attributes: [] },
          },
        ],
      });

      return new ResponseCommon(
        HttpStatus.CREATED,
        true,
        'Tạo địa điểm mới thành công.',
        savedPlace,
      );
    } catch (error) {
      await transaction.rollback();
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Lỗi khi tạo địa điểm: ${String(error)}`);
      this.serverError('Lỗi server.');
    }
  }

  async getRecommendations(userId: string, query: QueryRecommendationsDto) {
    const category = query.category ?? '';
    const limit = query.limit ?? 8;
    const page = query.page ?? 1;
    const offset = (page - 1) * limit;

    try {
      const { placeIds: userPlaceIds, categories: userCategories } =
        await this.getUserTripContext(userId);

      const mlRes = await this.callMlRecommend({
        trip_place_ids: userPlaceIds,
        trip_categories: userCategories,
        user_lat: query.lat ?? null,
        user_lng: query.lng ?? null,
        exclude_ids: userPlaceIds,
        category_filter: category || null,
        limit,
        offset,
      });

      const scores = mlRes.items ?? [];
      const total = mlRes.total ?? scores.length;
      const orderedIds = scores.map((s) => s.place_id);

      if (orderedIds.length === 0) {
        return new ResponseCommon(HttpStatus.OK, true, 'Recommendations fetched', {
          items: [],
          source: 'ml',
          pagination: {
            totalItems: total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            itemsPerPage: limit,
          },
        });
      }

      const places = await this.placeModel.findAll({
        where: { id: orderedIds },
        include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
      });
      const scoreMap = new Map(scores.map((s) => [s.place_id, s.score]));
      const sorted = places.sort(
        (a, b) => (scoreMap.get(b.id) ?? 0) - (scoreMap.get(a.id) ?? 0),
      );

      return new ResponseCommon(HttpStatus.OK, true, 'Recommendations fetched', {
        items: sorted,
        source: 'ml',
        pagination: {
          totalItems: total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          itemsPerPage: limit,
        },
      });
    } catch (mlError) {
      this.logger.warn(
        `ML service unavailable, falling back to top-rated: ${String((mlError as Error).message)}`,
      );
      try {
        const { count, rows: places } = await this.placeModel.findAndCountAll({
          order: [['averageRating', 'DESC']],
          limit,
          offset,
          include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
        });

        return new ResponseCommon(HttpStatus.OK, true, 'Recommendations fetched', {
          items: places,
          source: 'fallback',
          pagination: {
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            itemsPerPage: limit,
          },
        });
      } catch (error) {
        this.logger.error(`Fallback DB query failed: ${String(error)}`);
        this.serverError('Lỗi server.');
      }
    }
  }

  async getCommentsByPlace(placeId: string, query: QueryCommentsDto) {
    try {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const offset = (page - 1) * limit;

      const { count, rows } = await this.commentModel.findAndCountAll({
        where: { placeId },
        include: [{ model: User, as: 'user', attributes: ['id', 'username'] }],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      });

      return new ResponseCommon(HttpStatus.OK, true, 'Comments fetched', {
        items: rows,
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          itemsPerPage: limit,
        },
      });
    } catch (error) {
      this.logger.error(`Lỗi lấy danh sách bình luận: ${String(error)}`);
      this.serverError('Lỗi server.');
    }
  }

  async addComment(placeId: string, user: { id: string; username: string }, dto: AddCommentDto) {
    const sequelize = this.placeModel.sequelize;
    if (!sequelize) {
      this.serverError('Database chưa sẵn sàng.');
    }
    const transaction = await sequelize.transaction();
    try {
      const place = await this.placeModel.findByPk(placeId, { transaction });
      if (!place) {
        await transaction.rollback();
        throw new HttpException(
          new ResponseCommon(HttpStatus.NOT_FOUND, false, 'Địa điểm không tồn tại.', null),
          HttpStatus.NOT_FOUND,
        );
      }

      const comment = await this.commentModel.create(
        {
          userId: user.id,
          placeId,
          rating: dto.rating,
          content: dto.content,
        },
        { transaction },
      );

      const currentRating = place.averageRating || 0;
      const currentCount = place.reviewCount || 0;
      const newAverageRating =
        ((currentRating * currentCount + dto.rating) / (currentCount + 1)) || 0;
      place.averageRating = Math.round(newAverageRating * 10) / 10;
      place.reviewCount = currentCount + 1;
      await place.save({ transaction });

      await transaction.commit();

      return new ResponseCommon(HttpStatus.CREATED, true, 'Cảm ơn bạn đã đánh giá!', {
        comment: {
          ...comment.toJSON(),
          username: user.username,
        },
        placeNewStats: {
          averageRating: place.averageRating,
          reviewCount: place.reviewCount,
        },
      });
    } catch (error) {
      await transaction.rollback();
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Lỗi khi thêm bình luận: ${String(error)}`);
      this.serverError('Lỗi server.');
    }
  }
}
