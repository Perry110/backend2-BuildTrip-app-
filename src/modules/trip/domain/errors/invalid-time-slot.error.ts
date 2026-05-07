import { TripDomainError } from './trip-domain.error';

export class InvalidTimeSlotError extends TripDomainError {
  constructor(message = 'invalid_time_slot') {
    super(message, 400, 'Bad Request');
    this.name = 'InvalidTimeSlotError';
  }
}
