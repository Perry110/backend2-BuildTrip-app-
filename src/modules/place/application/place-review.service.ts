import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  createReviewCreatedEvent,
  createReviewDeletedEvent,
  createReviewUpdatedEvent,
} from '../shared/events/review-place.event';
import { NotificationService } from '../../notification/services/notification.service';
import type { PlaceReviewOwnerNotificationKind } from '../../notification/notification.types';
import { PLACE_REVIEW_EVENT_PUBLISHER, PLACE_REVIEW_REPOSITORY } from './review.di-token';
import type { PlaceReviewEventPublisherPort } from './ports/place-review-event-publisher.port';
import type { PlaceReviewRepositoryPort } from './ports/place-review-repository.port';
import type { UpdateReviewInput, UpsertReviewInput } from './place-review.inputs';

@Injectable()
export class PlaceReviewService {
  constructor(
    @Inject(PLACE_REVIEW_REPOSITORY)
    private readonly placeReviewRepository: PlaceReviewRepositoryPort,
    @Inject(PLACE_REVIEW_EVENT_PUBLISHER)
    private readonly reviewEventPublisher: PlaceReviewEventPublisherPort,
    private readonly notificationService: NotificationService,
  ) {}

  async getPlaceReviews(placeId: string, page: number, limit: number) {
    const place = await this.placeReviewRepository.findVisiblePlaceById(placeId);
    if (!place) {
      throw new NotFoundException('place_not_found');
    }

    const { items, total } = await this.placeReviewRepository.findByPlaceId(placeId, page, limit);
    return { items, total, page, limit };
  }

  async upsertReview(placeId: string, userId: string, input: UpsertReviewInput) {
    const place = await this.placeReviewRepository.findVisiblePlaceById(placeId);
    if (!place) {
      throw new NotFoundException('place_not_found');
    }

    const existing = await this.placeReviewRepository.findByUserAndPlaceWithDeleted(userId, placeId);
    const imageUrls = input.imageUrls ?? null;
    const comment = input.comment ?? null;

    if (!existing) {
      const created = this.placeReviewRepository.create({
        placeId,
        userId,
        rating: input.rating,
        comment,
        imageUrls,
      });
      const saved = await this.placeReviewRepository.save(created);

      await this.reviewEventPublisher.publish(
        createReviewCreatedEvent({
          reviewId: saved.id,
          placeId: saved.placeId,
          userId: saved.userId,
          rating: saved.rating,
        }),
      );
      await this.notifyOwnerAboutReview(
        saved.placeId,
        saved.id,
        saved.userId,
        'created',
      );

      return saved;
    }

    const oldRating = existing.rating;
    existing.rating = input.rating;
    existing.comment = comment;
    existing.imageUrls = imageUrls;
    const saved = await this.placeReviewRepository.save(existing);

    if (existing.deletedAt) {
      await this.placeReviewRepository.restore(existing.id);
      await this.reviewEventPublisher.publish(
        createReviewCreatedEvent({
          reviewId: saved.id,
          placeId: saved.placeId,
          userId: saved.userId,
          rating: saved.rating,
        }),
      );
      await this.notifyOwnerAboutReview(
        saved.placeId,
        saved.id,
        saved.userId,
        'created',
      );
      const restored = await this.placeReviewRepository.findById(saved.id);
      if (!restored) {
        throw new NotFoundException('review_not_found');
      }
      return restored;
    }

    await this.reviewEventPublisher.publish(
      createReviewUpdatedEvent({
        reviewId: saved.id,
        placeId: saved.placeId,
        userId: saved.userId,
        oldRating,
        newRating: saved.rating,
      }),
    );
    await this.notifyOwnerAboutReview(
      saved.placeId,
      saved.id,
      saved.userId,
      'updated',
    );

    return saved;
  }

  async updateOwnReview(reviewId: string, userId: string, input: UpdateReviewInput) {
    const review = await this.placeReviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundException('review_not_found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('review_forbidden');
    }

    const oldRating = review.rating;
    review.rating = input.rating ?? review.rating;
    review.comment = input.comment ?? review.comment ?? null;
    review.imageUrls = input.imageUrls ?? review.imageUrls ?? null;
    const saved = await this.placeReviewRepository.save(review);

    await this.reviewEventPublisher.publish(
      createReviewUpdatedEvent({
        reviewId: saved.id,
        placeId: saved.placeId,
        userId: saved.userId,
        oldRating,
        newRating: saved.rating,
      }),
    );
    await this.notifyOwnerAboutReview(
      saved.placeId,
      saved.id,
      saved.userId,
      'updated',
    );

    return saved;
  }

  async deleteOwnReview(reviewId: string, userId: string): Promise<void> {
    const review = await this.placeReviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundException('review_not_found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('review_forbidden');
    }

    await this.placeReviewRepository.softDelete(reviewId);

    await this.reviewEventPublisher.publish(
      createReviewDeletedEvent({
        reviewId: review.id,
        placeId: review.placeId,
        userId: review.userId,
        rating: review.rating,
      }),
    );
  }

  private async notifyOwnerAboutReview(
    placeId: string,
    reviewId: string,
    reviewerUserId: string,
    kind: PlaceReviewOwnerNotificationKind,
  ): Promise<void> {
    const ctx = await this.placeReviewRepository.findPublishedPlaceReviewContext(placeId);
    if (!ctx) {
      return;
    }
    await this.notificationService.notifyPlaceReviewForOwner({
      ownerUserId: ctx.ownerUserId,
      placeId: ctx.id,
      placeName: ctx.name,
      reviewId,
      reviewerUserId,
      kind,
    });
  }
}
