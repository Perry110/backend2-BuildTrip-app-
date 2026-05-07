import type { PlaceReviewDomainEvent } from '../../shared/events/review-place.event';

export interface PlaceReviewEventPublisherPort {
  publish(event: PlaceReviewDomainEvent): Promise<void>;
}

