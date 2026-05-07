import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PlaceRatingSnapshotEventOrmEntity } from '../../infrastructure/persistence/typeorm/place-rating-snapshot-event.orm.js';
import { PlaceRatingUpdatedDomainEvent } from '../../infrastructure/events/place-rating-snapshot.event.js';
import { PlaceOrmEntity } from '../../infrastructure/persistence/typeorm/place.orm-entity';

@Injectable()
export class PlaceRatingSnapshotService {
  private readonly logger = new Logger(PlaceRatingSnapshotService.name);

  constructor(
    @InjectRepository(PlaceRatingSnapshotEventOrmEntity)
    private readonly snapshotEventRepository: Repository<PlaceRatingSnapshotEventOrmEntity>,
    @InjectRepository(PlaceOrmEntity)
    private readonly placeRepository: Repository<PlaceOrmEntity>,
  ) {}

  async applyPlaceRatingUpdatedEvent(event: PlaceRatingUpdatedDomainEvent): Promise<void> {
    const inserted = await this.tryStartInboxEvent(event);
    if (!inserted) {
      this.logger.debug(`Skip duplicated place rating updated event ${event.metadata.eventId}`);
      return;
    }

    try {
      await this.applyIncrementalRatingSnapshot(event);

      const processedEvent = await this.snapshotEventRepository.findOne({
        where: { eventId: event.metadata.eventId },
        select: { attempts: true },
      });
      await this.snapshotEventRepository.update(
        { eventId: event.metadata.eventId },
        {
          status: 'PROCESSED',
          attempts: processedEvent?.attempts ?? 0,
          processedAt: new Date(),
          lastError: null,
        },
      );
    } catch (error) {
      await this.markEventFailed(event, error);
      throw error;
    }
  }

  async markEventDeadLetter(event: PlaceRatingUpdatedDomainEvent, error: unknown): Promise<void> {
    await this.snapshotEventRepository.update(
      { eventId: event.metadata.eventId },
      {
        status: 'DEAD_LETTER',
        attempts: 5,
        lastError: this.stringifyError(error),
      },
    );
  }

  private async tryStartInboxEvent(event: PlaceRatingUpdatedDomainEvent): Promise<boolean> {
    const result = await this.snapshotEventRepository
      .createQueryBuilder()
      .insert()
      .values({
        eventId: event.metadata.eventId,
        eventType: event.metadata.eventType,
        status: 'PROCESSING',
        placeId: event.payload.placeId,
        aggregateId: event.metadata.aggregateId,
        attempts: 0,
        payload: event.payload,
      })
      .orIgnore()
      .execute();

    // TypeORM InsertResult.raw is driver-specific and may not expose rowCount.
    // `identifiers` is stable across drivers: empty when insert was ignored.
    return (result.identifiers?.length ?? 0) > 0;
  }

  private async markEventFailed(event: PlaceRatingUpdatedDomainEvent, error: unknown): Promise<void> {
    await this.snapshotEventRepository
      .createQueryBuilder()
      .update()
      .set({
        status: 'FAILED',
        attempts: () => '"attempts" + 1',
        lastError: this.stringifyError(error),
      })
      .where('"eventId" = :eventId', { eventId: event.metadata.eventId })
      .execute();
  }

  private async applyIncrementalRatingSnapshot(event: PlaceRatingUpdatedDomainEvent): Promise<void> {
    const placeId = event.payload.placeId;
    const place = await this.placeRepository.findOne({
      where: { id: placeId },
      select: { id: true, averageRating: true, reviewCount: true },
    });
    if (!place) {
      return;
    }

    const currentCount = Math.max(0, Number(place.reviewCount ?? 0));
    const currentAverage = Number(place.averageRating ?? 0);

    let nextCount = currentCount;
    let nextAverage = currentAverage;

    if (event.metadata.eventType === 'ReviewCreated') {
      const rating = Number(event.payload.rating ?? 0);
      nextCount = currentCount + 1;
      nextAverage = nextCount > 0 ? (currentAverage * currentCount + rating) / nextCount : 0;
    } else if (event.metadata.eventType === 'ReviewUpdated') {
      const oldRating = Number(event.payload.oldRating ?? 0);
      const newRating = Number(event.payload.newRating ?? oldRating);
      nextCount = currentCount;
      nextAverage =
        currentCount > 0 ? (currentAverage * currentCount - oldRating + newRating) / currentCount : 0;
    } else if (event.metadata.eventType === 'ReviewDeleted') {
      const rating = Number(event.payload.rating ?? 0);
      nextCount = Math.max(currentCount - 1, 0);
      nextAverage = nextCount > 0 ? (currentAverage * currentCount - rating) / nextCount : 0;
    }

    await this.placeRepository.update(
      { id: placeId },
      {
        reviewCount: nextCount,
        averageRating: nextCount > 0 ? nextAverage.toFixed(2) : null,
      },
    );
  }

  private stringifyError(error: unknown): string {
    if (error instanceof Error) {
      return `${error.name}: ${error.message}`.slice(0, 2000);
    }
    return String(error).slice(0, 2000);
  }
}
