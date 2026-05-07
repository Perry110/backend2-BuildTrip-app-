import { Inject, Injectable } from '@nestjs/common';

import { ResourceNotFoundError } from '../../../../../common/errors/app.error';
import { TRIP_REPOSITORY } from '../../../trip.di-tokens';
import type { TripRepositoryPort } from '../../ports/trip.repository.port';
import { RemoveTripDayCommand, RemoveTripDayHandler } from '../handles/remove-trip-day.handler';

@Injectable()
export class RemoveTripDayHandlerImpl implements RemoveTripDayHandler {
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
  ) {}

  async execute(command: RemoveTripDayCommand): Promise<void> {
    const trip = await this.tripRepository.findById(command.tripId);

    if (!trip) {
      throw new ResourceNotFoundError('trip_not_found');
    }

    if (trip.toSnapshot().userId !== command.userId) {
      throw new ResourceNotFoundError('trip_not_found');
    }

    trip.removeDay({
      dayId: command.dayId,
    });

    await this.tripRepository.save(trip);
  }
}
