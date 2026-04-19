import { randomUUID } from 'crypto';
import { TripPlaceEntity } from './entities/trip-place.entity';
import { TripDomainError } from './trip.errors';
import type {
  CreateTripProps,
  TripPaginationBlock,
  TripPlaceChanges,
  TripProps,
  UpdateTripProps,
} from './trip.types';

/**
 * Trip — Aggregate Root.
 *
 * Chịu trách nhiệm:
 * - Invariant khi tạo / cập nhật (validate date range)
 * - Quản lý TripPlace child entities (add / update / remove)
 * - Tích lũy thay đổi qua pullPlaceChanges() để repository persist
 *
 * CQRS:
 * - Command side: load bằng findOwnedByIdWithPlaces → mutate → save
 * - Query side: dùng read models trực tiếp, không qua entity
 */
export class TripEntity {
  private readonly _isNew: boolean;
  private _places: TripPlaceEntity[] = [];
  private _addedPlaces: TripPlaceEntity[] = [];
  private _updatedPlaces: TripPlaceEntity[] = [];
  private _removedPlaceIds: string[] = [];

  private constructor(
    private props: TripProps,
    isNew: boolean,
  ) {
    this._isNew = isNew;
  }

  // ── Factories ─────────────────────────────────────────────────────────────

  static create(input: CreateTripProps): TripEntity {
    TripEntity.assertDateRange(input.startDate, input.endDate);
    return new TripEntity(
      {
        id: randomUUID(),
        userId: input.userId,
        name: input.name.trim(),
        destination: input.destination ?? null,
        description: input.description ?? null,
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
        isPublic: input.isPublic ?? false,
      },
      true,
    );
  }

  static reconstitute(raw: TripProps, places: TripPlaceEntity[] = []): TripEntity {
    const entity = new TripEntity({ ...raw }, false);
    entity._places = [...places];
    return entity;
  }

  // ── Accessors ─────────────────────────────────────────────────────────────

  getProps(): Readonly<TripProps> {
    return { ...this.props };
  }

  isNew(): boolean {
    return this._isNew;
  }

  getPlaces(): readonly TripPlaceEntity[] {
    return [...this._places];
  }

  // ── Trip domain behaviours ─────────────────────────────────────────────────

  update(patch: UpdateTripProps): void {
    const nextStart = patch.startDate !== undefined ? patch.startDate : this.props.startDate;
    const nextEnd = patch.endDate !== undefined ? patch.endDate : this.props.endDate;
    TripEntity.assertDateRange(nextStart, nextEnd);

    if (patch.name !== undefined) this.props.name = patch.name.trim();
    if (patch.destination !== undefined) this.props.destination = patch.destination;
    if (patch.description !== undefined) this.props.description = patch.description;
    if (patch.startDate !== undefined) this.props.startDate = patch.startDate;
    if (patch.endDate !== undefined) this.props.endDate = patch.endDate;
    if (patch.isPublic !== undefined) this.props.isPublic = patch.isPublic;
  }

  // ── TripPlace child entity behaviours ─────────────────────────────────────

  addPlace(placeId: string, visitOrder: number | null, visitTime: Date | null): TripPlaceEntity {
    const entity = TripPlaceEntity.create({ tripId: this.props.id, placeId, visitOrder, visitTime });
    this._places.push(entity);
    this._addedPlaces.push(entity);
    return entity;
  }

  updatePlace(tripPlaceId: string, patch: { visitOrder?: number | null; visitTime?: Date | null }): void {
    const entity = this._places.find((p) => p.getProps().id === tripPlaceId);
    if (!entity) {
      throw new TripDomainError('Không tìm thấy địa điểm trong chuyến đi.', 'TRIP_PLACE_NOT_FOUND');
    }
    entity.update(patch);
    if (!this._updatedPlaces.includes(entity)) this._updatedPlaces.push(entity);
  }

  removePlace(tripPlaceId: string): void {
    const idx = this._places.findIndex((p) => p.getProps().id === tripPlaceId);
    if (idx === -1) {
      throw new TripDomainError('Không tìm thấy địa điểm trong chuyến đi.', 'TRIP_PLACE_NOT_FOUND');
    }
    this._places.splice(idx, 1);
    this._removedPlaceIds.push(tripPlaceId);
  }

  /** One-time read — repository gọi trong save() để biết cần INSERT/UPDATE/DELETE gì. */
  pullPlaceChanges(): TripPlaceChanges {
    const changes: TripPlaceChanges = {
      added: [...this._addedPlaces],
      updated: [...this._updatedPlaces],
      removedIds: [...this._removedPlaceIds],
    };
    this._addedPlaces = [];
    this._updatedPlaces = [];
    this._removedPlaceIds = [];
    return changes;
  }

  // ── Static guards ─────────────────────────────────────────────────────────

  static assertFound(entity: TripEntity | null): asserts entity is TripEntity {
    if (!entity) {
      throw new TripDomainError(
        'Không tìm thấy chuyến đi hoặc không có quyền truy cập.',
        'TRIP_NOT_FOUND',
      );
    }
  }

  // ── Static helpers ────────────────────────────────────────────────────────

  static buildPagination(total: number, page: number, limit: number): TripPaginationBlock {
    return {
      totalItems: total,
      totalPages: Math.ceil(total / limit) || 0,
      currentPage: page,
      itemsPerPage: limit,
    };
  }

  private static assertDateRange(startDate?: string | null, endDate?: string | null): void {
    if (startDate && endDate && endDate < startDate) {
      throw new TripDomainError('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.', 'INVALID_DATE_RANGE');
    }
  }
}
