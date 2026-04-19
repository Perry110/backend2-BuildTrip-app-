import { Inject, Injectable } from '@nestjs/common';
import { TripEntity } from '../../domain/trip.entity';
import { TRIP_REPOSITORY } from '../../trips.di-tokens';
import type { TripRepositoryPort } from '../../database/trip.repository.port';

export class GetTripsQuery {
  readonly userId: string;
  readonly page: number;
  readonly pageSize: number;
  readonly isPublic?: boolean;

  constructor(props: GetTripsQuery) {
    Object.assign(this, props);
  }
}

@Injectable()
export class GetTripsQueryHandler {
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly repo: TripRepositoryPort,
  ) {}

  async execute(query: GetTripsQuery) {
    const { page, pageSize, userId, isPublic } = query;
    const offset = (page - 1) * pageSize;

    const { count, rows } = await this.repo.findTripsPaginated({
      userId,
      isPublic,
      limit: pageSize,
      offset,
    });

    return {
      list: rows,
      total: count,
      page,
      pageSize,
      pagination: TripEntity.buildPagination(count, page, pageSize),
    };
  }
}
