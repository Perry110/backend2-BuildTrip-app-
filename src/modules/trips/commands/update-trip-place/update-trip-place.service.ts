import { Inject, Injectable } from '@nestjs/common';
import { TripEntity } from '../../domain/trip.entity';
import { TRIP_REPOSITORY } from '../../trips.di-tokens';
import type { TripRepositoryPort } from '../../database/trip.repository.port';
import type { UpdateTripPlaceCommand } from './update-trip-place.command';

@Injectable()
export class UpdateTripPlaceService {
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly repo: TripRepositoryPort,
  ) {}

  async execute(cmd: UpdateTripPlaceCommand): Promise<unknown> {
    await this.repo.runTransaction(async (tx) => {
      const entity = await this.repo.findOwnedByIdWithPlaces(cmd.tripId, cmd.userId, tx);
      TripEntity.assertFound(entity);

      entity.updatePlace(cmd.tripPlaceId, {
        visitOrder: cmd.visitOrder,
        visitTime:
          cmd.visitTime !== undefined
            ? cmd.visitTime
              ? new Date(cmd.visitTime)
              : null
            : undefined,
      });

      await this.repo.save(entity, tx);
    });

    return this.repo.findTripPlaceById(cmd.tripPlaceId, cmd.tripId);
  }
}
