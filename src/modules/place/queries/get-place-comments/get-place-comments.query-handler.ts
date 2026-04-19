import { Inject, Injectable } from '@nestjs/common';
import { PlaceEntity } from '../../domain/place.entity';
import { PlaceDomainError } from '../../domain/place.errors';
import { PLACE_REPOSITORY } from '../../place.di-tokens';
import type { PlaceRepositoryPort } from '../../database/place.repository.port';

export class GetPlaceCommentsQuery {
  readonly placeId: string;
  readonly page: number;
  readonly limit: number;
  constructor(props: GetPlaceCommentsQuery) { Object.assign(this, props); }
}

@Injectable()
export class GetPlaceCommentsQueryHandler {
  constructor(
    @Inject(PLACE_REPOSITORY)
    private readonly repo: PlaceRepositoryPort,
  ) {}

  async execute(query: GetPlaceCommentsQuery) {
    const published = await this.repo.findPublishedPlaceByPk(query.placeId);
    if (!published) throw new PlaceDomainError('Không tìm thấy địa điểm.', 'PLACE_NOT_FOUND');

    const offset = (query.page - 1) * query.limit;
    const { count, rows } = await this.repo.listCommentsForPlace(query.placeId, query.limit, offset);

    return { items: rows, pagination: PlaceEntity.buildPagination(count, query.page, query.limit) };
  }
}
