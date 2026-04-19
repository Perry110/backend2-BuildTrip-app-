import type { TripEntity } from '../domain/trip.entity';

/** Transaction handle — implementation dùng Sequelize.Transaction */
export type TripDbTransaction = unknown;

/**
 * Repository port cho Trip aggregate.
 *
 * Command side: findOwnedById / findOwnedByIdWithPlaces → save / delete
 * Query side  : findTripsPaginated / loadTripWithPlaces / TripPlace helpers
 */
export interface TripRepositoryPort {
  // ── Transaction ────────────────────────────────────────────────────────────
  runTransaction<T>(fn: (tx: TripDbTransaction) => Promise<T>): Promise<T>;

  // ── Command side — aggregate writes ───────────────────────────────────────
  save(entity: TripEntity, tx?: TripDbTransaction): Promise<void>;
  delete(id: string, tx?: TripDbTransaction): Promise<void>;

  // ── Command side — aggregate reads ────────────────────────────────────────
  /** Load aggregate (không kèm places) — dùng cho update/delete trip. */
  findOwnedById(id: string, userId: string, tx?: TripDbTransaction): Promise<TripEntity | null>;

  /** Load aggregate kèm TripPlace child entities — dùng cho mutate places. */
  findOwnedByIdWithPlaces(id: string, userId: string, tx?: TripDbTransaction): Promise<TripEntity | null>;

  // ── Query side — read models ───────────────────────────────────────────────
  findTripsPaginated(params: {
    userId: string;
    isPublic?: boolean;
    limit: number;
    offset: number;
  }): Promise<{ count: number; rows: unknown[] }>;

  loadTripWithPlaces(id: string, userId: string): Promise<unknown | null>;

  // ── Query side — TripPlace helpers ─────────────────────────────────────────
  placeExistsById(placeId: string): Promise<boolean>;
  findTripPlaceById(tripPlaceId: string, tripId: string): Promise<unknown | null>;
  findTripPlacesByTrip(tripId: string): Promise<unknown[]>;
}
