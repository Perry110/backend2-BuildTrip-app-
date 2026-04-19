import { Inject, Injectable } from '@nestjs/common';
import { TripEntity } from '../../domain/trip.entity';
import { TRIP_REPOSITORY } from '../../trips.di-tokens';
import { TripMapper } from '../../trips.mapper';
import { TripResponseDto } from '../../dtos/trip.response.dto';
import type { TripRepositoryPort } from '../../database/trip.repository.port';
import type { UpdateTripCommand } from './update-trip.command';

@Injectable()
export class UpdateTripService {
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly repo: TripRepositoryPort,
    private readonly mapper: TripMapper,
  ) {}

  async execute(cmd: UpdateTripCommand): Promise<TripResponseDto> {
    const entity = await this.repo.findOwnedById(cmd.tripId, cmd.userId);
    TripEntity.assertFound(entity);

    entity.update({
      name: cmd.name,
      destination: cmd.destination,
      description: cmd.description,
      startDate: cmd.startDate,
      endDate: cmd.endDate,
      isPublic: cmd.isPublic,
    });

    await this.repo.save(entity);
    return this.mapper.toResponse(entity);
  }
}
