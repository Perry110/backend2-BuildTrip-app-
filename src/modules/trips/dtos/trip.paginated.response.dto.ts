import type { TripPaginationBlock } from '../domain/trip.types';

export class TripPaginatedResponseDto<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  pagination: TripPaginationBlock;

  constructor(data: {
    list: T[];
    total: number;
    page: number;
    pageSize: number;
    pagination: TripPaginationBlock;
  }) {
    Object.assign(this, data);
  }
}
