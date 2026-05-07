import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { ResourceNotFoundError } from '../../../../../common/errors/app.error';
import { TRIP_REPOSITORY } from '../../../trip.di-tokens';
import type { TripRepositoryPort } from '../../ports/trip.repository.port';
import { AddTripDayCommand, AddTripDayHandler } from '../handles/add-trip-day.handler';

@Injectable()
export class AddTripDayHandlerImpl implements AddTripDayHandler {
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
  ) {}

  async execute(command: AddTripDayCommand): Promise<{ dayId: string }> {
    const trip = await this.tripRepository.findById(command.tripId);

    if (!trip) {
      throw new ResourceNotFoundError('trip_not_found');
    }

    if (trip.toSnapshot().userId !== command.userId) {
      throw new ResourceNotFoundError('trip_not_found');
    }

    const dayId = randomUUID();
    trip.addDay({
      id: dayId,
      dayIndex: command.dayIndex,
      date: command.date,
    });

    await this.tripRepository.save(trip);
    return { dayId };
  }
}
