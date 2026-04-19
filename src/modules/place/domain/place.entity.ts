import { randomUUID } from 'crypto';
import { PlaceStatusChangedEvent } from './events/place-status-changed.event';
import { PlaceDomainError } from './place.errors';
import type { CreatePlaceProps, PaginationBlock, PlaceProps } from './place.types';
import type { PlaceStatusValue } from './value-objects/place-status.vo';
import { Coordinates, } from './value-objects/coordinates.vo';
import { PlaceStatus } from './value-objects/place-status.vo';

/**
 * Place — Aggregate Root.
 *
 * Chịu trách nhiệm về:
 * - Invariant khi tạo (validate tọa độ, status mặc định là pending)
 * - Thay đổi trạng thái (changeStatus) kèm domain event
 * - Nhận bình luận / cập nhật rating (applyComment)
 * - Xác nhận tag hợp lệ (assertTagsExist)
 *
 * CQRS:
 * - Command side: load aggregate → mutate → save
 * - Query side: read models trực tiếp, không qua entity
 */
export class PlaceEntity {
  private readonly _events: PlaceStatusChangedEvent[] = [];
  private readonly _isNew: boolean;

  private constructor(
    private props: PlaceProps,
    isNew: boolean,
  ) {
    this._isNew = isNew;
  }

  // ── Factories ─────────────────────────────────────────────────────────────

  static create(input: CreatePlaceProps): PlaceEntity {
    Coordinates.tryCreate(input.lat ?? undefined, input.lng ?? undefined);
    return new PlaceEntity(
      {
        id: randomUUID(),
        name: input.name.trim(),
        address: input.address.trim(),
        description: input.description.trim(),
        lat: input.lat,
        lng: input.lng,
        categoryId: input.categoryId,
        tagIds: [...input.tagIds],
        status: 'pending',
        averageRating: 0,
        reviewCount: 0,
      },
      true,
    );
  }

  static reconstitute(raw: PlaceProps): PlaceEntity {
    return new PlaceEntity({ ...raw, tagIds: [...(raw.tagIds ?? [])] }, false);
  }

  // ── Accessors ─────────────────────────────────────────────────────────────

  getProps(): Readonly<PlaceProps> {
    return { ...this.props, tagIds: [...this.props.tagIds] };
  }

  isNew(): boolean {
    return this._isNew;
  }

  pullEvents(): PlaceStatusChangedEvent[] {
    return this._events.splice(0);
  }

  // ── Domain behaviours ─────────────────────────────────────────────────────

  assertTagsExist(foundTagIds: string[]): void {
    const found = new Set(foundTagIds);
    const missing = this.props.tagIds.filter((id) => !found.has(id));
    if (missing.length > 0) {
      throw new PlaceDomainError(
        'Một hoặc nhiều Tags không tồn tại trong hệ thống.',
        'TAGS_NOT_ALL_RESOLVED',
      );
    }
  }

  changeStatus(next: PlaceStatus): void {
    const previous = this.props.status;
    this.props.status = next.value;
    this._events.push(new PlaceStatusChangedEvent(this.props.id, previous, next.value, new Date()));
  }

  applyComment(rating: number): void {
    if (this.props.status !== 'published') {
      throw new PlaceDomainError(
        'Địa điểm chưa được duyệt hoặc không hiển thị công khai.',
        'PLACE_NOT_PUBLISHED',
      );
    }
    const newAvg =
      ((this.props.averageRating * this.props.reviewCount + rating) /
        (this.props.reviewCount + 1)) || 0;
    this.props.averageRating = Math.round(newAvg * 10) / 10;
    this.props.reviewCount += 1;
  }

  // ── Static guards ─────────────────────────────────────────────────────────

  static assertFound(entity: PlaceEntity | null): asserts entity is PlaceEntity {
    if (!entity) {
      throw new PlaceDomainError('Không tìm thấy địa điểm.', 'PLACE_NOT_FOUND');
    }
  }

  static assertCategoryExists(exists: boolean): void {
    if (!exists) {
      throw new PlaceDomainError('Danh mục (Category) không tồn tại.', 'CATEGORY_NOT_FOUND');
    }
  }

  // ── Static helpers ────────────────────────────────────────────────────────

  static buildPagination(total: number, page: number, limit: number): PaginationBlock {
    return {
      totalItems: total,
      totalPages: Math.ceil(total / limit) || 0,
      currentPage: page,
      itemsPerPage: limit,
    };
  }

  static resolveCategoryFilter(
    categoryParam: string,
    resolvedCategoryId: string | null,
  ): { kind: 'none' } | { kind: 'empty' } | { kind: 'filter'; categoryId: string } {
    const trimmed = categoryParam.trim();
    if (!trimmed) return { kind: 'none' };
    if (!resolvedCategoryId) return { kind: 'empty' };
    return { kind: 'filter', categoryId: resolvedCategoryId };
  }

  static orderCandidatesByMlPlaceIds<T extends { id: string }>(
    candidates: T[],
    mlOrderedIds: string[],
  ): T[] {
    const map = new Map(candidates.map((p) => [p.id, p]));
    return mlOrderedIds.map((id) => map.get(id)).filter((p): p is T => Boolean(p));
  }

  static sortPlacesByMlScores<T extends { id: string }>(
    places: T[],
    scores: Array<{ place_id: string; score: number }>,
  ): T[] {
    const scoreMap = new Map(scores.map((s) => [s.place_id, s.score]));
    return [...places].sort((a, b) => (scoreMap.get(b.id) ?? 0) - (scoreMap.get(a.id) ?? 0));
  }

  static mlTotalFromResponse(total: number | undefined, scoresLength: number): number {
    return total ?? scoresLength;
  }
}
