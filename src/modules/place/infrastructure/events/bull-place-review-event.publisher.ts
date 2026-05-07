import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bull';
import {
  APPLY_REVIEW_EVENT_JOB,
  PLACE_RATING_SNAPSHOT_QUEUE,
  type PlaceReviewDomainEvent,
} from '../../shared/events/review-place.event';
import type { PlaceReviewEventPublisherPort } from '../../application/ports/place-review-event-publisher.port';

@Injectable()
export class BullPlaceReviewEventPublisher implements PlaceReviewEventPublisherPort {
  constructor(
    @InjectQueue(PLACE_RATING_SNAPSHOT_QUEUE)
    private readonly queue: Queue,
  ) {}

  async publish(event: PlaceReviewDomainEvent): Promise<void> {
    await this.queue.add(APPLY_REVIEW_EVENT_JOB, event, {
      jobId: event.metadata.eventId,
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 1000,
      removeOnFail: false,
    });
  }
}

