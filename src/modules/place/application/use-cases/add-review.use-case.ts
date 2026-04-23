import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ReviewRoot } from '../../domain/aggregates/review/review.root';
import type { PlaceManagementEventBusPort } from '../ports/place-management-event-bus.port';
import {
  PLACE_MANAGEMENT_EVENT_BUS,
  PLACE_MANAGEMENT_REPOSITORY,
} from '../management.di-tokens';
import type { PlaceRepositoryPort } from '../ports/place-repository.port';
import { REVIEW_REPOSITORY } from '../ports/review-repository.port';
import type { ReviewRepositoryPort } from '../ports/review-repository.port';

export interface AddReviewCommand {
  id: string;
  placeId: string;
  userId: string;
  rating: number;
  content: string;
}

@Injectable()
export class AddReviewUseCase {
  constructor(
    @Inject(PLACE_MANAGEMENT_REPOSITORY)
    private readonly placeRepository: PlaceRepositoryPort,
    @Inject(REVIEW_REPOSITORY)
    private readonly reviewRepository: ReviewRepositoryPort,
    @Inject(PLACE_MANAGEMENT_EVENT_BUS)
    private readonly eventBus: PlaceManagementEventBusPort,
  ) {}

  async execute(command: AddReviewCommand): Promise<void> {
    const place = await this.placeRepository.findByIdForAdmin(command.placeId);

    if (!place) {
      throw new NotFoundException(`Place ${command.placeId} not found`);
    }

    const review = ReviewRoot.create({
      id: command.id,
      placeId: command.placeId,
      userId: command.userId,
      rating: command.rating,
      content: command.content,
    });

    await this.reviewRepository.save(review);
    await this.eventBus.publish(review.pullDomainEvents());
  }
}
