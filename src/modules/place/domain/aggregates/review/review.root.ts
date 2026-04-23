import { ReviewAddedEvent } from '../../events/core/place-management.events';

export interface CreateReviewProps {
  id: string;
  placeId: string;
  userId: string;
  rating: number;
  content: string;
}

export class ReviewRoot {
  private domainEvents: ReviewAddedEvent[] = [];

  private constructor(
    public readonly id: string,
    public readonly placeId: string,
    public readonly userId: string,
    private rating: number,
    private content: string,
  ) {}

  static create(props: CreateReviewProps): ReviewRoot {
    const review = new ReviewRoot(
      props.id,
      props.placeId,
      props.userId,
      ReviewRoot.validateRating(props.rating),
      ReviewRoot.validateContent(props.content),
    );

    review.domainEvents.push(
      new ReviewAddedEvent(review.placeId, review.id, review.userId),
    );

    return review;
  }

  getSnapshot(): {
    id: string;
    placeId: string;
    userId: string;
    rating: number;
    content: string;
  } {
    return {
      id: this.id,
      placeId: this.placeId,
      userId: this.userId,
      rating: this.rating,
      content: this.content,
    };
  }

  pullDomainEvents(): ReviewAddedEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }

  private static validateRating(rating: number): number {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5.');
    }
    return rating;
  }

  private static validateContent(content: string): string {
    const trimmed = content.trim();
    if (trimmed.length < 3) {
      throw new Error('Review content must have at least 3 characters.');
    }
    return trimmed;
  }
}
