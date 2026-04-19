import { Inject, Injectable } from '@nestjs/common';
import { PlaceEntity } from '../../domain/place.entity';
import { PLACE_REPOSITORY } from '../../place.di-tokens';
import type { PlaceRepositoryPort } from '../../database/place.repository.port';

export class ListPendingPlacesQuery {
  readonly page: number;
  readonly limit: number;
  constructor(props: ListPendingPlacesQuery) { Object.assign(this, props); }
}

@Injectable()
export class ListPendingPlacesQueryHandler {
  constructor(
    @Inject(PLACE_REPOSITORY)
    private readonly repo: PlaceRepositoryPort,
  ) {}

  async execute(query: ListPendingPlacesQuery) {
    const offset = (query.page - 1) * query.limit;
    const { count, rows } = await this.repo.findPlacesByStatusPaginated({
      status: 'pending',
      limit: query.limit,
      offset,
    });
    return { items: rows, pagination: PlaceEntity.buildPagination(count, query.page, query.limit) };
  }
}
