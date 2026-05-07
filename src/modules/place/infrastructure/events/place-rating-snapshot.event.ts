import { OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { PlaceRatingSnapshotService } from '../../application/queries/place-rating-snapshot.queries.js';
import { APPLY_REVIEW_EVENT_JOB } from '../../shared/events/review-place.event';

export const PLACE_RATING_SNAPSHOT_QUEUE = 'place-rating-snapshot';
export const APPLY_PLACE_RATING_UPDATED_JOB = 'apply-place-rating-updated';

export interface PlaceRatingUpdatedDomainEvent {
  metadata: {
    eventId: string;
    eventType: string;
    aggregateId: string;
  };
  payload: {
    placeId: string;
    [key: string]: unknown;
  };
}

@Injectable()
@Processor(PLACE_RATING_SNAPSHOT_QUEUE)
export class PlaceRatingSnapshotConsumer {
  private readonly logger = new Logger(PlaceRatingSnapshotConsumer.name);

  constructor(private readonly snapshotService: PlaceRatingSnapshotService) {}

  @Process(APPLY_PLACE_RATING_UPDATED_JOB)
  async handleApplyPlaceRatingUpdated(job: unknown): Promise<void> {
    const typedJob = job as { data: PlaceRatingUpdatedDomainEvent };
    await this.snapshotService.applyPlaceRatingUpdatedEvent(typedJob.data);
  }

  @Process(APPLY_REVIEW_EVENT_JOB)
  async handleApplyReviewEvent(job: unknown): Promise<void> {
    const typedJob = job as { data: PlaceRatingUpdatedDomainEvent };
    await this.snapshotService.applyPlaceRatingUpdatedEvent(typedJob.data);
  }

  @OnQueueFailed()
  async handleFailed(job: unknown, error: Error): Promise<void> {
    const typedJob = job as {
      data: PlaceRatingUpdatedDomainEvent;
      opts: { attempts?: number };
      attemptsMade: number;
    };
    const maxAttempts = typedJob.opts.attempts ?? 1;
    if (typedJob.attemptsMade >= maxAttempts) {
      await this.snapshotService.markEventDeadLetter(typedJob.data, error);
      this.logger.error(
        `Place rating updated event moved to dead-letter: eventId=${typedJob.data.metadata.eventId} error=${error.message}`,
      );
    }
  }
}
