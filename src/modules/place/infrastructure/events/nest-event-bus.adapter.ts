import { Injectable, Logger } from '@nestjs/common';
import type { PlaceManagementEventBusPort } from '../../application/ports/place-management-event-bus.port';
import type { DomainEvent } from '../../domain/events/core/domain-event';

@Injectable()
export class NestEventBusAdapter implements PlaceManagementEventBusPort {
  private readonly logger = new Logger(NestEventBusAdapter.name);

  async publish(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      // Lightweight event publishing for now; can be replaced by outbox/message bus later.
      this.logger.log(
        `Published domain event: ${event.metadata.eventType} (id=${event.metadata.eventId}, aggregate=${event.metadata.aggregateType}:${event.metadata.aggregateId})`,
      );
    }
  }
}
