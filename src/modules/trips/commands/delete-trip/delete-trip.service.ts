import { Inject, Injectable } from '@nestjs/common';
import { TripEntity } from '../../domain/trip.entity';
import { TRIP_REPOSITORY } from '../../trips.di-tokens';
import type { TripRepositoryPort } from '../../database/trip.repository.port';
import type { DeleteTripCommand } from './delete-trip.command';

@Injectable()
export class DeleteTripService {
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly repo: TripRepositoryPort,
  ) {}

  async execute(cmd: DeleteTripCommand): Promise<void> {
    const entity = await this.repo.findOwnedById(cmd.tripId, cmd.userId);
    TripEntity.assertFound(entity);
    await this.repo.delete(cmd.tripId);
  }
}
