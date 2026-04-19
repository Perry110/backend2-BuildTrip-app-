import { Inject, Injectable } from '@nestjs/common';
import { TripEntity } from '../../domain/trip.entity';
import { TRIP_REPOSITORY } from '../../trips.di-tokens';
import type { TripRepositoryPort } from '../../database/trip.repository.port';
import type { RemoveTripPlaceCommand } from './remove-trip-place.command';

@Injectable()
export class RemoveTripPlaceService {
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly repo: TripRepositoryPort,
  ) {}

  async execute(cmd: RemoveTripPlaceCommand): Promise<void> {
    await this.repo.runTransaction(async (tx) => {
      const entity = await this.repo.findOwnedByIdWithPlaces(cmd.tripId, cmd.userId, tx);
      TripEntity.assertFound(entity);

      entity.removePlace(cmd.tripPlaceId);

      await this.repo.save(entity, tx);
    });
  }
}
