import { Inject, Injectable } from '@nestjs/common';
import { TripDomainError } from '../../domain/trip.errors';
import { TRIP_REPOSITORY } from '../../trips.di-tokens';
import type { TripRepositoryPort } from '../../database/trip.repository.port';

export class GetTripByIdQuery {
  readonly userId: string;
  readonly tripId: string;

  constructor(props: GetTripByIdQuery) {
    Object.assign(this, props);
  }
}

@Injectable()
export class GetTripByIdQueryHandler {
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly repo: TripRepositoryPort,
  ) {}

  async execute(query: GetTripByIdQuery): Promise<unknown> {
    const trip = await this.repo.loadTripWithPlaces(query.tripId, query.userId);
    if (!trip) {
      throw new TripDomainError(
        'Không tìm thấy chuyến đi hoặc không có quyền truy cập.',
        'TRIP_NOT_FOUND',
      );
    }
    return trip;
  }
}
