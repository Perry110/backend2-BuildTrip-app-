import { Injectable } from '@nestjs/common';
import { ReviewRepositoryPort } from '../../../../application/ports/review-repository.port';
import { ReviewRoot } from '../../../../domain/aggregates/review/review.root';

@Injectable()
export class PostgresReviewRepository implements ReviewRepositoryPort {
  async save(_review: ReviewRoot): Promise<void> {
    // TODO: Persist review aggregate into PostgreSQL write database.
  }
}
