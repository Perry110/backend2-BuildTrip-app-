import type { PlaceEntity } from '../domain/place.entity';
import type { PlaceStatusValue } from '../domain/value-objects/place-status.vo';

export type PlaceDbTransaction = unknown;

/**
 * Repository port cho Place aggregate.
 *
 * 1. Transaction & aggregate writes
 * 2. Single-aggregate reads (commands)
 * 3. Validation helpers (create)
 * 4. Read models (queries, CQRS)
 * 5. Comment helpers
 */
export interface PlaceRepositoryPort {
  // ── 1. Transaction & write ────────────────────────────────────────────────
  runTransaction<T>(fn: (tx: PlaceDbTransaction) => Promise<T>): Promise<T>;
  save(entity: PlaceEntity, tx?: PlaceDbTransaction): Promise<void>;

  // ── 2. Single-aggregate reads (commands) ─────────────────────────────────
  findById(id: string, tx?: PlaceDbTransaction): Promise<PlaceEntity | null>;

  // ── 3. Validation helpers ─────────────────────────────────────────────────
  categoryExists(categoryId: string, tx?: PlaceDbTransaction): Promise<boolean>;
  findExistingTagIds(tagIds: string[], tx?: PlaceDbTransaction): Promise<string[]>;

  // ── 4. Read models (queries) ──────────────────────────────────────────────
  loadPlaceDetails(placeId: string): Promise<unknown | null>;
  findPublishedPlaceByPk(id: string): Promise<unknown | null>;
  findCategoryIdByName(name: string): Promise<string | null>;
  findPlacesSearchCandidates(params: {
    search: string;
    categoryId?: string;
  }): Promise<Array<{ id: string } & Record<string, unknown>>>;
  findPlacesPaginated(params: {
    search: string;
    categoryId?: string;
    limit: number;
    offset: number;
  }): Promise<{ count: number; rows: unknown[] }>;
  findPlacesByIds(ids: string[]): Promise<unknown[]>;
  findTopRatedPaginated(limit: number, offset: number): Promise<{ count: number; rows: unknown[] }>;
  findPlacesByStatusPaginated(params: {
    status: PlaceStatusValue;
    limit: number;
    offset: number;
  }): Promise<{ count: number; rows: unknown[] }>;

  // ── 5. Comment helpers ────────────────────────────────────────────────────
  addCommentRow(
    params: { placeId: string; userId: string; username: string; rating: number; content: string },
    tx: PlaceDbTransaction,
  ): Promise<unknown>;
  listCommentsForPlace(placeId: string, limit: number, offset: number): Promise<{ count: number; rows: unknown[] }>;
}
