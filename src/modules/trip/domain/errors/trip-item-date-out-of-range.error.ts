import { TripDomainError } from './trip-domain.error';

export class TripItemDateOutOfRangeError extends TripDomainError {
  constructor(message = 'trip_item_date_out_of_range') {
    super(message, 409, 'Conflict');
    this.name = 'TripItemDateOutOfRangeError';
  }
}
