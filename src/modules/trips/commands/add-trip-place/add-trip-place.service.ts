import { Inject, Injectable } from '@nestjs/common';
import { TripEntity } from '../../domain/trip.entity';
import { TripDomainError } from '../../domain/trip.errors';
import { TRIP_REPOSITORY } from '../../trips.di-tokens';
import type { TripRepositoryPort } from '../../database/trip.repository.port';
import type { AddTripPlaceCommand } from './add-trip-place.command';

@Injectable()
export class AddTripPlaceService {
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly repo: TripRepositoryPort,
  ) {}

  async execute(cmd: AddTripPlaceCommand): Promise<unknown> {
    // Guard: place FK validation (cheap pre-check outside transaction)
    const placeExists = await this.repo.placeExistsById(cmd.placeId);
    if (!placeExists) {
      throw new TripDomainError('Không tìm thấy địa điểm.', 'PLACE_NOT_FOUND');
    }

    let newTripPlaceId!: string;

    await this.repo.runTransaction(async (tx) => {
      const entity = await this.repo.findOwnedByIdWithPlaces(cmd.tripId, cmd.userId, tx);
      TripEntity.assertFound(entity);

      const child = entity.addPlace(
        cmd.placeId,
        cmd.visitOrder ?? null,
        cmd.visitTime ? new Date(cmd.visitTime) : null,
      );
      newTripPlaceId = child.getProps().id;

      await this.repo.save(entity, tx);
    });

    // Query side: return read model with Place details
    return this.repo.findTripPlaceById(newTripPlaceId, cmd.tripId);
  }
}
