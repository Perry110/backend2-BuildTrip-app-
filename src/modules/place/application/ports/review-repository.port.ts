import { ReviewRoot } from '../../domain/aggregates/review/review.root';

export const REVIEW_REPOSITORY = Symbol('REVIEW_REPOSITORY');

export interface ReviewRepositoryPort {
  save(review: ReviewRoot): Promise<void>;
}
