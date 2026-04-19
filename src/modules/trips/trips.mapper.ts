import { Injectable } from '@nestjs/common';
import { TripPlaceEntity } from './domain/entities/trip-place.entity';
import { TripEntity } from './domain/trip.entity';
import { TripResponseDto } from './dtos/trip.response.dto';
import { Trip } from './database/models/trip.model';

type TripRecord = {
  id: string;
  userId: string;
  name: string;
  destination: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  isPublic: boolean;
};

/**
 * TripMapper — converts between:
 *  toPersistence : TripEntity → plain record  (used by repository.save)
 *  toDomain      : Trip ORM row → TripEntity  (used by repository finds)
 *  toResponse    : TripEntity → TripResponseDto (used by controllers)
 */
@Injectable()
export class TripMapper {
  toPersistence(entity: TripEntity): TripRecord {
    const p = entity.getProps();
    return {
      id: p.id,
      userId: p.userId,
      name: p.name,
      destination: p.destination,
      description: p.description,
      startDate: p.startDate,
      endDate: p.endDate,
      isPublic: p.isPublic,
    };
  }

  toDomain(row: Trip, places: TripPlaceEntity[] = []): TripEntity {
    return TripEntity.reconstitute(
      {
        id: row.id,
        userId: row.userId,
        name: row.name,
        destination: row.destination,
        description: row.description,
        startDate: row.startDate,
        endDate: row.endDate,
        isPublic: row.isPublic,
      },
      places,
    );
  }

  toResponse(entity: TripEntity): TripResponseDto {
    return new TripResponseDto(entity.getProps());
  }
}
