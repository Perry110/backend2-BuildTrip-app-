import { DomainEvent } from '../../domain/events/core/domain-event';

export interface PlaceManagementEventBusPort {
  publish(events: DomainEvent[]): Promise<void>;
}
