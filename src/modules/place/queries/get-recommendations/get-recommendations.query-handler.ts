import { Inject, Injectable, Logger } from '@nestjs/common';
import { PlaceEntity } from '../../domain/place.entity';
import { PLACE_REPOSITORY, ML_RECOMMENDATION_PORT, USER_TRIP_CONTEXT_PORT } from '../../place.di-tokens';
import type { PlaceRepositoryPort } from '../../database/place.repository.port';
import type { IMlRecommendationPort } from '../../ports/ml-recommendation.port';
import type { IUserTripContextPort } from '../../ports/user-trip-context.port';

export class GetRecommendationsQuery {
  readonly userId: string;
  readonly category: string;
  readonly limit: number;
  readonly page: number;
  readonly lat: number | null;
  readonly lng: number | null;
  constructor(props: GetRecommendationsQuery) { Object.assign(this, props); }
}

@Injectable()
export class GetRecommendationsQueryHandler {
  private readonly logger = new Logger(GetRecommendationsQueryHandler.name);

  constructor(
    @Inject(PLACE_REPOSITORY)
    private readonly repo: PlaceRepositoryPort,
    @Inject(USER_TRIP_CONTEXT_PORT)
    private readonly tripContext: IUserTripContextPort,
    @Inject(ML_RECOMMENDATION_PORT)
    private readonly mlGateway: IMlRecommendationPort,
  ) {}

  async execute(query: GetRecommendationsQuery) {
    const { category, limit, page, lat, lng, userId } = query;
    const offset = (page - 1) * limit;

    try {
      const { placeIds: userPlaceIds, categories: userCategories } =
        await this.tripContext.getContext(userId);

      const mlRes = await this.mlGateway.recommend({
        trip_place_ids: userPlaceIds,
        trip_categories: userCategories,
        user_lat: lat,
        user_lng: lng,
        exclude_ids: userPlaceIds,
        category_filter: category || null,
        limit,
        offset,
      });

      const scores = mlRes.items ?? [];
      const total = PlaceEntity.mlTotalFromResponse(mlRes.total, scores.length);
      const orderedIds = scores.map((s) => s.place_id);

      if (orderedIds.length === 0) {
        return { items: [], source: 'ml', pagination: PlaceEntity.buildPagination(total, page, limit) };
      }

      const places = await this.repo.findPlacesByIds(orderedIds);
      const sorted = PlaceEntity.sortPlacesByMlScores(places as Array<{ id: string }>, scores);

      return { items: sorted, source: 'ml', pagination: PlaceEntity.buildPagination(total, page, limit) };
    } catch (mlError) {
      this.logger.warn(`ML service unavailable, falling back to top-rated: ${String((mlError as Error).message)}`);
      const { count, rows } = await this.repo.findTopRatedPaginated(limit, offset);
      return { items: rows, source: 'fallback', pagination: PlaceEntity.buildPagination(count, page, limit) };
    }
  }
}
