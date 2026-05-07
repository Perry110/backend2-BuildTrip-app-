import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { TripRepositoryPort } from '../../../application/ports/trip.repository.port';
import { TripAggregate } from '../../../domain/aggregates/trip.aggregate';
import { TripMapper } from '../mappers/trip.mapper';
import { TripDayOrmEntity } from '../typeorm/trip-day.orm-entity';
import { TripItemOrmEntity } from '../typeorm/trip-item.orm-entity';
import { TripOrmEntity } from '../typeorm/trip.orm-entity';

@Injectable()
export class TypeormTripRepository implements TripRepositoryPort {
  constructor(
    @InjectRepository(TripOrmEntity)
    private readonly repository: Repository<TripOrmEntity>,
    private readonly mapper: TripMapper,
  ) {}

  async save(trip: TripAggregate): Promise<void> {
    const incoming = this.mapper.toPersistence(trip);

    await this.repository.manager.transaction(async (em) => {
      const tripExists = await em.exists(TripOrmEntity, { where: { id: incoming.id } });

      if (!tripExists) {
        incoming.days.forEach((day) => {
          day.trip = incoming;
          for (const item of day.items ?? []) {
            item.tripDay = day;
          }
        });
        await em.save(incoming);
        return;
      }

      const dayRepo = em.getRepository(TripDayOrmEntity);
      const existingDayRows = await dayRepo.find({
        where: { tripId: incoming.id },
        select: { id: true },
        withDeleted: false,
      });
      const incomingDayIds = new Set(incoming.days.map((d) => d.id));
      const removedDayIds = existingDayRows
        .map((row) => row.id)
        .filter((id) => !incomingDayIds.has(id));

      if (removedDayIds.length > 0) {
        await em.softDelete(TripItemOrmEntity, { tripDayId: In(removedDayIds) });
        await em.softDelete(TripDayOrmEntity, { id: In(removedDayIds) });
      }

      const itemRepo = em.getRepository(TripItemOrmEntity);
      for (const day of incoming.days) {
        const existingItemRows = await itemRepo.find({
          where: { tripDayId: day.id },
          select: { id: true },
          withDeleted: false,
        });
        const incomingItemIds = new Set((day.items ?? []).map((i) => i.id));
        const removedItemIds = existingItemRows
          .map((row) => row.id)
          .filter((id) => !incomingItemIds.has(id));
        if (removedItemIds.length > 0) {
          await em.softDelete(TripItemOrmEntity, { id: In(removedItemIds) });
        }
      }

      incoming.days.forEach((day) => {
        day.trip = incoming;
        for (const item of day.items ?? []) {
          item.tripDay = day;
        }
      });

      await em.save(incoming);
    });
  }

  async findById(id: string): Promise<TripAggregate | null> {
    const orm = await this.repository.findOne({
      where: { id },
      relations: {
        days: {
          items: true,
        },
      },
    });

    if (!orm) {
      return null;
    }

    return this.mapper.toDomain(orm);
  }

  async findByUserId(input: { userId: string; page: number; limit: number }): Promise<TripAggregate[]> {
    const offset = (input.page - 1) * input.limit;

    const ormTrips = await this.repository.find({
      where: { userId: input.userId },
      order: { updatedAt: 'DESC' },
      skip: offset,
      take: input.limit,
      relations: {
        days: {
          items: true,
        },
      },
    });

    return ormTrips.map((t) => this.mapper.toDomain(t));
  }
}
