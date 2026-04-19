// ── Aggregate props ───────────────────────────────────────────────────────────

export type TripProps = {
  id: string;
  userId: string;
  name: string;
  destination: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  isPublic: boolean;
};

export type CreateTripProps = {
  userId: string;
  name: string;
  destination?: string | null;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isPublic?: boolean;
};

export type UpdateTripProps = Partial<Omit<TripProps, 'id' | 'userId'>>;

// ── Pagination ────────────────────────────────────────────────────────────────

export type TripPaginationBlock = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
};

// ── TripPlace child entity change tracking ────────────────────────────────────

import type { TripPlaceEntity } from './entities/trip-place.entity';

export type TripPlaceChanges = {
  added: TripPlaceEntity[];
  updated: TripPlaceEntity[];
  removedIds: string[];
};
