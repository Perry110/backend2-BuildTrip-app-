import { Inject, Injectable } from '@nestjs/common';
import { TripEntity } from '../../domain/trip.entity';
import { TRIP_REPOSITORY } from '../../trips.di-tokens';
import type { TripRepositoryPort } from '../../database/trip.repository.port';

export class GetTripPlacesQuery {
  readonly userId: string;
  readonly tripId: string;

  constructor(props: GetTripPlacesQuery) {
    Object.assign(this, props);
  }
}

@Injectable()
export class GetTripPlacesQueryHandler {
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly repo: TripRepositoryPort,
  ) {}

  async execute(query: GetTripPlacesQuery): Promise<unknown[]> {
    // Ownership check: user phải là chủ trip
    const entity = await this.repo.findOwnedById(query.tripId, query.userId);
    TripEntity.assertFound(entity);

    return this.repo.findTripPlacesByTrip(query.tripId);
  }
}
