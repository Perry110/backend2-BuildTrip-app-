import { Inject, Injectable, Logger } from '@nestjs/common';
import { PlaceEntity } from '../../domain/place.entity';
import { PLACE_REPOSITORY, ML_RECOMMENDATION_PORT, USER_TRIP_CONTEXT_PORT } from '../../place.di-tokens';
import type { PlaceRepositoryPort } from '../../database/place.repository.port';
import type { IMlRecommendationPort } from '../../ports/ml-recommendation.port';
import type { IUserTripContextPort } from '../../ports/user-trip-context.port';

export class GetPlacesQuery {
  readonly userId: string;
  readonly page: number;
  readonly limit: number;
  readonly search: string;
  readonly category: string;
  readonly lat: number | null;
  readonly lng: number | null;

  constructor(props: GetPlacesQuery) {
    Object.assign(this, props);
  }
}

@Injectable()
export class GetPlacesQueryHandler {
  private readonly logger = new Logger(GetPlacesQueryHandler.name);

  constructor(
    @Inject(PLACE_REPOSITORY)
    private readonly repo: PlaceRepositoryPort,
    @Inject(USER_TRIP_CONTEXT_PORT)
    private readonly tripContext: IUserTripContextPort,
    @Inject(ML_RECOMMENDATION_PORT)
    private readonly mlGateway: IMlRecommendationPort,
  ) {}

  async execute(query: GetPlacesQuery) {
    const { page, limit, search, category, lat, lng, userId } = query;
    const offset = (page - 1) * limit;

    const resolvedCatId = category ? await this.repo.findCategoryIdByName(category) : null;
    const filter = PlaceEntity.resolveCategoryFilter(category, resolvedCatId);

    if (filter.kind === 'empty') {
      return { items: [], pagination: PlaceEntity.buildPagination(0, page, limit) };
    }

    const categoryId = filter.kind === 'filter' ? filter.categoryId : undefined;

    if (search) {
      const candidates = await this.repo.findPlacesSearchCandidates({ search, categoryId });
      if (candidates.length === 0) {
        return { items: [], pagination: PlaceEntity.buildPagination(0, page, limit) };
      }

      try {
        const { placeIds: userPlaceIds, categories: userCategories } =
          await this.tripContext.getContext(userId);

        const mlRes = await this.mlGateway.recommend({
          candidate_ids: candidates.map((p) => p.id),
          trip_place_ids: userPlaceIds,
          trip_categories: userCategories,
          user_lat: lat,
          user_lng: lng,
          limit,
          offset,
        });

        const scores = mlRes.items ?? [];
        const total = PlaceEntity.mlTotalFromResponse(mlRes.total, scores.length);
        const reranked = PlaceEntity.orderCandidatesByMlPlaceIds(candidates, scores.map((s) => s.place_id));

        return { items: reranked, source: 'ml', pagination: PlaceEntity.buildPagination(total, page, limit) };
      } catch (mlError) {
        this.logger.warn(`ML unavailable for search re-ranking, fallback by rating: ${String((mlError as Error).message)}`);
        return {
          items: candidates.slice(offset, offset + limit),
          pagination: PlaceEntity.buildPagination(candidates.length, page, limit),
        };
      }
    }

    const { count, rows } = await this.repo.findPlacesPaginated({ search: '', categoryId, limit, offset });
    return { items: rows, pagination: PlaceEntity.buildPagination(count, page, limit) };
  }
}
