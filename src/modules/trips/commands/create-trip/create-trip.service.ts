import { Inject, Injectable } from '@nestjs/common';
import { TripEntity } from '../../domain/trip.entity';
import { TRIP_REPOSITORY } from '../../trips.di-tokens';
import { TripMapper } from '../../trips.mapper';
import { TripResponseDto } from '../../dtos/trip.response.dto';
import type { TripRepositoryPort } from '../../database/trip.repository.port';
import type { CreateTripCommand } from './create-trip.command';

@Injectable()
export class CreateTripService {
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly repo: TripRepositoryPort,
    private readonly mapper: TripMapper,
  ) {}

  async execute(cmd: CreateTripCommand): Promise<TripResponseDto> {
    const entity = TripEntity.create(cmd);
    await this.repo.save(entity);
    return this.mapper.toResponse(entity);
  }
}
