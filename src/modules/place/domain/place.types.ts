import type { PlaceStatusValue } from './value-objects/place-status.vo';

// ── Aggregate props ────────────────────────────────────────────────────────────

export type PlaceProps = {
  id: string;
  name: string;
  address: string;
  description: string;
  lat: number | null;
  lng: number | null;
  categoryId: string;
  tagIds: string[];
  status: PlaceStatusValue;
  averageRating: number;
  reviewCount: number;
};

export type CreatePlaceProps = {
  name: string;
  address: string;
  description: string;
  lat: number | null;
  lng: number | null;
  categoryId: string;
  tagIds: string[];
};

// ── Pagination ─────────────────────────────────────────────────────────────────

export type PaginationBlock = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
};
