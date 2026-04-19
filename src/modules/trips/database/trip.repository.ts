import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { Place } from '../../place/entities/place.entity';
import { TripEntity } from '../domain/trip.entity';
import { TripPlaceEntity } from '../domain/entities/trip-place.entity';
import type { TripDbTransaction, TripRepositoryPort } from './trip.repository.port';
import { TripMapper } from '../trips.mapper';
import { Trip } from './models/trip.model';
import { TripPlace } from './models/trip-place.model';

@Injectable()
export class TripRepository implements TripRepositoryPort {
  constructor(
    @InjectModel(Trip)
    private readonly tripModel: typeof Trip,
    @InjectModel(TripPlace)
    private readonly tripPlaceModel: typeof TripPlace,
    @InjectModel(Place)
    private readonly placeModel: typeof Place,
    private readonly mapper: TripMapper,
  ) {}

  // ── Transaction ────────────────────────────────────────────────────────────

  async runTransaction<T>(fn: (tx: TripDbTransaction) => Promise<T>): Promise<T> {
    const sequelize = this.tripModel.sequelize;
    if (!sequelize) throw new Error('Sequelize instance not available');
    return sequelize.transaction(async (t) => fn(t as TripDbTransaction));
  }

  // ── Command side — aggregate writes ───────────────────────────────────────

  async save(entity: TripEntity, tx?: TripDbTransaction): Promise<void> {
    const record = this.mapper.toPersistence(entity);
    const t = tx as Transaction;

    if (entity.isNew()) {
      await this.tripModel.create(record, { transaction: t });
    } else {
      const { id, userId: _userId, ...updates } = record;
      await this.tripModel.update(updates, { where: { id }, transaction: t });
    }

    const { added, updated, removedIds } = entity.pullPlaceChanges();

    for (const child of added) {
      const p = child.getProps();
      await this.tripPlaceModel.create(
        { id: p.id, tripId: p.tripId, placeId: p.placeId, visitOrder: p.visitOrder, visitTime: p.visitTime },
        { transaction: t },
      );
    }

    for (const child of updated) {
      const p = child.getProps();
      await this.tripPlaceModel.update(
        { visitOrder: p.visitOrder, visitTime: p.visitTime },
        { where: { id: p.id }, transaction: t },
      );
    }

    for (const id of removedIds) {
      await this.tripPlaceModel.destroy({ where: { id }, transaction: t });
    }
  }

  async delete(id: string, tx?: TripDbTransaction): Promise<void> {
    await this.tripModel.destroy({ where: { id }, transaction: tx as Transaction });
  }

  // ── Command side — aggregate reads ────────────────────────────────────────

  async findOwnedById(id: string, userId: string, tx?: TripDbTransaction): Promise<TripEntity | null> {
    const row = await this.tripModel.findOne({
      where: { id, userId },
      transaction: tx as Transaction,
    });
    return row ? this.mapper.toDomain(row) : null;
  }

  async findOwnedByIdWithPlaces(
    id: string,
    userId: string,
    tx?: TripDbTransaction,
  ): Promise<TripEntity | null> {
    const row = await this.tripModel.findOne({
      where: { id, userId },
      include: [{ model: TripPlace, as: 'tripPlaces', attributes: ['id', 'tripId', 'placeId', 'visitOrder', 'visitTime'] }],
      transaction: tx as Transaction,
    });
    if (!row) return null;

    const places = (row.tripPlaces ?? []).map((tp) =>
      TripPlaceEntity.reconstitute({
        id: tp.id,
        tripId: tp.tripId,
        placeId: tp.placeId,
        visitOrder: tp.visitOrder,
        visitTime: tp.visitTime,
      }),
    );

    return this.mapper.toDomain(row, places);
  }

  // ── Query side — read models ───────────────────────────────────────────────

  async findTripsPaginated(params: {
    userId: string;
    isPublic?: boolean;
    limit: number;
    offset: number;
  }): Promise<{ count: number; rows: unknown[] }> {
    const where: Record<string, unknown> = { userId: params.userId };
    if (params.isPublic !== undefined) where.isPublic = params.isPublic;
    return this.tripModel.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: params.limit,
      offset: params.offset,
    });
  }

  async loadTripWithPlaces(id: string, userId: string): Promise<unknown | null> {
    return this.tripModel.findOne({
      where: { id, userId },
      include: [
        {
          model: TripPlace,
          as: 'tripPlaces',
          include: [{ model: Place, as: 'place' }],
        },
      ],
      order: [[{ model: TripPlace, as: 'tripPlaces' }, 'visitOrder', 'ASC']],
    });
  }

  // ── Query side — TripPlace helpers ─────────────────────────────────────────

  async placeExistsById(placeId: string): Promise<boolean> {
    const row = await this.placeModel.findByPk(placeId, { attributes: ['id'] });
    return row !== null;
  }

  async findTripPlaceById(tripPlaceId: string, tripId: string): Promise<unknown | null> {
    return this.tripPlaceModel.findOne({
      where: { id: tripPlaceId, tripId },
      include: [{ model: Place, as: 'place' }],
    });
  }

  async findTripPlacesByTrip(tripId: string): Promise<unknown[]> {
    return this.tripPlaceModel.findAll({
      where: { tripId },
      include: [{ model: Place, as: 'place' }],
      order: [
        ['visitOrder', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    });
  }
}
