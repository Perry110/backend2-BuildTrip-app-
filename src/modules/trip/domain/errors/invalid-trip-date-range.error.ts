import { TripDomainError } from './trip-domain.error';

export class InvalidTripDateRangeError extends TripDomainError {
  constructor(message = 'invalid_trip_date_range') {
    super(message, 400, 'Bad Request');
    this.name = 'InvalidTripDateRangeError';
  }
}
