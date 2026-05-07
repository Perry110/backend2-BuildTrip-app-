import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../users/entities/user.entity';
import { NotificationService } from '../../../notification/services/notification.service';
import type { PlaceManagementEventBusPort } from '../../application/ports/place-management-event-bus.port';
import type { DomainEvent } from '../../domain/events/core/domain-event';
import {
  PlaceApprovedEvent,
  PlaceRejectedEvent,
  PlaceSubmittedEvent,
} from '../../domain/events/core/place-management.events';

@Injectable()
export class NestEventBusAdapter implements PlaceManagementEventBusPort {
  private readonly logger = new Logger(NestEventBusAdapter.name);

  constructor(
    private readonly notificationService: NotificationService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async publish(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      this.logger.log(
        `Published domain event: ${event.metadata.eventType} (id=${event.metadata.eventId}, aggregate=${event.metadata.aggregateType}:${event.metadata.aggregateId})`,
      );

      if (event instanceof PlaceSubmittedEvent) {
        const reviewerIds = await this.findAdminReviewerUserIds();
        for (const recipientUserId of reviewerIds) {
          if (recipientUserId === event.actorUserId) {
            continue;
          }
          await this.notificationService.notifyPlaceRequestSubmitted({
            recipientUserId,
            requestId: event.placeId,
            placeName: event.placeName,
            requesterUserId: event.actorUserId,
          });
        }
      } else if (event instanceof PlaceApprovedEvent) {
        await this.notificationService.notifyPlaceApproved({
          actorUserId: event.partnerId,
          placeId: event.placeId,
        });
      } else if (event instanceof PlaceRejectedEvent) {
        await this.notificationService.notifyPlaceRejected({
          actorUserId: event.partnerId,
          placeId: event.placeId,
          reason: event.reason,
        });
      }
    }
  }

  private async findAdminReviewerUserIds(): Promise<string[]> {
    const rows = await this.userRepository.find({
      where: { role: 'admin' },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }
}
