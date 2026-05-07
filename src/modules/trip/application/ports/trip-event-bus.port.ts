import { TripDomainEvent } from '../../domain/events/trip.events';

export interface TripEventBusPort {
  publish(events: TripDomainEvent[]): Promise<void>;
}
