import { Inject, Injectable } from '@nestjs/common';

import { ResourceNotFoundError } from '../../../../../common/errors/app.error';
import { TRIP_REPOSITORY } from '../../../trip.di-tokens';
import type { TripRepositoryPort } from '../../ports/trip.repository.port';
import { RemoveTripItemCommand, RemoveTripItemHandler } from '../handles/remove-trip-item.handler';

@Injectable()
export class RemoveTripItemHandlerImpl implements RemoveTripItemHandler {
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
  ) {}

  async execute(command: RemoveTripItemCommand): Promise<void> {
    const trip = await this.tripRepository.findById(command.tripId);

    if (!trip) {
      throw new ResourceNotFoundError('trip_not_found');
    }

    if (trip.toSnapshot().userId !== command.userId) {
      throw new ResourceNotFoundError('trip_not_found');
    }

    trip.removeItem({
      tripDayId: command.dayId,
      itemId: command.itemId,
    });

    await this.tripRepository.save(trip);
  }
}
