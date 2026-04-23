import { randomUUID } from 'node:crypto';

export interface DomainEventMetadata {
  eventId: string;
  eventType: string;
  eventVersion: number;
  aggregateType: 'PLACE_MANAGEMENT';
  aggregateId: string;
  occurredAt: Date;
}

export interface DomainEvent {
  readonly metadata: DomainEventMetadata;
}

export abstract class BasePlaceManagementEvent implements DomainEvent {
  readonly metadata: DomainEventMetadata;

  protected constructor(eventType: string, aggregateId: string, eventVersion = 1) {
    this.metadata = {
      eventId: randomUUID(),
      eventType,
      eventVersion,
      aggregateType: 'PLACE_MANAGEMENT',
      aggregateId,
      occurredAt: new Date(),
    };
  }
}
